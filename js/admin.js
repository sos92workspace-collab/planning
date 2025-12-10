import { supabase, requireRole } from '../supabaseClient.js';

const doctorForm = document.getElementById('doctor-form');
const columnForm = document.getElementById('column-form');
const doctorTable = document.querySelector('#doctor-table tbody');
const columnTable = document.querySelector('#column-table tbody');
const recapTable = document.querySelector('#recap-table tbody');
const logoutBtn = document.getElementById('logout');

function formatDate(value) {
  return new Date(value).toLocaleString('fr-FR');
}

function renderRows(target, rows, render) {
  target.innerHTML = rows.map(render).join('');
}

async function refreshDoctors() {
  const { data, error } = await supabase.from('profiles').select('*').order('full_name');
  if (error) throw error;
  renderRows(doctorTable, data, (doctor) => `
    <tr>
      <td>${doctor.full_name}</td>
      <td>${doctor.email}</td>
      <td>${doctor.role}</td>
      <td>${doctor.priority_index ?? '-'}</td>
    </tr>
  `);
  document.getElementById('doctor-count').textContent = `${data.length} médecin${data.length > 1 ? 's' : ''}`;
}

async function refreshColumns() {
  const { data, error } = await supabase.from('shift_columns').select('*').order('start_at');
  if (error) throw error;
  renderRows(columnTable, data, (col) => `
    <tr>
      <td>${col.label}</td>
      <td>${formatDate(col.start_at)}</td>
      <td>${formatDate(col.end_at)}</td>
    </tr>
  `);
  document.getElementById('column-count').textContent = `${data.length} créneau${data.length > 1 ? 'x' : ''}`;
}

async function refreshRecap() {
  const { data, error } = await supabase
    .from('shift_preferences')
    .select('priority, note, shift_columns(label, start_at), profiles(full_name)')
    .order('priority');
  if (error) throw error;
  renderRows(recapTable, data, (row) => `
    <tr>
      <td>${row.profiles?.full_name ?? ''}</td>
      <td>${row.shift_columns?.label ?? ''} (${formatDate(row.shift_columns?.start_at)})</td>
      <td>${row.priority}</td>
      <td>${row.note ?? ''}</td>
    </tr>
  `);
}

function listenRealtime() {
  supabase
    .channel('admin-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, refreshDoctors)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'shift_columns' }, refreshColumns)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'shift_preferences' }, refreshRecap)
    .subscribe();
}

logoutBtn?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
});

doctorForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(doctorForm));
  payload.priority_index = payload.priority_index ? Number(payload.priority_index) : null;
  const { error } = await supabase.from('profiles').insert(payload);
  if (error) alert(error.message);
  doctorForm.reset();
});

columnForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(columnForm));
  payload.allowed_remplacant = !!payload.allowed_remplacant;
  const { error } = await supabase.from('shift_columns').insert(payload);
  if (error) alert(error.message);
  columnForm.reset();
});

(async () => {
  const auth = await requireRole('admin');
  if (!auth) return;
  await Promise.all([refreshDoctors(), refreshColumns(), refreshRecap()]);
  listenRealtime();
})();
