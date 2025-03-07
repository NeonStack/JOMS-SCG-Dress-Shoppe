import { json } from '@sveltejs/kit';
import { 
  prepareHistoricalData, 
  analyzeSeasonalPatterns, 
  analyzeCustomerDemand, 
  createSalesPredictionModel, 
  makePredictions,
  predictFutureTrends,
  predictInventoryNeeds
} from '$lib/api/ai/tensorflow.js';
import { supabase } from '$lib/supabaseClient';

export async function GET() {
  try {
    // Fetch order data from the past year
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        uniform_type,
        status,
        amount_paid,
        created_at,
        completed_at,
        payment_date,
        students (
          gender,
          courses (
            course_code
          )
        )
      `)
      .gte('created_at', oneYearAgo.toISOString());

    if (orderError) throw orderError;

    // Prepare data for predictions
    const historicalData = prepareHistoricalData(orderData);
    
    // Create and train the model - always attempt to create a model
    const model = await createSalesPredictionModel(historicalData);
    
    // Generate data for next 30 days
    const lastDate = historicalData.length > 0 
      ? new Date(historicalData[historicalData.length - 1].date)
      : new Date();
    
    const nextThirtyDays = [];
    for (let i = 1; i <= 30; i++) {
      const predictionDate = new Date(lastDate);
      predictionDate.setDate(lastDate.getDate() + i);
      
      // Use 0 as previous day revenue if we don't have data
      const previousDay = i === 1 && historicalData.length > 0
        ? historicalData[historicalData.length - 1].revenue
        : 0;
      
      nextThirtyDays.push([
        predictionDate.getDay(),
        predictionDate.getDate(),
        predictionDate.getMonth(),
        previousDay > 0 ? 1 : 0 // Binary indicator
      ]);
    }
    
    // Always make predictions, even if the model is a fallback
    let predictions = model ? makePredictions(model, nextThirtyDays) : Array(30).fill(0);
    
    // Format predictions for display
    const formattedPredictions = nextThirtyDays.map((day, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i + 1);
      
      return {
        date: date.toISOString().split('T')[0],
        predicted: Math.max(0, Math.round(predictions[i] * 100) / 100),
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day[0]]
      };
    });
    
    // Get seasonal analysis
    const seasonalAnalysis = analyzeSeasonalPatterns(orderData);
    
    // Get customer demand analysis
    const demandAnalysis = analyzeCustomerDemand(orderData);
    
    // Get additional AI predictions
    const futureTrends = predictFutureTrends(orderData);
    const inventoryNeeds = predictInventoryNeeds(orderData);
    
    // Calculate confidence score based on data availability
    const confidenceScore = Math.min(100, Math.max(20, (historicalData.length / 30) * 100));
    
    return json({
      success: true,
      predictions: formattedPredictions,
      seasonalAnalysis,
      demandAnalysis,
      futureTrends,
      inventoryNeeds,
      dataQuality: {
        confidenceScore: Math.round(confidenceScore), 
        dataPoints: historicalData.length,
        coverage: historicalData.length > 0 
          ? `${historicalData.length} days of historical data available`
          : "Limited historical data available",
        recommendation: historicalData.length < 30 
          ? "Continue collecting data for more accurate predictions" 
          : "Data quality is good for predictions"
      },
      insights: {
        topPerforming: {
          day: seasonalAnalysis.insights.bestDay.name,
          month: seasonalAnalysis.insights.bestMonth.name,
          quarter: seasonalAnalysis.insights.bestQuarter.name
        },
        demand: {
          popularUniform: demandAnalysis.insights.mostPopularUniform,
          popularCourse: demandAnalysis.insights.mostPopularCourse,
          dominantGender: demandAnalysis.insights.dominantGender
        },
        predictedRevenue: formattedPredictions.length > 0 
          ? formattedPredictions.reduce((sum, p) => sum + p.predicted, 0).toFixed(2)
          : '0.00',
        growthOpportunities: futureTrends.growthOpportunities,
        inventoryRecommendations: Object.entries(inventoryNeeds.recommendedStock)
          .map(([type, qty]) => `${type}: ${qty} units`)
      }
    });
  } catch (error) {
    console.error('AI prediction error:', error);
    return json({
      success: false,
      error: 'Failed to generate AI predictions',
      details: error.message
    }, { status: 500 });
  }
}