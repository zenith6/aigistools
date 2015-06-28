'use strict';

import EventEmitter from 'wolfy87-eventemitter';
import Message from './Message';
import * as MessageActionTypes from './MessageActionTypes';

import defaultMessageData from '../../data/default_message.json';

export default class MessageActions extends EventEmitter {
  constructor(dispatcher) {
    super();

    this.dispatcher = dispatcher;
  }

  restoreMessage() {
    this.dispatcher.dispatch({
      type: MessageActionTypes.MESSAGE_RESTORING,
    });

    setTimeout(() => {
      let message = this.createDefaultMessage();
      this.dispatcher.dispatch({
        type: MessageActionTypes.MESSAGE_RESTORED,
        message: message,
      });
    });
  }

  updateMessage(message) {
    this.dispatcher.dispatch({
      type: MessageActionTypes.MESSAGE_UPDATING,
      message: message,
    });

    this.messageChangeTimer = setTimeout(() => {
      this.dispatcher.dispatch({
        type: MessageActionTypes.MESSAGE_UPDATED,
        message: message,
      });
    });
  }

  createDefaultMessage() {
    return new Message(defaultMessageData);
  }
}
