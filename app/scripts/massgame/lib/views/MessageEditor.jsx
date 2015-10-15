import React from 'react';

export default class MessageEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      enabled: !!props.data,
    };

    this.emitChangeEventTimer = null;
    this.emitChangeEventDelay = 100;
  }

  componentWillReceiveProps(nextProps) {
    let message = nextProps.data;
    let enabled = !!message;
    this.setState({enabled: enabled});

    if (message.text !== this.refs.text.value) {
      this.refs.text.value = message.text;
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextState.enabled !== this.state.enabled;
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

  handleChange() {
    let message = this.props.data;

    if (!message) {
      return;
    }

    if (this.emitChangeEventTimer) {
      clearTimeout(this.emitChangeEventTimer);
    }

    message.text = this.refs.text.value;

    this.emitChangeEventTimer = setTimeout(() => {
      this.props.onChange(message);
    }, this.emitChangeEventDelay);
  }
}

MessageEditor.defaultProps = {
  value: null,
};
