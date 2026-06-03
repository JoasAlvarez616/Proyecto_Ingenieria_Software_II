/**
 * Formats a raw number or string representing a number into a Spanish/local formatted currency string.
 * Example: 200000 -> "200.000"
 */
export const formatNumberString = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null || value === '') return '';
  
  // Split integer and decimal parts
  const parts = value.toString().split('.');
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? parts[1] : null;
  
  let formattedInteger: string;
  if (integerPart) {
    formattedInteger = parseInt(integerPart, 10).toLocaleString('es-ES');
  } else {
    formattedInteger = '0';
  }
  
  if (decimalPart !== null && decimalPart !== '') {
    return `${formattedInteger},${decimalPart.slice(0, 2)}`;
  }
  
  return formattedInteger;
};

/**
 * Handles number input changes dynamically to format thousands with dots and decimals with commas.
 * Allows entering dot or comma as decimal separator.
 */
export const handleNumberInput = (inputVal: string, currentValue: string): { display: string; raw: number } => {
  if (!inputVal) return { display: '', raw: 0 };
  
  const lastChar = inputVal[inputVal.length - 1];
  const hasCommaInInput = inputVal.includes(',');
  
  let cleaned: string;
  
  if ((lastChar === '.' || lastChar === ',') && !currentValue.includes(',')) {
    // User typed a decimal separator at the end
    cleaned = inputVal.slice(0, -1).replace(/[^0-9]/g, '') + ',';
  } else {
    // User typed a digit or other character
    if (hasCommaInInput) {
      const parts = inputVal.split(',');
      const intPart = parts[0].replace(/[^0-9]/g, '');
      const decPart = parts.slice(1).join('').replace(/[^0-9]/g, '');
      cleaned = intPart + ',' + decPart;
    } else {
      // No comma, strip everything except digits
      cleaned = inputVal.replace(/[^0-9]/g, '');
    }
  }
  
  const parts = cleaned.split(',');
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? parts[1] : null;
  
  let display = '';
  if (integerPart) {
    display = parseInt(integerPart, 10).toLocaleString('es-ES');
  } else if (parts.length > 1) {
    display = '0';
  }
  
  if (decimalPart !== null) {
    display += ',' + decimalPart.slice(0, 2);
  }
  
  const cleanInt = integerPart || '0';
  const cleanDec = decimalPart ? decimalPart.slice(0, 2) : '0';
  const raw = parseFloat(`${cleanInt}.${cleanDec}`);
  
  return { display, raw };
};

/**
 * Parses a formatted number string back to a float number.
 * Supports string or number input.
 */
export const parseFormattedNumber = (value: string | number | undefined | null): number => {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;
  const clean = value.replace(/\./g, '').replace(/,/g, '.');
  return parseFloat(clean) || 0;
};

