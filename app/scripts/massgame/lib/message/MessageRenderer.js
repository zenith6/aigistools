'use strict';

export default class MessageRenderer {
  constructor() {
    this.mask = document.createElement('canvas');
  }

  render(target, message) {
    let text = message.text;
    let fontFamily = message.fontFamily;
    let fontSize = message.fontSize;
    let letterSpace = message.letterSpace;

    let dot = message.dotImage;
    let dw = dot.width, dh = dot.height;

    let chars = text.split(/\B/);

    let mask = this.mask;
    let mCtx = mask.getContext('2d');
    mCtx.font = '' + fontSize + 'px ' + fontFamily;

    let mw = chars.reduce(function (w, c) {
      return w + mCtx.measureText(c).width + letterSpace;
    }, 0);
    let mh = fontSize;
    mask.width = mw;
    mask.height = mh;

    mCtx.fillStyle = 'rgb(0, 0, 0)';
    mCtx.fillRect(0, 0, mw, mh);

    mCtx.strokeStyle = 'rgb(255, 255, 255)';
    mCtx.fillStyle = 'rgb(255, 255, 255)';
    mCtx.font = '' + fontSize + 'px ' + fontFamily;
    mCtx.textAlign = 'left';
    mCtx.textBaseline = 'top';
    chars.reduce(function (x, char) {
      mCtx.fillText(char, x, 0);
      return x + mCtx.measureText(char).width + 1;
    }, 0);

    let bg = message.backgroundImage;
    let bgw = bg.width;
    let bgh = bg.height;
    let pad = message.padding;
    let vw = Math.max(bgw, dw * mw + pad.x * 2);
    let vh = Math.max(bgh, dh * mh + pad.y * 2);
    target.width = vw;
    target.height = vh;

    let vCtx = target.getContext('2d');

    for (let y = 0; y < vh; y += bgh) {
      for (let x = 0; x < vw; x += bgw) {
        vCtx.drawImage(bg, x, y);
      }
    }

    if (chars.length === 0) {
      return;
    }

    let idata = mCtx.getImageData(0, 0, mw, mh).data;
    let bx = (vw - mw * dw) / 2 + message.origin.x;
    let by = (vh - mh * dh) / 2 + message.origin.y;
    for (let y = 0; y < mh; y++) {
      for (let x = 0; x < mw; x++) {
        let o = 4 * mw * y + 4 * x;
        let r = idata[o];
        let g = idata[o + 1];
        let b = idata[o + 2];
        if ((r + g + b) / 3 & 0x80) {
          vCtx.drawImage(dot, bx + dw * x, by + dh * y);
        }
      }
    }
  }
}
