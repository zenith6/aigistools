import React from 'react';

export default class LoadingIndicator extends React.Component {
  render() {
    return (
      <div className="loading-indicator">
        <span className="spinner">Loading...</span>
      </div>
    );
  }
}
