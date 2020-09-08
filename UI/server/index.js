/* eslint consistent-return:0 import/order:0 */

const express = require('express');
const logger = require('./logger');

const argv = require('./argv');
const port = require('./port');
const setup = require('./middlewares/frontendMiddleware');
const isDev = process.env.NODE_ENV !== 'production';
const ngrok =
  (isDev && process.env.ENABLE_TUNNEL) || argv.tunnel
    ? require('ngrok')
    : false;
const { resolve } = require('path');
const app = express();

// If you need a backend, e.g. an API, add your custom backend-specific middleware here
// https://create-react-app.dev/docs/proxying-api-requests-in-development/
const { createProxyMiddleware } = require('http-proxy-middleware');

var proc_host_vars = {
  "INIT_CWD" : process.env["INIT_CWD"],
  "NODE_ENV" : process.env["NODE_ENV"],
  "REACT_APP_WEBSITE_NAME" : process.env["REACT_APP_WEBSITE_NAME"],
  "REACT_APP_SERVER_PORT" :process.env["REACT_APP_SERVER_PORT"],
  "REACT_APP_WEBSITE_PORT" : process.env["REACT_APP_WEBSITE_PORT"],
}

var api_server_host = proc_host_vars.REACT_APP_WEBSITE_NAME+":"+proc_host_vars.REACT_APP_SERVER_PORT

app.use(
  '/api',
  createProxyMiddleware({
    target: api_server_host,
    changeOrigin: true,
  })
);

// In production we need to pass these values// console.log(api_server_host) in instead of relying on webpack
setup(app, {
  outputPath: resolve(process.cwd(), 'build'),
  publicPath: '/',
});

// get the intended host and port number, use localhost and port 3000 if not provided
const customHost = argv.host || process.env.HOST;
const host = customHost || null; // Let http.Server use its default IPv6/4 host
const prettyHost = customHost || 'localhost';

// use the gzipped bundle
app.get('*.js', (req, res, next) => {
  req.url = req.url + '.gz'; // eslint-disable-line
  res.set('Content-Encoding', 'gzip');
  next();
});

// Start your app.
app.listen(port, host, async err => {
  if (err) {
    return logger.error(err.message);
  }

  // Connect to ngrok in dev mode
  if (ngrok) {
    let url;
    try {
      url = await ngrok.connect(port);
    } catch (e) {
      return logger.error(e);
    }
    logger.appStarted(port, prettyHost, url);
  } else {
    logger.appStarted(port, prettyHost);
  }
});
