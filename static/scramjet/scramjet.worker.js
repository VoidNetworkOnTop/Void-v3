// Scramjet Worker
importScripts('./scramjet.config.js');
importScripts('./scramjet.shared.js');

self.addEventListener('message', async (event) => {
  const { type, data } = event.data;
  
  if (type === 'rewriteHtml') {
    const { html, baseUrl, origin } = data;
    const proxyPrefix = `${origin}${__scramjet$config.prefix}`;
    const rewritten = __scramjet$utils.rewriteHtml(
      html, 
      new URL(baseUrl), 
      proxyPrefix, 
      __scramjet$config.encodeUrl
    );
    self.postMessage({ type: 'rewriteHtmlResult', data: rewritten });
  }
  
  if (type === 'rewriteCss') {
    const { css, baseUrl, origin } = data;
    const proxyPrefix = `${origin}${__scramjet$config.prefix}`;
    const rewritten = __scramjet$utils.rewriteCss(
      css, 
      new URL(baseUrl), 
      proxyPrefix, 
      __scramjet$config.encodeUrl
    );
    self.postMessage({ type: 'rewriteCssResult', data: rewritten });
  }
});

self.postMessage({ type: 'ready' });
