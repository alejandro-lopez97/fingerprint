chrome.runtime.onInstalled.addListener(() => {
  console.log('Fingerprint Generator installed');
});

chrome.webRequest.onBeforeSendHeaders.addListener(
  async (details) => {
    const result = await chrome.storage.local.get(['fingerprint']);
    if (result.fingerprint && result.fingerprint.userAgent) {
      const headers = details.requestHeaders.filter(h => h.name.toLowerCase() !== 'user-agent');
      headers.push({
        name: 'User-Agent',
        value: result.fingerprint.userAgent
      });
      return { requestHeaders: headers };
    }
    return { requestHeaders: details.requestHeaders };
  },
  { urls: ['<all_urls>'] },
  ['blocking', 'requestHeaders']
);
