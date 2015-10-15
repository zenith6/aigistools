import React from 'react';
import {messageRenderer} from '../../services';

export default class ExportPane extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      enabled: !!props.data,
    };

    this.downloadFileName = 'massgame.png';
    this.contentType = 'image/png';
  }

  componentWillReceiveProps(nextProps) {
    let message = nextProps.data;
    this.setState({enabled: !!message});
  }

  render() {
    let enabled = this.state.enabled;

    return (
      <form
          className="form form--export"
          onSubmit={this.handleSubmit.bind(this)}
        >
        <div className="form-group">
          <button
              ref="download"
              type="submit"
              className='btn btn-block btn-default btn-lg'
              disabled={!enabled}
            >
            <i className="fa fa-download"></i> ダウンロード
          </button>
        </div>
      </form>
    );
  }

  handleSubmit(event) {
    event.preventDefault();

    if (!this.state.enabled) {
      return;
    }

    try {
      let message = this.props.data;
      this.download(message, messageRenderer);
    } catch (error) {
      window.alert('Failed to download operation. ' + error);
    }
  }

  download(message, renderer) {
    let canvas = document.createElement('canvas');
    renderer.render(canvas, message);

    let dataUrl = canvas.toDataURL('image/png');
    let link = document.createElement('a');

    if ('download' in link) {
      link.href = dataUrl;
      link.download = this.downloadFileName;

      var click = document.createEvent('MouseEvents');
      click.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
      link.dispatchEvent(click);
    } else {
      var win = window.open('about:blank', '_blank');
      let doc = win.document;
      var content = `<!DOCTYPE html><html><body>画像を右クリックして保存して下さい。<br />
        <img src="${dataUrl}" /></body></html>`;
      doc.open();
      doc.write(content);
      doc.close();
    }
  }
}
