// Description: Implements the utils features.
export function sanitizeUrl(url) {
  if (!url) {
    return '';
  }
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export function encodeQuery(value) {
  return encodeURIComponent(value ?? '');
}

export function countryToTimezones(input, ct, getCountryCode) {
  let code = (input || '').trim();
  if (!code) {
    return [];
  }
  if (code.length > 2) {
    const guessed = getCountryCode(code);
    if (guessed) {
      code = guessed;
    }
  }
  code = code.toUpperCase();
  const info = ct.getTimezonesForCountry(code) || [];
  return info.map((item) => item.name).filter(Boolean);
}


