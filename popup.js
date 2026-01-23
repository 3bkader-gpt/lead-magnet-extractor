// ============================================================================
// LEAD MAGNET EXTRACTOR - ENTERPRISE POPUP SCRIPT
// Features: Tabs, Webhook Integration, Excel Export (SheetJS), Toast Notifications
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // ============================================================================
    // DOM ELEMENTS
    // ============================================================================
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const scanBtn = document.getElementById('scan-btn');
    const downloadBtn = document.getElementById('download-btn');
    const syncBtn = document.getElementById('sync-btn');
    const clearBtn = document.getElementById('clear-btn');
    const emailCountSpan = document.getElementById('email-count');
    const phoneCountSpan = document.getElementById('phone-count');
    const statusMsg = document.getElementById('status-msg');
    const deepScanToggle = document.getElementById('deep-scan-toggle');
    const progressBar = document.getElementById('progress-bar');
    const progressFill = document.getElementById('progress-fill');
    const webhookUrlInput = document.getElementById('webhook-url');
    const webhookNameInput = document.getElementById('webhook-name');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const webhookStatus = document.getElementById('webhook-status');
    const toastContainer = document.getElementById('toast-container');

    // ============================================================================
    // STATE
    // ============================================================================
    let scrapedData = { leads: [], emails: [], phones: [] };
    let isScanning = false;
    let webhookUrl = '';
    let webhookName = '';

    // ============================================================================
    // TAB SWITCHING
    // ============================================================================
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
    });

    // ============================================================================
    // LOAD PERSISTED DATA
    // ============================================================================
    try {
        // Load local data
        const local = await chrome.storage.local.get(['scrapedData', 'deepScanEnabled']);
        if (local.scrapedData) {
            scrapedData = local.scrapedData;
            updateUI();
            enableButtons();
            if (scrapedData.leads?.length > 0 || scrapedData.emails?.length > 0) {
                statusMsg.textContent = 'Data restored from previous scan.';
            }
        }
        if (local.deepScanEnabled !== undefined) {
            deepScanToggle.checked = local.deepScanEnabled;
        }

        // Load sync data (webhook settings)
        const sync = await chrome.storage.sync.get(['webhookUrl', 'webhookName']);
        if (sync.webhookUrl) {
            webhookUrl = sync.webhookUrl;
            webhookUrlInput.value = webhookUrl;
        }
        if (sync.webhookName) {
            webhookName = sync.webhookName;
            webhookNameInput.value = webhookName;
        }
        updateWebhookStatus();
    } catch (e) {
        console.error('Error loading persisted data:', e);
    }

    // ============================================================================
    // SETTINGS
    // ============================================================================
    deepScanToggle.addEventListener('change', () => {
        chrome.storage.local.set({ deepScanEnabled: deepScanToggle.checked });
    });

    saveSettingsBtn.addEventListener('click', async () => {
        webhookUrl = webhookUrlInput.value.trim();
        webhookName = webhookNameInput.value.trim();

        if (webhookUrl && !isValidUrl(webhookUrl)) {
            showToast('Invalid URL format', 'error');
            return;
        }

        await chrome.storage.sync.set({ webhookUrl, webhookName });
        updateWebhookStatus();
        showToast('Settings saved!', 'success');
    });

    function updateWebhookStatus() {
        if (webhookUrl) {
            const label = webhookName || 'Webhook';
            webhookStatus.innerHTML = `<span class="status-connected">✅ ${label} configured</span>`;
            syncBtn.disabled = scrapedData.leads?.length === 0 && scrapedData.emails?.length === 0;
        } else {
            webhookStatus.innerHTML = '<span class="status-disconnected">⚪ No webhook configured</span>';
            syncBtn.disabled = true;
        }
    }

    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

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
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab) throw new Error('No active tab found.');
            if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
                throw new Error('Cannot scan Chrome internal pages.');
            }

            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });

            const progressListener = (message) => {
                if (message.action === 'scanProgress') {
                    progressFill.style.width = message.progress + '%';
                    statusMsg.textContent = `Deep scanning... ${message.progress}%`;
                }
            };
            chrome.runtime.onMessage.addListener(progressListener);

            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'scanPage',
                deepScan: isDeepScan,
                highlight: true
            });

            chrome.runtime.onMessage.removeListener(progressListener);

            if (response && response.success) {
                scrapedData = response.data;
                scrapedData.sourceUrl = tab.url;
                scrapedData.scannedAt = new Date().toISOString();

                await chrome.storage.local.set({ scrapedData });

                updateUI();
                enableButtons();

                const total = (scrapedData.leads?.length || 0) || (scrapedData.emails?.length + scrapedData.phones?.length);
                statusMsg.textContent = total > 0
                    ? `✅ Found ${total} lead${total !== 1 ? 's' : ''}!`
                    : '⚠️ No leads found.';

                if (total > 0) {
                    showToast(`Found ${total} leads!`, 'success');
                }
            } else {
                throw new Error(response?.error || 'Unknown error.');
            }

        } catch (error) {
            statusMsg.textContent = '❌ ' + error.message;
            showToast(error.message, 'error');
        } finally {
            isScanning = false;
            scanBtn.disabled = false;
            scanBtn.innerHTML = '<span class="icon">🔍</span> Scan Page';
            progressBar.style.display = 'none';
        }
    });

    // ============================================================================
    // SYNC BUTTON (Webhook POST)
    // ============================================================================
    syncBtn.addEventListener('click', async () => {
        if (!webhookUrl) {
            showToast('Configure webhook in Settings first', 'error');
            return;
        }

        syncBtn.disabled = true;
        syncBtn.innerHTML = '<span class="icon">⏳</span>';

        try {
            const payload = {
                timestamp: new Date().toISOString(),
                source: scrapedData.sourceUrl || 'unknown',
                leads: scrapedData.leads || [],
                summary: {
                    totalEmails: scrapedData.emails?.length || 0,
                    totalPhones: scrapedData.phones?.length || 0
                }
            };

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                showToast(`Synced to ${webhookName || 'webhook'}!`, 'success');
                statusMsg.textContent = '☁️ Data synced successfully!';
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            showToast(`Sync failed: ${error.message}`, 'error');
            statusMsg.textContent = '❌ Sync failed.';
        } finally {
            syncBtn.disabled = false;
            syncBtn.innerHTML = '<span class="icon">☁️</span> Sync';
        }
    });

    // ============================================================================
    // DOWNLOAD BUTTON (Excel Export)
    // ============================================================================
    downloadBtn.addEventListener('click', () => {
        const leads = scrapedData.leads || [];
        if (leads.length === 0 && scrapedData.emails?.length === 0) {
            showToast('No data to download', 'error');
            return;
        }

        downloadExcel(scrapedData);
        showToast('Excel downloaded!', 'success');
    });

    // ============================================================================
    // CLEAR BUTTON
    // ============================================================================
    clearBtn.addEventListener('click', async () => {
        scrapedData = { leads: [], emails: [], phones: [] };
        await chrome.storage.local.remove('scrapedData');
        updateUI();
        disableButtons();
        statusMsg.textContent = '🗑️ Data cleared.';
        showToast('Data cleared', 'info');

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && !tab.url.startsWith('chrome://')) {
                await chrome.tabs.sendMessage(tab.id, { action: 'clearHighlights' });
            }
        } catch (e) { }
    });

    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================
    function updateUI() {
        const emailCount = scrapedData.leads?.filter(l => l.type === 'email').length || scrapedData.emails?.length || 0;
        const phoneCount = scrapedData.leads?.filter(l => l.type === 'phone').length || scrapedData.phones?.length || 0;
        emailCountSpan.textContent = emailCount;
        phoneCountSpan.textContent = phoneCount;
    }

    function enableButtons() {
        downloadBtn.disabled = false;
        if (webhookUrl) syncBtn.disabled = false;
    }

    function disableButtons() {
        downloadBtn.disabled = true;
        syncBtn.disabled = true;
    }

    // ============================================================================
    // EXCEL EXPORT (Real binary .xlsx via SheetJS)
    // ============================================================================
    function downloadExcel(data) {
        const leads = data.leads || [];

        // Prepare data for SheetJS
        let rows = [];

        if (leads.length > 0) {
            rows = leads.map(l => ({
                "Type": l.type === 'email' ? '📧 Email' : '📞 Phone',
                "Value": l.value,
                "Name": l.name || ''
            }));
        } else if (data.emails?.length || data.phones?.length) {
            // Legacy data support
            if (data.emails) data.emails.forEach(e => rows.push({ "Type": "📧 Email", "Value": e, "Name": "" }));
            if (data.phones) data.phones.forEach(p => rows.push({ "Type": "📞 Phone", "Value": p, "Name": "" }));
        }

        // Create Worksheet
        // @ts-ignore
        const ws = XLSX.utils.json_to_sheet(rows);

        // Set Column Widths
        const wscols = [
            { wch: 15 }, // Type
            { wch: 35 }, // Value
            { wch: 25 }  // Name
        ];
        ws['!cols'] = wscols;

        // Create Workbook
        // @ts-ignore
        const wb = XLSX.utils.book_new();
        // @ts-ignore
        XLSX.utils.book_append_sheet(wb, ws, "Leads");

        // Write file
        // @ts-ignore
        XLSX.writeFile(wb, `leads_${getFormattedDate()}.xlsx`);
    }

    function getFormattedDate() {
        const now = new Date();
        return `${now.getFullYear()}-${padZero(now.getMonth() + 1)}-${padZero(now.getDate())}_${padZero(now.getHours())}${padZero(now.getMinutes())}`;
    }

    function padZero(num) {
        return num.toString().padStart(2, '0');
    }

    // ============================================================================
    // TOAST NOTIFICATIONS
    // ============================================================================
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };

        toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-message">${message}</span>`;
        toastContainer.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
});
