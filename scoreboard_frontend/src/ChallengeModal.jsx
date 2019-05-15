import PropTypes from 'prop-types';
import React from 'react';
import showdown from 'showdown';

class ChallengeModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      description: 'Loading...',
    };
  }

  componentDidMount() {
    this.loadData();
  }

  loadData = () => {
    fetch('final_challenges.json', { method: 'GET' })
      .then(response =>
        response.json().then(body => ({ body, status: response.status }))
      )
      .then(({ body, status }) => {
        const converter = new showdown.Converter({
          literalMidWordUnderscores: true,
          simplifiedAutoLink: true,
        });
        const description = converter.makeHtml(body[this.props.challengeId]['description']);
        this.setState({ ...this.state, description });
      })
  };

  render() {
    return (
      <div className="container">
        <button onClick={this.props.onClose}>X</button>
        <h1>{this.props.challengeTitle}</h1>
        <div dangerouslySetInnerHTML={{ __html: this.state.description }} />
      </div>
    );
  }
}
ChallengeModal.propTypes = {
  challengeId: PropTypes.string.isRequired,
  challengeTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSolve: PropTypes.func.isRequired,
  solved: PropTypes.bool.isRequired,
  token: PropTypes.string.isRequired,
};
export default ChallengeModal;
