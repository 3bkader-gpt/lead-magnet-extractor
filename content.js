// ============================================================================
// LEAD MAGNET EXTRACTOR - ELITE CONTENT SCRIPT
// Features: Deep Scan, DOM Highlighting, Smart Obfuscation Detection
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
        STYLES_ID: 'lme-injected-styles'
    };

    // ============================================================================
    // REGEX PATTERNS (with obfuscation detection)
    // ============================================================================

    // Standard email pattern
    const EMAIL_STANDARD = /[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g;

    // Obfuscated email patterns: user [at] domain [dot] com, user(at)domain(dot)com, etc.
    const EMAIL_OBFUSCATED = /[a-zA-Z0-9._+-]+\s*[\[\(]?\s*(?:at|AT)\s*[\]\)]?\s*[a-zA-Z0-9.-]+\s*[\[\(]?\s*(?:dot|DOT)\s*[\]\)]?\s*[a-zA-Z]{2,6}/gi;

    // Phone patterns
    const PHONE_STANDARD = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;

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
        const totalHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
        );
        const viewportHeight = window.innerHeight;
        let currentScroll = 0;
        let lastHeight = totalHeight;
        let unchangedCount = 0;

        // Scroll to top first
        window.scrollTo(0, 0);
        await sleep(100);

        while (currentScroll < document.body.scrollHeight) {
            currentScroll += CONFIG.SCROLL_STEP;
            window.scrollTo({ top: currentScroll, behavior: 'smooth' });
            await sleep(CONFIG.SCROLL_DELAY);

            // Calculate progress
            const progress = Math.min(100, Math.round((currentScroll / document.body.scrollHeight) * 100));
            if (onProgress) onProgress(progress);

            // Check if new content loaded (page height changed)
            const newHeight = document.body.scrollHeight;
            if (newHeight === lastHeight) {
                unchangedCount++;
                if (unchangedCount > 5) break; // No more content loading
            } else {
                unchangedCount = 0;
                lastHeight = newHeight;
            }
        }

        // Return to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        await sleep(300);
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ============================================================================
    // SCRAPING LOGIC
    // ============================================================================
    function scrapeData() {
        const content = document.body.innerText;

        // Find standard emails
        let emails = content.match(EMAIL_STANDARD) || [];

        // Find obfuscated emails and normalize them
        const obfuscatedMatches = content.match(EMAIL_OBFUSCATED) || [];
        const normalizedObfuscated = obfuscatedMatches.map(normalizeEmail);
        emails = [...emails, ...normalizedObfuscated];

        // Find phones
        let phones = content.match(PHONE_STANDARD) || [];

        // Clean and deduplicate
        emails = [...new Set(emails.map(e => e.toLowerCase().trim()))];
        phones = [...new Set(phones.map(p => p.trim()))];

        return { emails, phones };
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
                    // Skip script, style, and already highlighted elements
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

        let highlightedEmails = 0;
        let highlightedPhones = 0;

        nodesToProcess.forEach(textNode => {
            const text = textNode.textContent;
            if (!text || text.trim().length === 0) return;

            // Check for matches
            const emailMatches = text.match(EMAIL_STANDARD) || [];
            const phoneMatches = text.match(PHONE_STANDARD) || [];
            const obfuscatedMatches = text.match(EMAIL_OBFUSCATED) || [];

            if (emailMatches.length === 0 && phoneMatches.length === 0 && obfuscatedMatches.length === 0) {
                return;
            }

            // Create highlighted version
            let html = escapeHtml(text);

            // Highlight emails
            emailMatches.forEach(email => {
                const escapedEmail = escapeHtml(email);
                const regex = new RegExp(escapeRegex(escapedEmail), 'g');
                html = html.replace(regex,
                    `<span class="${CONFIG.HIGHLIGHT_CLASS} ${CONFIG.HIGHLIGHT_EMAIL_CLASS}" data-lme-type="📧 Email">${escapedEmail}</span>`
                );
                highlightedEmails++;
            });

            // Highlight obfuscated emails
            obfuscatedMatches.forEach(email => {
                const escapedEmail = escapeHtml(email);
                const regex = new RegExp(escapeRegex(escapedEmail), 'gi');
                html = html.replace(regex,
                    `<span class="${CONFIG.HIGHLIGHT_CLASS} ${CONFIG.HIGHLIGHT_EMAIL_CLASS}" data-lme-type="📧 Email (obfuscated)">${escapedEmail}</span>`
                );
                highlightedEmails++;
            });

            // Highlight phones
            phoneMatches.forEach(phone => {
                const escapedPhone = escapeHtml(phone);
                const regex = new RegExp(escapeRegex(escapedPhone), 'g');
                html = html.replace(regex,
                    `<span class="${CONFIG.HIGHLIGHT_CLASS} ${CONFIG.HIGHLIGHT_PHONE_CLASS}" data-lme-type="📞 Phone">${escapedPhone}</span>`
                );
                highlightedPhones++;
            });

            // Replace text node with highlighted HTML
            if (html !== escapeHtml(text)) {
                const span = document.createElement('span');
                span.innerHTML = html;
                textNode.parentNode.replaceChild(span, textNode);
            }
        });

        return { highlightedEmails, highlightedPhones };
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
                    // Deep scan if requested
                    if (request.deepScan) {
                        await deepScan((progress) => {
                            chrome.runtime.sendMessage({ action: 'scanProgress', progress });
                        });
                    }

                    // Scrape data
                    const results = scrapeData();

                    // Highlight matches on page
                    if (request.highlight !== false) {
                        highlightMatches();
                    }

                    sendResponse({ success: true, data: results });
                } catch (error) {
                    sendResponse({ success: false, error: error.message });
                }
            })();
            return true; // Keep channel open for async response
        }

        if (request.action === 'clearHighlights') {
            clearHighlights();
            sendResponse({ success: true });
        }
    });

})();
