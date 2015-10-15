import React from 'react';
import MessageEditor from './MessageEditor';
import MessageView from './MessageView';
import ExportPane from './ExportPane';
import {messageActions, messageStore} from '../../services';

export default class Massgame extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      message: null,
      updating: false,
    };

    this.messageChangedHandler = null;
  }

  componentWillMount() {
    this.messageChangedHandler = this.handleMessageChanged.bind(this);
    messageStore.addListener('changed', this.messageChangedHandler);

    messageActions.restoreMessage();
  }

  componentWillUnmount() {
    messageStore.removeListener('changed', this.messageChangedHandler);
  }

  render() {
    let message = this.state.message;
    let updating = this.state.updating;

    let rootClassName = [
      'massgame',
      updating ? 'updating' : '',
    ].join(' ');

    return (
      <div className={rootClassName}>
        <MessageEditor
            data={message}
            onChange={this.handleMessageEditorChange.bind(this)}
          />
        <MessageView key="view" data={message} />
        <ExportPane key="export" data={message} />
      </div>
    );
  }

  handleMessageChanged() {
    this.setState({message: messageStore.currentMessage});
  }

  handleMessageEditorChange(message) {
    messageActions.updateMessage(message);
  }
}
