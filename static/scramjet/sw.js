// Scramjet Service Worker with Resource Rewriting
importScripts('/scramjet/scramjet.config.js');
importScripts('/scramjet/scramjet.bundle.js');

// Handle fetch events
self.addEventListener('fetch', (event) => {
  // Handle requests with our prefix
  if (event.request.url.startsWith(self.location.origin + __scramjet$config.prefix)) {
    event.respondWith(handleScramjetRequest(event));
  }
});

async function handleScramjetRequest(event) {
  try {
    // Get the original URL from the request
    const scramjetPath = new URL(event.request.url).pathname.slice(__scramjet$config.prefix.length);
    const originalUrl = __scramjet.decodeUrl(scramjetPath);
    
    // We'll use corsanywhere as it tends to handle resources better
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(originalUrl)}`;
    
    // Make the request through the proxy
    const response = await fetch(proxyUrl);
    
    // If successful, process the response
    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      
      // If it's HTML, we need to rewrite the links
      if (contentType.includes('text/html')) {
        const text = await response.text();
        
        // Rewrite HTML to proxy all resources
        const baseUrl = new URL(originalUrl);
        const rewritten = rewriteHtml(text, baseUrl);
        
        return new Response(rewritten, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            'Content-Type': 'text/html',
            'X-Scramjet-Proxied': 'true'
          }
        });
      } 
      // For CSS, rewrite urls
      else if (contentType.includes('text/css')) {
        const text = await response.text();
        const baseUrl = new URL(originalUrl);
        const rewritten = rewriteCss(text, baseUrl);
        
        return new Response(rewritten, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            'Content-Type': 'text/css',
            'X-Scramjet-Proxied': 'true'
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
    
    // Error message HTML
    const errorHtml = `
      <html>
        <head>
          <title>Scramjet Error</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f0f0f0; }
            .error-container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #e41e3f; margin-top: 0; }
            pre { background: #f7f7f7; padding: 15px; border-radius: 4px; overflow-x: auto; }
            .message { margin-bottom: 20px; }
            .suggestions { margin-top: 20px; }
            .suggestion { margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="error-container">
            <h1>Scramjet Proxy Error</h1>
            <div class="message">
              <p>There was an error connecting to the site.</p>
              <pre>${error.message}</pre>
            </div>
            <div class="suggestions">
              <p><strong>Try these suggestions:</strong></p>
              <div class="suggestion">- Use the UV proxy instead for this site</div>
              <div class="suggestion">- Check your internet connection</div>
              <div class="suggestion">- Try again later</div>
            </div>
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

// Function to rewrite HTML content
function rewriteHtml(html, baseUrl) {
  // Function to rewrite a URL
  function rewriteUrl(url) {
    // Skip empty URLs, data URLs, and javascript URLs
    if (!url || url.startsWith('data:') || url.startsWith('javascript:') || url.startsWith('#')) {
      return url;
    }
    
    // Convert relative URLs to absolute
    let absoluteUrl;
    try {
      absoluteUrl = new URL(url, baseUrl).href;
    } catch (e) {
      // If we can't parse it, return as is
      return url;
    }
    
    // Encode the URL for our proxy
    return `${self.location.origin}${__scramjet$config.prefix}${__scramjet$config.encodeUrl(absoluteUrl)}`;
  }
  
  // Rewrite various attributes
  return html
    // Add base tag to ensure relative URLs work properly
    .replace(/<head>/i, `<head><base href="${baseUrl.href}">`)
    
    // Rewrite src attributes
    .replace(/(<script[^>]+src=["'])([^"']+)(["'])/gi, (match, pre, url, post) => {
      return `${pre}${rewriteUrl(url)}${post}`;
    })
    
    // Rewrite href attributes in link tags
    .replace(/(<link[^>]+href=["'])([^"']+)(["'])/gi, (match, pre, url, post) => {
      return `${pre}${rewriteUrl(url)}${post}`;
    })
    
    // Rewrite img src
    .replace(/(<img[^>]+src=["'])([^"']+)(["'])/gi, (match, pre, url, post) => {
      return `${pre}${rewriteUrl(url)}${post}`;
    })
    
    // Rewrite a tags
    .replace(/(<a[^>]+href=["'])([^"']+)(["'])/gi, (match, pre, url, post) => {
      return `${pre}${rewriteUrl(url)}${post}`;
    })
    
    // Add a note at the top of the body
    .replace(/<body/i, `<body style="position:relative;padding-top:30px;"`)
    .replace(/<body([^>]*)>/i, `<body$1><div style="position:fixed;top:0;left:0;right:0;background:#f0f0f0;color:#333;padding:5px 10px;font-family:Arial,sans-serif;font-size:12px;z-index:9999;text-align:center;">Proxied via Scramjet | <a href="${baseUrl.href}" target="_blank">Open original</a></div>`);
}

// Function to rewrite CSS content
function rewriteCss(css, baseUrl) {
  return css.replace(/url\(['"]?([^'"\)]+)['"]?\)/gi, (match, url) => {
    // Skip data URLs
    if (url.startsWith('data:')) {
      return match;
    }
    
    // Convert to absolute URL
    let absoluteUrl;
    try {
      absoluteUrl = new URL(url, baseUrl).href;
    } catch (e) {
      return match;
    }
    
    // Encode for our proxy
    const proxyUrl = `${self.location.origin}${__scramjet$config.prefix}${__scramjet$config.encodeUrl(absoluteUrl)}`;
    return `url("${proxyUrl}")`;
  });
}
