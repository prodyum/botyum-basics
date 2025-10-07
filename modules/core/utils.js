// Description: Implements the utils features.
import { DateTime } from "luxon";

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
  // TR -> ISO ülke adı eşlemeleri (yaygın Türkçe karşılıklar)
  const trAliases = {
    "turkiye": "TR",
    "türkiye": "TR",
    "azerbaycan": "AZ",
    "kibris": "CY",
    "kıbrıs": "CY",
    "almanya": "DE",
    "fransa": "FR",
    "ispanya": "ES",
    "ingiltere": "GB",
    "birlesik krallik": "GB",
    "birleşik krallık": "GB",
    "amerika": "US",
    "abd": "US",
    "kanada": "CA",
    "japonya": "JP",
    "guney kore": "KR",
    "güney kore": "KR",
    "isvec": "SE",
    "isveç": "SE",
    "norvec": "NO",
    "norveç": "NO",
    "isvicre": "CH",
    "isviçre": "CH",
    "italya": "IT",
    "hollanda": "NL",
    "yeni zelanda": "NZ",
    "avustralya": "AU",
    "yunanistan": "GR",
    "rusya": "RU",
    "ukrayna": "UA",
    "paraguay": "PY",
  };
  const lower = code.toLowerCase();
  if (trAliases[lower]) {
    code = trAliases[lower];
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


// Esnek tarih/saat ayrıştırıcı: ISO, HH:mm ve yaygın tarih biçimlerini destekler
// options: { zone?: string, now?: DateTime }
export function parseFlexibleDateTime(input, options = {}) {
  const raw = (input ?? "").toString().trim();
  const zone = options.zone;
  const now = options.now || DateTime.now().setZone(zone || undefined);
  if (!raw) {
    return DateTime.invalid("empty");
  }
  // Önce ISO'yu dene (tarih/saat veya sadece tarih)
  let dt = DateTime.fromISO(raw, { setZone: true, zone });
  if (dt.isValid) {
    return dt;
  }
  // Sadece saat (HH:mm) → bugünün tarihi ile
  if (/^\d{1,2}:\d{2}$/.test(raw)) {
    const [H, M] = raw.split(":").map((n) => Number(n));
    return now.set({ hour: H, minute: M, second: 0, millisecond: 0 });
  }
  // Yaygın tarih ve tarih+saat biçimleri
  const candidates = [
    "dd.MM.yyyy",
    "dd/MM/yyyy",
    "dd-MM-yyyy",
    "yyyy/MM/dd",
    "yyyy.MM.dd",
    "yyyy-MM-dd",
    // tarih + saat
    "dd.MM.yyyy HH:mm",
    "dd/MM/yyyy HH:mm",
    "dd-MM-yyyy HH:mm",
    "yyyy/MM/dd HH:mm",
    "yyyy.MM.dd HH:mm",
    "yyyy-MM-dd HH:mm",
  ];
  for (const fmt of candidates) {
    const parsed = DateTime.fromFormat(raw, fmt, { setZone: true, zone });
    if (parsed.isValid) {
      return parsed;
    }
  }
  return dt; // geçersiz
}


