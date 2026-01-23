<div align="center">

# 🧲 Lead Magnet Extractor

### 🚀 Enterprise Edition v3.0

[![Version](https://img.shields.io/badge/version-3.0-blue.svg)](https://github.com/3bkader-gpt/lead-magnet-extractor)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome](https://img.shields.io/badge/Chrome-Extension-yellow.svg)](https://chrome.google.com/webstore)
[![Enterprise](https://img.shields.io/badge/Edition-Enterprise-purple.svg)](https://github.com/3bkader-gpt/lead-magnet-extractor)

**The Ultimate Professional Lead Extraction Tool** ⚡

*Transform any webpage into a structured lead database with one click*

---

</div>

## 🌟 Overview

**Lead Magnet Extractor Enterprise** is a powerful Chrome extension designed for professionals who need to extract, organize, and export contact information at scale. With advanced features like smart name detection, webhook integration, and Excel export, it's the perfect tool for sales teams, marketers, and data analysts.

> 💼 **Enterprise-Grade**: Built for professionals who demand precision, automation, and seamless integration with their existing workflows.

---

## ✨ Enterprise Features

| Feature | Description | Status |
|---------|-------------|--------|
| 🔍 **Deep Scan** | Auto-scrolls through entire pages to trigger lazy-loaded content | ✅ |
| 🎨 **DOM Highlighting** | Visual feedback with blue borders for emails, green for phones | ✅ |
| 🛡️ **Obfuscation Detection** | Intelligently detects and decodes hidden emails (`[at]`, `[dot]` patterns) | ✅ |
| 👤 **Smart Name Extraction** | Automatically finds names associated with emails/phones | ✅ |
| 🌐 **Webhook Integration** | POST data directly to CRM, Zapier, or any webhook endpoint | ✅ |
| 📊 **Excel Export** | Generate real `.xls` files with professional formatting | ✅ |
| 💾 **State Persistence** | Data survives popup close - never lose your results | ✅ |
| 🔔 **Toast Notifications** | Beautiful success/error feedback for all actions | ✅ |
| 🌍 **Multi-language Support** | Name extraction supports English + Arabic names | ✅ |

---

## 🎯 Key Capabilities

### 🔍 Intelligent Scanning
- **Standard Scan**: Quick extraction from visible content
- **Deep Scan**: Comprehensive page analysis with auto-scrolling
- **Progress Tracking**: Real-time progress bar during deep scans
- **Smart Detection**: Finds emails, phones, and associated names

### 🎨 Visual Feedback
- **Color-Coded Highlights**: 
  - 🔵 Blue borders for email addresses
  - 🟢 Green borders for phone numbers
- **Interactive Tooltips**: Hover to see full contact details
- **Real-time Stats**: Live count of discovered leads

### ☁️ Integration & Export
- **Webhook Sync**: Send data directly to your CRM or automation platform
- **Excel Export**: Download formatted `.xls` files ready for import
- **Clipboard Copy**: Quick copy-to-clipboard functionality
- **State Management**: All data persists across sessions

---

## 📦 Project Structure

```
lead-magnet-extractor/
├── manifest.json          # v3.0 with storage permission
├── content.js             # Scraping + name extraction engine
├── popup.js               # UI logic + webhook + Excel export
├── popup.html             # Tabbed interface (Scan/Settings)
├── popup.css              # Premium enterprise styling
├── images/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # This file
```

---

## 🚀 Quick Start

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/3bkader-gpt/lead-magnet-extractor.git
   cd lead-magnet-extractor
   ```

2. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right corner)
   - Click **"Load unpacked"**
   - Select the project directory

3. **Pin the Extension**
   - Click the puzzle icon in Chrome toolbar
   - Find "Lead Magnet Extractor"
   - Click the pin icon to keep it accessible

---

## 📖 Usage Guide

### Basic Scanning

1. Navigate to your target webpage
2. Click the **Lead Magnet Extractor** icon
3. Ensure you're on the **Scan** tab
4. Toggle **"Deep Scan"** for comprehensive results (recommended)
5. Click **"Scan Page"** button
6. Watch as leads are highlighted on the page with colored borders
7. View real-time statistics in the popup

### Webhook Integration

1. Click the **Settings** tab
2. Enter your webhook URL (e.g., `https://hooks.zapier.com/hooks/catch/...`)
3. Optionally add a label for identification
4. Click **"Save Settings"**
5. Return to **Scan** tab
6. After scanning, click the **☁️ Sync** button
7. Verify the JSON payload was received at your webhook

### Excel Export

1. After scanning, click the **📊 Excel** button
2. A formatted `.xls` file will download automatically
3. Open in Excel, Google Sheets, or any spreadsheet application
4. Data includes: emails, phones, names, and metadata

### Webhook Payload Format

```json
{
  "timestamp": "2026-01-23T12:51:00Z",
  "source": "https://example.com/contact",
  "leads": [
    {
      "type": "email",
      "value": "john@example.com",
      "name": "John Doe"
    },
    {
      "type": "phone",
      "value": "123-456-7890",
      "name": "John Doe"
    }
  ],
  "summary": {
    "totalEmails": 1,
    "totalPhones": 1
  }
}
```

---

## 🧪 Testing Guide

### Step-by-Step Test Procedure

1. **Load Extension**
   - Open `chrome://extensions/`
   - Enable Developer Mode
   - Load unpacked extension

2. **Test Scanning**
   - Navigate to a test page (e.g., company contact page)
   - Open extension popup
   - Toggle **Deep Scan** ON
   - Click **"Scan Page"**
   - Verify highlights appear on page with tooltips
   - Check stats update in real-time

3. **Test Webhook Integration**
   - Go to **Settings** tab
   - Enter test webhook URL (use [webhook.site](https://webhook.site) for testing)
   - Click **"Save Settings"**
   - Return to **Scan** tab
   - Click **☁️ Sync** button
   - Verify JSON received at webhook endpoint

4. **Test Excel Export**
   - After scanning, click **📊 Excel** button
   - Open downloaded file
   - Verify:
     - ✅ Names are extracted correctly
     - ✅ Emails and phones are formatted
     - ✅ File opens properly in Excel/Sheets
     - ✅ Arabic/Unicode characters display correctly

---

## 🛠️ Technical Highlights

### Architecture
- **Pure Vanilla JavaScript**: No external dependencies
- **Manifest V3**: Latest Chrome extension standard
- **SpreadsheetML Format**: Excel export with Unicode support (Arabic-safe)
- **Dual Storage**: 
  - `chrome.storage.local` for scan data
  - `chrome.storage.sync` for user settings

### Smart Detection
- **Email Patterns**: Standard + obfuscated formats
- **Phone Patterns**: International formats supported
- **Name Extraction**: Context-aware name detection
- **Multi-language**: English and Arabic name support

### Performance
- **Optimized Scrolling**: Efficient deep scan algorithm
- **Memory Efficient**: Lightweight content script
- **Fast Processing**: Instant results for standard scans

---

## 🔒 Permissions & Privacy

| Permission | Purpose | Privacy Impact |
|-----------|---------|----------------|
| `activeTab` | Access current webpage for scanning | Only active tab |
| `scripting` | Inject content scripts for analysis | Temporary injection |
| `storage` | Save scan results and settings | Local storage only |

**🔐 Privacy First**: 
- All data processing happens locally
- No external servers involved
- Webhook data sent only when you explicitly click "Sync"
- No tracking or analytics

---

## 📊 Use Cases

### Sales Teams
- Extract contact information from company directories
- Build prospect lists from industry websites
- Export to CRM systems via webhook

### Marketing Professionals
- Collect leads from event pages
- Extract contacts from social media profiles
- Build email lists for campaigns

### Data Analysts
- Gather contact data for research
- Extract information from public directories
- Export structured data for analysis

### Business Development
- Find decision-makers on company websites
- Extract contact info from job boards
- Build lead databases from multiple sources

---

## 🎨 UI/UX Features

- **Tabbed Interface**: Clean separation between scanning and settings
- **Real-time Feedback**: Progress bars, status messages, toast notifications
- **Professional Design**: Enterprise-grade styling and animations
- **Responsive Layout**: Optimized for extension popup dimensions
- **Accessibility**: Clear labels and intuitive controls

---

## 📝 Version History

### Version 3.0 - Enterprise Edition (Current)
- ✨ Smart name extraction (English + Arabic)
- ☁️ Webhook integration for CRM/Zapier
- 📊 Real Excel export with formatting
- 💾 State persistence across sessions
- 🔔 Toast notification system
- 🎨 Enhanced UI with tabbed interface
- 🌍 Multi-language name support

### Version 2.0
- Deep scan mode with progress tracking
- Enhanced visual highlighting
- Improved obfuscation detection
- Performance optimizations

---

## 👨‍💻 Creator

<div align="center">

### Crafted with ❤️ and precision by

# **Mohamed Omar**

*Building enterprise tools that make a difference* 🚀

[![GitHub](https://img.shields.io/badge/GitHub-Profile-black?style=for-the-badge&logo=github)](https://github.com/3bkader-gpt)
[![Email](https://img.shields.io/badge/Email-Contact-red?style=for-the-badge&logo=gmail)](mailto:medo.omar.salama@gmail.com)

</div>

---

## 🤝 Contributing

Contributions are welcome! Whether it's:
- 🐛 Bug reports
- 💡 Feature suggestions
- 📝 Documentation improvements
- 🔧 Code contributions

Feel free to open an [issue](https://github.com/3bkader-gpt/lead-magnet-extractor/issues) or submit a pull request.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with pure JavaScript - no dependencies
- Excel export using SpreadsheetML format
- Designed for professionals who value quality and efficiency

---

<div align="center">

### ⭐ If this tool helps your business, consider giving it a star!

**Made with passion by Mohamed Omar** 💫

---

![GitHub stars](https://img.shields.io/github/stars/3bkader-gpt/lead-magnet-extractor?style=social)
![GitHub forks](https://img.shields.io/github/forks/3bkader-gpt/lead-magnet-extractor?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/3bkader-gpt/lead-magnet-extractor?style=social)

**Enterprise Edition • Built for Professionals** 🚀

</div>
