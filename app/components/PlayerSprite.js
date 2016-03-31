import React from 'react';

import Sprite from './Sprite'

export default class PlayerSprite extends React.Component {
  componentDidMount() {
    window.addEventListener('keydown', this.props.handleKeyPress)
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.props.handleKeyPress)
  }

  render() {
    return <Sprite position={this.props.position} fill='blue' className='player'/>
  }

}
