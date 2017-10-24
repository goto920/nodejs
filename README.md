# nodejs

Programming practice for nodejs and react application

1) metronome -- simple metronome using React and Web Audio API

try at http://kmgoto.jp/nodejs/metronome/

Time is not very accurate used WAAClock repeat function only.

      this.clock.start()
      let num = this.state.bpm*(this.state.denominator/4)
      this.setState({playing: true})
      this.tickEvent = this.clock.callbackAtTime(
         this.playClick,
        context.currentTime
      ).repeat(60/num) 


