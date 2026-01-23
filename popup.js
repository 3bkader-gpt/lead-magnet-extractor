// ============================================================================
// LEAD MAGNET EXTRACTOR - ELITE POPUP SCRIPT
// Features: Deep Scan Toggle, State Persistence, Clear Data
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // ============================================================================
    // DOM ELEMENTS
    // ============================================================================
    const scanBtn = document.getElementById('scan-btn');
    const downloadBtn = document.getElementById('download-btn');
    const clearBtn = document.getElementById('clear-btn');
    const emailCountSpan = document.getElementById('email-count');
    const phoneCountSpan = document.getElementById('phone-count');
    const statusMsg = document.getElementById('status-msg');
    const deepScanToggle = document.getElementById('deep-scan-toggle');
    const progressBar = document.getElementById('progress-bar');
    const progressFill = document.getElementById('progress-fill');

    // ============================================================================
    // STATE
    // ============================================================================
    let scrapedData = { emails: [], phones: [] };
    let isScanning = false;

    // ============================================================================
    // LOAD PERSISTED DATA
    // ============================================================================
    try {
        const stored = await chrome.storage.local.get(['scrapedData', 'deepScanEnabled']);
        if (stored.scrapedData) {
            scrapedData = stored.scrapedData;
            updateUI();
            downloadBtn.disabled = scrapedData.emails.length === 0 && scrapedData.phones.length === 0;
            if (scrapedData.emails.length > 0 || scrapedData.phones.length > 0) {
                statusMsg.textContent = 'Data restored from previous scan.';
            }
        }
        if (stored.deepScanEnabled !== undefined) {
            deepScanToggle.checked = stored.deepScanEnabled;
        }
    } catch (e) {
        console.error('Error loading persisted data:', e);
    }

    // ============================================================================
    // DEEP SCAN TOGGLE PERSISTENCE
    // ============================================================================
    deepScanToggle.addEventListener('change', () => {
        chrome.storage.local.set({ deepScanEnabled: deepScanToggle.checked });
    });

    // ============================================================================
    // SCAN BUTTON
    // ============================================================================
    scanBtn.addEventListener('click', async () => {
        if (isScanning) return;
        isScanning = true;

        const isDeepScan = deepScanToggle.checked;

        scanBtn.disabled = true;
        scanBtn.innerHTML = '<span class="icon">⏳</span> Scanning...';
        statusMsg.textContent = isDeepScan ? 'Deep scanning...' : 'Scanning...';

        if (isDeepScan) {
            progressBar.style.display = 'block';
            progressFill.style.width = '0%';
        }

        try {
            // Get active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab) {
                throw new Error('No active tab found.');
            }

            // Check if we can access the tab
            if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
                throw new Error('Cannot scan Chrome internal pages.');
            }

            // Inject content script
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });

            // Listen for progress updates
            const progressListener = (message) => {
                if (message.action === 'scanProgress') {
                    progressFill.style.width = message.progress + '%';
                    statusMsg.textContent = `Deep scanning... ${message.progress}%`;
                }
            };
            chrome.runtime.onMessage.addListener(progressListener);

            // Send scan request
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'scanPage',
                deepScan: isDeepScan,
                highlight: true
            });

            chrome.runtime.onMessage.removeListener(progressListener);

            if (response && response.success) {
                scrapedData = response.data;

                // Persist to storage
                await chrome.storage.local.set({ scrapedData });

                updateUI();
                downloadBtn.disabled = false;

                const total = scrapedData.emails.length + scrapedData.phones.length;
                statusMsg.textContent = total > 0
                    ? `✅ Found ${total} lead${total !== 1 ? 's' : ''}! Check highlighted items.`
                    : '⚠️ No leads found on this page.';
            } else {
                throw new Error(response?.error || 'Unknown error occurred.');
            }

        } catch (error) {
            statusMsg.textContent = '❌ ' + error.message;
            console.error('Scan error:', error);
        } finally {
            isScanning = false;
            scanBtn.disabled = false;
            scanBtn.innerHTML = '<span class="icon">🔍</span> Scan Page';
            progressBar.style.display = 'none';
        }
    });

    // ============================================================================
    // DOWNLOAD BUTTON
    // ============================================================================
    downloadBtn.addEventListener('click', () => {
        if (scrapedData.emails.length === 0 && scrapedData.phones.length === 0) {
            statusMsg.textContent = 'No data to download.';
            return;
        }
        downloadCSV(scrapedData);
        statusMsg.textContent = '📁 CSV downloaded!';
    });

    // ============================================================================
    // CLEAR BUTTON
    // ============================================================================
    clearBtn.addEventListener('click', async () => {
        scrapedData = { emails: [], phones: [] };
        await chrome.storage.local.remove('scrapedData');
        updateUI();
        downloadBtn.disabled = true;
        statusMsg.textContent = '🗑️ Data cleared.';

        // Also clear highlights on the page
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && !tab.url.startsWith('chrome://')) {
                await chrome.tabs.sendMessage(tab.id, { action: 'clearHighlights' });
            }
        } catch (e) {
            // Ignore if content script not loaded
        }
    });

    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================
    function updateUI() {
        emailCountSpan.textContent = scrapedData.emails.length;
        phoneCountSpan.textContent = scrapedData.phones.length;
    }

    function downloadCSV(data) {
        const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
        let csvContent = BOM + 'Type,Value,Source URL\n';

        const currentUrl = 'Extracted via Lead Magnet Extractor';

        data.emails.forEach(email => {
            csvContent += `Email,"${escapeCSV(email)}","${currentUrl}"\n`;
        });

        data.phones.forEach(phone => {
            csvContent += `Phone,"${escapeCSV(phone)}","${currentUrl}"\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `leads_${getFormattedDate()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function escapeCSV(str) {
        return str.replace(/"/g, '""');
    }

    function getFormattedDate() {
        const now = new Date();
        return `${now.getFullYear()}-${padZero(now.getMonth() + 1)}-${padZero(now.getDate())}_${padZero(now.getHours())}${padZero(now.getMinutes())}`;
    }

    function padZero(num) {
        return num.toString().padStart(2, '0');
    }
});
