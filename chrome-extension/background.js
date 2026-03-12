chrome.runtime.onInstalled.addListener(() => {
  console.log('Fingerprint Generator installed');
});

// Handle IP detection requests from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'detectIP') {
    detectIPAddress().then(sendResponse);
    return true; // Keep channel open for async response
  }
});

async function detectIPAddress() {
  // Try multiple free APIs in order - prioritize accuracy
  const apis = [
    {
      name: 'ipapi.co',
      url: 'https://ipapi.co/json/',
      parse: (data) => ({
        ip: data.ip,
        country: data.country_name,
        countryCode: data.country_code,
        city: data.city,
        region: data.region,
        timezone: data.timezone,
        latitude: data.latitude,
        longitude: data.longitude
      })
    },
    {
      name: 'ip-api.com',
      url: 'http://ip-api.com/json/',
      parse: (data) => ({
        ip: data.query,
        country: data.country,
        countryCode: data.countryCode,
        city: data.city,
        region: data.regionName,
        timezone: data.timezone,
        latitude: data.lat,
        longitude: data.lon
      })
    },
    {
      name: 'ipify + ipapi.co',
      url: 'https://api.ipify.org?format=json',
      parse: async (data) => {
        const ip = data.ip;
        try {
          const locRes = await fetch(`https://ipapi.co/${ip}/json/`);
          const locData = await locRes.json();
          return {
            ip: ip,
            country: locData.country_name,
            countryCode: locData.country_code,
            city: locData.city,
            region: locData.region,
            timezone: locData.timezone,
            latitude: locData.latitude,
            longitude: locData.longitude
          };
        } catch {
          return null;
        }
      }
    }
  ];

  for (const api of apis) {
    try {
      console.log(`[IP Detection] Trying ${api.name}...`);
      const response = await fetch(api.url, {
        method: 'GET',
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        console.log(`[IP Detection] ${api.name} returned status ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      const result = await api.parse(data);
      
      if (result && result.ip && result.ip !== 'Unknown') {
        console.log(`[IP Detection] ✓ Success with ${api.name}:`, result);
        return { success: true, data: result, source: api.name };
      }
    } catch (error) {
      console.log(`[IP Detection] ${api.name} failed:`, error.message);
      continue;
    }
  }
  
  console.log('[IP Detection] All APIs failed, using defaults');
  return { 
    success: false, 
    error: 'All IP detection services failed',
    data: {
      ip: 'Unknown',
      country: 'Unknown',
      countryCode: 'US',
      city: 'Unknown',
      region: 'Unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      latitude: 0,
      longitude: 0
    },
    source: 'fallback'
  };
}

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
