'use strict';

import EventEmitter from 'wolfy87-eventemitter';
import * as MessageActionTypes from './MessageActionTypes';

export default class MessageStore extends EventEmitter {
  constructor(dispatcher) {
    super();

    this.currentMessage = null;

    this.registerDispatcher(dispatcher);
  }

  registerDispatcher(dispatcher) {
    this.dispatcherToken = dispatcher.register((action) => {
      switch (action.type) {
        case MessageActionTypes.MESSAGE_RESTORING:
          this.emit('restoring');
          this.emit('changing');
          break;

        case MessageActionTypes.MESSAGE_RESTORED:
          this.currentMessage = action.message;
          this.emit('restored');
          this.emit('changed');
          break;

        case MessageActionTypes.MESSAGE_UPDATING:
          this.emit('changing');
          break;

        case MessageActionTypes.MESSAGE_UPDATED:
          this.currentMessage = action.message;
          this.emit('changed');
          break;
      }
    });
  }
}
