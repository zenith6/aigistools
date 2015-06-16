'use strict';

import * as components from './components';

export default {
  flame: {
    name: '火属性付与',
    layers: [
      {
        component: components.Flame,
        options: {},
        zIndex: 500
      }
    ]
  },
  portrait: {
    name: 'お通夜',
    layers: [
      {
        component: components.Portrait,
        options: {},
        zIndex: 2800
      },
      {
        component: components.Grayscale,
        options: {},
        zIndex: 2801
      }
    ]
  },
  heaven: {
    name: 'ヘヴン状態',
    layers: [
      {
        component: components.Heaven,
        options: {
          src: 'http://i.imgur.com/avY2MqD.png'
        },
        zIndex: 500
      }
    ]
  },
  forced: {
    name: '強いられてる',
    layers: [
      {
        component: components.Image,
        options: {
          src: 'http://i.imgur.com/BYdzlmS.png',
          fill: true
        },
        zIndex: 2700
      }
    ]
  },
  run: {
    name: '疾走感',
    layers: [
      {
        component: components.Image,
        options: {
          src: 'http://i.imgur.com/Fy9Ibw0.jpg',
          fill: true
        },
        zIndex: 500
      }
    ]
  },
  crystal: {
    name: '魔水晶',
    layers: [
      {
        id: 'text',
        component: components.Crystal,
        options: {},
        zIndex: 2600
      }
    ]
  },
  sofmap: {
    name: 'ソフ○ップ',
    layers: [
      {
        component: components.Image,
        options: {
          src: 'http://i.imgur.com/bH6aXbz.png',
          tiling: true
        },
        zIndex: 500
      }
    ]
  },
  gedou: {
    name: '外道',
    layers: [
      {
        id: 'bg',
        component: components.Image,
        options: {
          src: 'http://i.imgur.com/th8OtsE.png',
          fill: true
        },
        zIndex: 500
      },
      {
        id: 'text',
        component: components.Gedou,
        options: {},
        zIndex: 2400
      }
    ]
  },
  gameover: {
    name: 'ゲームオーバー',
    layers: [
      {
        id: 'text',
        component: components.Gameover,
        options: {},
        zIndex: 2400
      }
    ]
  },
  ad: {
    name: 'DMM広告',
    layers: [
      {
        id: 'bg',
        component: components.Ad,
        options: {
          src: 'http://i.imgur.com/2SAQBCg.png'
        },
        zIndex: 2600
      }
    ]
  }
};
