import React, { Component } from 'react'
import './Metronome.css';
import BufferLoader from './buffer-loader'
//import click2 from './resources/cowbell-low.wav'
import WAAClock from 'waaclock'

// global variable
window.AudioContext = window.AudioContext || window.webkitAudioContext
var context = new AudioContext() 
var clock = new WAAClock(context, {toleranceEarly: 0.01, toleranceLate: 0.01})
var gainNode = context.createGain()
var version = '2017112000'

clock.start()

class App extends Component {
  constructor(props){
    super(props)
    this.state = {
      timer: 0,
      rest: 0,
      playing: false, 
      count: 0, 
      min_bpm: 40,
      max_bpm: 240,
      bpm: 100, 
      increment: 0,
      perBars: 0,
      barCount: 0,
      muteBars: 0,
      muteProb: 0.0,
      muteCount: 0,
      mute: false,
      preset: 5, // default 4/4
      numerator: 4,
      denominator: 4,
      swing: false,
      swingVal: 2.0, // 0(min),1,1.5(straight),2(full),3(max)
      click1: null,
      click2: null,
      click3: null,
      click4: null,
      click5: null,
    }

    this.setState = this.setState.bind(this)
    this.startStop = this.startStop.bind(this)
    this.changeTempo = this.changeTempo.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handleSelect = this.handleSelect.bind(this)
    this.playClick = this.playClick.bind(this)

    this.presets = [
      {key: 0, value: '2/2', numerator: 2, denominator: 2, swing: false},
      {key: 1, value: '3/4', numerator: 3, denominator: 4, swing: false},
      {key: 2, value: '6/8', numerator: 6, denominator: 8, swing: false}, 
      {key: 3, value: '6/8swing', numerator: 6, denominator: 8, 
        swing: true, swingVal: 2.0}, 
      {key: 4, value: '12/8', 
           numerator: 12, denominator: 8, swing: false}, 
      {key: 5, value:'4/4', numerator: 4, denominator: 4, swing: false},
      {key: 6, value: '8/8', 
            numerator: 8, denominator: 8, swing: false},
      {key: 7, value: '8/8swing', 
           numerator: 8, denominator: 8, swing: true, swingVal: 2.0},
      {key: 8, value: '16/16', 
           numerator: 16, denominator: 16, swing: false},
      {key: 9, value: '16/16swing', 
           numerator: 16, denominator: 16, swing: true, swingVal: 2.0},
      {key: 10, value: '5/4', numerator: 5, denominator: 4, swing: false},
      {key: 11, value: '10/8', 
           numerator: 10, denominator: 8, swing: 1.5},
      {key: 12, value: '7/4', numerator: 7, denominator: 4, swing: false},
      {key: 13, value: '14/8', numerator: 14, denominator: 8, swing: false},
      {key: 14, value: '7/8', numerator: 7, denominator: 8, swing: false},
      {key: 15, value: '14/16', numerator: 14, denominator: 16, swing: false},
      {key: 16, value: '15/16', numerator: 15, denominator: 16, swing: false},
      {key: 17, value: '17/16', numerator: 17, denominator: 16, swing: false},
    ]

  } // end constructor

  componentDidMount() {

    let bufferLoader = new BufferLoader(
      context,
      [
          './resources/cowbell-higher.wav',
          './resources/cowbell-high.wav',
          './resources/cowbell-mid.wav',
          './resources/cowbell-low.wav',
          './resources/cowbell-lower.wav',
      ],
      function (bufferList) {
         this.setState({click1: bufferList[0]})
         this.setState({click2: bufferList[1]})
         this.setState({click3: bufferList[2]})
         this.setState({click4: bufferList[3]})
         this.setState({click5: bufferList[4]})
         console.log('BufferLoader loading finished')
      }.bind(this)
    )

    bufferLoader.load()

  }

  render() {
    const { playing, bpm, min_bpm, max_bpm } = this.state

    const options = this.presets.map(e => {
      return (<option value={e.key} key={e.value}>{e.value}</option>)
    })

    return (
      <div className="metronome">
      Version: {version}
      <hr />
        <div className="number"> 
         Beat: <select name="preset" defaultValue={this.state.preset} 
           onChange = {this.handleSelect}>
         {options}
         </select>
        &nbsp; BPM({min_bpm}--{max_bpm}): <input type="number" name="bpm_number"
           min={min_bpm} max={max_bpm} value={bpm} step="0.1"
         onChange = {this.handleChange} />
        &nbsp;&nbsp; <button name="startStop" onClick={this.startStop}>
          {playing ? 'Stop' : 'Start'}
        </button>
        &nbsp;&nbsp; Timer: <input type="number" name="timer" 
        min="0" max="180" value={this.state.timer} step="1" 
          onChange={this.handleChange} /> {this.state.rest}
        </div>
        <hr />
        Advanced Options<br />
        <div className="number">
        Swing: <input type="number" name="swing" 
        min="0.0" max="3.0" value={this.state.swingVal} step="0.1" 
          onChange={this.handleChange} />
        (0--1.5(straight),2.0(full)--3)
        </div>
       <div className="number">
        Increment: bpm<input type="number" name="increment"
           min="0" max="10" value={this.state.increment}
         onChange = {this.handleChange} />
         /bars <select name="perBars" defaultValue={this.state.perBars}
           onChange={this.handleSelect}>
         <option value="0">0</option>
         <option value="1">1</option>
         <option value="2">2</option>
         <option value="4">4</option>
         <option value="8">8</option>
         <option value="12">12</option>
         <option value="16">16</option>
         </select>
         </div>
        <div className="number">
        Mute: <select name="muteBars" 
           defaultValue={this.state.muteBars} onChange={this.handleSelect}>
         <option value="0">0</option>
         <option value="1">1</option>
         <option value="2">2</option>
         <option value="4">4</option>
         <option value="8">8</option>
         <option value="12">12</option>
         <option value="16">16</option>
         </select> bars at prob <input type="number" name="muteProb"
           min="0.0" max="1.0" value={this.state.muteProb} step="0.1"
         onChange={this.handleChange} />
        </div>
      <hr />
      <div>
      Set List: (TBD)
      </div>
      </div>
    )
  } // end render()

  changeTempo(newBpm, denominator){
      if(this.state.playing) {
        // clock.stop()

        if(this.tickEvent) {
           this.tickEvent.clear()
           this.tickEvent = null
        }
        if(this.oddEvent) {
           this.oddEvent.clear()
           this.oddEvent = null
        }
        if(this.evenEvent) {
           this.evenEvent.clear()
           this.evenEvent = null
        }
        this.setState({count: 0})

        // clock.start()
 
        let clickPmin = newBpm*denominator/4

        if(this.state.swing){
          var currentTime = context.currentTime
        // even
           this.evenEvent = clock.callbackAtTime(
           currentTime
          ).repeat(60.0/clickPmin*2) 
        // odd
          this.oddEvent = clock.callbackAtTime(
            this.playClick,
            currentTime + 60.0/clickPmin*2*this.state.swingVal/3.0
          ).repeat(60.0/clickPmin*2) 
        } else {
         this.tickEvent = clock.callbackAtTime(
           this.playClick,
           context.currentTime
         ).repeat(60.0/clickPmin) 
        }
      }
      return
  }


  startStop() {

    if (this.state.playing){
      // clock.stop()
      if (this.tickEvent) {
        this.tickEvent.clear()
        this.tickEvent = null
      }
      if (this.oddEvent){
        this.oddEvent.clear()
        this.oddEvent = null
      }
      if (this.evenEvent){
        this.evenEvent.clear()
        this.evenEvent = null
      }
      this.setState({count: 0, playing: false})
    } else {
      // clock.start()
      let clickPmin = this.state.bpm*(this.state.denominator/4)
      this.setState({count: 0, playing: true})

      if (this.state.swing) {
        var currentTime = context.currentTime
        // even
        this.evenEvent = clock.callbackAtTime(
          this.playClick,
          currentTime
        ).repeat(60.0/clickPmin*2) 
        // odd
        this.oddEvent = clock.callbackAtTime(
          this.playClick,
          currentTime + 60.0/clickPmin*2*this.state.swingVal/3.0
        ).repeat(60.0/clickPmin*2) 

      } else {
        this.tickEvent = clock.callbackAtTime(
          this.playClick,
          context.currentTime
        ).repeat(60.0/clickPmin) 
      }

      if (this.state.timer > 0){
//       console.log('timer set')

         clock.callbackAtTime(function() {
           let rest = this.state.rest - 1
           this.setState({rest: rest})
         }.bind(this),1).repeat(1)

         clock.setTimeout(function() {
           // console.log('timer expired')
           // clock.stop()
           if (this.tickEvent) {
            this.tickEvent.clear()
            this.tickEvent = null
           }
           this.setState({count: 0, playing: false, rest: this.state.timer})
         }.bind(this), this.state.timer)
      }

    }
    return

  } // end startStop()

  playClick() {
     const {count,numerator,
           swing,bpm,increment,barCount,perBars} = this.state

     if(perBars > 0 && count === 0 && barCount > 0
       && (barCount % perBars) === 0){
       let newBpm = bpm + increment
       this.setState({bpm: newBpm})
       console.log('bpm up to ' + newBpm + ' ' + barCount)

       if (swing){ 
        if(this.evenEvent && this.oddEvent)
         clock.timeStretch(context.currentTime,
          [this.evenEvent,this.oddEvent], bpm/newBpm)
       } else {
         if(this.tickEvent)
           clock.timeStretch(context.currentTime,
            [this.tickEvent], bpm/newBpm)
       }
     }

     var volume = 1.0
     let mute = 1.0

     if (this.state.muteBars > 0 && this.state.muteProb > 0 && count === 0){
/*
       console.log('check mute(muteCount, bars): ' 
          + this.state.muteCount + ' ' 
          + this.state.muteBars)
*/
       if (this.state.muteCount === this.state.muteBars){
         console.log('mute off')
         this.setState({mute: false, muteCount: 0})
       } else {
         let rand = Math.random()
//         console.log('random: ' + rand + ' prob ' + this.state.muteProb)
         if (this.state.mute){ 
//           console.log('mute cont')
           this.setState({muteCount: this.state.muteCount+1})
         } else if(rand < parseFloat(this.state.muteProb)){
//           console.log('mute on')
           this.setState({mute: true, muteCount: 1})
         }
       }
     }

     if (this.state.mute) mute = 0.0

     let source = context.createBufferSource()
     let newBarCount = barCount
     if(count % numerator === 0){
        source.buffer = this.state.click2
        volume = 1.0*mute
     } else {
        source.buffer = this.state.click3
        volume = 0.7*mute
        if ((count + 1) % numerator === 0){ 
           newBarCount++
           this.setState({barCount: newBarCount})
        }
     }

     source.connect(gainNode)
     gainNode.connect(context.destination)
     gainNode.gain.value = volume
     source.start(0)

     let newCount = (count+1) % numerator
     this.setState({count: newCount})

  }

  handleChange(event) {

/*
    if (event.target.name === 'bpm_slider' 
        || event.target.name === 'bpm_number'){ 
*/
    if (event.target.name === 'bpm_number'){ 
      console.log('bpm change')
      let currentBpm = this.state.bpm
      let newBpm = parseFloat(event.target.value,10)
      this.setState({bpm: newBpm})
      if (this.state.swing){ 
         if (this.evenEvent && this.oddEvent)
         clock.timeStretch(context.currentTime,
          [this.evenEvent,this.oddEvent], currentBpm/newBpm)
      } else {
         if (this.tickEvent) clock.timeStretch(context.currentTime,
          [this.tickEvent], currentBpm/newBpm)
      }
    }

    if (event.target.name === 'swing'){ 
      this.setState({swingVal: event.target.value})
      if(this.state.playig) this.startStop()
    }

    if (event.target.name === 'increment') 
        this.setState({increment: parseInt(event.target.value,10)})

    if (event.target.name === 'muteProb') 
        this.setState({muteProb: parseFloat(event.target.value,10)})

    if (event.target.name === 'timer'){ 
        let rest = parseInt(event.target.value,10)
        this.setState({timer: rest, rest: rest})
    }

  } // end handleChange()

  handleSelect(event) {

   if (event.target.name === 'preset') {
     console.log('preset: ' + event.target.value)
     const preset = this.presets[event.target.value]
     console.log(
     preset.key + ' ' 
     + preset.value + ' ' + preset.numerator + ' ' 
     + preset.denominator + ' ' + preset.swing + ' ' + preset.swingVal)
      this.setState({
        count: 0,
        preset: preset.value,
        numerator: preset.numerator,
        denominator: preset.denominator,
        swing: preset.swing,
        swingVal: preset.swingVal
      })
      if (this.state.playing) this.startStop() 
    }

    if (event.target.name === 'perBars') 
        this.setState({perBars: parseInt(event.target.value,10)})

    if (event.target.name === 'muteBars') 
        this.setState({muteBars: parseInt(event.target.value,10)})

  } // end func

} // end App

export default App;
