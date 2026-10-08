// Pure, dependency-free validation helpers for Brazilian CPF and CNPJ documents.
// CPF is always numeric. CNPJ became alphanumeric in 2026: the first 12 positions may
// hold letters or digits, while the last 2 check digits stay numeric.

// Keep digits only. Used for CPF, which is always numeric.
export function normalizeCpf(input: string): string {
  return (input ?? '').replace(/\D/g, '');
}

// Strip anything outside [0-9A-Za-z] and upper-case the result.
// Never use [^\d] here: it would drop the letters of an alphanumeric CNPJ.
export function normalizeCnpj(input: string): string {
  return (input ?? '').replace(/[^0-9A-Za-z]/g, '').toUpperCase();
}

// Validate a CPF check digit (modulo 11). Rejects the repeated-digit sequences.
export function isValidCpf(input: string): boolean {
  const cpf = normalizeCpf(input);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const checkDigit = (length: number): number => {
    let sum = 0;
    let weight = length + 1;
    for (let i = 0; i < length; i++) {
      sum += parseInt(cpf[i], 10) * weight;
      weight--;
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return checkDigit(9) === parseInt(cpf[9], 10) && checkDigit(10) === parseInt(cpf[10], 10);
}

// Validate an alphanumeric CNPJ check digit (modulo 11).
// 12 alphanumeric positions + 2 numeric check digits. Each character value is charCode - 48.
export function isValidCnpj(input: string): boolean {
  const cnpj = normalizeCnpj(input);
  if (cnpj.length !== 14) return false;
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(cnpj)) return false;
  if (/^(.)\1{13}$/.test(cnpj)) return false;

  const value = (character: string): number => character.charCodeAt(0) - 48;
  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const checkDigit = (base: string, weights: number[]): number => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += value(base[i]) * weights[i];
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = checkDigit(cnpj.slice(0, 12), firstWeights);
  const secondDigit = checkDigit(cnpj.slice(0, 12) + String(firstDigit), secondWeights);

  return firstDigit === parseInt(cnpj[12], 10) && secondDigit === parseInt(cnpj[13], 10);
}
