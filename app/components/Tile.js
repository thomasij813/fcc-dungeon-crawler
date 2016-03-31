import React from 'react';

export default function Tile(props) {
  function evaluateFill(habitable) {
    return habitable ? 'gainsboro' : 'darkslategray'
  }

  return (
    <rect
      x={props.x * 5} y={props.y * 5}
      height="5" width="5"
      fill={evaluateFill(props.habitable)}>
    </rect>
  )
}
