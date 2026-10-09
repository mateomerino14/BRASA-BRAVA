import {randomInt} from 'node:crypto';

const codeLength = 6;
const codeRange = 10 ** codeLength;

// Genera un código numérico aleatorio de 6 dígitos
export const generateCode = () => String(randomInt(0, codeRange)).padStart(codeLength, '0');
