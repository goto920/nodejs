import React, { Component } from 'react'
import './Metronome.css';
import BufferLoader from './buffer-loader'
//import click2 from './resources/cowbell-low.wav'
import WAAClock from 'waaclock'

// global variable
window.AudioContext = window.AudioContext || window.webkitAudioContext
var context = new AudioContext() 
var gainNode = context.createGain()

class App extends Component {
  constructor(props){
    super(props)
    this.state = {
      playing: false, 
      count: 0, 
      min_bpm: 40,
      max_bpm: 240,
      bpm: 100, 
      preset: 4,
      numerator: 4,
      denominator: 4,
      swing: false,
      click1: null,
      click2: null,
      click3: null,
      click4: null,
      click5: null,
    }

    this.setState = this.setState.bind(this)
    this.startStop = this.startStop.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handleSelect = this.handleSelect.bind(this)
    this.playClick = this.playClick.bind(this)

    this.presets = [
      {key: 0, value: '2/2', numerator: 2, denominator: 2, swing:false},
      {key: 1, value: '3/4', numerator: 3, denominator: 4, swing: false},
      {key: 2, value: '6/8', numerator: 6, denominator: 8, swing: false}, 
      {key: 3, value: '12/8', 
           numerator: 12, denominator: 8, swing: false}, 
      {key: 4, value:'4/4', numerator: 4, denominator: 4, swing: false},
      {key: 5, value: '8/8', 
            numerator: 8, denominator: 8, swing: false},
      {key: 6, value: '8/8swing', 
           numerator: 12, denominator: 12, swing: true},
      {key: 7, value: '16/16', 
           numerator: 16, denominator: 16, swing: false},
      {key: 8, value: '16/16swing', 
           numerator: 24, denominator: 24, swing: true},
      {key: 9, value: '5/4', numerator: 5, denominator: 4, swing: false},
      {key: 10, value: '10/8', 
           numerator: 10, denominator: 8, swing: false},
      {key: 11, value: '7/4', numerator: 7, denominator: 4, swing: false},
      {key: 12, value: '14/8', numerator: 14, denominator: 8, swing: false},
      {key: 13, value: '7/8', numerator: 7, denominator: 8, swing: false},
      {key: 14, value: '14/16', numerator: 14, denominator: 16, swing: false},
      {key: 15, value: '15/16', numerator: 15, denominator: 16, swing: false},
      {key: 16, value: '17/16', numerator: 17, denominator: 16, swing: false},
    ]

    this.clock = null

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
    this.clock = new WAAClock(context)

  }

  render() {
    const { playing, bpm, min_bpm, max_bpm } = this.state

    const options = this.presets.map(e => {
      return (<option value={e.key} key={e.value}>{e.value}</option>)
    })

    return (
      <div className="metronome">
        <div>
        Beat(presets): <select name="preset" defaultValue={this.state.preset} 
           onChange = {this.handleSelect}>
         {options}
         </select>
        <hr />
        </div>
        <div className="number">
        BPM({min_bpm}--{max_bpm}): <input type="number" name="bpm_number"
           min={min_bpm} max={max_bpm} value={bpm} step="0.1"
         onChange = {this.handleChange} />
        <button onClick={this.startStop}>
          {playing ? 'Stop' : 'Start'}
        </button>
        </div>
        <div className="bpm-slider">
        <input type="range" name="bpm_slider"
          min={min_bpm} max={max_bpm} value={bpm} step="0.1"
          onChange = {this.handleChange} />
        </div>
        <hr />
        Drummer Options(not implemented yet)<br />
        <div className="number">
        Swing(normal 0.5): <input type="number" name="swing" 
        min="0.0" max="1.0" value="0.5" step="0.1" />
        </div>
       <div className="number">
        Incr (bpm) <input type="number" name="increment"
           min="0" max="10" value="2"
         onChange = {this.handleChange} />
         (/bars) <select name="bars" onChange = {this.handleSelect}>
         <option value="1">1</option>
         <option value="2">2</option>
         <option value="4">4</option>
         <option value="8">8</option>
         <option value="12">12</option>
         <option value="16">16</option>
         </select>
         </div>
        <div className="number">
        Rnd Rest (bars) <select name="rests" onChange = {this.handleSelect}>
         <option value="1">1</option>
         <option value="2">2</option>
         <option value="4">4</option>
         <option value="8">8</option>
         <option value="12">12</option>
         <option value="16">16</option>
         </select>
         &nbsp; (prob) <input type="number" name="prob"
           min="0.0" max="1.0" value="0.1" step="0.1"
         onChange = {this.handleChange} />
        </div>
      </div>
    )
  } // end render()

  startStop(event) {

    if(this.state.playing) {

      this.clock.stop()
      if (this.tickEvent) {
        this.tickEvent.clear()
        this.tickEvent = null
      }
      this.setState({count: 0, playing: false})

    } else {
      this.clock.start()
      let num = this.state.bpm*(this.state.denominator/4)
      this.setState({playing: true})
      this.tickEvent = this.clock.callbackAtTime(
         this.playClick,
        context.currentTime
      ).tolerance({early: 0.007, late: 0.007})
       .repeat(60.0/num) 

    }

  } // end startStop()

  playClick() {
     const {count,numerator,swing} = this.state

     if(count % numerator === 0){
        let source = context.createBufferSource()
        source.buffer = this.state.click2
        source.connect(gainNode)
        gainNode.connect(context.destination)
        gainNode.gain.value = 1
        source.start(0)
     } else {
       var volume
       if (swing && (count % 3 === 1)) {
         volume = 0.0
        console.log(count + ' mute')
       } else {
         volume = 0.7
        console.log(count + ' low')
       }
       let source = context.createBufferSource()
       source.buffer = this.state.click3
       source.connect(gainNode)
       gainNode.connect(context.destination)
       gainNode.gain.value = volume
       source.start(0)
     }

     let newCount = (count + 1) % numerator
     this.setState({count: newCount})
  }

  handleChange(event) {
    if (event.target.name === 'bpm_slider' 
        || event.target.name === 'bpm_number'){ 

  
      const bpm = event.target.value
      if(this.state.playing) {

         this.clock.stop()
         this.tickEvent.clear()
         this.tickEvent = null
         this.clock.start()
 
         let clickbpm = event.target.value*(this.state.denominator/4)
         this.tickEvent = this.clock.callbackAtTime(
           this.playClick,
           context.currentTime
         ).repeat(60/clickbpm) 
      } 

      this.setState({bpm: bpm})
    }


  } // end handleChange()

  handleSelect(event) {

    if (event.target.name !== 'preset') return

     console.log('preset: ' + event.target.value)
     const preset = this.presets[event.target.value]
     console.log(
     preset.key + ' ' 
     + preset.value + ' ' + preset.numerator + ' ' 
     + preset.denominator + ' ' + preset.swing)
      this.setState({
        preset: preset.value,
        numerator: preset.numerator,
        denominator: preset.denominator,
        swing: preset.swing
      })

    if (this.state.playing) {
      this.startStop(null)
    } // if playing

  } // end func

} // end App

export default App;
