import { supabase } from '$lib/supabaseClient'
import { invalidate } from '$app/navigation'

supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        invalidate('supabase:auth')
    }
})