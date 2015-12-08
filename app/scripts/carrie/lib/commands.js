export default {
  r: function () {
    var items = Array.prototype.slice.call(arguments, 0);
    return items[Math.floor(Math.random() * items.length)];
  }
};
