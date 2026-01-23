// ============================================================================
// LEAD MAGNET EXTRACTOR - ENTERPRISE CONTENT SCRIPT
// Features: Deep Scan, DOM Highlighting, Obfuscation Detection, Name Extraction
// ============================================================================

(() => {
    // Prevent duplicate initialization
    if (window.__leadExtractorInitialized) return;
    window.__leadExtractorInitialized = true;

    // ============================================================================
    // CONFIGURATION
    // ============================================================================
    const CONFIG = {
        SCROLL_STEP: 400,
        SCROLL_DELAY: 250,
        HIGHLIGHT_CLASS: 'lme-highlight',
        HIGHLIGHT_EMAIL_CLASS: 'lme-highlight-email',
        HIGHLIGHT_PHONE_CLASS: 'lme-highlight-phone',
        STYLES_ID: 'lme-injected-styles',
        NAME_CONTEXT_LENGTH: 80
    };

    // ============================================================================
    // REGEX PATTERNS (with obfuscation detection)
    // ============================================================================

    // Standard email pattern
    const EMAIL_STANDARD = /[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g;

    // Obfuscated email patterns
    const EMAIL_OBFUSCATED = /[a-zA-Z0-9._+-]+\s*[\[\(]?\s*(?:at|AT)\s*[\]\)]?\s*[a-zA-Z0-9.-]+\s*[\[\(]?\s*(?:dot|DOT)\s*[\]\)]?\s*[a-zA-Z]{2,6}/gi;

    // Phone patterns
    const PHONE_STANDARD = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;

    // Name patterns (for context extraction)
    const NAME_PATTERN = /([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+){0,2})/g;
    const ARABIC_NAME_PATTERN = /[\u0600-\u06FF\u0750-\u077F]+(?:\s+[\u0600-\u06FF\u0750-\u077F]+){0,2}/g;

    // ============================================================================
    // STYLE INJECTION
    // ============================================================================
    function injectStyles() {
        if (document.getElementById(CONFIG.STYLES_ID)) return;

        const styles = document.createElement('style');
        styles.id = CONFIG.STYLES_ID;
        styles.textContent = `
      .${CONFIG.HIGHLIGHT_CLASS} {
        position: relative;
        display: inline;
        border-radius: 3px;
        padding: 1px 4px;
        margin: 0 2px;
        animation: lme-pulse 2s ease-in-out infinite;
      }
      
      .${CONFIG.HIGHLIGHT_EMAIL_CLASS} {
        background: linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(37, 99, 235, 0.25));
        border: 2px solid #2563eb;
        box-shadow: 0 0 8px rgba(37, 99, 235, 0.4);
      }
      
      .${CONFIG.HIGHLIGHT_PHONE_CLASS} {
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.25));
        border: 2px solid #22c55e;
        box-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
      }
      
      .${CONFIG.HIGHLIGHT_CLASS}::after {
        content: attr(data-lme-type);
        position: absolute;
        top: -22px;
        left: 50%;
        transform: translateX(-50%);
        background: #1f2937;
        color: #fff;
        font-size: 10px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 4px;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
        z-index: 999999;
      }
      
      .${CONFIG.HIGHLIGHT_CLASS}:hover::after {
        opacity: 1;
      }
      
      @keyframes lme-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
    `;
        document.head.appendChild(styles);
    }

    // ============================================================================
    // DEEP SCAN (Auto-Scroll for Lazy Loading)
    // ============================================================================
    async function deepScan(onProgress) {
        let currentScroll = 0;
        let lastHeight = document.body.scrollHeight;
        let unchangedCount = 0;

        window.scrollTo(0, 0);
        await sleep(100);

        while (currentScroll < document.body.scrollHeight) {
            currentScroll += CONFIG.SCROLL_STEP;
            window.scrollTo({ top: currentScroll, behavior: 'smooth' });
            await sleep(CONFIG.SCROLL_DELAY);

            const progress = Math.min(100, Math.round((currentScroll / document.body.scrollHeight) * 100));
            if (onProgress) onProgress(progress);

            const newHeight = document.body.scrollHeight;
            if (newHeight === lastHeight) {
                unchangedCount++;
                if (unchangedCount > 5) break;
            } else {
                unchangedCount = 0;
                lastHeight = newHeight;
            }
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
        await sleep(300);
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ============================================================================
    // NAME EXTRACTION (Smart Context Analysis)
    // ============================================================================
    function extractNameFromContext(fullText, matchValue, matchIndex) {
        // Get text before the match
        const startIndex = Math.max(0, matchIndex - CONFIG.NAME_CONTEXT_LENGTH);
        const precedingText = fullText.substring(startIndex, matchIndex).trim();

        // Try to find English names (Capitalized words)
        const englishNames = precedingText.match(NAME_PATTERN);
        if (englishNames && englishNames.length > 0) {
            // Get the last name match (closest to email)
            const name = englishNames[englishNames.length - 1].trim();
            // Filter out common false positives
            const blacklist = ['Contact', 'Email', 'Phone', 'Tel', 'Mobile', 'Address', 'Website', 'The', 'Our', 'Your', 'We', 'If', 'Please'];
            if (!blacklist.includes(name) && name.length > 2) {
                return name;
            }
        }

        // Try to find Arabic names
        const arabicNames = precedingText.match(ARABIC_NAME_PATTERN);
        if (arabicNames && arabicNames.length > 0) {
            return arabicNames[arabicNames.length - 1].trim();
        }

        // Try pattern: "Name: Value" or "Name <email>"
        const colonPattern = /([^:,\n]+)[:]\s*$/;
        const anglePattern = /([^<\n]+)\s*<\s*$/;

        let match = precedingText.match(colonPattern) || precedingText.match(anglePattern);
        if (match) {
            const extracted = match[1].trim();
            if (extracted.length > 1 && extracted.length < 50) {
                return extracted;
            }
        }

        return '';
    }

    // ============================================================================
    // SCRAPING LOGIC (Enhanced with Name Extraction)
    // ============================================================================
    function scrapeData() {
        const content = document.body.innerText;
        const leads = [];
        const seenValues = new Set();

        // Process standard emails
        let match;
        const emailRegex = new RegExp(EMAIL_STANDARD.source, 'g');
        while ((match = emailRegex.exec(content)) !== null) {
            const email = match[0].toLowerCase().trim();
            if (!seenValues.has(email)) {
                seenValues.add(email);
                const name = extractNameFromContext(content, email, match.index);
                leads.push({ type: 'email', value: email, name: name });
            }
        }

        // Process obfuscated emails
        const obfuscatedRegex = new RegExp(EMAIL_OBFUSCATED.source, 'gi');
        while ((match = obfuscatedRegex.exec(content)) !== null) {
            const normalized = normalizeEmail(match[0]);
            if (!seenValues.has(normalized)) {
                seenValues.add(normalized);
                const name = extractNameFromContext(content, match[0], match.index);
                leads.push({ type: 'email', value: normalized, name: name, obfuscated: true });
            }
        }

        // Process phones
        const phoneRegex = new RegExp(PHONE_STANDARD.source, 'g');
        while ((match = phoneRegex.exec(content)) !== null) {
            const phone = match[0].trim();
            if (!seenValues.has(phone)) {
                seenValues.add(phone);
                const name = extractNameFromContext(content, phone, match.index);
                leads.push({ type: 'phone', value: phone, name: name });
            }
        }

        // Also return legacy format for backward compatibility
        const emails = leads.filter(l => l.type === 'email').map(l => l.value);
        const phones = leads.filter(l => l.type === 'phone').map(l => l.value);

        return { leads, emails, phones };
    }

    function normalizeEmail(obfuscated) {
        return obfuscated
            .replace(/\s*[\[\(]?\s*(?:at|AT)\s*[\]\)]?\s*/g, '@')
            .replace(/\s*[\[\(]?\s*(?:dot|DOT)\s*[\]\)]?\s*/g, '.')
            .toLowerCase()
            .trim();
    }

    // ============================================================================
    // DOM HIGHLIGHTING
    // ============================================================================
    function highlightMatches() {
        injectStyles();
        clearHighlights();

        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    const parent = node.parentElement;
                    if (!parent) return NodeFilter.FILTER_REJECT;
                    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT'].includes(parent.tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    if (parent.classList.contains(CONFIG.HIGHLIGHT_CLASS)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const nodesToProcess = [];
        let node;
        while ((node = walker.nextNode())) {
            nodesToProcess.push(node);
        }

        nodesToProcess.forEach(textNode => {
            const text = textNode.textContent;
            if (!text || text.trim().length === 0) return;

            const emailMatches = text.match(EMAIL_STANDARD) || [];
            const phoneMatches = text.match(PHONE_STANDARD) || [];
            const obfuscatedMatches = text.match(EMAIL_OBFUSCATED) || [];

            if (emailMatches.length === 0 && phoneMatches.length === 0 && obfuscatedMatches.length === 0) {
                return;
            }

            let html = escapeHtml(text);

            emailMatches.forEach(email => {
                const escapedEmail = escapeHtml(email);
                const regex = new RegExp(escapeRegex(escapedEmail), 'g');
                html = html.replace(regex,
                    `<span class="${CONFIG.HIGHLIGHT_CLASS} ${CONFIG.HIGHLIGHT_EMAIL_CLASS}" data-lme-type="📧 Email">${escapedEmail}</span>`
                );
            });

            obfuscatedMatches.forEach(email => {
                const escapedEmail = escapeHtml(email);
                const regex = new RegExp(escapeRegex(escapedEmail), 'gi');
                html = html.replace(regex,
                    `<span class="${CONFIG.HIGHLIGHT_CLASS} ${CONFIG.HIGHLIGHT_EMAIL_CLASS}" data-lme-type="📧 Obfuscated">${escapedEmail}</span>`
                );
            });

            phoneMatches.forEach(phone => {
                const escapedPhone = escapeHtml(phone);
                const regex = new RegExp(escapeRegex(escapedPhone), 'g');
                html = html.replace(regex,
                    `<span class="${CONFIG.HIGHLIGHT_CLASS} ${CONFIG.HIGHLIGHT_PHONE_CLASS}" data-lme-type="📞 Phone">${escapedPhone}</span>`
                );
            });

            if (html !== escapeHtml(text)) {
                const span = document.createElement('span');
                span.innerHTML = html;
                textNode.parentNode.replaceChild(span, textNode);
            }
        });
    }

    function clearHighlights() {
        document.querySelectorAll(`.${CONFIG.HIGHLIGHT_CLASS}`).forEach(el => {
            const parent = el.parentNode;
            parent.replaceChild(document.createTextNode(el.textContent), el);
            parent.normalize();
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // ============================================================================
    // MESSAGE LISTENER
    // ============================================================================
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'scanPage') {
            (async () => {
                try {
                    if (request.deepScan) {
                        await deepScan((progress) => {
                            chrome.runtime.sendMessage({ action: 'scanProgress', progress });
                        });
                    }

                    const results = scrapeData();

                    if (request.highlight !== false) {
                        highlightMatches();
                    }

                    sendResponse({ success: true, data: results });
                } catch (error) {
                    sendResponse({ success: false, error: error.message });
                }
            })();
            return true;
        }

        if (request.action === 'clearHighlights') {
            clearHighlights();
            sendResponse({ success: true });
        }
    });

})();
