import React from 'react';

import Row from './Row'

export default function Map(props) {
  function handleDarknessToggle(e) {
    e.preventDefault()
    props.toggleDarkness()
  }

  let length = props.map[0].length
  let rows = props.map.map((tilesArray, index) => {
    return <Row tiles={tilesArray} x={index} key={index}/>
  })

  return (
    <div>
      <svg id="map" width={length * 5} height={length * 5}
        style={props.darkness ? {clipPath: 'url(#playerClip)'} : null}>
          {rows}
      </svg>
      <button style={{display:'block'}}
        onClick={handleDarknessToggle}>
          Toggle Darkness
      </button>
    </div>
  )
}
