// Scramjet Service Worker - Improved Version
importScripts('./scramjet.config.js');
importScripts('./scramjet.bundle.js');

// Handle fetch events
self.addEventListener('fetch', (event) => {
  // Only handle requests with our prefix
  if (event.request.url.startsWith(self.location.origin + __scramjet$config.prefix)) {
    event.respondWith(handleScramjetRequest(event));
  }
});

async function handleScramjetRequest(event) {
  try {
    // Get the original URL from the request
    const scramjetPath = new URL(event.request.url).pathname.slice(__scramjet$config.prefix.length);
    const originalUrl = __scramjet.decodeUrl(scramjetPath);
    
    // Try a different CORS proxy that tends to work better
    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(originalUrl)}`;
    
    // Make the request through the proxy
    const response = await fetch(proxyUrl);
    
    // If successful, process the response
    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      
      // If it's HTML, we need to rewrite the links
      if (contentType.includes('text/html')) {
        let text = await response.text();
        
        // Rewrite URLs in the HTML
        const baseUrl = new URL(originalUrl);
        text = rewriteHtml(text, baseUrl);
        
        return new Response(text, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            'Content-Type': 'text/html',
          }
        });
      } 
      // For other resources, pass through as-is
      else {
        return response;
      }
    } else {
      throw new Error(`Proxy returned error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Scramjet error:', error);
    
    // Create a simpler error message
    const errorHtml = `
      <html>
        <head>
          <title>Scramjet Error</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .error-container { max-width: 600px; margin: 0 auto; }
            h1 { color: #e41e3f; }
            pre { background: #f7f7f7; padding: 10px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="error-container">
            <h1>Scramjet Proxy Error</h1>
            <p>Could not load the requested website. Try using UV instead.</p>
            <pre>${error.message}</pre>
          </div>
        </body>
      </html>
    `;
    
    return new Response(errorHtml, { 
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Simplified HTML rewriting function
function rewriteHtml(html, baseUrl) {
  // Find the base domain for easier URL construction
  const origin = self.location.origin;
  const prefix = __scramjet$config.prefix;
  
  // Function to rewrite URLs
  function rewriteUrl(url) {
    // Skip empty, hash, or javascript URLs
    if (!url || url.startsWith('#') || url.startsWith('javascript:') || url.startsWith('data:')) {
      return url;
    }
    
    // Convert to absolute URL
    let absoluteUrl;
    try {
      absoluteUrl = new URL(url, baseUrl).href;
    } catch (e) {
      return url;
    }
    
    // Create the proxied URL
    return `${origin}${prefix}${__scramjet$config.encodeUrl(absoluteUrl)}`;
  }
  
  // Rewrite src attributes
  html = html.replace(/(<script[^>]+src=["'])([^"']+)(["'])/gi, 
    (match, prefix, url, suffix) => `${prefix}${rewriteUrl(url)}${suffix}`);
  
  // Rewrite link href attributes
  html = html.replace(/(<link[^>]+href=["'])([^"']+)(["'])/gi, 
    (match, prefix, url, suffix) => `${prefix}${rewriteUrl(url)}${suffix}`);
  
  // Rewrite img src attributes
  html = html.replace(/(<img[^>]+src=["'])([^"']+)(["'])/gi, 
    (match, prefix, url, suffix) => `${prefix}${rewriteUrl(url)}${suffix}`);
  
  // Rewrite a href attributes
  html = html.replace(/(<a[^>]+href=["'])([^"']+)(["'])/gi, 
    (match, prefix, url, suffix) => `${prefix}${rewriteUrl(url)}${suffix}`);
  
  // Add base tag to header to help with relative URLs
  html = html.replace(/<head>/i, `<head><base href="${baseUrl.href}">`);
  
  // Add minimal indicator (no padding needed) that's less intrusive
  html = html.replace(/<body([^>]*)>/i, 
    `<body$1><div style="position:fixed;bottom:0;right:0;background:rgba(0,0,0,0.6);color:white;padding:3px 8px;font-size:10px;z-index:9999;opacity:0.7;">Scramjet</div>`);
  
  return html;
}
