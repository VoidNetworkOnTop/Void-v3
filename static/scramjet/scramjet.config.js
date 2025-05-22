// Enhanced Scramjet Configuration
self.__scramjet$config = {
    prefix: "/scramjet/",
    codec: "plain",
    files: {
        wasm: "/scramjet/scramjet.wasm.js",
        worker: "/scramjet/scramjet.worker.js", 
        client: "/scramjet/scramjet.client.js",
        codecs: "/scramjet/scramjet.codecs.js"
    },
    
    // Enhanced URL encoding/decoding
    encodeUrl: function(url) {
        if (!url) return "";
        try {
            // Normalize the URL first
            let normalizedUrl = url.trim();
            
            // Add protocol if missing
            if (!normalizedUrl.match(/^https?:\/\//)) {
                if (normalizedUrl.startsWith('//')) {
                    normalizedUrl = 'https:' + normalizedUrl;
                } else if (!normalizedUrl.startsWith('/')) {
                    normalizedUrl = 'https://' + normalizedUrl;
                }
            }
            
            // Validate URL
            new URL(normalizedUrl);
            
            // Use base64 encoding with URL-safe characters
            return btoa(unescape(encodeURIComponent(normalizedUrl)))
                .replace(/\+/g, "-")
                .replace(/\//g, "_")
                .replace(/=/g, "");
        } catch (e) {
            console.error('Error encoding URL:', e, 'Input:', url);
            return "";
        }
    },
    
    decodeUrl: function(encodedUrl) {
        if (!encodedUrl) return "";
        try {
            // Restore base64 padding and decode
            let paddedUrl = encodedUrl.replace(/-/g, "+").replace(/_/g, "/");
            
            // Add proper padding
            while (paddedUrl.length % 4) {
                paddedUrl += '=';
            }
            
            return decodeURIComponent(escape(atob(paddedUrl)));
        } catch (e) {
            console.error('Error decoding URL:', e, 'Input:', encodedUrl);
            return "";
        }
    },
    
    // Helper functions
    isValidUrl: function(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    },
    
    rewriteUrl: function(url, baseUrl) {
        try {
            // Skip if already a proxy URL
            if (url.startsWith('/scramjet/')) {
                return url;
            }
            
            // Skip special URLs
            if (url.startsWith('data:') || 
                url.startsWith('javascript:') || 
                url.startsWith('mailto:') || 
                url.startsWith('#') ||
                url.startsWith('blob:')) {
                return url;
            }
            
            // Create absolute URL
            let absoluteUrl;
            if (url.startsWith('//')) {
                absoluteUrl = (baseUrl ? new URL(baseUrl).protocol : 'https:') + url;
            } else if (url.startsWith('/')) {
                absoluteUrl = (baseUrl ? new URL(baseUrl).origin : '') + url;
            } else if (url.startsWith('http://') || url.startsWith('https://')) {
                absoluteUrl = url;
            } else {
                // Relative URL
                absoluteUrl = baseUrl ? new URL(url, baseUrl).href : url;
            }
            
            // Encode for proxy
            const encodedUrl = this.encodeUrl(absoluteUrl);
            return `/scramjet/${encodedUrl}`;
            
        } catch (error) {
            console.warn('URL rewriting failed for:', url, error);
            return url;
        }
    }
};

// Make it globally accessible
if (typeof window !== 'undefined') {
    window.__scramjet$config = self.__scramjet$config;
}

// Enhanced bundle with proper rewriters
if (typeof self !== 'undefined' && self.__scramjet$config) {
    self.__scramjet$bundle = {
        rewriters: {
            url: {
                encodeUrl: self.__scramjet$config.encodeUrl,
                decodeUrl: self.__scramjet$config.decodeUrl,
                rewriteUrl: self.__scramjet$config.rewriteUrl
            },
            
            rewriteHtml: function(html, baseUrl) {
                if (!html || typeof html !== 'string') return html;
                
                try {
                    // Remove problematic meta tags
                    html = html.replace(/<meta[^>]*http-equiv=["']?content-security-policy["']?[^>]*>/gi, '');
                    html = html.replace(/<meta[^>]*name=["']?referrer["']?[^>]*>/gi, '');
                    
                    // Rewrite URLs in various attributes
                    const urlAttributes = ['href', 'src', 'action', 'formaction', 'data-src', 'data-href'];
                    
                    for (const attr of urlAttributes) {
                        const regex = new RegExp(`(${attr})=["']([^"']+)["']`, 'gi');
                        html = html.replace(regex, (match, attribute, url) => {
                            const rewrittenUrl = self.__scramjet$config.rewriteUrl(url, baseUrl);
                            return `${attribute}="${rewrittenUrl}"`;
                        });
                    }
                    
                    return html;
                } catch (e) {
                    console.warn('HTML rewriting failed:', e);
                    return html;
                }
            },
            
            rewriteJs: function(js, baseUrl) {
                // Basic JS rewriting - return as-is for now
                return js;
            },
            
            rewriteCss: function(css, baseUrl) {
                if (!css || typeof css !== 'string') return css;
                
                try {
                    // Rewrite url() in CSS
                    css = css.replace(/url\(\s*['"]?([^'")\s]+)['"]?\s*\)/gi, (match, url) => {
                        const rewrittenUrl = self.__scramjet$config.rewriteUrl(url, baseUrl);
                        return `url("${rewrittenUrl}")`;
                    });
                    
                    // Rewrite @import statements
                    css = css.replace(/@import\s+['"]([^'"]+)['"]/gi, (match, url) => {
                        const rewrittenUrl = self.__scramjet$config.rewriteUrl(url, baseUrl);
                        return `@import "${rewrittenUrl}"`;
                    });
                    
                    return css;
                } catch (e) {
                    console.warn('CSS rewriting failed:', e);
                    return css;
                }
            },
            
            rewriteHeaders: function(headers, baseUrl) {
                if (!headers) return {};
                
                const cleanHeaders = {};
                const skipHeaders = [
                    'content-security-policy',
                    'content-security-policy-report-only',
                    'x-frame-options',
                    'x-content-type-options',
                    'strict-transport-security',
                    'referrer-policy',
                    'permissions-policy'
                ];
                
                for (const [key, value] of Object.entries(headers)) {
                    if (!skipHeaders.includes(key.toLowerCase())) {
                        cleanHeaders[key] = value;
                    }
                }
                
                // Add permissive headers
                cleanHeaders['Access-Control-Allow-Origin'] = '*';
                cleanHeaders['X-Frame-Options'] = 'ALLOWALL';
                
                return cleanHeaders;
            },
            
            rewriteSrcset: function(srcset, baseUrl) {
                if (!srcset || typeof srcset !== 'string') return srcset;
                
                try {
                    return srcset.replace(/([^\s,]+)/g, (match, url) => {
                        // Only rewrite if it looks like a URL (not a size descriptor)
                        if (url.includes('.') && !url.endsWith('x') && !url.endsWith('w')) {
                            return self.__scramjet$config.rewriteUrl(url, baseUrl);
                        }
                        return url;
                    });
                } catch (e) {
                    console.warn('Srcset rewriting failed:', e);
                    return srcset;
                }
            }
        },
        
        // Utility functions
        isScramjetFile: function(url) {
            const scramjetFiles = [
                '/scramjet/scramjet.config.js',
                '/scramjet/scramjet.bundle.js',
                '/scramjet/scramjet.client.js',
                '/scramjet/scramjet.worker.js',
                '/scramjet/scramjet.codecs.js',
                '/scramjet/register.js'
            ];
            return scramjetFiles.some(file => url.includes(file));
        }
    };
}
