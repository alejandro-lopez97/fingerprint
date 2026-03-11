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
    // Try multiple IP detection services to ensure proxy IP is detected
    let data;
    
    try {
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        data = await response.json();
      }
    } catch (e) {
      console.log('ipapi.co failed, trying alternative...');
    }
    
    // Fallback to ip-api.com if first service fails
    if (!data || !data.ip) {
      try {
        const response = await fetch('http://ip-api.com/json/');
        if (response.ok) {
          const ipApiData = await response.json();
          data = {
            ip: ipApiData.query,
            country_name: ipApiData.country,
            country_code: ipApiData.countryCode,
            city: ipApiData.city,
            timezone: ipApiData.timezone,
            languages: ipApiData.countryCode === 'ES' ? 'es' : 'en',
            latitude: ipApiData.lat,
            longitude: ipApiData.lon
          };
        }
      } catch (e) {
        console.log('ip-api.com also failed');
      }
    }
    
    if (!data || !data.ip) {
      throw new Error('All IP detection services failed');
    }
    
    return {
      country: data.country_name || data.country || 'United States',
      countryCode: data.country_code || data.countryCode || 'US',
      city: data.city || 'New York',
      timezone: data.timezone || 'America/New_York',
      languages: data.languages ? data.languages.split(',')[0] : (data.countryCode === 'ES' ? 'es' : 'en'),
      latitude: data.latitude || data.lat || 40.7128,
      longitude: data.longitude || data.lon || -74.0060,
      ip: data.ip || data.query || 'Unknown'
    };
  } catch (error) {
    console.error('IP lookup failed:', error);
    throw error;
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
    'ES': ['es-ES', 'es'],
    'IT': ['it-IT', 'it', 'en'],
    'JP': ['ja-JP', 'ja', 'en'],
    'CN': ['zh-CN', 'zh', 'en'],
    'KR': ['ko-KR', 'ko', 'en'],
    'BR': ['pt-BR', 'pt', 'en'],
    'RU': ['ru-RU', 'ru', 'en'],
    'IN': ['en-IN', 'hi-IN', 'en'],
    'MX': ['es-MX', 'es', 'en'],
    'NL': ['nl-NL', 'nl', 'en'],
    'PL': ['pl-PL', 'pl', 'en'],
    'SE': ['sv-SE', 'sv', 'en'],
    'NO': ['nb-NO', 'nb', 'en'],
    'DK': ['da-DK', 'da', 'en'],
    'FI': ['fi-FI', 'fi', 'en'],
    'PT': ['pt-PT', 'pt', 'en'],
    'GR': ['el-GR', 'el', 'en'],
    'TR': ['tr-TR', 'tr', 'en'],
    'AR': ['es-AR', 'es', 'en'],
    'CL': ['es-CL', 'es', 'en'],
    'CO': ['es-CO', 'es', 'en']
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
    fonts: Math.floor(Math.random() * 50) + 100,
    hardwareNoise: false,
    webrtc: 'Based on IP',
    password: 'No',
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
    <div class="info-item"><span class="label">User Agent:</span><br>${fp.userAgent}</div>
    <div class="info-item"><span class="label">Operating System:</span> ${fp.platform}</div>
    <div class="info-item"><span class="label">Fonts:</span> ${fp.fonts}</div>
    <div class="info-item"><span class="label">Screen Resolution:</span> ${fp.screen.width}x${fp.screen.height}</div>
    <div class="info-item"><span class="label">Languages:</span> ${fp.languages.join(', ')}</div>
    <div class="info-item"><span class="label">Timezone:</span> ${fp.timezone}</div>
    <div class="info-item"><span class="label">Geolocation:</span> ${fp.geolocation.latitude.toFixed(4)}, ${fp.geolocation.longitude.toFixed(4)}</div>
    <div class="info-item"><span class="label">CPU Cores:</span> ${fp.hardwareConcurrency}</div>
    <div class="info-item"><span class="label">RAM Size:</span> ${fp.deviceMemory} GB</div>
    <div class="info-item"><span class="label">Renderer:</span> ${fp.renderer}</div>
    <div class="info-item"><span class="label">Hardware Noise:</span> ${fp.hardwareNoise ? 'Yes' : 'No'}</div>
    <div class="info-item"><span class="label">Media Devices:</span> Cameras: ${fp.mediaDevices.videoinput}, Microphones: ${fp.mediaDevices.audioinput}, Speakers: ${fp.mediaDevices.audiooutput}</div>
    <div class="info-item"><span class="label">WebRTC:</span> ${fp.ip}</div>
    <div class="info-item"><span class="label">Password:</span> ${fp.password}</div>
  `;
}

chrome.storage.local.get(['fingerprint'], (result) => {
  if (result.fingerprint) {
    displayFingerprint(result.fingerprint);
  }
});
