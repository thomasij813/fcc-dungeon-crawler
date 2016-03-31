import React from 'react';

import Tile from './Tile'

export default function Row(props) {
  let tiles = props.tiles.map((tile, index) => {
    return <Tile y={index} x={props.x} habitable={tile} key={index}/>
  })
  return (
    <g>
      {tiles}
    </g>
  )
}
