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
            const gl = thisArg;
            
            // WebGL Renderer and Vendor
            if (param === 37445 || param === gl.UNMASKED_RENDERER_WEBGL) {
              return fingerprint.webgl.renderer;
            }
            if (param === 37446 || param === gl.UNMASKED_VENDOR_WEBGL) {
              return fingerprint.webgl.vendor;
            }
            
            // Additional WebGL parameters
            if (param === gl.SHADING_LANGUAGE_VERSION) {
              return fingerprint.webgl.shadingLanguageVersion;
            }
            if (param === gl.MAX_TEXTURE_SIZE) {
              return fingerprint.webgl.maxTextureSize;
            }
            if (param === gl.MAX_VERTEX_ATTRIBS) {
              return fingerprint.webgl.maxVertexAttribs;
            }
            if (param === gl.MAX_VARYING_VECTORS) {
              return fingerprint.webgl.maxVaryingVectors;
            }
            if (param === gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) {
              return fingerprint.webgl.maxVertexTextureImageUnits;
            }
            if (param === gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS) {
              return fingerprint.webgl.maxCombinedTextureImageUnits;
            }
            if (param === gl.MAX_FRAGMENT_UNIFORM_VECTORS) {
              return fingerprint.webgl.maxFragmentUniformVectors;
            }
            if (param === gl.MAX_VERTEX_UNIFORM_VECTORS) {
              return fingerprint.webgl.maxVertexUniformVectors;
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
          
          // Canvas 2D noise injection
          if (context && type === '2d' && fingerprint.canvasNoise) {
            const originalGetImageData = context.getImageData;
            context.getImageData = function(...args) {
              const imageData = originalGetImageData.apply(this, args);
              const data = imageData.data;
              for (let i = 0; i < data.length; i += 4) {
                data[i] = data[i] + fingerprint.canvasNoise * (Math.random() - 0.5) * 255;
                data[i + 1] = data[i + 1] + fingerprint.canvasNoise * (Math.random() - 0.5) * 255;
                data[i + 2] = data[i + 2] + fingerprint.canvasNoise * (Math.random() - 0.5) * 255;
              }
              return imageData;
            };
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
        
        // Canvas noise injection for hardware noise
        if (fingerprint.hardwareNoise) {
          const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
          const originalToBlob = HTMLCanvasElement.prototype.toBlob;
          const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
          
          const addNoise = (imageData) => {
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              data[i] = data[i] + Math.floor(Math.random() * 3) - 1;
              data[i + 1] = data[i + 1] + Math.floor(Math.random() * 3) - 1;
              data[i + 2] = data[i + 2] + Math.floor(Math.random() * 3) - 1;
            }
            return imageData;
          };
          
          CanvasRenderingContext2D.prototype.getImageData = function(...args) {
            const imageData = originalGetImageData.apply(this, args);
            return addNoise(imageData);
          };
          
          HTMLCanvasElement.prototype.toDataURL = function(...args) {
            const context = this.getContext('2d');
            if (context) {
              const imageData = context.getImageData(0, 0, this.width, this.height);
              addNoise(imageData);
              context.putImageData(imageData, 0, 0);
            }
            return originalToDataURL.apply(this, args);
          };
        }
        
        // Font spoofing
        const originalFonts = Object.getOwnPropertyDescriptor(Document.prototype, 'fonts');
        if (originalFonts) {
          Object.defineProperty(document, 'fonts', {
            get: function() {
              const fontFaceSet = originalFonts.get.call(this);
              Object.defineProperty(fontFaceSet, 'size', {
                get: () => fingerprint.fonts
              });
              return fontFaceSet;
            }
          });
        }
        
        // WebRTC IP leak protection - replace real IP with proxy IP
        if (fingerprint.webrtc === 'Based on IP') {
          const originalRTCPeerConnection = window.RTCPeerConnection;
          window.RTCPeerConnection = function(...args) {
            const pc = new originalRTCPeerConnection(...args);
            
            const originalCreateOffer = pc.createOffer;
            pc.createOffer = function(...args) {
              return originalCreateOffer.apply(this, args).then((offer) => {
                offer.sdp = offer.sdp.replace(/([0-9]{1,3}\.){3}[0-9]{1,3}/g, fingerprint.ip);
                return offer;
              });
            };
            
            const originalCreateAnswer = pc.createAnswer;
            pc.createAnswer = function(...args) {
              return originalCreateAnswer.apply(this, args).then((answer) => {
                answer.sdp = answer.sdp.replace(/([0-9]{1,3}\.){3}[0-9]{1,3}/g, fingerprint.ip);
                return answer;
              });
            };
            
            return pc;
          };
        }
        
        // Password credential blocking
        if (fingerprint.password === 'No' && navigator.credentials) {
          navigator.credentials.get = function() {
            return Promise.resolve(null);
          };
          navigator.credentials.store = function() {
            return Promise.resolve();
          };
        }
      })();
    `;
    
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  });
})();
