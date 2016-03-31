import React from 'react';

export default function Sprite(props) {
  return (
    <rect x={props.position[0] * 5} y={props.position[1] * 5}
      height="5" width="5"
      className={props.className || ''}/>
  )
}
