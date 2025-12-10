import { supabase, getProfile, roleToPage } from '../supabaseClient.js';

const form = document.getElementById('login-form');
const message = document.getElementById('message');

function showMessage(text, type = 'alert') {
  message.innerHTML = `<div class="${type}">${text}</div>`;
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = new FormData(form).get('email');
  const password = new FormData(form).get('password');
  showMessage('Connexion en cours...', 'success');

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    showMessage(error.message, 'alert');
    return;
  }

  try {
    const profile = await getProfile(data.user.id);
    const target = roleToPage(profile.role);
    if (!target) {
      showMessage('Rôle non reconnu, contactez un administrateur.', 'alert');
    } else {
      window.location.href = target;
    }
  } catch (err) {
    showMessage(err.message, 'alert');
  }
});

// Si déjà connecté, redirige automatiquement
(async () => {
  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  if (session) {
    try {
      const profile = await getProfile(session.user.id);
      const target = roleToPage(profile.role);
      if (target) window.location.href = target;
    } catch (err) {
      console.error(err);
    }
  }
})();
