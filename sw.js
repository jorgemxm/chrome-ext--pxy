/**
 * This script runs in the background when the extension is first installed
 * or updated. Its purpose is to set up sane default values.
 */
chrome.runtime.onInstalled.addListener(() => {
  // On installation, store a default proxy URL.
  // The user can change this in the popup.
  chrome.storage.sync.set({ proxyUrl: 'http://localhost:8899' });

  // Ensure the proxy is disabled by default.
  // The proxy mode 'direct' means no proxy is used.
  const config = {
    mode: 'direct'
  };

  chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
    console.log('Proxy extension installed. Proxy is disabled by default.');
  });
});

