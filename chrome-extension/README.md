# Browser Fingerprint Generator - Chrome Extension

A Chrome extension that generates randomized browser fingerprints to protect privacy and prevent tracking, similar to Octo Browser functionality.

## Features

- **IP-Based Configuration**: Automatically detects your current IP (including proxy) and generates fingerprints based on location
- **User Agent Spoofing**: Randomizes browser user agent strings
- **Screen Resolution**: Spoofs screen dimensions
- **Hardware Specs**: Randomizes CPU cores, RAM size, and GPU renderer
- **Geolocation**: Sets location data based on detected IP
- **Language & Timezone**: Automatically matches your IP location
- **WebRTC Protection**: Prevents IP leaks through WebRTC
- **Media Devices**: Spoofs camera, microphone, and speaker counts
- **Canvas Fingerprinting**: Optional hardware noise injection
- **Font Spoofing**: Randomizes reported font count

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `chrome-extension` folder
6. The extension icon will appear in your toolbar

## Usage

1. **Set up your proxy** (e.g., IPRoyal) if desired
2. Click the extension icon in Chrome toolbar
3. Click "🔄 New Fingerprint" button
4. Extension will detect your current IP and generate matching fingerprint
5. Reload any open tabs to apply the new fingerprint

## How It Works

### Architecture

```
┌─────────────────┐
│   popup.html    │  User Interface
│   popup.js      │  Fingerprint Generation Logic
└────────┬────────┘
         │
         ├─────────────────────────────────┐
         │                                 │
┌────────▼────────┐              ┌────────▼────────┐
│  background.js  │              │   content.js    │
│  Service Worker │              │  Injection      │
└─────────────────┘              └─────────────────┘
         │                                 │
         │ User-Agent Header               │ JavaScript API
         │ Modification                    │ Overrides
         │                                 │
         └─────────────┬───────────────────┘
                       │
                ┌──────▼──────┐
                │  Websites   │
                └─────────────┘
```

### Workflow

#### 1. Fingerprint Generation (popup.js)

```
User clicks "New Fingerprint"
         ↓
Fetch IP info from ip-api.com
         ↓
Detect: IP, Country, City, Timezone, Coordinates
         ↓
Generate random fingerprint:
  - User Agent (random from pool)
  - Screen Resolution (random)
  - CPU Cores (2, 4, 8, or 16)
  - RAM Size (4, 8, or 16 GB)
  - GPU Renderer (random)
  - Platform (Win32/MacIntel/Linux)
  - Languages (based on country code)
  - Timezone (from IP)
  - Geolocation (from IP coordinates)
  - Fonts (100-150 random count)
  - Media Devices (random counts)
         ↓
Save to chrome.storage.local
         ↓
Display in popup UI
```

#### 2. IP Detection Logic

```javascript
// Uses ip-api.com with 5-second timeout
fetch('http://ip-api.com/json/')
  ↓
Returns: {
  query: "IP address",
  country: "Spain",
  countryCode: "ES",
  city: "Malaga",
  timezone: "Europe/Madrid",
  lat: 36.7213,
  lon: -4.4214
}
  ↓
Maps country code to languages:
  ES → ['es-ES', 'es']
  US → ['en-US', 'en']
  etc.
```

#### 3. Content Script Injection (content.js)

Runs at `document_start` (before page loads):

```javascript
// Retrieve fingerprint from storage
chrome.storage.local.get(['fingerprint'])
  ↓
// Inject script into page context
Create <script> element with overrides
  ↓
// Override JavaScript APIs:
  - navigator.userAgent
  - navigator.hardwareConcurrency
  - navigator.deviceMemory
  - navigator.platform
  - navigator.languages
  - navigator.geolocation.getCurrentPosition()
  - screen.width / screen.height
  - WebGL renderer/vendor
  - navigator.mediaDevices.enumerateDevices()
  - Canvas noise (if enabled)
  - document.fonts.size
  - RTCPeerConnection (WebRTC)
  - navigator.credentials (password)
```

#### 4. Background Service Worker (background.js)

```javascript
// Intercepts HTTP requests
chrome.webRequest.onBeforeSendHeaders
  ↓
// Modifies User-Agent header
Replace default User-Agent with spoofed one
  ↓
// Applies to all requests
```

### API Overrides Detail

**Navigator Properties:**
```javascript
Object.defineProperty(navigator, 'userAgent', {
  get: () => fingerprint.userAgent
});
```

**Geolocation:**
```javascript
navigator.geolocation.getCurrentPosition = function(success) {
  success({
    coords: {
      latitude: fingerprint.geolocation.latitude,
      longitude: fingerprint.geolocation.longitude,
      accuracy: fingerprint.geolocation.accuracy
    }
  });
};
```

**WebRTC IP Leak Protection:**
```javascript
window.RTCPeerConnection = function(...args) {
  const pc = new originalRTCPeerConnection(...args);
  // Replace local IPs with proxy IP in SDP
  pc.createOffer = function() {
    return originalCreateOffer().then((offer) => {
      offer.sdp = offer.sdp.replace(/IP_REGEX/g, fingerprint.ip);
      return offer;
    });
  };
  return pc;
};
```

**Canvas Noise (when enabled):**
```javascript
CanvasRenderingContext2D.prototype.getImageData = function(...args) {
  const imageData = originalGetImageData.apply(this, args);
  // Add random noise to pixel data
  for (let i = 0; i < data.length; i += 4) {
    data[i] += Math.floor(Math.random() * 3) - 1;
  }
  return imageData;
};
```

## Configuration

### Supported Countries & Languages

The extension automatically maps country codes to appropriate languages:

| Country | Languages |
|---------|-----------|
| Spain (ES) | es-ES, es |
| United States (US) | en-US, en |
| Germany (DE) | de-DE, de, en |
| France (FR) | fr-FR, fr, en |
| Japan (JP) | ja-JP, ja, en |
| And 20+ more... |

### Fingerprint Components

| Component | Values | Source |
|-----------|--------|--------|
| IP Address | Detected | ip-api.com |
| Location | City, Country | Based on IP |
| User Agent | 4 variants | Random pool |
| Screen Resolution | 4 options | Random (1920x1080, 1440x900, etc.) |
| CPU Cores | 2, 4, 8, 16 | Random |
| RAM Size | 4, 8, 16 GB | Random |
| GPU Renderer | 4 types | Random (Intel, NVIDIA, AMD) |
| Platform | Win32, MacIntel, Linux | Random |
| Languages | Country-specific | Based on IP country |
| Timezone | IANA timezone | Based on IP |
| Geolocation | Lat/Lon | Based on IP |
| Fonts | 100-150 | Random count |
| Hardware Noise | No | Fixed |
| Media Devices | 1-3 each | Random |
| WebRTC | Proxy IP | Based on IP |
| Password | No | Fixed |

## Use Cases

1. **Privacy Protection**: Prevent websites from tracking you across sessions
2. **Proxy Testing**: Verify proxy location is correctly detected
3. **Multi-Account Management**: Use different fingerprints for different accounts
4. **Web Scraping**: Avoid detection when collecting data
5. **Ad Testing**: Test ads from different locations/devices

## Limitations

- **Not 100% undetectable**: Advanced fingerprinting systems may still detect inconsistencies
- **Requires page reload**: Changes only apply after reloading the page
- **Extension detection**: Websites can detect Chrome extensions are installed
- **Partial WebGL spoofing**: Only basic WebGL parameters are spoofed
- **No persistent profiles**: Each generation creates a new random fingerprint

## Troubleshooting

**IP shows as "Unknown":**
- Check internet connection
- Verify proxy is working
- Try disabling other extensions that might block API requests

**Fingerprint not applying:**
- Make sure to reload the page after generating new fingerprint
- Check browser console for errors (F12)

**Slow IP detection:**
- API has 5-second timeout
- Check if ip-api.com is accessible in your region
- Verify proxy isn't blocking the API request

## Technical Details

**Permissions Required:**
- `storage`: Save fingerprint data
- `webRequest`: Modify User-Agent headers
- `scripting`: Inject content scripts
- `<all_urls>`: Apply to all websites

**Manifest Version:** 3

**Browser Compatibility:** Chrome 88+, Edge 88+

## Privacy & Security

- No data is sent to external servers (except IP detection API)
- All fingerprint data stored locally in browser
- No tracking or analytics
- Open source - audit the code yourself

## Development

**File Structure:**
```
chrome-extension/
├── manifest.json       # Extension configuration
├── popup.html          # UI interface
├── popup.js            # Fingerprint generation logic
├── content.js          # JavaScript API overrides
├── background.js       # HTTP header modification
└── README.md           # This file
```

**To modify:**
1. Edit the relevant file
2. Go to `chrome://extensions/`
3. Click reload icon on the extension card
4. Test changes

## License

Open source - use freely

## Credits

Inspired by Octo Browser's fingerprint management system.
