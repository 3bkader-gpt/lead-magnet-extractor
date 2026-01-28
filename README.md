<div align="center">

<img src="./images/logo128.png" alt="Lead Magnet Extractor" width="96" />

# 🧲 Lead Magnet Extractor

### Chrome Extension for extracting emails & phones from any webpage

[![Manifest](https://img.shields.io/badge/Manifest-V3-blue)](./manifest.json)
[![Version](https://img.shields.io/badge/version-3.0.1-3b82f6)](./manifest.json)
[![License](https://img.shields.io/badge/license-MIT-22c55e)](./LICENSE)

**Deep Scan • Obfuscation Detection • Smart Name Matching • Webhook Sync • Excel Export**

</div>

---

## 🎯 Overview

**Lead Magnet Extractor** is a lightweight **Manifest V3** Chrome extension that scans the current page and extracts:

- Emails (including obfuscated formats like `name [at] domain [dot] com`)
- Phone numbers (basic international patterns)
- Optional **name guesses** from nearby text context (English + Arabic)

It can highlight matches on the page, **export to `.xlsx`**, and optionally **POST results to a webhook** (Zapier/CRM/etc).

---

## ✨ Features

- **Scan + Deep Scan**: quick scan or auto-scroll deep scan for lazy-loaded pages
- **On-page highlighting**: emails (blue) and phones (green)
- **Obfuscation detection**: decodes common `[at]` / `[dot]` patterns
- **Smart name extraction**: best-effort name guess near each lead (EN/AR)
- **Webhook sync**: send results as JSON on demand
- **Excel export**: downloads a real `.xlsx` file (via embedded SheetJS build)
- **Persistence**: keeps scan results after closing the popup

---

## 📸 UI (Popup)

The popup UI is implemented in `popup.html` / `popup.css` / `popup.js` and includes:

- Scan tab (counts + deep scan toggle + actions)
- Settings tab (webhook URL + label)

---

## 🚀 Quick Start (Load Unpacked)

1. Clone:

```bash
git clone https://github.com/3bkader-gpt/lead-magnet-extractor.git
cd lead-magnet-extractor
```

2. Open Chrome extensions page:

- Go to `chrome://extensions/`
- Enable **Developer mode**
- Click **Load unpacked**
- Select the `lead-magnet-extractor` folder

3. (Optional) Pin it from the puzzle icon.

---

## 🧭 How to Use

1. Open any website page you want to scan.
2. Click the extension icon.
3. (Optional) enable **Deep Scan**.
4. Click **Scan Page**.
5. Use:
   - **Excel** to export `.xlsx`
   - **Sync** to send results to your webhook
   - **Trash** to clear stored results + remove highlights

---

## ☁️ Webhook Payload

When you click **Sync**, the extension sends:

```json
{
  "timestamp": "2026-01-23T12:51:00Z",
  "source": "https://example.com/contact",
  "leads": [
    { "type": "email", "value": "john@example.com", "name": "John Doe" },
    { "type": "phone", "value": "+1 555 555 5555", "name": "John Doe" }
  ],
  "summary": { "totalEmails": 1, "totalPhones": 1 }
}
```

---

## 🔒 Permissions & Privacy

Declared in `manifest.json`:

- `activeTab`: scan only the currently active page
- `scripting`: inject `content.js` for scanning/highlighting
- `storage`: save scan results + deep-scan toggle locally, webhook settings in sync storage

**Privacy notes**

- All scanning happens locally in your browser.
- Nothing is sent anywhere **unless you click Sync** (webhook).
- No tracking/analytics.

---

## 🧩 Project Structure

```text
lead-magnet-extractor/
├── manifest.json
├── content.js
├── popup.html
├── popup.css
├── popup.js
├── libs/
│   └── xlsx.mini.min.js
└── images/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

---

## 🧪 Troubleshooting

- **“Cannot scan Chrome internal pages”**: open a normal website page (not `chrome://...`).
- **No results**: try **Deep Scan** on pages that load content while scrolling.
- **Sync is disabled**: configure a webhook URL in Settings first.

---

## 🤝 Contributing

Issues and PRs are welcome:

- Bug reports
- Better regex patterns (phones/emails)
- Better name extraction heuristics
- UI improvements

---

## 📄 License

MIT. See `LICENSE`.
