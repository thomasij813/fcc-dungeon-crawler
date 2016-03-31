import React from 'react';

import * as mapUtils from '../utils/mapUtils'

import Overlay from './Overlay'
import Map from './Map'

export default class Main extends React.Component {
  constructor() {
    super()
    this.state = {
      map: [],
      darkness: true,
      playing: true,
      win: false
    }
  }

  componentWillMount() {
    let map = mapUtils.createMap(100)
    map = mapUtils.cleanMap(map, 3)
    this.setState({
      map: map
    })
  }

  toggleDarkness() {
    this.setState({
      darkness: !this.state.darkness
    })
  }

  loseGame() {
    this.setState({
      playing: false,
    })
  }

  winGame() {
    this.setState({
      playing: false,
      win: true
    })
  }

  render() {
    if (this.state.playing) {
      return (
        <div>
          <Map map={this.state.map}
            darkness={this.state.darkness}
            toggleDarkness={this.toggleDarkness.bind(this)} />
          <Overlay map={this.state.map} darkness={this.state.darkness}
            playing={this.state.playing}
            lose={this.loseGame.bind(this)}
            win={this.winGame.bind(this)}/>
        </div>
      )
    } else if (!this.state.win){
      return <h1 style={{color: 'white'}}>Game Over!</h1>
    } else {
      return <h1 style={{color: 'white'}}>You won!</h1>
    }

  }
}
