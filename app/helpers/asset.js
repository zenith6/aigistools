import urlHelper from './url';
import config from '../config';

function assetHelper(pathname, options) {
  return urlHelper(config.server.asset + pathname, options);
}

module.exports = assetHelper;
