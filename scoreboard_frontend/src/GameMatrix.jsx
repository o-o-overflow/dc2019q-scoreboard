import React from 'react';

class GameMatrix extends React.Component {
  header() {
    const theHeaders = this.challenges.map(id => {
      return <th key={id}>{id}</th>;
    });

    return theHeaders;
  }

  solvedRow(solves) {
    const solved = this.challenges.map(id => {
      const isSolved = solves.has(id);
      const theClass = isSolved ? 'solved' : 'not-solved';
      return (
        <td
          className={theClass}
          dangerouslySetInnerHTML={{
            __html: isSolved ? '&#10004;' : '&#10060;',
          }}
        />
      );
    });
    return solved;
  }

  body() {
    // Go through each team in order of score

    return this.props.teamScoreboardOrder.map(team => {
      return (
        <tr key={team.name}>
          <td key={team.name}>{team.name}</td>
          {this.solvedRow(new Set(team.solves))}
        </tr>
      );
    });
  }

  render() {
    this.challenges = [];
    Object.keys(this.props.challenges)
      .filter(cat => cat !== 'speedrun')
      .map(cat => {
        return this.props.challenges[cat].map(chall => {
          return this.challenges.push(chall.id);
        });
      });

    this.challenges.sort();

    return (
      <div>
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSeNZQFep3eFFIAMm2Riz3H8nwqE-gOeEtbKSwxsOUiWuSlSVg/viewform"
          className="feedback-link"
        >
          The OOO requests your FEEDBACK on the game, please fill out this form
        </a>
        <table className="lcars-u-7 solves">
          <thead>
            <tr>
              <th>Team</th>
              {this.header()}
            </tr>
          </thead>
          <tbody>{this.body()}</tbody>
        </table>
      </div>
    );
  }
}

export default GameMatrix;
