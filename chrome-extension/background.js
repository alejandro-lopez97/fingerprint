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
  // Try multiple free APIs in order
  const apis = [
    {
      name: 'ip-api.com',
      url: 'http://ip-api.com/json/',
      parse: (data) => ({
        ip: data.query,
        country: data.country,
        countryCode: data.countryCode,
        city: data.city,
        timezone: data.timezone,
        latitude: data.lat,
        longitude: data.lon
      })
    },
    {
      name: 'ipapi.co',
      url: 'https://ipapi.co/json/',
      parse: (data) => ({
        ip: data.ip,
        country: data.country_name,
        countryCode: data.country_code,
        city: data.city,
        timezone: data.timezone,
        latitude: data.latitude,
        longitude: data.longitude
      })
    },
    {
      name: 'ipify + ipapi',
      url: 'https://api.ipify.org?format=json',
      parse: async (data) => {
        const ip = data.ip;
        try {
          const locRes = await fetch(`http://ip-api.com/json/${ip}`);
          const locData = await locRes.json();
          return {
            ip: ip,
            country: locData.country,
            countryCode: locData.countryCode,
            city: locData.city,
            timezone: locData.timezone,
            latitude: locData.lat,
            longitude: locData.lon
          };
        } catch {
          return { ip: ip, country: 'Unknown', countryCode: 'US', city: 'Unknown', timezone: 'America/New_York', latitude: 0, longitude: 0 };
        }
      }
    }
  ];

  for (const api of apis) {
    try {
      console.log(`Trying ${api.name}...`);
      const response = await fetch(api.url, {
        method: 'GET',
        cache: 'no-cache'
      });
      
      if (!response.ok) continue;
      
      const data = await response.json();
      const result = await api.parse(data);
      
      if (result.ip && result.ip !== 'Unknown') {
        console.log(`Success with ${api.name}:`, result);
        return { success: true, data: result };
      }
    } catch (error) {
      console.log(`${api.name} failed:`, error.message);
      continue;
    }
  }
  
  return { 
    success: false, 
    error: 'All IP detection services failed',
    data: {
      ip: 'Unknown',
      country: 'Unknown',
      countryCode: 'US',
      city: 'Unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      latitude: 0,
      longitude: 0
    }
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
