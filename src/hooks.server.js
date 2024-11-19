import { supabase } from '$lib/supabaseClient';

export const handle = async ({ event, resolve }) => {
  event.locals.supabase = supabase;

  // Get the session from the request
  const {
    data: { session }
  } = await supabase.auth.getSession();

  // If session exists but is about to expire, refresh it
  if (session) {
    const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
    event.locals.session = refreshedSession;
  } else {
    event.locals.session = session;
  }

  return resolve(event);
};
