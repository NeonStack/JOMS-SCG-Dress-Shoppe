// src/lib/adminClient.js
import { createClient } from "@supabase/supabase-js";
import {
  PRIVATE_SUPABASE_URL,
  PRIVATE_SUPABASE_SERVICE_KEY,
} from "$env/static/private";

export const adminClient = createClient(
  PRIVATE_SUPABASE_URL,
  PRIVATE_SUPABASE_SERVICE_KEY
);
