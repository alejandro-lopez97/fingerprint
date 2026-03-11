(function() {
  'use strict';
  
  chrome.storage.local.get(['fingerprint'], (result) => {
    if (!result.fingerprint) return;
    
    const fp = result.fingerprint;
    
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        const fingerprint = ${JSON.stringify(fp)};
        
        Object.defineProperty(navigator, 'userAgent', {
          get: () => fingerprint.userAgent
        });
        
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          get: () => fingerprint.hardwareConcurrency
        });
        
        Object.defineProperty(navigator, 'deviceMemory', {
          get: () => fingerprint.deviceMemory
        });
        
        Object.defineProperty(navigator, 'platform', {
          get: () => fingerprint.platform
        });
        
        Object.defineProperty(navigator, 'languages', {
          get: () => fingerprint.languages
        });
        
        Object.defineProperty(navigator, 'language', {
          get: () => fingerprint.languages[0]
        });
        
        if (navigator.geolocation) {
          const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition;
          navigator.geolocation.getCurrentPosition = function(success, error, options) {
            if (fingerprint.geolocation) {
              success({
                coords: {
                  latitude: fingerprint.geolocation.latitude,
                  longitude: fingerprint.geolocation.longitude,
                  accuracy: fingerprint.geolocation.accuracy,
                  altitude: null,
                  altitudeAccuracy: null,
                  heading: null,
                  speed: null
                },
                timestamp: Date.now()
              });
            } else {
              originalGetCurrentPosition.apply(this, arguments);
            }
          };
        }
        
        Object.defineProperty(screen, 'width', {
          get: () => fingerprint.screen.width
        });
        
        Object.defineProperty(screen, 'height', {
          get: () => fingerprint.screen.height
        });
        
        Object.defineProperty(screen, 'availWidth', {
          get: () => fingerprint.screen.width
        });
        
        Object.defineProperty(screen, 'availHeight', {
          get: () => fingerprint.screen.height - 40
        });
        
        const getParameterProxyHandler = {
          apply: function(target, thisArg, args) {
            const param = args[0];
            if (param === 'UNMASKED_RENDERER_WEBGL') {
              return fingerprint.renderer;
            }
            if (param === 'UNMASKED_VENDOR_WEBGL') {
              return fingerprint.vendor;
            }
            return target.apply(thisArg, args);
          }
        };
        
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type, ...args) {
          const context = originalGetContext.apply(this, [type, ...args]);
          if (context && (type === 'webgl' || type === 'webgl2')) {
            const originalGetParameter = context.getParameter;
            context.getParameter = new Proxy(originalGetParameter, getParameterProxyHandler);
          }
          return context;
        };
        
        const originalEnumerateDevices = navigator.mediaDevices.enumerateDevices;
        navigator.mediaDevices.enumerateDevices = async function() {
          const devices = [];
          for (let i = 0; i < fingerprint.mediaDevices.audioinput; i++) {
            devices.push({
              deviceId: 'audioinput' + i,
              kind: 'audioinput',
              label: 'Microphone ' + (i + 1),
              groupId: 'group' + i
            });
          }
          for (let i = 0; i < fingerprint.mediaDevices.videoinput; i++) {
            devices.push({
              deviceId: 'videoinput' + i,
              kind: 'videoinput',
              label: 'Camera ' + (i + 1),
              groupId: 'group' + i
            });
          }
          for (let i = 0; i < fingerprint.mediaDevices.audiooutput; i++) {
            devices.push({
              deviceId: 'audiooutput' + i,
              kind: 'audiooutput',
              label: 'Speaker ' + (i + 1),
              groupId: 'group' + i
            });
          }
          return devices;
        };
      })();
    `;
    
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  });
})();
