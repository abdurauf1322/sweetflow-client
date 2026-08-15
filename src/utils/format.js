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
  if (!imagePath) return null;
  if (imagePath.startsWith('blob:') || imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  let backendUrl = 
    import.meta.env?.VITE_API_BASE_URL || 
    import.meta.env?.VITE_API_URL || 
    (typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_API_URL || process.env?.VITE_API_URL : null);
    
  if (!backendUrl) {
    const isLocal = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.hostname.startsWith('192.168.') || 
                    window.location.hostname.startsWith('10.') || 
                    window.location.hostname.startsWith('172.');
                    
    backendUrl = isLocal 
      ? `http://${window.location.hostname}:5000`
      : 'https://sweetflow-backend-production.up.railway.app';
  }
  
  const cleanBase = backendUrl.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
  const cleanPath = imagePath.replace(/^\/+/, '').replace(/^uploads\//, '');
  return `${cleanBase}/uploads/${cleanPath}`;
};
