import { createClient } from '@supabase/supabase-js'

export const handle = async ({ event, resolve }) => {
    event.locals.supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    // Access the session from a cookie
    const accessToken = event.cookies.get('sb-access-token')
    const refreshToken = event.cookies.get('sb-refresh-token')

    if (accessToken && refreshToken) {
        const { data: { session }, error } = await event.locals.supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
        })
        event.locals.session = session
    } else {
        event.locals.session = null
    }

    // Protected routes (add your protected routes here)
    if (event.url.pathname.startsWith('/admin') && !event.locals.session) {
        throw redirect(303, '/')
    }

    if (event.url.pathname.startsWith('/employee') && !event.locals.session) {
      throw redirect(303, '/')
  }

    return resolve(event)
}