import React, { Component } from 'react'
import './Metronome.css';
import BufferLoader from './buffer-loader'
//import click2 from './resources/cowbell-low.wav'
import WAAClock from 'waaclock'

// global variable
window.AudioContext = window.AudioContext || window.webkitAudioContext
var context = new AudioContext() 
var clock = new WAAClock(context)
var gainNode = context.createGain()
var version = '2017112900'
var early = 0.1
var late = 1.0

clock.start()

class App extends Component {
  constructor(props){
    super(props)
    this.state = {
      timer: 0,
      rest: 0,
      playing: false, 
      voice: false,
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
      triplet: false,
      swing: false,
      swingVal: 1.5, // 0(min),1,1.5(straight),2(full),3(max)
      click1: null,
      click2: null,
      click3: null,
      click4: null,
      click5: null,
      voiceOne: null,
      voiceTwo: null,
      voiceThree: null,
      voiceFour: null,
      voiceFive: null,
      voiceSix: null,
      voiceSeven: null
    }

    this.setState = this.setState.bind(this)
    this.startStop = this.startStop.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handleSelect = this.handleSelect.bind(this)
    this.playClick = this.playClick.bind(this)
    this.nextTick = this.nextTick.bind(this)
    this.presets = [
      {key: 0, value: '2/2', triplet: false, numerator: 2, denominator: 2, 
         swing: false, swingVal: 1.5},
      {key: 1, value: '3/4', triplet: false, numerator: 3, denominator: 4, 
         swing: false, swingVal: 1.5},
      {key: 2, value: '6/8', triplet: false, numerator: 6, denominator: 8, 
         swing: false, swingVal: 1.5},
      {key: 3, value: '6/8swing', triplet: false, numerator: 6, denominator: 8, 
        swing: true, swingVal: 2.0}, 
      {key: 4, value: '12/8', triplet: true,
           numerator: 12, denominator: 8, swing: false, swingVal: 1.5}, 
      {key: 5, value:'4/4', triplet: false, numerator: 4, denominator: 4, 
           swing: false, swingVal: 1.5},
      {key: 6, value: '8/8', triplet: false, 
            numerator: 8, denominator: 8, swing: false, swingVal: 1.5},
      {key: 7, value: '8/8swing', triplet: false,
           numerator: 8, denominator: 8, swing: true, swingVal: 2.0},
      {key: 8, value: '16/16', triplet: false,
           numerator: 16, denominator: 16, swing: false, swingVal: 1.5},
      {key: 9, value: '16/16swing', triplet: false,
           numerator: 16, denominator: 16, swing: true, swingVal: 2.0},
      {key: 10, value: '5/4', triplet: false, numerator: 5, denominator: 4, 
           swing: false, swingVal: 1.5},
      {key: 11, value: '10/8', triplet: false, numerator: 10, denominator: 8, 
           swing: false, swingVal: 1.5},
      {key: 12, value: '7/4', triplet: false, numerator: 7, denominator: 4, 
           swing: false, swingVal: 1.5},
      {key: 13, value: '14/8', triplet: false, numerator: 14, denominator: 8,
           swing: false, swingVal: 1.5},
      {key: 14, value: '7/8', triplet: false, numerator: 7, denominator: 8,
           swing: false, swingVal: 1.5},
      {key: 15, value: '14/16', triplet: false, numerator: 14, denominator: 16,
           swing: false, swingVal: 1.5},
      {key: 16, value: '15/16', triplet: false, numerator: 15, denominator: 16,
           swing: false, swingVal: 1.5},
      {key: 17, value: '17/16', triplet: false, numerator: 17, denominator: 16,
           swing: false, swingVal: 1.5},
    ]

    this.tickEvents = []
    this.count = 0
    this.barCount = 0
 

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
          './resources/one-norm.wav',
          './resources/two-9.wav',
          './resources/three-6.wav',
          './resources/four-6.wav',
          './resources/five-6.wav',
          './resources/six-6.wav',
          './resources/seven-6.wav'
      ],
      function (bufferList) {
         this.setState({click1: bufferList[0]})
         this.setState({click2: bufferList[1]})
         this.setState({click3: bufferList[2]})
         this.setState({click4: bufferList[3]})
         this.setState({click5: bufferList[4]})
         this.setState({voiceOne: bufferList[5]})
         this.setState({voiceTwo: bufferList[6]})
         this.setState({voiceThree: bufferList[7]})
         this.setState({voiceFour: bufferList[8]})
         this.setState({voiceFive: bufferList[9]})
         this.setState({voiceSix: bufferList[10]})
         this.setState({voiceSeven: bufferList[11]})
         // console.log('BufferLoader loading finished')
      }.bind(this)
    )

    bufferLoader.load()

  }

  render() {
    const {voice,playing, bpm, min_bpm, max_bpm } = this.state

    const options = this.presets.map(e => {
      return (<option value={e.key} key={e.value}>{e.value}</option>)
    })

    return (
      <div className="metronome">
      Version: {version}
      <hr />
        <div className="number"> 
         Preset Beat: <select name="preset" defaultValue={this.state.preset} 
           onChange = {this.handleSelect}>
         {options}
         </select>
          &nbsp;voice: <button name="voice" onClick={this.handleChange}>
          {voice ? 'Off' : 'On'}</button><br />
        BPM({min_bpm}-{max_bpm},0.1step): 
        <input type="number" name="bpm_number"
           min={min_bpm} max={max_bpm} value={bpm} step="0.1"
         onChange = {this.handleChange} /><br />
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
        (0,1.5(str),2.0(swg),3)
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
      Additional feature (thinking..)<br />
      Set List, Tempo Tap, Sound variation
      </div>
      </div>
    )
  } // end render()

  startStop(event) {

//    console.log('event target name: ' + event.target.name)

    if (event.target.name === 'stop'){
      if (this.state.playing) {
        this.setState({playing: false})
        for (let beat=0; beat < this.tickEvents.length; beat++)
          this.tickEvents[beat].clear() 
      }
      this.count = 0
      if(this.timer) {
           this.timer.clear()
           this.timeout.clear()
      }
      return
    } // stop

    if (event.target.name === 'restart' && this.state.playing){

      for (let beat=0; beat < this.tickEvents.length; beat++)
          this.tickEvents[beat].clear() 

      this.count = 0
      this.startTime = context.currentTime
      let clickPmin = this.state.bpm*(this.state.denominator/4)

      for(let beat = 0; beat < this.state.numerator; beat++){
          let event = clock.callbackAtTime(
            function(event) {this.playClick(event.deadline)}.bind(this),
            this.nextTick(beat)
          ).repeat((this.state.numerator*60.0)/clickPmin) // parBar 
           .tolerance({early: early, late: late})
          this.tickEvents[beat] = event
      } // end for
      console.log('restart')
      return

    } // end restart

    if (event.target.name === 'startStop'){

      if (this.state.playing) {
        this.setState({playing: false})
        for (let beat=0; beat < this.tickEvents.length; beat++)
          this.tickEvents[beat].clear() 
        this.count = 0
        if(this.timer) {
           this.timer.clear()
           this.timeout.clear()
        }
//        console.log('stop by startStop')
        return
      } // stop

      // start
      let clickPmin = this.state.bpm*(this.state.denominator/4)
      this.setState({playing: true})

      this.count = 0
      this.startTime = context.currentTime
      for(let beat = 0; beat < this.state.numerator; beat++){
        let event = clock.callbackAtTime(
            function(event) {this.playClick(event.deadline)}.bind(this),
            this.nextTick(beat)
        ).repeat((this.state.numerator*60.0)/clickPmin) // parBar 
         .tolerance({early: early, late: late})

        this.tickEvents[beat] = event
      } // end for

      if (this.state.timer > 0) {

         this.timer = clock.callbackAtTime(function(event) {
           let rest = this.state.rest - 1
           this.setState({rest: rest})
         }.bind(this),1).repeat(1)

         this.timeout = clock.setTimeout(function(event) {
        //  console.log('timer expired')
         if (this.timer) this.timer.clear()
         this.startStop({target: {name: 'stop'}})
         this.setState({rest: this.state.timer})
        }.bind(this), this.state.rest)
      } // end if timer

//        console.log('start by startStop')
    } // button event

    return
  } // end startStop()

// https://github.com/sebpiq/WAAClock/blob/master/demos/beatSequence.js
   nextTick(beatInd) { 

     const beatDur = 60.0/(this.state.bpm*this.state.denominator/4)
     const barDur  = beatDur*this.state.numerator

     const currentTime = context.currentTime
     const relativeTime = currentTime - this.startTime
     var currentBar = Math.floor(relativeTime / barDur)  

   //  const currentBeat = Math.round((relativeTime % barDur) % beatDur)
   //  if (currentBeat > beatInd) currentBar++

     let offset = 0
     if (this.state.swing && (beatInd % 2) === 1){
        offset = (this.state.swingVal - 1.5)/1.5 * beatDur
        // console.log(beatInd + ' offset ' + offset)
     }

     return currentTime + offset + currentBar*barDur + beatInd*beatDur
  }

  playClick(deadline) {

  // console.log('deadline = ' + deadline)
     const {triplet,denominator,numerator,bpm,increment,perBars} = this.state

     // automatic bpm increment
     if(perBars > 0 && this.count === 0 && this.barCount > 0
       && (this.barCount % perBars) === 0){
       let newBpm = bpm + increment
       this.setState({bpm: newBpm})
       clock.timeStretch(context.currentTime, this.tickEvents, bpm/newBpm)
     } // end automatic bpm increment 

     let volume = 1.0
     let mute

     // random mute
     if (this.state.muteBars > 0 
        && this.state.muteProb > 0 && this.count === 0){
       if (this.state.muteCount === this.state.muteBars){
         // console.log('mute off')
         this.setState({mute: false, muteCount: 0})
       } else {
         if (this.state.mute){ 
           this.setState({muteCount: this.state.muteCount+1})
           console.log('mute cont' + this.state.muteCount)
         } else if(Math.random() < parseFloat(this.state.muteProb)){
           // console.log('mute on')
           this.setState({mute: true, muteCount: 1})
         }
       }
     } // end random mute

     if (this.state.mute) mute = 0.0 
     else mute = 1.0

     let source = context.createBufferSource()
     let voice = context.createBufferSource()

     let voiceCount
     if(triplet) voiceCount = (this.count*4*2) / (denominator*3)
     else voiceCount = (this.count*4) / denominator
     // console.log('voiceCount: ' + voiceCount)
     let deadlineVoice = deadline

     if(voiceCount === 0){
        voice.buffer = this.state.voiceOne
     } else if(voiceCount === 1){
        voice.buffer = this.state.voiceTwo
        deadlineVoice -= 0.02
     } else if(voiceCount === 2){
        voice.buffer = this.state.voiceThree
        deadlineVoice -= 0.02
     } else if(voiceCount === 3){
        voice.buffer = this.state.voiceFour
        deadlineVoice -= 0.01
     } else if(voiceCount === 4){
        voice.buffer = this.state.voiceFive
        deadlineVoice -= 0.01
     } else if(voiceCount === 5){
        voice.buffer = this.state.voiceSix
        deadlineVoice -= 0.01
     } else if(voiceCount === 6){
        voice.buffer = this.state.voiceSeven
        deadlineVoice -= 0.01
     }
     
     if(this.count === 0){
        source.buffer = this.state.click2
        volume = 1.0*mute
     } else {
        source.buffer = this.state.click3
        volume = 0.7*mute
        if ((this.count + 1) % numerator === 0){ 
           this.barCount++
        }
     }

     source.connect(gainNode)
     if (this.state.voice) voice.connect(gainNode)
     gainNode.connect(context.destination)
     gainNode.gain.value = volume
     source.start(deadline)
     if (this.state.voice) voice.start(deadlineVoice)

     this.count = (this.count+1) % numerator

  } // end playClick

  handleChange(event) {

    if (event.target.name === 'voice'){ 
      if (this.state.voice) this.setState({voice: false})
      else this.setState({voice: true})
    }

    if (event.target.name === 'bpm_number'){ 
      // console.log('bpm change')
      let newBpm = parseFloat(event.target.value,10)
      this.setState({bpm: newBpm.toFixed(1)})
      this.startStop({target: {name: 'stop'}})

/*
      if (this.state.bpm >= this.state.min_bpm && this.state.playing) 
        clock.setTimeout(function(event) {
          this.startStop({target: {name: 'restart'}}) }.bind(this),0.02)
*/

    }

    if (event.target.name === 'swing'){ 
      this.setState({swingVal: parseFloat(event.target.value,10)})
      clock.setTimeout(function(event) {
          this.startStop({target: {name: 'restart'}}) }.bind(this),0.02)
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

     // console.log('preset changed') 
     const preset = this.presets[event.target.value]
     this.setState({
        count: 0,
        preset: preset.value,
        triplet: preset.triplet,
        numerator: preset.numerator,
        denominator: preset.denominator,
        swing: preset.swing,
        swingVal: preset.swingVal
     })

     if (this.state.playing) {
        clock.setTimeout(function(event) {
          console.log('restarting') 
          this.startStop({target: {name: 'restart'}}) 
        }.bind(this),0.02)
      }
    }

    if (event.target.name === 'perBars') 
        this.setState({perBars: parseInt(event.target.value,10)})

    if (event.target.name === 'muteBars') 
        this.setState({muteBars: parseInt(event.target.value,10)})

  } // end func

} // end App

export default App;
