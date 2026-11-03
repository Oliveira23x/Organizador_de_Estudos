export class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export function requireInteger(value, min, max, label, field) {
  if (!/^\d+$/.test(String(value).trim()))
    throw new ValidationError(`${label}: informe um número inteiro.`, field);
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) {
    throw new ValidationError(`${label}: use um valor entre ${min} e ${max}.`, field);
  }
  return number;
}

export function optionalText(value, max, label, field) {
  const text = String(value ?? '').trim();
  if (text.length > max) throw new ValidationError(`${label}: limite de ${max} caracteres.`, field);
  return text;
}
