import PropTypes from 'prop-types';
import React from 'react';

class ChallengeModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      buttonDisabled: false,
      flag: '',
      status: '',
    };
    this.hashTimestamp = null;
    this.worker = new Worker('worker.js');
    this.worker.onmessage = (message) => {
      if (message.data.complete) {
        this.submit(message.data.nonce);
      } else {
        this.setState({ ...this.state, status: `${this.state.status} .` });
      }
    };
  }

  componentWillUnmount() {
    this.worker.terminate();
  }

  handleFlagChange = (event) => {
    this.setState({ ...this.state, flag: event.target.value });
  }

  handleKeyPress = (event) => {
    if (!this.state.buttonDisabled && event.key === 'Enter') {
      this.handleSubmit();
    }
  }

  handleSubmit = () => {
    let validation;
    if (this.state.flag.length < 1 || this.state.flag.length > 160) {
      validation = 'invalid flag';
    } else {
      this.hashTimestamp = parseInt(Date.now() / 1000, 10);
      this.setState({
        ...this.state,
        buttonDisabled: true,
        status: 'computing proof of work',
      });
      this.worker.postMessage({
        prefix: '00c7f',
        value: `${this.props.challengeId}!${this.state.flag}!${this.props.token}!${this.hashTimestamp}`,
      });
      return;
    }
    this.setState({ ...this.state, status: validation });
  }


  submit = (nonce) => {
    const requestData = {
      challenge_id: this.props.challengeId,
      flag: this.state.flag,
      nonce,
      timestamp: this.hashTimestamp,
      token: this.props.token,
    };
    this.setState({ ...this.state, status: 'submitting flag' });
    fetch(`${process.env.REACT_APP_BACKEND_URL}/submit`, {
      body: JSON.stringify(requestData),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    }).then(response => response.json().then(body => ({ body, status: response.status })))
      .then(({ body, status }) => {
        // if (status === 200) {
        //   this.props.setToken(body.message.token);
        // }
        this.setState({
          ...this.state,
          buttonDisabled: false,
          status: body.message,
        });
      })
      .catch((error) => {
        this.setState({ ...this.state, buttonDisabled: false, status: '(error) see console for info' });
        console.log(error);
      });
  }

  render() {
    let status;
    const buttonText = this.state.buttonDisabled ? 'Please Wait' : 'Submit Flag';
    if (this.state.status !== '') {
      status = (<div className="wrapped">Status: {this.state.status}</div>);
    }

    return (
      <div className="container">
        <button onClick={this.props.onClose}>X</button>
        <h1>Challenge Info</h1>
        <div className="form-group">
          <label htmlFor="flag">Flag<br />
            <input id="flag" onChange={this.handleFlagChange} onKeyPress={this.handleKeyPress} readOnly={this.state.buttonDisabled} type="text" value={this.state.flag} />
          </label>
        </div>
        <div className="form-group">
          <input className="button" disabled={this.state.buttonDisabled} onClick={this.handleSubmit} type="button" value={buttonText} />
        </div>
        {status}
      </div>
    );
  }
}
ChallengeModal.propTypes = {
  challengeId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  token: PropTypes.string.isRequired,
};
export default ChallengeModal;