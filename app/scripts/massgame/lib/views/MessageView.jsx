import React from 'react';
import LoadingIndicator from './LoadingIndicator';
import services from '../../services';

export default class MessageView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      hasError: false,
    };
  }

  componentWillReceiveProps(nextProps) {
    let message = nextProps.data;
    let loaded = message && message.loaded;

    this.setState({
      loaded: loaded,
    });
  }

  componentDidUpdate() {
    let message = this.props.data;

    if (this.state.hasError) {
      return;
    }

    if (!this.state.loaded) {
      this.loadResources(message);
      return;
    }

    this.renderMessage(message);
  }

  render() {
    let content;

    if (this.state.hasError) {
      content = <div className="alert alert-danger">Failed to load resources.</div>;
    } else if (this.state.loaded) {
      content = <canvas ref="canvas"></canvas>;
    } else {
      content = <LoadingIndicator />;
    }

    return (
      <div className="message-view">
        {content}
      </div>
    );
  }

  renderMessage(message) {
    let renderer = services.messageRenderer;
    let canvas = this.refs.canvas;
    renderer.render(canvas, message);
  }

  loadResources(message) {
    message.loadResources()
      .catch(() => {
        this.setState({loaded: true, hasError: true});
      })
      .then(() => {
        this.setState({loaded: true, hasError: false});
      });
  }
}
