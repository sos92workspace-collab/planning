import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://tnsjdhuulaebclvdtthh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uGW0mWIQ94EO9zmZ56bnAA_guffQW5T';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export function roleToPage(role) {
  switch (role) {
    case 'admin':
      return 'admin.html';
    case 'titulaire':
      return 'saisie_titulaire.html';
    case 'remplacant':
      return 'saisie_remplacant.html';
    default:
      return null;
  }
}

export async function requireRole(role) {
  const session = await getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  const profile = await getProfile(session.user.id);
  if (role && profile.role !== role) {
    const target = roleToPage(profile.role) || 'login.html';
    window.location.href = target;
    return null;
  }
  return { session, profile };
}
