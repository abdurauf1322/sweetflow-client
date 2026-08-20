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
export const fallbackImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'%3E%3C/rect%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'%3E%3C/path%3E%3Ccircle cx='9' cy='9' r='2'%3E%3C/circle%3E%3C/svg%3E";

export const getImageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') return null;
  
  // Agar to'liq URL bo'lsa (S3 yoki boshqa http/https) — to'g'ridan-to'g'ri qaytaramiz
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Eski disk fayllariga fallback (localhost yoki Railway backend)
  const BASE_BACKEND_URL = import.meta.env?.VITE_API_BASE_URL 
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '')
    : 'http://localhost:5000';

  // Path boshidagi ortiqcha / yoki uploads/ so'zlarini tozalash
  const cleanPath = imagePath.replace(/^\/+/, '').replace(/^uploads\//, '');

  return `${BASE_BACKEND_URL}/uploads/${cleanPath}`;
};
