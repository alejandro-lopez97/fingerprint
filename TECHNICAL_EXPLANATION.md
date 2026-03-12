# Technical Explanation: How the Extension Works

## Data Storage Location

### Chrome Storage API
```javascript
// Extension saves fingerprint here:
chrome.storage.local.set({ 
  fingerprint: {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    hardwareConcurrency: 4,
    deviceMemory: 8,
    screen: { width: 1440, height: 900 },
    renderer: "Intel(R) UHD Graphics",
    // ... more fake data
  }
});

// Location: Chrome's internal database
// Path (Windows): C:\Users\[User]\AppData\Local\Google\Chrome\User Data\Default\Local Storage
// Not accessible to websites directly
```

## How Websites Detect Device Information

### 1. JavaScript Navigator API

Websites use built-in JavaScript objects to detect device info:

```javascript
// What websites do:
console.log(navigator.hardwareConcurrency);  // CPU cores
console.log(navigator.deviceMemory);         // RAM in GB
console.log(navigator.userAgent);            // Browser info
console.log(navigator.platform);             // Operating system
console.log(navigator.languages);            // Languages
```

### 2. Screen Detection

```javascript
// What websites do:
console.log(screen.width);        // Screen width
console.log(screen.height);       // Screen height
console.log(screen.colorDepth);   // Color depth
console.log(window.devicePixelRatio); // Pixel ratio
```

### 3. WebGL GPU Detection

```javascript
// What websites do:
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl');
const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

if (debugInfo) {
  const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
  const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
  console.log('GPU:', renderer);  // e.g., "NVIDIA GeForce RTX 3060"
}
```

### 4. Canvas Fingerprinting

```javascript
// What websites do:
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// Draw text and shapes
ctx.textBaseline = 'top';
ctx.font = '14px Arial';
ctx.fillStyle = '#f60';
ctx.fillRect(125, 1, 62, 20);
ctx.fillText('Browser Fingerprint', 2, 15);

// Get unique hash
const dataURL = canvas.toDataURL();
const hash = hashFunction(dataURL);  // Creates unique ID
console.log('Canvas fingerprint:', hash);
```

### 5. Geolocation API

```javascript
// What websites do:
navigator.geolocation.getCurrentPosition((position) => {
  console.log('Latitude:', position.coords.latitude);
  console.log('Longitude:', position.coords.longitude);
});
```

### 6. Media Devices

```javascript
// What websites do:
navigator.mediaDevices.enumerateDevices().then(devices => {
  const cameras = devices.filter(d => d.kind === 'videoinput');
  const mics = devices.filter(d => d.kind === 'audioinput');
  console.log('Cameras:', cameras.length);
  console.log('Microphones:', mics.length);
});
```

## How Extension Intercepts and Spoofs

### Step-by-Step Process:

```
1. User clicks "New Fingerprint" button
   ↓
2. Extension generates random fake data
   ↓
3. Saves to chrome.storage.local
   ↓
4. User visits website (e.g., google.com)
   ↓
5. content.js runs at "document_start" (BEFORE page loads)
   ↓
6. content.js reads fake data from storage
   ↓
7. Injects <script> into page that overrides JavaScript APIs
   ↓
8. Website JavaScript runs
   ↓
9. Website calls: navigator.hardwareConcurrency
   ↓
10. Instead of real value, gets fake value from extension
   ↓
11. Website stores fake fingerprint
```

### Code Injection Example:

**content.js (Extension):**
```javascript
chrome.storage.local.get(['fingerprint'], (result) => {
  const fp = result.fingerprint;
  
  // Create script element
  const script = document.createElement('script');
  
  // Inject code that overrides APIs
  script.textContent = `
    (function() {
      const fakeData = ${JSON.stringify(fp)};
      
      // Override CPU cores
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => fakeData.hardwareConcurrency  // Returns 4 instead of 8
      });
      
      // Override RAM
      Object.defineProperty(navigator, 'deviceMemory', {
        get: () => fakeData.deviceMemory  // Returns 8 instead of 16
      });
      
      // Override screen size
      Object.defineProperty(screen, 'width', {
        get: () => fakeData.screen.width  // Returns 1440 instead of 1920
      });
      
      // ... more overrides
    })();
  `;
  
  // Inject into page
  document.documentElement.appendChild(script);
  script.remove();
});
```

**What Website Sees:**
```javascript
// Website code:
console.log(navigator.hardwareConcurrency);  // Output: 4 (fake)
console.log(navigator.deviceMemory);         // Output: 8 (fake)
console.log(screen.width);                   // Output: 1440 (fake)

// Real values (8 cores, 16GB RAM, 1920px) are hidden!
```

## Comparison: Before vs After

### Without Extension:

```javascript
// Website detection code:
const fingerprint = {
  cpu: navigator.hardwareConcurrency,        // 8 (real)
  ram: navigator.deviceMemory,               // 16 (real)
  screen: `${screen.width}x${screen.height}`, // 1920x1080 (real)
  gpu: getWebGLRenderer(),                   // "NVIDIA RTX 3060" (real)
  userAgent: navigator.userAgent,            // Your real browser
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Your real timezone
};

console.log(fingerprint);
// Output: Your REAL device information
```

### With Extension:

```javascript
// Same website detection code:
const fingerprint = {
  cpu: navigator.hardwareConcurrency,        // 4 (FAKE)
  ram: navigator.deviceMemory,               // 8 (FAKE)
  screen: `${screen.width}x${screen.height}`, // 1440x900 (FAKE)
  gpu: getWebGLRenderer(),                   // "Intel UHD Graphics" (FAKE)
  userAgent: navigator.userAgent,            // Random fake UA
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Spain timezone (FAKE)
};

console.log(fingerprint);
// Output: FAKE device information from extension
```

## Real-World Example

### Scenario: You visit Amazon.com

**Without Extension:**
```javascript
// Amazon's tracking code detects:
{
  ip: "123.45.67.89",              // Your real IP
  location: "New York, USA",        // Your real location
  device: {
    cpu: 8,                         // Your real CPU
    ram: 16,                        // Your real RAM
    screen: "1920x1080",            // Your real screen
    gpu: "NVIDIA RTX 3060",         // Your real GPU
  },
  browser: "Chrome 120 on Windows", // Your real browser
  fingerprint_hash: "abc123def456"  // Unique to YOUR device
}

// Amazon thinks: "This is user ABC123 from New York"
```

**With Extension + Proxy (Spain):**
```javascript
// Amazon's tracking code detects:
{
  ip: "185.23.45.67",              // Spanish proxy IP (FAKE)
  location: "Madrid, Spain",        // Proxy location (FAKE)
  device: {
    cpu: 4,                         // Random fake CPU
    ram: 8,                         // Random fake RAM
    screen: "1440x900",             // Random fake screen
    gpu: "Intel UHD Graphics",      // Random fake GPU
  },
  browser: "Chrome 145 on Mac",     // Random fake browser
  fingerprint_hash: "xyz789ghi012"  // Different hash (FAKE)
}

// Amazon thinks: "This is a DIFFERENT user from Spain"
```

## How to Verify It's Working

### Test 1: Open Browser Console (F12)

**Before Extension:**
```javascript
console.log(navigator.hardwareConcurrency);  // 8
console.log(screen.width);                   // 1920
```

**After Extension:**
```javascript
console.log(navigator.hardwareConcurrency);  // 4
console.log(screen.width);                   // 1440
```

### Test 2: Use test.html

1. Open test.html WITHOUT extension → See real values
2. Enable extension, generate fingerprint
3. Reload test.html → See fake values

### Test 3: Visit Fingerprinting Sites

Try these sites before and after:
- https://browserleaks.com/canvas
- https://amiunique.org/
- https://pixelscan.net/

You'll see completely different fingerprints!

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     YOUR REAL COMPUTER                        │
│  CPU: 8 cores | RAM: 16GB | GPU: NVIDIA RTX 3060            │
│  Screen: 1920x1080 | Location: New York                      │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                   CHROME EXTENSION LAYER                      │
│                                                               │
│  1. Reads fake data from chrome.storage.local                │
│  2. Injects JavaScript that overrides browser APIs           │
│  3. Intercepts all device detection attempts                 │
│                                                               │
│  Stored Data:                                                │
│  {                                                            │
│    hardwareConcurrency: 4,      ← Fake CPU                  │
│    deviceMemory: 8,             ← Fake RAM                  │
│    screen: {width: 1440, height: 900},  ← Fake Screen      │
│    renderer: "Intel UHD Graphics",      ← Fake GPU          │
│    ip: "185.23.45.67",          ← Proxy IP                  │
│    timezone: "Europe/Madrid"    ← Proxy timezone            │
│  }                                                            │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                    WEBSITE (e.g., Amazon)                     │
│                                                               │
│  JavaScript Detection Code:                                  │
│  const cpu = navigator.hardwareConcurrency;  // Gets: 4      │
│  const ram = navigator.deviceMemory;         // Gets: 8      │
│  const width = screen.width;                 // Gets: 1440   │
│  const gpu = getWebGLRenderer();             // Gets: Intel  │
│                                                               │
│  Website thinks you are:                                     │
│  - Different device (4 cores, not 8)                        │
│  - Different location (Spain, not New York)                 │
│  - Different user (new fingerprint hash)                    │
└──────────────────────────────────────────────────────────────┘
```

## Key Points

1. **Fake data is stored in Chrome's internal storage** (chrome.storage.local)
2. **Websites detect device info using JavaScript APIs** (navigator, screen, WebGL, etc.)
3. **Extension intercepts these APIs** and returns fake data instead of real data
4. **Websites cannot access the real values** because JavaScript APIs are overridden
5. **You must reload pages** after generating fingerprint for changes to apply
6. **Works automatically** - no manual configuration needed per site

## Security Note

The extension does NOT:
- Send your data anywhere
- Store data on external servers
- Track your browsing
- Share information with third parties

All fake data is:
- Generated locally in your browser
- Stored only in Chrome's local storage
- Only used to override JavaScript APIs
- Deleted when you uninstall the extension
