document.addEventListener('DOMContentLoaded', () => {
    // Get references to all the UI elements
    const proxyEnabledToggle = document.getElementById('proxy-enabled');
    const proxyUrlInput = document.getElementById('proxy-url');
    const saveBtn = document.getElementById('save-btn');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const messageArea = document.getElementById('message-area');

    /**
     * Shows a message in the message area for a brief period.
     * @param {string} text - The message to display.
     * @param {boolean} isError - If true, displays the message in red.
     * @param {number} duration - How long to display the message in milliseconds.
     */
    const showMessage = (text, isError = false, duration = 3000) => {
        messageArea.textContent = text;
        messageArea.className = isError
            ? 'text-sm text-red-600 mt-1 h-4'
            : 'text-sm text-green-600 mt-1 h-4';

        if (duration > 0) {
            setTimeout(() => {
                messageArea.textContent = '';
            }, duration);
        }
    };

    /**
     * Updates the UI elements (indicator and text) to reflect the proxy's status.
     * @param {boolean} isEnabled - True if the proxy is active.
     */
    const updateUiStatus = (isEnabled) => {
        if (isEnabled) {
            statusIndicator.classList.replace('bg-red-500', 'bg-green-500');
            statusIndicator.title = 'Proxy Enabled';
            statusText.textContent = 'Enabled';
        } else {
            statusIndicator.classList.replace('bg-green-500', 'bg-red-500');
            statusIndicator.title = 'Proxy Disabled';
            statusText.textContent = 'Disabled';
        }
        proxyEnabledToggle.checked = isEnabled;
    };

    /**
     * Enables the proxy using the URL stored in chrome.storage.
     */
    const enableProxy = () => {
        chrome.storage.sync.get('proxyUrl', (data) => {
            const proxyUrl = data.proxyUrl;
            if (!proxyUrl) {
                showMessage('Proxy URL is not set. Please save a URL first.', true);
                updateUiStatus(false);
                return;
            }

            try {
                const url = new URL(proxyUrl);
                const config = {
                    mode: 'fixed_servers',
                    rules: {
                        singleProxy: {
                            scheme: url.protocol.replace(':', ''), // 'http:' -> 'http'
                            host: url.hostname,
                            port: parseInt(url.port, 10)
                        },
                        // It's good practice to bypass local addresses.
                        bypassList: ['<local>']
                    }
                };

                // Apply the new proxy settings.
                chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
                    // console.log('Proxy enabled.');
                    updateUiStatus(true);
                });
            } catch (e) {
                showMessage('Invalid URL format. Use http://host:port', true);
                updateUiStatus(false);
            }
        });
    };

    /**
     * Disables the proxy by setting the mode to 'direct'.
     */
    const disableProxy = () => {
        const config = { mode: 'direct' };
        chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
            // console.log('Proxy disabled.');
            updateUiStatus(false);
        });
    };

    // --- Event Listeners ---

    // Listen for changes on the master toggle switch.
    proxyEnabledToggle.addEventListener('change', () => {
        if (proxyEnabledToggle.checked) {
            enableProxy();
        } else {
            disableProxy();
        }
    });

    // Listen for clicks on the 'Save' button.
    saveBtn.addEventListener('click', () => {
        const proxyUrl = proxyUrlInput.value.trim();
        if (proxyUrl) {
            chrome.storage.sync.set({ proxyUrl: proxyUrl }, () => {
                showMessage('Proxy URL saved!', false);
                // If the proxy is already enabled, re-apply the settings with the new URL.
                if (proxyEnabledToggle.checked) {
                    enableProxy();
                }
            });
        } else {
            showMessage('Proxy URL cannot be empty.', true);
        }
    });

    // --- Initialization ---

    // Load the initial state when the popup is opened.
    const initializePopup = () => {
        // Get the saved proxy URL and populate the input field.
        chrome.storage.sync.get('proxyUrl', (data) => {
            if (data.proxyUrl) {
                proxyUrlInput.value = data.proxyUrl;
            }
        });

        // Get the current proxy settings to correctly set the toggle state.
        chrome.proxy.settings.get({ incognito: false }, (config) => {
            const isProxyEnabled = config.value.mode === 'fixed_servers';
            updateUiStatus(isProxyEnabled);
        });
    };

    initializePopup();
});

