// Global override for Number.prototype.toLocaleString to format thousands with space
const originalToLocaleString = Number.prototype.toLocaleString;
Number.prototype.toLocaleString = function(locale, options) {
  if (locale || options) {
    return originalToLocaleString.call(this, locale, options);
  }
  return originalToLocaleString.call(this, 'en-US').replace(/,/g, ' ');
};

export const formatMoney = (val) => {
  return Number(val || 0).toLocaleString();
};

export const formatNumberWithSpaces = (val) => {
  if (val === undefined || val === null || val === '') return '';
  // Remove all non-digits
  const clean = val.toString().replace(/[^0-9]/g, '');
  if (clean === '') return '';
  // Format with space as separator
  return Number(clean).toLocaleString('en-US').replace(/,/g, ' ');
};

export const parseNumberFromSpaces = (val) => {
  if (val === undefined || val === null || val === '') return 0;
  return Number(val.toString().replace(/\s/g, ''));
};
export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('blob:') || path.startsWith('http')) {
    return path;
  }
  
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (apiBase && apiBase.startsWith('http')) {
    return `${apiBase.replace('/api/v1', '')}${path.startsWith('/') ? '' : '/'}${path}`;
  }
  
  const host = window.location.hostname;
  return `http://${host}:5000${path.startsWith('/') ? '' : '/'}${path}`;
};
