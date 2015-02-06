function formatTime(time, scale) {
  scale = scale === undefined ? 2 : scale;
  time = (time === Infinity || time === -Infinity) ? '∞' : (time / 1000).toFixed(scale);
  return time + '秒';
}

module.exports = formatTime;
