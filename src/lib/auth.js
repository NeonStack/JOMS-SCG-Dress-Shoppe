
import { supabase } from './supabaseClient';

// Set up periodic session refresh (every 4 minutes)
export function initializeAuthRefresh() {
    setInterval(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await supabase.auth.refreshSession();
        }
    }, 4 * 60 * 1000); // 4 minutes
}