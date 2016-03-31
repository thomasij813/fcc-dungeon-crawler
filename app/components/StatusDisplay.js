import React from 'react';

export default function StatusDisplay(props) {
  return (
    <div className="status-display">
      <p>Health: {props.health}</p>
      <p>Weapon: {props.weapon.name}</p>
      <p>Level: {props.level}</p>
    </div>
  )
}
