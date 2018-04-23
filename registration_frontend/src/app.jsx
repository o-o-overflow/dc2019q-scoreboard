import React from 'react';
import workerScript from './worker';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      button_disabled: false,
      email: '',
      password: '',
      password_confirmation: '',
      status: '',
    };
    this.hashTimestamp = null;
    this.worker = new Worker(workerScript);
    this.worker.onmessage = (message) => {
      if (message.data.complete) {
        this.register(message.data.nonce);
      } else {
        this.setState({ ...this.state, status: `${this.state.status}.` });
      }
    };
  }

  handleEmailChange = (event) => {
    this.setState({ ...this.state, email: event.target.value });
  }

  handleKeyPress = (event) => {
    if (!this.state.button_disabled && event.key === 'Enter') {
      this.handleRegister();
    }
  }

  handlePasswordChange = (event) => {
    this.setState({ ...this.state, password: event.target.value });
  }

  handlePasswordConfirmationChange = (event) => {
    this.setState({ ...this.state, password_confirmation: event.target.value });
  }

  handleRegister = () => {
    let validation;
    if (this.state.email.length < 6 || this.state.email.length > 320
      || !this.state.email.includes('@') || !this.state.email.includes('.')) {
      validation = 'invalid email';
    } else if (this.state.password.length < 10 || this.state.password.length > 72) {
      validation = 'invalid password';
    } else if (this.state.password !== this.state.password_confirmation) {
      validation = 'password mismatch';
    } else {
      this.hashTimestamp = parseInt(Date.now() / 1000, 10);
      this.setState({
        ...this.state,
        button_disabled: true,
        status: 'computing proof of work',
      });
      this.worker.postMessage({
        prefix: '000c7f',
        value: `${this.state.email}!${this.hashTimestamp}`,
      });
      return;
    }
    this.setState({ ...this.state, status: validation });
  }

  register = (nonce) => {
    this.setState({ ...this.state, status: 'submitting registration' });
    console.log(`registering ${this.state.email} using ${nonce}`);
  }

  render() {
    let status;
    if (this.state.status !== '') {
      status = (<div className="wrapped">Status: {this.state.status}</div>);
    }

    return (
      <div>
        <header>
          <div className="container">
            <h1><a href="http://www.oooverflow.io/">OOO</a> --- DEF CON CTF 2018</h1>
          </div>
        </header>
        <div className="container">
          <h1>Registration</h1>
          <div>
            <label htmlFor="email">Email:
              <input id="email" type="text" onChange={this.handleEmailChange} onKeyPress={this.handleKeyPress} value={this.state.email} />
            </label>
          </div>
          <div>
            <label htmlFor="password">Password:
              <input id="password" placeholder="10 to 72 characters" type="password" onChange={this.handlePasswordChange} onKeyPress={this.handleKeyPress} value={this.state.password} />
            </label>
          </div>
          <div>
            <label htmlFor="password_confirmation">Password Confirmation:
              <input id="password_confirmation" type="password" onChange={this.handlePasswordConfirmationChange} onKeyPress={this.handleKeyPress} value={this.state.password_confirmation} />
            </label>
          </div>
          <div>
            <input className="button" disabled={this.state.button_disabled} onClick={this.handleRegister} type="button" value="Register" />
          </div>
          {status}
        </div>
      </div>
    );
  }
}
export default App;
