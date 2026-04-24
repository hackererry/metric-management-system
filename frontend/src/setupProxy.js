const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
      onProxyReq: (proxyReq, req, res) => {
        // 把客户端 IP 传给后端
        proxyReq.setHeader('X-Real-IP', req.connection.remoteAddress || req.socket.remoteAddress);
        proxyReq.setHeader('X-Forwarded-For', req.ip);
      },
    })
  );
};
