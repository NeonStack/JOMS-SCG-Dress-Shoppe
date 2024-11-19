import { supabase } from '$lib/supabaseClient';

export const handle = async ({ event, resolve }) => {
  event.locals.supabase = supabase;

  const {
    data: { session }
  } = await supabase.auth.getSession();

  event.locals.session = session;

  return resolve(event);
};
