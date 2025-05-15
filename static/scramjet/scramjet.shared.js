// Shared utilities for Scramjet
(function(self) {
  // HTML rewriting utilities
  self.__scramjet$utils = {
    // Function to rewrite HTML content
    rewriteHtml: function(html, baseUrl, proxyPrefix, encoder) {
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
        return `${proxyPrefix}${encoder(absoluteUrl)}`;
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
    },

    // Function to rewrite CSS content
    rewriteCss: function(css, baseUrl, proxyPrefix, encoder) {
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
        const proxyUrl = `${proxyPrefix}${encoder(absoluteUrl)}`;
        return `url("${proxyUrl}")`;
      });
    }
  };
})(self);
