// modules/productivity/google-calendar.js
// Google Calendar: OAuth ile etkinlik listele/ekle.


import fs from "fs-extra";
import path from "path";
import { google } from "googleapis";
import http from "http";
import { DateTime } from "luxon";
import { parseFlexibleDateTime } from "../core/utils.js";

const SCOPES = ["https://www.googleapis.com/auth/calendar"]; // read+write

async function authorizeInteractive(ctx) {
  const { open, ok, err } = ctx;
  const clientId = process.env.GCAL_CLIENT_ID || "";
  const clientSecret = process.env.GCAL_CLIENT_SECRET || "";
  const redirect = process.env.GCAL_REDIRECT_URI || "http://localhost:42817/callback";
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirect);
  const authUrl = oauth2Client.generateAuthUrl({ access_type: "offline", scope: SCOPES });
  await open(authUrl);
  console.log(ok("Tarayıcıda yetkilendirin, ardından dönen tam URL'yi yapıştırın."));
  return new Promise((resolve) => {
    const server = http.createServer();
    server.on("request", async (req, res) => {
      if (req.url && req.url.startsWith("/callback")) {
        const u = new URL(req.url, redirect);
        const code = u.searchParams.get("code");
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Yetkilendirme tamamlandı. Bu sekmeyi kapatabilirsiniz.");
        try {
          const { tokens } = await oauth2Client.getToken(code);
          oauth2Client.setCredentials(tokens);
          resolve(oauth2Client);
        } catch (e) {
          console.log(err("Token alınamadı."));
          resolve(null);
        } finally {
          try { server.close(); } catch {}
        }
      } else {
        res.writeHead(404); res.end();
      }
    });
    server.listen(42817);
  });
}

async function getAuthClient(ctx) {
  const storeFile = ctx.STORE_FILE || path.join(ctx.modulesDir || process.cwd(), ".botyum.json");
  const store = await fs.readJson(ctx.STORE_FILE).catch(() => ({}));
  const tokens = store.googleTokens;
  const clientId = process.env.GCAL_CLIENT_ID || "";
  const clientSecret = process.env.GCAL_CLIENT_SECRET || "";
  const redirect = process.env.GCAL_REDIRECT_URI || "http://localhost:42817/callback";
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirect);
  // OAuth bilgileri yoksa doğrudan fallback kullanılacak
  if (!clientId || !clientSecret) {
    return null;
  }
  if (tokens && tokens.access_token) {
    oauth2Client.setCredentials(tokens);
    return oauth2Client;
  }
  const authed = await authorizeInteractive(ctx);
  if (authed && (authed.credentials?.access_token || authed.credentials?.refresh_token)) {
    const creds = authed.credentials;
    const storeNow = await ctx.readStore();
    storeNow.googleTokens = creds;
    await ctx.writeStore(storeNow);
    return authed;
  }
  return null;
}

export function createGoogleCalendarGroup(ctx) {
  const { inquirer, ok, err, curl, warn } = ctx;

  async function listEvents() {
    // Önce OAuth dene
    const auth = await getAuthClient(ctx);
    if (auth) {
      const calendar = google.calendar({ version: "v3", auth });
      const now = new Date().toISOString();
      const { data } = await calendar.events.list({ calendarId: "primary", timeMin: now, maxResults: 10, singleEvents: true, orderBy: "startTime" });
      const items = data.items || [];
      if (!items.length) { console.log(ok("Yaklaşan etkinlik yok.")); return; }
      items.forEach((e, i) => {
        const start = e.start?.dateTime || e.start?.date || "";
        console.log(`${String(i + 1).padStart(2, "0")}) ${e.summary || "(Başlıksız)"} - ${start}`);
      });
      return;
    }
    // OAuth yoksa API key fallback (yalnızca public takvimler)
    console.log(warn("OAuth bulunamadı. API key ile public takvim listelenecek."));
    const envKey = process.env.GCAL_API_KEY || "";
    const { calendarId, apiKey } = await inquirer.prompt([
      { type: "input", name: "calendarId", message: "Public calendarId (örn: tr.turkish#holiday@group.v.calendar.google.com)" },
      { type: "password", name: "apiKey", message: "GCAL API Key (boş bırakırsanız .env GCAL_API_KEY kullanılacak)", mask: "*", default: envKey },
    ]);
    const key = apiKey || envKey;
    if (!key || !calendarId) { console.log(err("API key veya calendarId gerekli.")); return; }
    const now = new Date().toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(now)}&maxResults=10&singleEvents=true&orderBy=startTime&key=${encodeURIComponent(key)}`;
    try {
      const json = await curl(url, { Accept: "application/json" }, 20);
      const data = JSON.parse(json || "{}");
      const items = data.items || [];
      if (!items.length) { console.log(ok("Yaklaşan etkinlik yok (public).")); return; }
      items.forEach((e, i) => {
        const start = e.start?.dateTime || e.start?.date || "";
        console.log(`${String(i + 1).padStart(2, "0")}) ${e.summary || "(Başlıksız)"} - ${start}`);
      });
      console.log(warn("Not: API key ile sadece public takvimler okunur; ekleme/düzenleme için OAuth gerekir."));
    } catch (e) {
      console.log(err(`Public listeleme hatası: ${e.message}`));
    }
  }

  async function addEvent() {
    const auth = await getAuthClient(ctx);
    if (!auth) { console.log(err("Etkinlik eklemek için OAuth gerekir. Lütfen GCAL_CLIENT_ID/SECRET ayarlayıp yeniden deneyin.")); return; }
    const { summary, start, duration } = await inquirer.prompt([
      { type: "input", name: "summary", message: "Başlık" },
      { type: "input", name: "start", message: "Başlangıç (örn: 01.12.2025 14:00)" },
      { type: "number", name: "duration", message: "Süre (dk)", default: 60 },
    ]);
    const dt = parseFlexibleDateTime(start);
    if (!dt.isValid) { console.log(err("Geçersiz tarih/saat.")); return; }
    const startISO = dt.toISO();
    const endISO = dt.plus({ minutes: duration || 60 }).toISO();
    const calendar = google.calendar({ version: "v3", auth });
    await calendar.events.insert({
      calendarId: "primary",
      requestBody: { summary, start: { dateTime: startISO }, end: { dateTime: endISO } },
    });
    console.log(ok("Etkinlik eklendi."));
  }

  return {
    id: "google-calendar",
    label: "Google Takvim",
    description: "Google Calendar etkinliklerini listele veya ekle.",
    items: [
      { id: "gcal-list", label: "Yaklaşanları listele", run: listEvents },
      { id: "gcal-add", label: "Etkinlik ekle", run: addEvent },
    ],
  };
}





