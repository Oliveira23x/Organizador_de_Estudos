// Datas civis locais: evita que o fuso horário altere o dia registrado.
export function toISODate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function addDays(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function weekStart(iso = toISODate()) {
  const [y, m, d] = iso.split('-').map(Number);
  const day = new Date(y, m - 1, d, 12).getDay();
  return addDays(iso, -((day + 6) % 7));
}

export function isISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  if (y < 2000 || y > 2100) return false;
  const date = new Date(y, m - 1, d, 12);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export function fromBRDate(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value).trim());
  return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
}

export function formatDate(iso) {
  return iso ? iso.slice(0, 10).split('-').reverse().join('/') : '';
}

export function formatMinutes(value = 0) {
  const total = Math.max(0, Math.round(Number(value) || 0));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h ? `${h}h${m ? ` ${String(m).padStart(2, '0')}min` : ''}` : `${m}min`;
}

export function dateInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.length > 4
    ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
    : digits.length > 2
      ? `${digits.slice(0, 2)}/${digits.slice(2)}`
      : digits;
}
