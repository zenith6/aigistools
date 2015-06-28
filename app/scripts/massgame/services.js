'use strict';

import MessageActions from './lib/message/MessageActions';
import MessageDispatcher from './lib/message/MessageDispatcher';
import MessageRenderer from './lib/message/MessageRenderer';
import MessageStore from './lib/message/MessageStore';

class ServiceContainer {
  constructor() {
    this.services = {};
  }

  get messageDispatcher() {
    return this.services['messageDispatcher'] ||
      (this.services['messageDispatcher'] = new MessageDispatcher());
  }

  get messageActions() {
    return this.services['messageActions'] ||
      (this.services['messageActions'] = new MessageActions(this.messageDispatcher));
  }

  get messageStore() {
    return this.services['messageStore'] ||
      (this.services['messageStore'] = new MessageStore(this.messageDispatcher));
  }

  get messageRenderer() {
    return this.services['messageRenderer'] ||
      (this.services['messageRenderer'] = new MessageRenderer());
  }
}

export default new ServiceContainer();
