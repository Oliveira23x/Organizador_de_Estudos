import { ValidationError } from '../models/ValidationError.js';

export function readableError(error) {
  if (error instanceof ValidationError || error?.name === 'ValidationError') return error.message;
  const message = String(error?.message || '');
  if (/UNIQUE constraint failed: subjects/i.test(message))
    return 'Já existe uma disciplina com esse nome. Escolha outro nome.';
  if (/FOREIGN KEY constraint failed/i.test(message))
    return 'Este registro está vinculado a outros dados. Revise as sessões e metas relacionadas.';
  if (/database.*(locked|busy)/i.test(message))
    return 'O banco de dados está ocupado. Aguarde um momento e tente novamente.';
  if (/SQLITE_FULL|disk.*full/i.test(message))
    return 'O dispositivo está sem espaço para salvar os dados.';
  if (/O registro não existe/.test(message)) return message;
  return 'Não foi possível acessar os dados. Tente novamente. Seus registros anteriores continuam no dispositivo.';
}
