'use strict';

import React from 'react';
import Massgame from './lib/views/Massgame';

document.addEventListener('DOMContentLoaded', () => {
  React.render(<Massgame />, document.getElementById('massgame'));
});
