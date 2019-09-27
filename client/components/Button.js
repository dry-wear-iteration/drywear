import React from 'react';

function Button(props) {
    return (
      <button
        className="confirmButton"
        type="button"
        onClick={() => props.onClick(props.username, props.password)}
      >
        {props.title}
      </button>
    )
  }
  
  export default Button;
