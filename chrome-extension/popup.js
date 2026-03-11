document.getElementById('generateBtn').addEventListener('click', async () => {
  document.getElementById('generateBtn').disabled = true;
  document.getElementById('generateBtn').textContent = '⏳ Generating...';
  
  try {
    const ipInfo = await getIPInfo();
    const fingerprint = generateFingerprint(ipInfo);
    
    await chrome.storage.local.set({ fingerprint });
    
    displayFingerprint(fingerprint);
    
    alert('New fingerprint generated based on your IP! Reload pages to apply changes.');
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    document.getElementById('generateBtn').disabled = false;
    document.getElementById('generateBtn').textContent = '🔄 New Fingerprint';
  }
});

async function getIPInfo() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) throw new Error('Failed to fetch IP info');
    const data = await response.json();
    return {
      country: data.country_name || 'United States',
      countryCode: data.country_code || 'US',
      city: data.city || 'New York',
      timezone: data.timezone || 'America/New_York',
      languages: data.languages ? data.languages.split(',')[0] : 'en',
      latitude: data.latitude || 40.7128,
      longitude: data.longitude || -74.0060,
      ip: data.ip || 'Unknown'
    };
  } catch (error) {
    console.error('IP lookup failed, using defaults:', error);
    return {
      country: 'United States',
      countryCode: 'US',
      city: 'New York',
      timezone: 'America/New_York',
      languages: 'en',
      latitude: 40.7128,
      longitude: -74.0060,
      ip: 'Unknown'
    };
  }
}

function getLanguagesFromCountry(countryCode, primaryLang) {
  const langMap = {
    'US': ['en-US', 'en'],
    'GB': ['en-GB', 'en'],
    'CA': ['en-CA', 'fr-CA', 'en'],
    'AU': ['en-AU', 'en'],
    'DE': ['de-DE', 'de', 'en'],
    'FR': ['fr-FR', 'fr', 'en'],
    'ES': ['es-ES', 'es', 'en'],
    'IT': ['it-IT', 'it', 'en'],
    'JP': ['ja-JP', 'ja', 'en'],
    'CN': ['zh-CN', 'zh', 'en'],
    'KR': ['ko-KR', 'ko', 'en'],
    'BR': ['pt-BR', 'pt', 'en'],
    'RU': ['ru-RU', 'ru', 'en'],
    'IN': ['en-IN', 'hi-IN', 'en'],
    'MX': ['es-MX', 'es', 'en']
  };
  
  return langMap[countryCode] || [`${primaryLang}-${countryCode}`, primaryLang, 'en'];
}

function generateFingerprint(ipInfo) {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
  ];
  
  const resolutions = [
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 2560, height: 1440 }
  ];
  
  const renderers = [
    'Intel(R) UHD Graphics',
    'NVIDIA GeForce GTX 1650',
    'AMD Radeon RX 580',
    'Intel(R) Iris(R) Xe Graphics'
  ];
  
  const resolution = resolutions[Math.floor(Math.random() * resolutions.length)];
  const languages = getLanguagesFromCountry(ipInfo.countryCode, ipInfo.languages);
  
  return {
    userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
    screen: resolution,
    hardwareConcurrency: [2, 4, 8, 16][Math.floor(Math.random() * 4)],
    deviceMemory: [4, 8, 16][Math.floor(Math.random() * 3)],
    renderer: renderers[Math.floor(Math.random() * renderers.length)],
    vendor: 'Google Inc.',
    platform: ['Win32', 'MacIntel', 'Linux x86_64'][Math.floor(Math.random() * 3)],
    languages: languages,
    timezone: ipInfo.timezone,
    geolocation: {
      latitude: ipInfo.latitude,
      longitude: ipInfo.longitude,
      accuracy: Math.floor(Math.random() * 100) + 50
    },
    country: ipInfo.country,
    city: ipInfo.city,
    ip: ipInfo.ip,
    mediaDevices: {
      audioinput: Math.floor(Math.random() * 2) + 1,
      videoinput: Math.floor(Math.random() * 2) + 1,
      audiooutput: Math.floor(Math.random() * 3) + 1
    }
  };
}

function displayFingerprint(fp) {
  const info = document.getElementById('fingerprintInfo');
  info.innerHTML = `
    <div class="info-item"><span class="label">IP:</span> ${fp.ip}</div>
    <div class="info-item"><span class="label">Location:</span> ${fp.city}, ${fp.country}</div>
    <div class="info-item"><span class="label">Timezone:</span> ${fp.timezone}</div>
    <div class="info-item"><span class="label">Languages:</span> ${fp.languages.join(', ')}</div>
    <div class="info-item"><span class="label">User Agent:</span><br>${fp.userAgent}</div>
    <div class="info-item"><span class="label">Screen:</span> ${fp.screen.width}x${fp.screen.height}</div>
    <div class="info-item"><span class="label">CPU Cores:</span> ${fp.hardwareConcurrency}</div>
    <div class="info-item"><span class="label">RAM:</span> ${fp.deviceMemory} GB</div>
    <div class="info-item"><span class="label">Renderer:</span> ${fp.renderer}</div>
    <div class="info-item"><span class="label">Platform:</span> ${fp.platform}</div>
    <div class="info-item"><span class="label">Media Devices:</span> Cameras: ${fp.mediaDevices.videoinput}, Mics: ${fp.mediaDevices.audioinput}, Speakers: ${fp.mediaDevices.audiooutput}</div>
  `;
}

chrome.storage.local.get(['fingerprint'], (result) => {
  if (result.fingerprint) {
    displayFingerprint(result.fingerprint);
  }
});
