// Função interna para validar CNPJ (o mesmo código que já tínhamos)
function validaCNPJ(cnpj) {
  const b = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const c = String(cnpj).replace(/[^\d]/g, '');

  if (c.length !== 14 || /0{14}/.test(c)) return false;

  for (var i = 0, n = 0; i < 12; n += c[i] * b[++i]);
  if (c[12] != (((n %= 11) < 2) ? 0 : 11 - n)) return false;

  for (var i = 0, n = 0; i <= 12; n += c[i] * b[i++]);
  if (c[13] != (((n %= 11) < 2) ? 0 : 11 - n)) return false;

  return true;
}

// Função interna para validar CPF (o mesmo código que já tínhamos)
function validaCPF(cpf) {
  let Soma = 0;
  let Resto;
  const strCPF = String(cpf).replace(/[^\d]/g, '');

  if (strCPF.length !== 11) return false;

  if ([
    // '00000000000', - Desativado para que a gente possa usar esse para testes
    '11111111111',
    '22222222222',
    '33333333333',
    '44444444444',
    '55555555555',
    '66666666666',
    '77777777777',
    '88888888888',
    '99999999999',
  ].indexOf(strCPF) !== -1) return false;

  for (let i = 1; i <= 9; i++) Soma += parseInt(strCPF.substring(i - 1, i)) * (11 - i);
  Resto = (Soma * 10) % 11;
  if ((Resto === 10) || (Resto === 11)) Resto = 0;
  if (Resto !== parseInt(strCPF.substring(9, 10))) return false;

  Soma = 0;
  for (let i = 1; i <= 10; i++) Soma += parseInt(strCPF.substring(i - 1, i)) * (12 - i);
  Resto = (Soma * 10) % 11;
  if ((Resto === 10) || (Resto === 11)) Resto = 0;
  if (Resto !== parseInt(strCPF.substring(10, 11))) return false;

  return true;
}

/**
 * Valida um CPF ou CNPJ, detectando o tipo pelo número de dígitos.
 * Aceita valores formatados (com pontos, traços, barras).
 * @param {string} documento O CPF ou CNPJ a ser validado.
 * @returns {boolean} True se for válido, false caso contrário.
 */
export function validaDocumento(documento) {
  if (!documento) return false;

  // 1. Remove todos os caracteres que não são dígitos
  const valorLimpo = String(documento).replace(/[^\d]/g, '');

  // 2. Verifica o tipo pelo tamanho e chama a função correspondente
  if (valorLimpo.length === 11) {
    return validaCPF(valorLimpo);
  } else if (valorLimpo.length === 14) {
    return validaCNPJ(valorLimpo);
  }

  // Se não tiver 11 ou 14 dígitos, é inválido
  return false;
}