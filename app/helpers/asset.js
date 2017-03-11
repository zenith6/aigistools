import urlHelper from './url';
import config from '../config';

function assetHelper(pathname, options) {
  options = options || {};
  options.query = options && 'query' in options && options.query ? options.query : {};
  options.query.v = config.app.version;

  return urlHelper(config.server.asset + pathname, options);
}

module.exports = assetHelper;
