'use strict';

export default class Message {
  constructor(values) {
    this.text = '';
    this.fontFamily = 'monospace';
    this.fontSize = 10;
    this.letterSpace = 1;
    this.dot = null;
    this.background = null;
    this.loaded = false;

    this.origin = {
      x: 0,
      y: 0,
    };

    this.padding = {
      x: 0,
      y: 0,
    };

    this.dotImage = null;
    this.backgroundImage = null;

    Object.keys(values).forEach((key) => {
      this[key] = values[key];
    });
  }

  loadResources() {
    let images = [
      'dot',
      'background',
    ].filter((key) => {
      return this[key] !== null;
    });

    let loaders = images.map((key) => {
      return new Promise((resolve, reject) => {
        let image = new Image();
        image.crossOrigin = 'Anonymous';
        image.onload = resolve;
        image.onerror = reject;
        this[key + 'Image'] = image;
        image.src = this[key];
      });
    });

    return Promise.all(loaders)
      .then(() => {
        this.loaded = true;
      });
  }
}
