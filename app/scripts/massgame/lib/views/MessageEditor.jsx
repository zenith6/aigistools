'use strict';

import React from 'react';
import Message from '../message/Message';

export default class MessageEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      enabled: !!props.data,
    };

    this.changeEmitTimer = null;
    this.changeEmitDelay = 100;
  }

  componentWillReceiveProps(nextProps) {
    let message = nextProps.data;
    let enabled = !!message;
    this.setState({enabled: enabled});

    if (message) {
      this.refs.text.getDOMNode().value = message.text;
    }
  }

  render() {
    let enabled = this.state.enabled;
    let message = this.props.data;
    let text = message ? message.text : '';

    return (
      <form
          className="form form--message-edit"
          onSubmit={this.handleSubmit.bind(this)}
        >
        <div className="form-group">
          <input
              type="text"
              ref="text"
              className="form-control"
              defaultValue={text}
              placeholder="メッセージ"
              disabled={!enabled}
              onChange={this.handleChange.bind(this)}
            />
        </div>
      </form>
    );
  }

  handleSubmit(event) {
    event.preventDefault();
  }

  handleChange(event) {
    let message = this.props.data;

    if (!message) {
      return;
    }

    if (this.changeEmitTimer) {
      clearTimeout(this.changeEmitTimer);
    }

    message.text = this.refs.text.getDOMNode().value;

    this.changeEmitTimer = setTimeout(() => {
      this.props.onChange(message);
    }, this.changeEmitDelay);
  }
}

MessageEditor.defaultProps = {
  value: null,
};
