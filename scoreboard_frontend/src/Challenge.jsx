import PropTypes from 'prop-types';
import React from 'react';

function Challenge(props) {
  const { tags, points, solveCount, title } = props;

  let className = 'menu-header';

  let status;
  if (solveCount > 1) {
    status = `(Completed by ${solveCount} cadets)`;
  } else if (solveCount === 1) {
    status = '(Completed by 1 cadet)';
  } else {
    status = '(Be the first)';
  }

  let onClick = null;
  let menuClasses = 'menu-item';
  onClick = () => props.onClick(props);
  menuClasses += ' logged-in';
  let point_display = <div className="menu-points">{points} pts</div>;
  if (props.isSpeedrun) {
    point_display = <span />;
  }

  return (
    <div
      className={`lcars-element lcars-u-3-2 rounded ${menuClasses}`}
      onClick={onClick}
      role="presentation"
    >
      {point_display}
      <div className="menu-lower">
        <h3 className={className}>{title}</h3>
        <div className="menu-box">
          <div className="menu-text">{tags}</div>
          <div className="menu-text">{status}</div>
        </div>
      </div>
    </div>
  );
}
Challenge.propTypes = {
  onClick: PropTypes.func.isRequired,
  points: PropTypes.number.isRequired,
  solveCount: PropTypes.number.isRequired,
  tags: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  isSpeedrun: PropTypes.bool.isRequired,
};
export default Challenge;
