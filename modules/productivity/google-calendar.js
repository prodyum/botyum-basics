// modules/productivity/google-calendar.js
// Google Calendar: OAuth ile etkinlik listele/ekle.


import fs from "fs-extra";
import path from "path";
import { google } from "googleapis";
import { DateTime } from "luxon";
import { parseFlexibleDateTime } from "../core/utils.js";

const SCOPES = ["https://www.googleapis.com/auth/calendar"]; // read+write

async function authorizeInteractive(ctx) {
  const { open, warn, ok, err } = ctx;
  const clientId = process.env.GCAL_CLIENT_ID || "";
  const clientSecret = process.env.GCAL_CLIENT_SECRET || "";
  const redirect = process.env.GCAL_REDIRECT_URI || "http://localhost:42817/callback";
  if (!clientId || !clientSecret) {
    console.log(warn("GCAL_CLIENT_ID/GCAL_CLIENT_SECRET .env'de yok. Yalnızca listeleme başarısız olabilir."));
  }
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirect);
  const authUrl = oauth2Client.generateAuthUrl({ access_type: "offline", scope: SCOPES });
  await open(authUrl);
  console.log(ok("Tarayıcıda yetkilendirin, ardından dönen tam URL'yi yapıştırın."));
  return new Promise((resolve) => {
    const server = ctx.require && ctx.require("http").createServer ? ctx.require("http").createServer() : null;
    if (server) {
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
    } else {
      // Fallback: manuel yapıştırma
      resolve(oauth2Client);
    }
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
  if (tokens && tokens.access_token) {
    oauth2Client.setCredentials(tokens);
    return oauth2Client;
  }
  const authed = await authorizeInteractive(ctx);
  if (authed) {
    const creds = authed.credentials;
    const storeNow = await ctx.readStore();
    storeNow.googleTokens = creds;
    await ctx.writeStore(storeNow);
    return authed;
  }
  return null;
}

export function createGoogleCalendarGroup(ctx) {
  const { inquirer, ok, err } = ctx;

  async function listEvents() {
    const auth = await getAuthClient(ctx);
    if (!auth) { console.log(err("Yetkilendirme yapılamadı.")); return; }
    const calendar = google.calendar({ version: "v3", auth });
    const now = new Date().toISOString();
    const { data } = await calendar.events.list({ calendarId: "primary", timeMin: now, maxResults: 10, singleEvents: true, orderBy: "startTime" });
    const items = data.items || [];
    if (!items.length) { console.log(ok("Yaklaşan etkinlik yok.")); return; }
    items.forEach((e, i) => {
      const start = e.start?.dateTime || e.start?.date || "";
      console.log(`${String(i + 1).padStart(2, "0")}) ${e.summary || "(Başlıksız)"} - ${start}`);
    });
  }

  async function addEvent() {
    const auth = await getAuthClient(ctx);
    if (!auth) { console.log(err("Yetkilendirme yapılamadı.")); return; }
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





