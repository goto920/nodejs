import React, { Component } from 'react'
import './Metronome.css'
import BufferLoader from './buffer-loader'
import WAAClock from 'waaclock'
import messages from './language.json'

// global variable
window.AudioContext = window.AudioContext || window.webkitAudioContext
var context = new AudioContext()
var clock = new WAAClock(context)
var gainNode = context.createGain()
var version = '2017121002'
var early = 0.1
var late = 1.0

/*
var language = (window.navigator.languages && window.navigator.languages[0]) ||
            window.navigator.language ||
            window.navigator.userLanguage ||
            window.navigator.browserLanguage
console.log(language)
*/

var jaText = messages.ja
var usText = messages.us
var m = usText

clock.start()

class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      ja: false,
      timer: 0,
      rest: 0,
      barTimer: 0,
      restBars: 0,
      playing: false,
      voice: 'c', // c(owbell) only, c+v, v(oice) only
      count: 0,
      min_bpm: 30.0,
      max_bpm: 360.0,
      bpm: '100.0',
      bpm_frac: 0,
      increment: 0,
      perBars: 0,
      muteBars: 0,
      muteProb: 0.0,
      muteCount: 0,
      mute: false,
      preset: 5, // default 4/4
      numerator: 4,
      denominator: 4,
      triplet: false,
      swing: false,
      swingVal: 'N/A', // 0(min),1,1.5(straight),2(full),3(max)
      evenVol: 1.0,
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
    this.customPlay = this.customPlay.bind(this)

    this.presets = [
      {key: 0,
        value: '2/2',
        triplet: false,
        numerator: 2,
        denominator: 2,
        swing: false},
      {key: 1,
        value: '3/4',
        triplet: false,
        numerator: 3,
        denominator: 4,
        swing: false},
      {key: 2,
        value: '6/8',
        triplet: false,
        numerator: 6,
        denominator: 8,
        swing: false},
      {key: 3,
        value: '6/8swing',
        triplet: false,
        numerator: 6,
        denominator: 8,
        swing: true,
        swingVal: 2.0},
      {key: 4,
        value: '12/8',
        triplet: true,
        numerator: 12,
        denominator: 8,
        swing: false},
      {key: 5,
        value: '4/4',
        triplet: false,
        numerator: 4,
        denominator: 4,
        swing: false},
      {key: 6,
        value: '8/8',
        triplet: false,
        numerator: 8,
        denominator: 8,
        swing: false},
      {key: 7,
        value: '8/8swing',
        triplet: false,
        numerator: 8,
        denominator: 8,
        swing: true,
        swingVal: 2.0},
      {key: 8,
        value: '16/16',
        triplet: false,
        numerator: 16,
        denominator: 16,
        swing: false},
      {key: 9,
        value: '16/16swing',
        triplet: false,
        numerator: 16,
        denominator: 16,
        swing: true,
        swingVal: 2.0},
      {key: 10,
        value: '5/4',
        triplet: false,
        numerator: 5,
        denominator: 4,
        swing: false},
      {key: 11,
        value: '10/8',
        triplet: false,
        numerator: 10,
        denominator: 8,
        swing: false},
      {key: 12,
        value: '7/4',
        triplet: false,
        numerator: 7,
        denominator: 4,
        swing: false},
      {key: 13,
        value: '14/8',
        triplet: false,
        numerator: 14,
        denominator: 8,
        swing: false},
      {key: 14,
        value: '7/8',
        triplet: false,
        numerator: 7,
        denominator: 8,
        swing: false},
      {key: 15,
        value: '14/16',
        triplet: false,
        numerator: 14,
        denominator: 16,
        swing: false},
      {key: 16,
        value: '15/16',
        triplet: false,
        numerator: 15,
        denominator: 16,
        swing: false},
      {key: 17,
        value: '17/16',
        triplet: false,
        numerator: 17,
        denominator: 16,
        swing: false}
    ]

    this.tickEvents = []
    this.count = 0
    this.barCount = 0
    this.tap = {
      count: 0,
      msecsFirst: 0,
      msecsPrevious: 0
    }
  } // end constructor

  componentDidMount () {
    let bufferLoader = new BufferLoader(
      context,
      [
        './resources/cowbell-higher.mp3',
        './resources/cowbell-high.mp3',
        './resources/cowbell-mid.mp3',
        './resources/cowbell-low.mp3',
        './resources/cowbell-lower.mp3',
        './resources/one-norm.mp3',
        './resources/two-9.mp3',
        './resources/three-6.mp3',
        './resources/four-6.mp3',
        './resources/five-6.mp3',
        './resources/six-6.mp3',
        './resources/seven-6.mp3',
        './resources/eight-6.mp3'
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

  render () {
    const {ja, voice, playing, bpm, bpm_frac, min_bpm, max_bpm, 
         swingVal, evenVol} = this.state

    const options = this.presets.map(e => {
      return (<option value={e.key} key={e.value}>{e.value}</option>)
    })

    let voiceStr
    if (voice === 'c') voiceStr = m.bell
    else if (voice === 'c+v') voiceStr = m.both
    else voiceStr = m.voice

/*
    const customLoopTable =
      '<tr>'
      + '<th>seq<br />del: -1</th><th>preset</th><th>rep</th><th>bpm</th>'
      + '</tr>'
*/

    return (
      <div className='metronome'>
      KG's JS_Metronome &nbsp;
          <span className='small-button'>
           <button name='language' onClick={this.handleChange}>
           {ja ? 'US' : 'JP'}
          </button>
          </span>
      <hr />
        {m.beat}: <select name='preset' defaultValue={this.state.preset}
          onChange={this.handleSelect}>
          {options}
        </select>
          &nbsp;
        <span className='small-button'>
          <button name='voice' onClick={this.handleChange}>
            {m.sound}</button>
          <tt><b> {voiceStr}</b></tt>
        </span>&nbsp;
        <button name='startStop' onClick={this.startStop}>
          {playing ? 'Stop' : 'Start'}
        </button><br />
        <span className='number'>
        BPM({min_bpm}-{max_bpm}): &nbsp; {('0' + Math.floor(bpm)).slice(-3)}.
        {/*
        <input type='number' name='bpm_number'
          min={0} max={9} value={bpm_frac} step='1.0'
          onChange={this.handleChange} />
        */}
        <select name='bpm_number' defaultValue={bpm_frac}
           onChange={this.handleChange}>
           <option value='0'>0</option>
           <option value='1'>1</option>
           <option value='2'>2</option>
           <option value='3'>3</option>
           <option value='4'>4</option>
           <option value='5'>5</option>
           <option value='6'>6</option>
           <option value='7'>7</option>
           <option value='8'>8</option>
           <option value='9'>9</option>
         </select>
        &nbsp; &nbsp; &nbsp; &nbsp;
        </span>
        <span className='small-button'>
          <button name='tempo_tap' onClick={this.handleChange}>
            {m.tap}</button></span>&nbsp;
        <br />
        <span className='bpm-slider'>
          <input type='range' name='bpm_slider'
            min={min_bpm} max={max_bpm} value={bpm} step='1.0'
            onChange={this.handleChange} />
        </span> <br />
        {m.timer}: <span className='number'><input type='number' name='timer'
          min='0' max='600' value={this.state.rest} step='1'
          onChange={this.handleChange} />({m.secs})</span> &nbsp;
        <span className='number'><input type='number' name='barTimer'
          min='0' max='124' value={this.state.restBars} step='1'
          onChange={this.handleChange} />({m.bars})</span>
        <hr />
        <font color='blue'>{m.advanced}</font><br />
        <span>
          {m.swing}: {swingVal} 
        <input type='range' name='swing'
          min='0.5' max='2.5' value={swingVal} 
          step='0.01' onChange={this.handleChange} />
       {/* <input type='number' name='swing'
            min='0.0' max='3.0' value={this.state.swingVal} step='0.1'
            onChange={this.handleChange} />
       */}
        </span><br />
        -- {m.swingStr}
        <br />
        <span className='number'>
        {m.increment}: <input type='number' name='increment'
          min='-10' max='10' value={this.state.increment}
          onChange={this.handleChange} /> bpm &nbsp;
        </span>
         / 
        <span> 
           <select name='perBars' defaultValue={this.state.perBars}
           onChange={this.handleSelect}>
           <option value='0'>0</option>
           <option value='1'>1</option>
           <option value='2'>2</option>
           <option value='4'>4</option>
           <option value='8'>8</option>
           <option value='12'>12</option>
           <option value='16'>16</option>
         </select> 
         &nbsp; {m.perBars}</span><br />
        <span>
        {m.muteBars}: &nbsp;
         <select name='muteBars'
          defaultValue={this.state.muteBars} onChange={this.handleSelect}>
          <option value='0'>0</option>
          <option value='1'>1</option>
          <option value='2'>2</option>
          <option value='4'>4</option>
          <option value='8'>8</option>
          <option value='12'>12</option>
          <option value='16'>16</option>
        </select>{m.muteProb1}<br />
        </span>
        <span>
        -- &nbsp; {m.muteProb2}: {(this.state.muteProb).toFixed(1)}
          <input type='range' name='muteProb'
          min='0.0' max='1.0' value={this.state.muteProb} 
          step='0.1' onChange={this.handleChange} />
        </span>
       {/*
        <span className='number'>
        {m.muteProb}<input type='number' name='muteProb'
          min='0.0' max='1.0' value={this.state.muteProb} step='0.1'
          onChange={this.handleChange} />
        </span>
       */}
        <br />
        <span>
        {m.evenNotes}: {evenVol.toFixed(2)} <input type='range' name='evenVol'
          min='0.0' max='1.0' value={evenVol} step='0.01'
          onChange={this.handleChange} />
        </span>
      {/* 
        <hr />
        <div>
      Custom Loop: &nbsp;
        <span className='small-button'>
          <button name='addBeats' onClick={this.customPlay}>
        Add</button></span>&nbsp;
          <span className='small-button'>
            <button name='clearBeats' onClick={this.customPlay}>
        Clear</button></span>&nbsp;
          <span className='button'>
            <button name='startCustom' onClick={this.customPlay}>
        Start</button></span><br />
        (not ready)
      </div>
      */}
        <hr />
      (Version: {version})<br />
      Additional feature (thinking..)<br />
      Set List, Sound variation, loop with presets
      </div>
    )
  } // end render()

  customPlay () {
  }

  startStop (event) {
//    console.log('event target name: ' + event.target.name)

    if (event.target.name === 'stop') {
      if (this.state.playing) {
        this.setState({playing: false})
        for (let beat = 0; beat < this.tickEvents.length; beat++) { this.tickEvents[beat].clear() }
      }
      this.count = 0
      if (this.timer) {
        this.timer.clear()
        this.timeout.clear()
      }
      return
    } // stop

    if (event.target.name === 'restart' && this.state.playing) {
      for (let beat = 0; beat < this.tickEvents.length; beat++) { this.tickEvents[beat].clear() }

      this.count = 0
      this.startTime = context.currentTime
      let clickPmin = this.state.bpm * (this.state.denominator / 4)

      for (let beat = 0; beat < this.state.numerator; beat++) {
        let event = clock.callbackAtTime(
            function (event) { this.playClick(event.deadline) }.bind(this),
            this.nextTick(beat)
          ).repeat((this.state.numerator * 60.0) / clickPmin) // parBar
           .tolerance({early: early, late: late})
        this.tickEvents[beat] = event
      } // end for
      console.log('restart')
      return
    } // end restart

    if (event.target.name === 'startStop') {
      if (this.state.playing) {
        this.setState({playing: false})
        for (let beat = 0; beat < this.tickEvents.length; beat++) { this.tickEvents[beat].clear() }
        this.count = 0
        if (this.timer) {
          this.timer.clear()
          this.timeout.clear()
        }
//        console.log('stop by startStop')
        return
      } // stop

      // start
      let clickPmin = this.state.bpm * (this.state.denominator / 4)
      this.setState({playing: true})

      this.count = 0
      this.startTime = context.currentTime
      for (let beat = 0; beat < this.state.numerator; beat++) {
        let event = clock.callbackAtTime(
            function (event) { this.playClick(event.deadline) }.bind(this),
            this.nextTick(beat)
        ).repeat((this.state.numerator * 60.0) / clickPmin) // parBar
         .tolerance({early: early, late: late})

        this.tickEvents[beat] = event
      } // end for

      if (this.state.timer > 0) {
        this.timer = clock.callbackAtTime(function (event) {
          let rest = this.state.rest - 1
          this.setState({rest: rest})
        }.bind(this), 1).repeat(1)

        this.timeout = clock.setTimeout(function (event) {
          if (this.timer) this.timer.clear()
          this.startStop({target: {name: 'stop'}})
          this.setState({rest: this.state.timer})
        }.bind(this), this.state.rest)
      } // end if timer

//        console.log('start by startStop')
    } // button event
  } // end startStop()

// https://github.com/sebpiq/WAAClock/blob/master/demos/beatSequence.js
  nextTick (beatInd) {
    const beatDur = 60.0 / (this.state.bpm * this.state.denominator / 4)
    const barDur = beatDur * this.state.numerator

    const currentTime = context.currentTime
    const relativeTime = currentTime - this.startTime
    var currentBar = Math.floor(relativeTime / barDur)

   //  const currentBeat = Math.round((relativeTime % barDur) % beatDur)
   //  if (currentBeat > beatInd) currentBar++

    let offset = 0
    if (this.state.swing && (beatInd % 2) === 1) {
      offset = (this.state.swingVal - 1.5) / 1.5 * beatDur
        // console.log(beatInd + ' offset ' + offset)
    }

    return currentTime + offset + currentBar * barDur + beatInd * beatDur
  }

  playClick (deadline) {
  // console.log('deadline = ' + deadline)
    const {triplet, denominator, numerator, bpm, increment, perBars} = this.state

    if (this.state.barTimer > 0 && this.state.restBars <= 0) {
      console.log('barTimer ' + this.state.barTimer)
      this.startStop({target: {name: 'stop'}})
      this.setState({restBars: this.state.barTimer}) // back to initial state
      return
    }

     // automatic bpm increment
    if (perBars > 0 && this.count === 0 && this.barCount > 0 &&
       (this.barCount % perBars) === 0) {
      let newBpm = parseFloat(bpm) + parseFloat(increment)
      if (newBpm > this.state.max_bpm) newBpm = this.state.max_bpm
      if (newBpm < this.state.min_bpm) newBpm = this.state.min_bpm
      this.setState({bpm: newBpm})
      clock.timeStretch(context.currentTime, this.tickEvents, bpm / newBpm)
    } // end automatic bpm increment

    let volume = 1.0
    let mute

     // random mute
    if (this.state.muteBars > 0 &&
        this.state.muteProb > 0 && this.count === 0) {
      if (this.state.muteCount === this.state.muteBars) {
         // console.log('mute off')
        this.setState({mute: false, muteCount: 0})
      } else {
        if (this.state.mute) {
          this.setState({muteCount: this.state.muteCount + 1})
          console.log('mute cont' + this.state.muteCount)
        } else if (Math.random() < parseFloat(this.state.muteProb)) {
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
    if (triplet) voiceCount = (this.count * 4 * 2) / (denominator * 3)
    else voiceCount = (this.count * 4) / denominator
     // console.log('voiceCount: ' + voiceCount)
    let deadlineVoice = deadline

    if (voiceCount === 0) {
      voice.buffer = this.state.voiceOne
    } else if (voiceCount === 1) {
      voice.buffer = this.state.voiceTwo
      deadlineVoice -= 0.02
    } else if (voiceCount === 2) {
      voice.buffer = this.state.voiceThree
      deadlineVoice -= 0.02
    } else if (voiceCount === 3) {
      voice.buffer = this.state.voiceFour
      deadlineVoice -= 0.01
    } else if (voiceCount === 4) {
      voice.buffer = this.state.voiceFive
      deadlineVoice -= 0.01
    } else if (voiceCount === 5) {
      voice.buffer = this.state.voiceSix
      deadlineVoice -= 0.01
    } else if (voiceCount === 6) {
      voice.buffer = this.state.voiceSeven
      deadlineVoice -= 0.01
    }

    if (this.count === 0) {
      source.buffer = this.state.click2
      volume = 1.0 * mute
    } else {
      source.buffer = this.state.click3
      volume = 0.7 * mute
      if ((this.count + 1) % numerator === 0) {
        this.barCount++
        if (this.state.restBars > 0) { this.setState({restBars: this.state.restBars - 1}) }
      }
    }

    if (triplet) {
      if (this.count % 3 !== 2) volume *= this.state.evenVol
    } else {
      if (this.count % 2 === 0) volume *= this.state.evenVol
    }

    if (this.state.voice === 'c') { source.connect(gainNode) } else if (this.state.voice === 'v') { voice.connect(gainNode) } else if (this.state.voice === 'c+v') {
      source.connect(gainNode)
      voice.connect(gainNode)
    }

    gainNode.connect(context.destination)
    gainNode.gain.value = volume
    source.start(deadline)
    if (this.state.voice) voice.start(deadlineVoice)

    this.count = (this.count + 1) % numerator
  } // end playClick

  handleChange (event) {
    if (event.target.name === 'language'){
     if (this.state.ja === true){
      m = usText
      this.setState({ja: false})
     } else {
      m = jaText
      this.setState({ja: true})
     }
    }

    if (event.target.name === 'evenVol') {
      if (this.state.evenVol) { this.setState({evenVol: parseFloat(event.target.value)}) } else { this.setState({evenVol: 1.0}) }
    }

    if (event.target.name === 'voice') { // c, c+v, v, rotation
      if (this.state.voice === 'c') this.setState({voice: 'v'})
      else if (this.state.voice === 'v') this.setState({voice: 'c+v'})
      else this.setState({voice: 'c'})
    }

    if (event.target.name === 'tempo_tap') {
// https://www.all8.com/tools/bpm.htm
      let timeSeconds = new Date()
      let msecs = timeSeconds.getTime()

     // console.log('TAP msec ' + msecs)

      if ((msecs - this.tap.msecsPrevious) > 3000) { // timeout 3 sec
        this.tap.count = 0
      }

      if (this.tap.count === 0) {
        this.tap.msecsFirst = msecs
        this.tap.count = 1
      } else {
        let newBpm = 60000 * this.tap.count / (msecs - this.tap.msecsFirst)
        this.setState({bpm: newBpm.toFixed(1)})
        clock.setTimeout(function (event) {
          this.startStop({target: {name: 'restart'}})
        }.bind(this), 0.02)
        this.tap.count++
      }
      this.tap.msecsPrevious = msecs
    }

    if (event.target.name === 'bpm_number') {
      // console.log('bpm change')
      let bpm_frac = parseFloat(event.target.value, 10)
      let newBpm =  Math.floor(this.state.bpm) + 0.1*bpm_frac
      this.setState({bpm: newBpm, bpm_frac: bpm_frac})
      clock.setTimeout(function (event) {
        this.startStop({target: {name: 'restart'}})
      }.bind(this), 0.02)
    }

    if (event.target.name === 'bpm_slider') {
      let newBpm = parseFloat(event.target.value, 10)
      this.setState({bpm: newBpm.toFixed(1), bpm_frac: 0.0})
      clock.setTimeout(function (event) {
        this.startStop({target: {name: 'restart'}})
      }.bind(this), 0.02)
    }

    if (event.target.name === 'swing') {
      if (this.state.swing) {
        this.setState({swingVal: parseFloat(event.target.value, 10)})
        clock.setTimeout(function (event) {
          this.startStop({target: {name: 'restart'}})
        }.bind(this), 0.02)
      } else { this.setState({swingVal: 'N/A'}) }
    }

    if (event.target.name === 'increment') { this.setState({increment: parseInt(event.target.value, 10)}) }

    if (event.target.name === 'muteProb') { this.setState({muteProb: parseFloat(event.target.value, 10)}) }

    if (event.target.name === 'timer') {
      let rest = parseInt(event.target.value, 10)
      this.setState({timer: rest, rest: rest})
    }

    if (event.target.name === 'barTimer') {
      let rest = parseInt(event.target.value, 10)
      this.setState({barTimer: rest, restBars: rest})
    }
  } // end handleChange()

  handleSelect (event) {
    if (event.target.name === 'preset') {
     // console.log('preset changed')
      const preset = this.presets[event.target.value]
      this.setState({
        count: 0,
        preset: preset.value,
        triplet: preset.triplet,
        numerator: preset.numerator,
        denominator: preset.denominator,
        swing: preset.swing
      })
      if (preset.swing !== 'undefined') { this.setState({swingVal: preset.swingVal}) } else { this.setState({swingVal: 'N/A'}) }

      if (this.state.playing) {
        clock.setTimeout(function (event) {
          console.log('restarting')
          this.startStop({target: {name: 'restart'}})
        }.bind(this), 0.02)
      }
    }

    if (event.target.name === 'perBars') { this.setState({perBars: parseInt(event.target.value, 10)}) }

    if (event.target.name === 'muteBars') { this.setState({muteBars: parseInt(event.target.value, 10)}) }
  } // end func
} // end App

export default App
