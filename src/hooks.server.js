import { supabase } from '$lib/supabaseClient';
import { redirect } from '@sveltejs/kit';

export const handle = async ({ event, resolve }) => {
  event.locals.supabase = supabase;

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (session) {
    // Get role along with session
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    event.locals.session = session;
    event.locals.userRole = profile?.role;
  } else {
    event.locals.session = null;
    event.locals.userRole = null;
  }

  return resolve(event);
};