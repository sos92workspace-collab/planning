import { supabase, requireRole } from '../supabaseClient.js';

const shiftSelect = document.getElementById('shift-select');
const wishTable = document.querySelector('#wish-table tbody');
const wishCount = document.getElementById('wish-count');
const wishForm = document.getElementById('wish-form');
const logoutBtn = document.getElementById('logout');
let userId;

function formatDate(value) {
  return new Date(value).toLocaleString('fr-FR');
}

function renderWishes(rows) {
  wishTable.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${row.shift_columns?.label ?? ''}</td>
          <td>${formatDate(row.shift_columns?.start_at)}</td>
          <td>${formatDate(row.shift_columns?.end_at)}</td>
          <td>${row.priority}</td>
          <td>${row.note ?? ''}</td>
        </tr>
      `,
    )
    .join('');
  wishCount.textContent = `${rows.length}`;
}

async function loadShifts() {
  const { data, error } = await supabase
    .from('shift_columns')
    .select('*')
    .eq('allowed_remplacant', true)
    .order('start_at');
  if (error) throw error;
  shiftSelect.innerHTML = data
    .map((shift) => `<option value="${shift.id}">${shift.label} (${formatDate(shift.start_at)})</option>`)
    .join('');
}

async function loadWishes() {
  const { data, error } = await supabase
    .from('shift_preferences')
    .select('priority, note, shift_columns(label, start_at, end_at)')
    .eq('profile_id', userId)
    .order('priority');
  if (error) throw error;
  renderWishes(data);
}

wishForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(wishForm));
  payload.priority = Number(payload.priority);
  payload.profile_id = userId;

  const { error } = await supabase.from('shift_preferences').insert(payload);
  if (error) alert(error.message);
  wishForm.reset();
  await loadWishes();
});

logoutBtn?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
});

(async () => {
  const auth = await requireRole('remplacant');
  if (!auth) return;
  userId = auth.session.user.id;
  await loadShifts();
  await loadWishes();
})();
