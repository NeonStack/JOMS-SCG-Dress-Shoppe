# api_main.py

import os
import pandas as pd
import pickle # Still needed for model object in memory during training
from fastapi import FastAPI, HTTPException, Query, Depends, Security, status, BackgroundTasks
from fastapi.security import APIKeyHeader
from supabase import create_client, Client
from prophet import Prophet
from dotenv import load_dotenv
import logging
from contextlib import asynccontextmanager
from datetime import datetime
import numpy as np
import json # For handling JSON data for Supabase

# --- Basic Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Load Environment Variables ---
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
# Key used for reading predictions (typically anon key)
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
# Key used for training & WRITING predictions (recommend service_role key for writes)
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
# Secret key for triggering training via GitHub Actions
TRAINING_API_KEY = os.getenv("TRAINING_API_KEY")

# --- Validate Essential Config ---
if not all([SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, TRAINING_API_KEY]):
    logger.error("CRITICAL: Missing one or more environment variables (Supabase URL/Keys, Training Key).")
    # Optional: raise RuntimeError("Missing critical configuration") to prevent startup

# --- Constants ---
PREDICT_MONTHLY_PERIODS = 12
PREDICT_YEARLY_PERIODS = 3
FORECAST_TABLE_NAME = "forecast_results" # Name of your Supabase table

# --- API Key Security ---
API_KEY_NAME = "X-API-KEY"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=True)

async def get_api_key(key: str = Security(api_key_header)):
    """Dependency function to validate the API key for protected endpoints."""
    if not TRAINING_API_KEY:
         logger.error("CRITICAL: TRAINING_API_KEY is not set in the server environment.")
         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server config error")
    if key == TRAINING_API_KEY:
        return key
    else:
        logger.warning("Invalid API Key received for protected /train_and_store endpoint.")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid API Key")

# --- Supabase Client Initialization ---
# Use separate clients for read (anon) and write (service) roles if keys differ
supabase_read_client: Client = None
supabase_write_client: Client = None
try:
    if SUPABASE_URL and SUPABASE_ANON_KEY:
        supabase_read_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    if SUPABASE_URL and SUPABASE_SERVICE_KEY:
        supabase_write_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
except Exception as e:
    logger.error(f"Failed to initialize Supabase client(s): {e}")
    # Decide if app should fail to start

# ==============================================================================
#  TRAINING & STORING LOGIC (Run when POST /train_and_store is called)
# ==============================================================================

def fetch_and_prepare_data_for_training(supabase: Client):
    """Fetches and prepares sales data from Supabase 'orders' table."""
    if not supabase:
        raise RuntimeError("Supabase client (for training read) not available.")
    logger.info("(Training) Fetching data from Supabase 'orders'...")
    try:
        response = supabase.table('orders').select('created_at, total_amount, status').execute()
        logger.info(f"(Training) Fetched {len(response.data)} rows.")
        if not response.data: return None
        df = pd.DataFrame(response.data)
        df['created_at'] = pd.to_datetime(df['created_at'], format='ISO8601', errors='coerce')
        df['total_amount'] = pd.to_numeric(df['total_amount'], errors='coerce')
        # !!! IMPORTANT: Define your "sale" condition !!!
        df_filtered = df[df['status'] == 'completed'].copy()
        logger.info(f"(Training) Filtered to {len(df_filtered)} completed orders.")
        df_filtered.dropna(subset=['created_at', 'total_amount'], inplace=True)
        if df_filtered.empty: return None
        df_filtered.set_index('created_at', inplace=True)
        return df_filtered
    except Exception as e:
        logger.error(f"(Training) Error fetching/processing data: {e}")
        raise RuntimeError(f"Data fetching/processing failed: {e}")

def aggregate_and_rename(df, freq_code, freq_name):
    """Aggregates data by frequency and renames columns for Prophet."""
    if df is None or df.empty:
        logger.warning(f"(Training) No base data to aggregate for {freq_name}.")
        return None
    logger.info(f"(Training) Aggregating data by {freq_name} ({freq_code})...")
    try:
        aggregated = df['total_amount'].resample(freq_code).sum().reset_index()
        aggregated.rename(columns={'created_at': 'ds', 'total_amount': 'y'}, inplace=True)

        # --- FIX APPLIED HERE: Remove timezone info from 'ds' column ---
        # Ensure 'ds' column is datetime type first (should be from resample)
        if pd.api.types.is_datetime64_any_dtype(aggregated['ds']):
             aggregated['ds'] = aggregated['ds'].dt.tz_localize(None)
        else:
             logger.warning(f"(Training) 'ds' column for {freq_name} is not datetime after resample. Type: {aggregated['ds'].dtype}")
             # Depending on the issue, you might need further checks or raise an error

        if len(aggregated) < 2:
            logger.warning(f"(Training) Insufficient data points (< 2) for {freq_name} after aggregation.")
            return None # Need at least 2 points

        logger.info(f"(Training) Prepared {len(aggregated)} {freq_name} points. 'ds' is now timezone-naive.")
        return aggregated
    except Exception as e:
        logger.error(f"(Training) Error during {freq_name} aggregation: {e}")
        raise RuntimeError(f"Aggregation failed for {freq_name}: {e}") # Raise to signal failure

def train_predict_and_format(data, granularity, periods_to_predict):
    """Trains model, predicts future, and formats the output JSON list."""
    if data is None or data.empty:
        logger.warning(f"(Training) No data provided for {granularity}, cannot train/predict.")
        return None

    logger.info(f"(Training) Starting training & prediction for {granularity}...")
    try:
        # 1. Train Model
        model = Prophet()
        model.fit(data)
        logger.info(f"(Training) {granularity.capitalize()} model trained.")

        # 2. Create Future DataFrame
        freq = 'MS' if granularity == 'monthly' else 'YS'
        # Make future dataframe based on *last date in training data*
        last_history_date = data['ds'].max()
        future_dates = pd.date_range(start=last_history_date, periods=periods_to_predict + 1, freq=freq)[1:]
        future_df = pd.DataFrame({'ds': future_dates})

        if future_df.empty:
             logger.warning(f"(Training) Future dataframe empty for {granularity}.")
             return [] # Return empty list if no future periods

        # 3. Make Prediction
        forecast = model.predict(future_df)
        logger.info(f"(Training) Prediction complete for {granularity}.")

        # 4. Format Output
        forecast_output = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].copy()

        if granularity == 'monthly':
            forecast_output['label'] = forecast_output['ds'].dt.strftime('%Y-%m')
        else: # yearly
            forecast_output['label'] = forecast_output['ds'].dt.strftime('%Y')

        forecast_output.rename(columns={
            'yhat': 'predicted', 'yhat_lower': 'lower_bound', 'yhat_upper': 'upper_bound'
        }, inplace=True)

        numeric_cols = ['predicted', 'lower_bound', 'upper_bound']
        for col in numeric_cols:
             # Replace non-finite numbers (NaN, inf, -inf) with None for JSON compatibility
             forecast_output[col] = forecast_output[col].apply(lambda x: None if not np.isfinite(x) else x)

        # Convert prediction rows to list of dictionaries
        result_list = forecast_output[['label', 'predicted', 'lower_bound', 'upper_bound']].to_dict(orient='records')
        logger.info(f"(Training) Formatted {len(result_list)} prediction points for {granularity}.")
        return result_list

    except Exception as e:
        logger.error(f"(Training) Error during train/predict/format for {granularity}: {e}")
        raise RuntimeError(f"Train/Predict failed for {granularity}: {e}")


def store_predictions_in_supabase(supabase: Client, granularity, prediction_list):
    """Stores the prediction JSON list into the Supabase forecast table."""
    if not supabase:
        raise RuntimeError("Supabase client (for writing) not available.")
    if prediction_list is None: # Could be None if aggregation failed
        logger.warning(f"(Storage) No prediction list to store for {granularity}.")
        return False
    if not prediction_list: # Could be empty list if future df was empty
        logger.warning(f"(Storage) Empty prediction list for {granularity}, nothing to store.")
        return True # Technically not an error

    logger.info(f"(Storage) Storing {len(prediction_list)} predictions for {granularity} in Supabase...")
    try:
        # 1. Delete old forecasts for this granularity (optional but recommended)
        # This prevents the table from growing indefinitely.
        delete_response = supabase.table(FORECAST_TABLE_NAME)\
            .delete()\
            .eq('granularity', granularity)\
            .execute()
        # Basic check for delete errors (supabase-py might not raise exceptions on logical errors)
        # if hasattr(delete_response, 'error') and delete_response.error:
        #     logger.error(f"(Storage) Failed to delete old {granularity} forecasts: {delete_response.error}")
            # Decide if this is a fatal error or just a warning

        logger.info(f"(Storage) Old {granularity} forecasts cleanup attempted.")

        # 2. Insert the new forecast
        # We need to convert the list of dicts into a JSON string for Supabase client,
        # although jsonb column expects JSON, the client might need string representation.
        # However, supabase-py often handles dicts/lists directly for JSONB. Test this.
        forecast_json_data = prediction_list # Try passing the list directly first

        insert_response = supabase.table(FORECAST_TABLE_NAME)\
            .insert({"granularity": granularity, "forecast_data": forecast_json_data})\
            .execute()

        # Check for insert errors
        if hasattr(insert_response, 'error') and insert_response.error:
             logger.error(f"(Storage) Failed to insert {granularity} forecast: {insert_response.error}")
             raise RuntimeError(f"Supabase insert failed: {insert_response.error}")
        elif not insert_response.data:
            logger.error(f"(Storage) Supabase insert for {granularity} returned no data, potentially failed.")
            raise RuntimeError("Supabase insert failed silently.")


        logger.info(f"(Storage) Successfully stored {granularity} forecast in Supabase.")
        return True

    except Exception as e:
        logger.error(f"(Storage) Error storing {granularity} predictions in Supabase: {e}")
        raise RuntimeError(f"Supabase storage failed for {granularity}: {e}")


# Define the actual background task function
def run_training_and_storing():
    logger.info("--- Background Training Task Started ---")
    task_start_time = datetime.now()
    results = {'monthly': 'skipped', 'yearly': 'skipped'}
    task_errors = []

    try:
        # Use the service client for read/write needed in training/storing
        # If service key = anon key, this distinction isn't necessary
        write_client = supabase_write_client or supabase_read_client
        if not write_client: raise RuntimeError("No suitable Supabase client for training/writing.")

        base_data = fetch_and_prepare_data_for_training(write_client)

        if base_data is not None:
            # Monthly
            try:
                monthly_agg = aggregate_and_rename(base_data, 'MS', 'monthly')
                monthly_preds = train_predict_and_format(monthly_agg, 'monthly', PREDICT_MONTHLY_PERIODS)
                if store_predictions_in_supabase(write_client, 'monthly', monthly_preds):
                    results['monthly'] = 'success'
                else:
                    results['monthly'] = 'failed (storage)'
                    task_errors.append("Failed to store monthly predictions.")
            except Exception as e:
                logger.error(f"Error during monthly sequence: {e}")
                results['monthly'] = 'failed (exception)'
                task_errors.append(f"Monthly exception: {str(e)}")

            # Yearly
            try:
                yearly_agg = aggregate_and_rename(base_data, 'YS', 'yearly')
                yearly_preds = train_predict_and_format(yearly_agg, 'yearly', PREDICT_YEARLY_PERIODS)
                if store_predictions_in_supabase(write_client, 'yearly', yearly_preds):
                    results['yearly'] = 'success'
                else:
                    results['yearly'] = 'failed (storage)'
                    task_errors.append("Failed to store yearly predictions.")
            except Exception as e:
                logger.error(f"Error during yearly sequence: {e}")
                results['yearly'] = 'failed (exception)'
                task_errors.append(f"Yearly exception: {str(e)}")
        else:
            logger.error("(Training Task) Base data preparation failed, skipping storage.")
            task_errors.append("Base data preparation failed.")

    except Exception as e:
        logger.error(f"Unhandled exception during background training task: {e}", exc_info=True)
        task_errors.append(f"Task-level exception: {str(e)}")

    task_end_time = datetime.now()
    duration = task_end_time - task_start_time
    logger.info(f"--- Background Training Task Finished --- Duration: {duration} --- Results: {results} --- Errors: {task_errors} ---")

# ==============================================================================
#  API ENDPOINTS
# ==============================================================================

# --- FastAPI Lifespan (Optional, can be removed if no startup logic needed) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("API Starting up...")
    yield
    logger.info("API Shutting down...")

app = FastAPI(lifespan=lifespan)

@app.get("/")
async def read_root():
    """Root endpoint for basic health check."""
    return {"message": "Sales Forecast API is running!"}

# --- PROTECTED TRAINING ENDPOINT ---
@app.post("/train_and_store", status_code=status.HTTP_202_ACCEPTED)
async def trigger_training_and_storage(
    background_tasks: BackgroundTasks, # Inject background tasks handler
    api_key: str = Depends(get_api_key) # Protect endpoint
):
    """
    (Protected) Triggers the background task to train models and store predictions in Supabase.
    Returns immediately with 202 Accepted.
    """
    logger.info("--- /train_and_store Endpoint Triggered ---")
    # Add the actual work to the background queue
    background_tasks.add_task(run_training_and_storing)
    logger.info("Training and storing task added to background queue.")
    return {"message": "Training and storing process initiated in background."}


# --- PUBLIC PREDICTION ENDPOINT ---
@app.get("/predict/")
async def get_latest_forecast(
    granularity: str = Query(..., description="Forecasting granularity", pattern="^(monthly|yearly)$")
):
    """
    Retrieves the latest pre-calculated sales forecast from Supabase
    for the specified granularity.
    """
    logger.info(f"--- /predict request: granularity='{granularity}' ---")
    start_time = datetime.now()

    if not supabase_read_client:
         logger.error("Supabase read client not available for prediction.")
         raise HTTPException(status_code=500, detail="Prediction service not configured.")

    try:
        # Fetch the latest forecast for the given granularity
        response = supabase_read_client.table(FORECAST_TABLE_NAME)\
            .select("forecast_data, generated_at")\
            .eq("granularity", granularity)\
            .order("generated_at", desc=True)\
            .limit(1)\
            .maybe_single()\
            .execute() # maybe_single returns one record or None

        end_time = datetime.now()
        logger.info(f"Supabase query executed in {end_time - start_time}.")

        if response.data and 'forecast_data' in response.data:
            logger.info(f"Successfully retrieved latest {granularity} forecast generated at {response.data.get('generated_at')}.")
            # The forecast_data from Supabase should already be the correct JSON array
            return {
                "granularity": granularity,
                "forecast": response.data['forecast_data'],
                "generated_at": response.data.get('generated_at')
            }
        else:
            # Handle case where no forecast exists yet
            logger.warning(f"No pre-calculated forecast found for {granularity} in Supabase.")
            # Check for errors explicitly if needed:
            # if hasattr(response, 'error') and response.error:
            #     logger.error(f"Supabase read error: {response.error}")
            #     raise HTTPException(status_code=500, detail="Error fetching forecast data.")
            raise HTTPException(status_code=404, detail=f"No forecast found for {granularity}. Training may need to run.")

    except Exception as e:
        logger.error(f"(Prediction) Error fetching forecast from Supabase: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error retrieving forecast: {str(e)}")
