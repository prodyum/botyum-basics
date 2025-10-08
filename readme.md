# botyum-basics

botyum-basics is a modular console assistant that brings everyday voice-assistant workflows into a keyboard-first, screen-reader-friendly Node.js 18+ application. The project ships with focused feature packs that cover automation, research, productivity, media, finance, and deep voice integrations while keeping data on the developer workstation.

## Table of Contents
- [Project Layout](#project-layout)
- [Environment Setup](#environment-setup)
- [Tooling, Scripts, and Debugging](#tooling-scripts-and-debugging)
- [Deployment Playbook](#deployment-playbook)
- [Feature Catalog](#feature-catalog)
  - [Core Assistant](#core-assistant)
  - [Time Toolkit](#time-toolkit)
  - [Personal Toolkit](#personal-toolkit)
  - [Productivity Suite](#productivity-suite)
  - [Insight Search Hub](#insight-search-hub)
  - [Automation Kit](#automation-kit)
  - [Vision Suite](#vision-suite)
  - [Documents Suite](#documents-suite)
  - [Integrations Suite](#integrations-suite)
  - [Monitoring Suite](#monitoring-suite)
  - [Fun Arcade](#fun-arcade)
  - [Finance Suite](#finance-suite)
  - [Voice Suite](#voice-suite)
- [External Services and Data Sources](#external-services-and-data-sources)
- [Roadmap](#roadmap)
- [Assistant Gap Analysis](#assistant-gap-analysis)
- [Contributing Notes](#contributing-notes)

## Project Layout
- `index.js` - entry point that wires feature packs, handles the persistent store at `~/.botyum`, and exposes number-first menus for accessibility.
- `modules/` - feature implementations grouped by domain. Each folder exposes an `index.js` plugin that default-exports `{ id, label, description, order, async register(ctx) }`, while sibling files define the feature groups consumed by the plugin.
- `modules/shared/` - cross-cutting helpers (workspace persistence, web search utilities) reused by multiple plugins.
- `documents/` - workspace for generated documents and OCR output. The `.keep` file ensures the directory exists in git.
- `scripts/setup.js` - provisioning script that prepares the runtime cache, copies `.env` files when requested, and runs dependency health checks.

### Plugin Architecture
- `index.js` dynamically scans the `modules/` directory on each main-menu render and loads every plugin that exposes the contract above.
- To add a module, drop a new folder under `modules/<your-plugin>/`, create an `index.js` default export with `id`, `label`, `description`, optional `order`, and an async `register(ctx)` that returns `{ featureGroups, description? }`.
- The provided `ctx` includes shared utilities (`inquirer`, `curl`, `readStore`, `writeStore`, `scheduleCountdown`, `scheduleAbsolute`, `math`, `htmlToText`, etc.) plus plugin metadata such as `moduleDir` and a `resolve(...segments)` helper for local assets.
- Plugins are picked up without modifying core files; removing the folder detaches the module instantly.

## Environment Setup
1. **Clone and install**
   ```bash
   git clone <repo-url> botyum-basics
   cd botyum-basics
   npm install
   ```
2. **Bootstrap the workspace**
   ```bash
   npm run setup            # creates ~/.botyum/*, runs tool health checks
   npm run setup -- --copy-env   # optional: copies .env.example to .env
   ```
3. **Node and npm requirements**
   - Node.js >= 18.0.0 (v20+ recommended for Intl and fetch improvements)
   - npm (ships with Node)
4. **Environment variables** - copy `.env.example` and fill the keys you need:
   - `LIBRETRANSLATE_URL` - override the default libretranslate endpoint for translations.
   - `SLACK_TOKEN` - Slack Bot/User OAuth token for the Slack helper.
   - `GITHUB_TOKEN`, `TRELLO_KEY`, `TRELLO_TOKEN` - unlock higher rate limits for the Issues dashboard.
   - `IMAP_*` keys - optional IMAP sync for the email digest.
5. **Optional external tooling** - the assistant auto-detects these utilities; install the ones your features rely on:
   - `ffmpeg` (audio/video capture, transcription pre-processing)
   - `tesseract`, `pdftoppm` (OCR pipelines)
   - `soffice` / LibreOffice (Office document generation)
   - `yt-dlp` (YouTube and media metadata fetch)
   - `telegram-cli` (Telegram inbox bridge)
   - `espeak`, `spd-say`, `say`, Windows SAPI (text-to-speech fallbacks)
   - `xclip` / `xsel` (clipboard integration under X11)

### Windows quick install (ffmpeg / Tesseract / Poppler)

These tools are required for camera/screen capture and OCR features under Windows. You can install them via Scoop (user-level, no admin) or Chocolatey (admin).

- Using Scoop (recommended, user-level):
  ```powershell
  iwr -useb get.scoop.sh | iex
  $env:PATH="$HOME\scoop\shims;$env:PATH"
  scoop install ffmpeg tesseract poppler
  ffmpeg -version
  tesseract -v
  pdftoppm -v
  ```

- Using Chocolatey (admin PowerShell):
  ```powershell
  choco install ffmpeg -y
  choco install tesseract -y
  choco install poppler -y
  ffmpeg -version
  tesseract -v
  pdftoppm -v
  ```

Then run the project setup to verify:
```powershell
npm run setup
```
You should see a line similar to: `Found: ffmpeg, tesseract, pdftoppm` and warnings for any optional tools not yet installed.

## Tooling, Scripts, and Debugging
- `npm run dev` / `npm start` - launches the interactive console menu. The numeric selector works well with screen readers.
- `npm run setup` - re-run anytime you add optional binaries or rotate environment variables.
- There is no automated test suite yet; rely on manual smoke tests of the relevant menu paths.
- **Debug tips**
  - Export `DEBUG=1` to print stack traces when a feature throws.
  - Use `node --inspect-brk index.js` to attach Chrome DevTools or VS Code debugger.
  - Persistent data lives in `~/.botyum/botyum.json`; back it up before experiments.
  - Menu prompts accept either the displayed number or the raw feature id (useful when scripting).

## Deployment Playbook
- **Local workstation** - run `npm install && npm run dev`. Ensure `~/.botyum` is writable; the assistant stores alarms, notes, cache, and exports there.
- **Headless server or container**
  - Create a system user with a persistent home directory.
  - Install Node.js 20 LTS and the optional binaries needed by your feature set.
  - Copy `.env` and `~/.botyum` defaults; mount volumes for `documents/` if you export assets.
  - Run with a process manager such as `pm2 start index.js --name botyum` or a supervised `systemd` unit.
- **On-prem / enterprise deployment** - place credentials in a dedicated secret store; map `~/.botyum` to an encrypted volume; whitelist outbound requests to the public APIs you activate (LibreTranslate, Wikipedia, RapidAPI sources, etc.).
- **Packaging** - for air-gapped environments, use `npm pack` to create a tarball or vendor dependencies into a private registry. Include the optional binaries in a bootstrap script.

## Feature Catalog
Each feature pack exposes nested menus. The top-level selection chooses the pack; the second level navigates groups, and the third level launches a specific workflow. All menus answer to numeric input for accessibility.

### Core Assistant
- **Calculations**
  - *Calculator* — mathjs-powered evaluator that supports advanced expressions and unit math.
  - *Unit Converter* — reuse `mathjs.to()` semantics for engineering-friendly conversions.
- **Web & Knowledge Access**
  - *Open Link* — launch URLs with the native browser (`open`).
  - *Fetch Web Content* — download HTML and display textified (html-to-text) snippets.
  - *Google Search* — perform curl queries with a faux user agent and print ranked results.
  - *Wikipedia Q&A* — hit the REST summary API (tr/en fallback) to surface concise answers.
  - *Quick Link Generator* — build `tel:`, `sms:`, and WhatsApp deep links.

### Time Toolkit
- **Current Time** — list time for every timezone in a country.
- **Weekday Lookup** — reveal the weekday for any ISO timestamp.
- **Time Difference** — compute precise duration between two timestamps.
- **Time Adjustment** — add or subtract durations (supporting ISO input and discrete components).
- **Countdown Scheduler** — persist countdown timers that feed the shared alarm engine.
- **Alarm Planner** — schedule alarms at absolute times.
- **Alarm Inventory** — list and delete stored alarms.

### Personal Toolkit
- **Notes** — add/list/delete plain text notes.
- **To-Do List** — manage tasks with completion status.
- **Synonyms Glossary** — maintain personal synonym pairs for quick lookup.
- **Translation (TR↔EN)** — perform LibreTranslate-based conversions.
- **Weather** — fetch 7-day forecasts via Open-Meteo.
- **Text-to-Speech** — speak arbitrary text through platform engines.
- **Personal Settings** — toggle TTS and set default LibreTranslate endpoint.

### Productivity Suite
- **Calendar Import** — parse ICS files/URLs into readable event summaries.
- **Calendar Manager** — create, edit, and schedule reminders for local events.
- **Natural Reminders** — log quick reminders (currently scheduled +1 minute placeholders).
- **Email Digest** — configure IMAP and list recent messages.
- **RSS News** — fetch top headlines from RSS/Atom feeds.
- **Price Watch** — cache BTC/ETH prices via CoinGecko.
- **Content Summariser** — print the first 2k characters of a page in text form.
- **PDF Narrator** — extract text from PDFs and optionally TTS the first 1k characters.
- **Expenses** — maintain a simple expense ledger.
- **Clipboard Tools** — view or clear a minimal clipboard placeholder.
- **Text Templates** — store reusable snippets and display them.
- **Media Launcher** — open URLs immediately or after a countdown.
- **Comfort Shortcuts** — placeholder for future wellbeing routines.

### Insight Search Hub
- **Today Summary** — show today’s reminders and optional weather snapshot.
- **System Info** — display OS, CPU, and memory stats.
- **Maps Links** — generate Google/Yandex/Apple Maps deep links.
- **Package Tracking** — build quick search URLs for shipment codes.
- **Timezone Converter** — convert timestamps between zones.
- **Dictionary EN→TR** — surface meanings via dictionaryapi.dev.
- **Translation TR→EN** — pass phrases through LibreTranslate.
- **Media Search** — DuckDuckGo-powered YouTube lookups.
- **Quora Search** — list relevant Quora discussions via DuckDuckGo.
- **Reddit Search** — pull noteworthy Reddit threads for a query.
- **Social Search** — general web/social search aggregator.
- **Quote Feed** — display a random inspirational quote.
- **Data Insights** — compute quick CSV statistics (avg/min/max from numerical columns).

### Automation Kit
- **Webhook Sender** — configure defaults and trigger smart-home style webhooks.
- **ICS Event Builder** — export calendar events into `events/*.ics`.
- **Sun & Moon Almanac** — fetch sunrise/sunset and approximate moon phase.
- **Shopping List** — add, toggle, delete, and CSV-export shopping items.
- **Flashcards** — Leitner-style spaced repetition deck manager.
- **Pomodoro Coach** — run focus/break cycles with terminal countdowns.
- **QR Code Maker** — generate QR image URLs via qrserver.com.
- **Password Generator** — build random passwords or passphrases.
- **URL Shortener** — shorten links via TinyURL.
- **File Finder** — list files matching recent activity filters.
- **Tip Splitter** — calculate per-person totals with tip.
- **Readability Analyzer** — compute the Automated Readability Index for pasted text.

### Vision Suite
- **Camera Photo** – capture still photos to the workspace.
- **Camera Video** – record short video clips.
- **Screenshot + OCR** – take screenshots and extract text via Tesseract.
- **Image OCR** – run Tesseract against existing images and show extracted snippets.

### Documents Suite
- **Documents Browser** – list files under the `documents/` workspace.
- **Documents Search** – search file names and contents within the workspace.
- **Office Generator** – produce DOCX/XLSX/PPTX templates through LibreOffice.

### Integrations Suite
- **Slack Helper** – post, browse channels, and store auth settings.
- **Telegram Helper** – interact with `telegram-cli`, list chats, and send messages.
- **Issues Dashboard** – aggregate tickets from GitHub/Jira/Trello/Azure when tokens exist.
- **Quick Text Library** – store canned responses for handoffs.
- **User Profile** – capture personal preferences (locale, avatar, etc.) for other modules.

### Monitoring Suite
- **Page Watcher** – diff web pages over time and notify on change.
- **Traffic Links** – open saved traffic and transit dashboards.

### Fun Arcade
- **Dice Games** — single or double dice rolls.
- **Coin Flip** — classic yazı/tura generator.
- **Random Number** — pick a number within bounds.
- **Rock-Paper-Scissors** — challenge the built-in opponent.
- **Stopwatch** — lightweight start/stop timer.
- **Podcast Search** — query iTunes podcast directory.
- **YouTube Search** — list DuckDuckGo YouTube results.
- **Sports Search** — pull sports headlines.
- **Music Search** — gather general music search results (Apple/Amazon friendly).

### Finance Suite
- **Percentage/KDV Calculator** — handle simple percentage and tax increase scenarios.
- **Forex Converter** — USD-based currency conversions cached for 60 seconds via exchangerate.host.

### Voice Suite
- **Speech Tools** – orchestrate local STT pipelines, wake word helpers, and clipboard-powered transcripts.

## External Services and Data Sources
The assistant keeps data on disk but federates to several public APIs. Key destinations include LibreTranslate, Open-Meteo, dictionaryapi.dev, Wikipedia REST, DuckDuckGo, YouTube/Apple/Amazon search endpoints, exchangerate.host, CoinGecko, Slack, Telegram, GitHub, Jira, Trello, and Azure DevOps. Review each feature’s code before enabling it in regulated environments; most calls are authenticated with personal API tokens stored in `.env`.

## Roadmap
To surpass mainstream digital assistants in pragmatic day-to-day work, the following investments are recommended.

### Intelligence & Context
- **Unified context memory** - persist recent conversations and decisions, enabling long-running workflows and smarter follow-ups.
- **Semantic search** - embed documents and notes to provide vector-based recall across the local knowledge base.
- **Natural language automation** - parse plain-text instructions into multi-step workflows that chain existing modules.

### Enterprise Integrations
- **Calendar write-back connectors** - two-way sync with Google Workspace, Microsoft 365, and CalDAV.
- **CRM & ticketing bridges** - native adapters for Salesforce, HubSpot, Zendesk, ServiceNow.
- **Enterprise chat ops** - Microsoft Teams and Zoom Chat integrations alongside Slack and Telegram.

### Proactive Assistance
- **Routine scheduler** - configurable daily/weekly routines that proactively surface tasks, weather, commutes, and focus blocks.
- **Smart notifications** - anomaly detection on RSS, financial feeds, or monitored web pages with configurable thresholds.
- **Voice macros** - personal wake phrases mapped to stored scripts for rapid-fire operations.

### Developer Experience
- **Scripting SDK** - expose a plugin interface so teams can add features with minimal boilerplate.
- **Test harness** - record-and-replay console sessions for regression testing.
- **Telemetry & observability** - optional local dashboard to inspect logs, HTTP calls, and cache hits.

### Hardware & IoT
- **Home automation** - connectors for Home Assistant, Philips Hue, Shelly, smart thermostats.
- **Wearable sync** - pull activity and health metrics from Apple Health, Google Fit, Garmin.
- **In-car mode** - simplified prompts with TTS confirmation and offline maps caching.

## Assistant Gap Analysis
Mainstream assistants still offer capabilities that botyum-basics does not yet replicate. Highlighting these gaps helps prioritise roadmap efforts.

### Apple Siri
- Deep iOS integration: HomeKit scenes, SMS and phone call routing, CarPlay dashboards.
- On-device machine learning for photo search, device automation, and Shortcuts sharing.
- System-wide dictation with multilingual auto-detect and offline corrections.

### Amazon Alexa
- Smart speaker ecosystem with multi-room audio, skills marketplace, and household profiles.
- Device discovery for Zigbee/BLE accessories and guard mode security monitoring.
- Commerce flows (shopping lists, Amazon orders, delivery status) with voice purchasing safeguards.

### Google Assistant
- Bidirectional Chromecast control, Nest device management, and interpreter mode for live translation.
- Rich smart display UI with cards, routines, and assistant suggestions based on Gmail/Calendar heuristics.
- Continued conversation mode that maintains context without a repeated wake word.

### Microsoft Cortana (legacy enterprise focus)
- Native Microsoft 365 integration: Outlook triage, Teams scheduling, SharePoint search.
- Windows shell automation, including file system navigation and app launching with voice.
- Enterprise compliance certifications and Azure Active Directory single sign-on.

### General Voice-Assistant Capabilities Missing Today
- End-to-end encrypted voice messaging across platforms.
- Real-time navigation guidance with live traffic rerouting.
- Native smart home automation across multiple ecosystems.
- Marketplace ecosystem for third-party skills distributed to end users.
- Rich multilingual pipeline with automatic locale detection per utterance.
- Hands-free device provisioning and over-the-air firmware updates for companion hardware.

Addressing these holes—starting with conversation memory, smart home connectors, and richer voice pipelines—will position botyum-basics as a pragmatic alternative to consumer assistants for both individuals and organisations.

## Contributing Notes
- Review `AGENTS.md` for repository guidelines covering coding style, scripts, and commit expectations.
- Keep features modular by introducing a new plugin under `modules/<domain>/index.js`; export the plugin object described above and place group factories beside it so the loader picks it up automatically.
- Validate manually with `npm run dev` across all affected menus; share transcripts or screen-reader notes in pull requests to document the behaviour.
