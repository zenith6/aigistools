import React from 'react';
import ReactDOM from 'react-dom';
import Massgame from './lib/views/Massgame';

document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(<Massgame />, document.getElementById('massgame'));
});
