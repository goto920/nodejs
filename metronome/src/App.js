import React, { Component } from 'react'
import './Metronome.css'
import BufferLoader from './buffer-loader'
import WAAClock from 'waaclock'
import messages from './language.json'
import packageJSON from '../package.json' 

// global variable
window.AudioContext = window.AudioContext || window.webkitAudioContext
const context = new window.AudioContext()
const clock = new WAAClock(context)
const timerClock = new WAAClock(context)
const gainNode = context.createGain()

const version = (packageJSON.homepage + packageJSON.subversion).slice(-10)
 // define in package.json
const early = 0.1
const late = 1.0

const jaText = messages.ja
const usText = messages.us
var m = usText

clock.start()
timerClock.start()

class App extends Component {
  constructor (props) {
    super(props)

    this.params = {
      min_bpm: 30.0,
      max_bpm: 360.0,
      timer: 0, barTimer: 0,
      increment: 0, perBars: 0,
      muteBars: 0, muteProb: 0.0,
      muteCount: 0, muteStat: false,
      numerator: 4, denominator: 4, triplet: false,
      cowbell: [], maleVoice: [],
      swing: false,
      count: 0, barCount: 0,
      startTime: 0
    }

    this.timerEvent = 0
    this.timeOutEvent = 0

    this.state = {
      ja: false,
      voice: 'c', // c(owbell) only, c+v, v(oice) only
      rest: 0, restBars: 0, playing: false,
      bpm: '100.0', bpm_frac: 0, preset: 4, // default 4/4
      swingVal: 1.5, evenVol: 1.0,
      loopTable : [],
      newRow: {preset: 4, swingVal: 1.5, repeat: 1},
      loopStat: {playing: false, seq: 0, repeat: 0, bar: 0}
    }

    this.setState = this.setState.bind(this)
    this.startStop = this.startStop.bind(this)
    this.customPlay = this.customPlay.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handleTable = this.handleTable.bind(this)
    this.playClick = this.playClick.bind(this)
    this.nextTick = this.nextTick.bind(this)
    this.handleWindowClose = this.handleWindowClose.bind(this)

    this.presets = [
      { value: '2/2', numerator: 2, denominator: 2},
      { value: '3/4', numerator: 3, denominator: 4},
      { value: '6/8', numerator: 6, denominator: 8},
      { value: '12/8', numerator: 12, denominator: 8, triplet: true},
      { value: '4/4', numerator: 4, denominator: 4}, 
      { value: '8/8', numerator: 8, denominator: 8},
      { value: '16/16', numerator: 16, denominator: 16},
      { value: '5/4', numerator: 5, denominator: 4},
      { value: '10/8', numerator: 10, denominator: 8},
      { value: '7/4', numerator: 7, denominator: 4},
      { value: '14/8', numerator: 14, denominator: 8},
      { value: '7/8', numerator: 7, denominator: 8},
      { value: '14/16', numerator: 14, denominator: 16},
      { value: '15/16', numerator: 15, denominator: 16},
      { value: '17/16', numerator: 17, denominator: 16}
    ]

    this.tickEvents = []

    this.tap = {
      count: 0,
      msecsFirst: 0,
      msecsPrevious: 0
    }

  } // end constructor


  componentDidMount () {
    window.addEventListener('beforeunload', this.handleWindowClose)
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
        for (let i=0; i < 5; i++)
            this.params.cowbell[i] = bufferList[i]
        for (let i=5; i <= 12; i++)
            this.params.maleVoice[i-5] = bufferList[i]
         // console.log('BufferLoader loading finished')
      }.bind(this)
    )

    bufferLoader.load()
  }

  componentWillUnMount(){
    window.removeEventListener('beforeunload', this.handleWindowClose)
  }

  render () {
    const {ja, voice, loopTable, newRow, loopStat,
           preset, playing, bpm, bpm_frac,
           rest, restBars, swingVal, evenVol} = this.state
    const {min_bpm, max_bpm} = this.params

    const options = this.presets.map((e,index) => {
      return (<option value={index} key={e.value}>{e.value}</option>)
    })

    let voiceStr
    if (voice === 'c') voiceStr = m.bell
    else if (voice === 'c+v') voiceStr = m.both
    else voiceStr = m.voice

    const loopTableRows = loopTable.map(function(e,index) {
      return (<tr key={index}>
         <td align="right">
          d<input type="radio" name="loopDel" value={index} 
          checked={false}
            onChange={this.handleTable}/></td>
         <td align="right">{index}</td>
         <td align="right">{e.preset.value}</td>
         <td align="right">{e.swingVal}</td>
         <td align="right">{e.repeat}</td>
         </tr>)
    }.bind(this))

    return (
      <div className='metronome'>
      KG's JS_Metronome &nbsp;
          <span className='small-button'>
           <button name='language' onClick={this.handleChange}>
           {ja ? 'US' : 'JP'}
          </button>
          </span>
      <hr />
        {m.beat}: <select name='preset' defaultValue={preset}
          onChange={this.handleChange}>
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
        {m.timer}: &nbsp;
     <span>
     {('00' + rest).slice(-3)}/
     <select name='timer' defaultValue='0' onChange={this.handleChange}> 
     <option value='0'>off</option>
     <option value='30'>30</option>
     <option value='60'>60</option>
     <option value='90'>90</option>
     <option value='120'>120</option>
     <option value='180'>180</option>
     <option value='240'>240</option>
     <option value='300'>300</option>
     <option value='600'>600</option>
     </select>({m.secs}), </span>
  <span>
  {('00' + restBars).slice(-3)}/ 
  <select name='barTimer' defaultValue='0' onChange={this.handleChange}>
  <option value='0'>off</option>
  <option value='12'>12</option>
  <option value='16'>16</option>
  <option value='24'>24</option>
  <option value='32'>32</option>
  <option value='64'>64</option>
  <option value='128'>128</option>
  <option value='256'>256</option>
  </select> ({m.bars})</span>
        <hr />
        <font color='blue'>{m.advanced}</font><br />
          {m.swing}: &nbsp; 
        <span>
           <select name='swing' value={parseInt(swingVal*10,10)}
           onChange={this.handleChange}>
           <option value='5'>0.5</option>
           <option value='6'>0.6</option>
           <option value='7'>0.7</option>
           <option value='8'>0.8</option>
           <option value='9'>0.9</option>
           <option value='10'>1.0</option>
           <option value='11'>1.1</option>
           <option value='12'>1.2</option>
           <option value='13'>1.3(str)</option>
           <option value='14'>1.4</option>
           <option value='15'>1.5(str)</option>
           <option value='16'>1.6</option>
           <option value='17'>1.7</option>
           <option value='18'>1.8(Lt)</option>
           <option value='19'>1.9</option>
           <option value='20'>2.0(Swg)</option>
           <option value='21'>2.1</option>
           <option value='22'>2.2(Hvy)</option>
           <option value='23'>2.3</option>
           <option value='24'>2.4</option>
           <option value='25'>2.5</option>
           </select>
       </span>
        &nbsp; {m.swingStr}
        <br />
        <span className='number'>
        {m.increment}: 
       <select name='increment' defaultValue='0' onChange={this.handleChange}> 
         <option value='-10'>-10</option> <option value='-9'>-9</option>
         <option value='-8'>-8</option> <option value='-7'>-7</option>
         <option value='-6'>-6</option> <option value='-5'>-5</option>
         <option value='-4'>-4</option> <option value='-3'>-3</option>
         <option value='-2'>-2</option> <option value='-1'>-1</option>
         <option value='0'>off</option>
         <option value='1'>1</option> <option value='2'>2</option>
         <option value='3'>3</option> <option value='4'>4</option>
         <option value='5'>5</option> <option value='6'>6</option>
         <option value='7'>7</option> <option value='8'>8</option>
         <option value='9'>9</option> <option value='10'>10</option>
         </select> bpm
        </span>
         / 
        <span> 
           <select name='perBars' defaultValue='0' onChange={this.handleChange}>
           <option value='0'>off</option>
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
         <select name='muteBars' defaultValue='0' onChange={this.handleChange}>
          <option value='0'>off</option>
          <option value='1'>1</option>
          <option value='2'>2</option>
          <option value='4'>4</option>
          <option value='8'>8</option>
          <option value='12'>12</option>
          <option value='16'>16</option>
        </select>
        </span>
        {m.muteProb1}
        &nbsp; {m.muteProb2}
        <span>
          <select name='muteProb' defaultValue='0' onChange={this.handleChange}>
          <option value='0.0'>0.0</option>
          <option value='0.1'>0.1</option>
          <option value='0.2'>0.2</option>
          <option value='0.3'>0.3</option>
          <option value='0.4'>0.4</option>
          <option value='0.5'>0.5</option>
          <option value='0.6'>0.6</option>
          <option value='0.7'>0.7</option>
          <option value='0.8'>0.8</option>
          <option value='0.9'>0.9</option>
          <option value='1.0'>1.0</option>
          </select>
        </span>
        <br />
        <span>
        {m.evenNotes}: {evenVol.toFixed(2)} <input type='range' name='evenVol'
          min='0.0' max='1.0' value={evenVol} step='0.01'
          onChange={this.handleChange} />
        </span>
       <hr />
      (Version: {version})<br />
      Additional feature is coming<br />
      PresetLoop(60% done), Set List, Sound variation
      <hr /> 
{/*
      <b>Edit Loop and &nbsp;</b>
      <span className="loopButton">
        <button name="startLoop" onClick={this.customPlay}>
        {loopStat.playing ? 'Stop' : 'Start'}</button>
      </span>&nbsp; rewind &nbsp;
      <span className="loopButton">
        <button name="rewindLoop" onClick={this.customPlay}>
        &lt;&lt;&lt;</button>
      </span>
      <div>
      <table border="3">
      <tbody>
      <tr><th>d/a</th><th>seq</th>
          <th>beat</th><th>swing</th><th>repeat</th></tr>
      {loopTableRows}
      <tr><td align="right">
     a<input type="radio" name="loopAdd" checked={false}
        onChange={this.handleTable}/></td>
          <td align="right">add</td>
          <td align="right">
             <select name="loopAddPreset" 
              defaultValue={newRow.preset} 
              onChange={this.handleTable}>
               {options}</select></td>
          <td align="right">
           <span><select name='loopSwingVal' 
             defaultValue='1.5'
             onChange={this.handleTable}>
           <option value='0.5'>0.5</option>
           <option value='0.6'>0.6</option>
           <option value='0.7'>0.7</option>
           <option value='0.8'>0.8</option>
           <option value='0.9'>0.9</option>
           <option value='1.0'>1.0</option>
           <option value='1.1'>1.1</option>
           <option value='1.2'>1.2</option>
           <option value='1.3'>1.3(str)</option>
           <option value='1.4'>1.4</option>
           <option value='1.5'>1.5(str)</option>
           <option value='1.6'>1.6</option>
           <option value='1.7'>1.7</option>
           <option value='1.8'>1.8(Lt)</option>
           <option value='1.9'>1.9</option>
           <option value='2.0'>2.0(Swg)</option>
           <option value='2.1'>2.1</option>
           <option value='2.2'>2.2(Hvy)</option>
           <option value='2.3'>2.3</option>
           <option value='2.4'>2.4</option>
           <option value='2.5'>2.5</option>
          </select></span></td>
          <td align="right"><span>
          <select name='loopRepeat' 
             defaultValue={this.state.newRow.repeat} 
             onChange={this.handleTable}>
           <option value='1'>1</option> <option value='2'>2</option>
           <option value='3'>3</option> <option value='4'>4</option>
           <option value='5'>5</option> <option value='6'>6</option>
           <option value='7'>7</option> <option value='8'>8</option>
           <option value='9'>9</option> <option value='10'>10</option>
           <option value='11'>11</option> <option value='12'>12</option>
           <option value='13'>13</option> <option value='14'>14</option>
           <option value='15'>15</option> <option value='16'>16</option>
         </select>
          </span></td>
          </tr>
      </tbody>
      </table>
      </div> 
*/}
      </div>
    )
  } // end render()

  customPlay (event) {

    let {loopTable,loopStat} = this.state 
    if (loopTable.length <= 0) return 


    if (event.target.name === 'startLoop'){

      if(loopStat.playing) {
        console.log('startLoop stop')
        this.startStop({target: {name: 'stop'}})
        loopStat.playing = false
      } else {
        console.log('stopLoop start')
        this.customPlay({target: {name: 'start'}})
        loopStat.playing = true
      }
      this.setState({loopStat: loopStat}) 
         
      return
    } 

    if (event.target.name === 'rewindLoop'){
      console.log('rewindLoop')
      this.customPlay({target: {name: 'restart'}})
      return
    }

 // Are recursive calls OK?
    if (event.target.name === 'stop'){ return }
    if (event.target.name === 'start'){ 

      this.params.startTime = context.currentTime
      this.params.count = 0
      let beat = 0
      for(let i = 0; i < loopTable.length; i++){

        let {preset,swingVal,repeat} = loopTable[i]
        this.params.numerator = preset.numerator
        this.params.denominator = preset.denominator
        this.params.triplet = preset.triplet
        if (parseInt(swingVal*10,10) !== 15) {
          this.params.swing = true
          this.params.swingVal = preset.swingVal
        }

        for (let beatId = beat; 
            beatId < beat + this.params.numerator*repeat; 
            beatId++, beat++) {
          let event = clock.callbackAtTime(
            function (event) { this.playClick(event.deadline) }.bind(this),
            this.nextTick(beatId)
          ).tolerance({early: early, late: late})
          this.tickEvents[beat] = event
        } // end for
      }
      return 
    }
    if (event.target.name === 'restart'){ return }

  }

  handleTable(event) {
    const {newRow, loopTable} = this.state

    if (event.target.name === 'loopDel'){
      let tmp = loopTable
      tmp.splice(event.target.value,1)
      this.setState({loopTable: tmp})
      return
    }

    if (event.target.name === 'loopAdd'){
      let tmp = loopTable
      tmp.push(
       {preset: this.presets[newRow.preset],
        swingVal: newRow.swingVal,
        repeat:   newRow.repeat
      })
      this.setState({loopTable: tmp})
      return
    }

    if (event.target.name === 'loopAddPreset'){
      let tmp=newRow
      tmp.preset = event.target.value
      this.setState({newRow: tmp})
      return
    }

    if (event.target.name === 'loopSwingVal'){
      let tmp=newRow
      tmp.swingVal = event.target.value
      this.setState({newRow: tmp})
      return
    }

    if (event.target.name === 'loopRepeat'){
      let tmp=newRow
      tmp.repeat = event.target.value
      this.setState({newRow: tmp})
      return
    }

  } // end handleTable

  startStop (event) {

    if (event.target.name === 'stop') {
      if (this.state.playing) {
        this.setState({playing: false})
        for (let beat = 0; beat < this.tickEvents.length; beat++) { this.tickEvents[beat].clear() }
      }
      this.params.count = 0
      if (this.timerEvent) {
        this.timerEvent.clear()
        this.timeoutEvent.clear()
      }
      return
    } // stop

    if (event.target.name === 'restart' && this.state.playing) {
      for (let beat = 0; beat < this.tickEvents.length; beat++) { this.tickEvents[beat].clear() }

      this.params.count = 0
      this.params.startTime = context.currentTime
      let clickPmin = this.state.bpm * (this.params.denominator / 4)

      for (let beat = 0; beat < this.params.numerator; beat++) {
        let event = clock.callbackAtTime(
            function (event) { this.playClick(event.deadline) }.bind(this),
            this.nextTick(beat)
          ).repeat((this.params.numerator * 60.0) / clickPmin) // parBar
           .tolerance({early: early, late: late})
        this.tickEvents[beat] = event
      } // end for
      console.log('restart')
      return
    } // end restart

    if (event.target.name === 'startStop') {

      if (this.state.playing) {
        console.log('stopping')
        this.setState({playing: false})
        for (let beat = 0; beat < this.tickEvents.length; beat++) { this.tickEvents[beat].clear() }
        this.params.count = 0
        if (this.timerEvent) {
          this.timerEvent.clear()
          this.timeoutEvent.clear()
        }
//        console.log('stop by startStop')
        return
      } // stop

      // start
      console.log('starting')
      let clickPmin = this.state.bpm * (this.params.denominator / 4)
      this.setState({playing: true})

      this.params.count = 0
      this.params.startTime = context.currentTime
      for (let beat = 0; beat < this.params.numerator; beat++) {
        let event = clock.callbackAtTime(
            function (event) { this.playClick(event.deadline) }.bind(this),
            this.nextTick(beat)
        ).repeat((this.params.numerator * 60.0) / clickPmin) // parBar
         .tolerance({early: early, late: late})

        this.tickEvents[beat] = event
      } // end for

      if (this.params.timer > 0) {
        this.timerEvent = timerClock.callbackAtTime(function (event) {
          let rest = this.state.rest - 1
          this.setState({rest: rest})
        }.bind(this), 1).repeat(1)

        this.timeoutEvent = timerClock.setTimeout(function (event) {
          if (this.timerEvent) this.timerEvent.clear()
          this.startStop({target: {name: 'stop'}})
          this.setState({rest: this.params.timer})
        }.bind(this), this.state.rest)
      } // end if timer

//        console.log('start by startStop')
    } // button event
  } // end startStop()

// https://github.com/sebpiq/WAAClock/blob/master/demos/beatSequence.js
  nextTick (beatInd) {
    const beatDur = 60.0 / (this.state.bpm * this.params.denominator / 4)
    const barDur = beatDur * this.params.numerator

    const currentTime = context.currentTime
    const relativeTime = currentTime - this.params.startTime
    var currentBar = Math.floor(relativeTime / barDur)

    let offset = 0
    if (this.params.swing && (beatInd % 2) === 1) {
      offset = (this.state.swingVal - 1.5) / 1.5 * beatDur
        // console.log(beatInd + ' offset ' + offset)
    }

    return currentTime + offset + currentBar * barDur + beatInd * beatDur
  }

  playClick (deadline) {

    const {bpm, restBars} = this.state
    const {max_bpm, min_bpm, numerator, denominator, triplet,
          increment, barTimer, perBars, muteBars, muteProb, 
          cowbell, maleVoice} = this.params
    let {muteCount, muteStat, count, barCount} = this.params

//    console.log('count: ' + count) 

    // Timer in bars
    if (barTimer > 0 && restBars <= 0) {
      console.log('barTimer ' + barTimer)
      this.startStop({target: {name: 'stop'}})
      this.setState({restBars: barTimer}) // back to initial value
      return
    }

    // automatic bpm increment
    if (perBars > 0 && count === 0 && barCount > 0 &&
       (barCount % perBars) === 0) {
      let newBpm = parseFloat(bpm) + parseFloat(increment)
      if (newBpm > max_bpm) newBpm = max_bpm
      if (newBpm < min_bpm) newBpm = min_bpm
      this.setState({bpm: newBpm})
      clock.timeStretch(context.currentTime, this.tickEvents, bpm / newBpm)
    } // end automatic bpm increment

    // random mute
    if (muteBars > 0 && muteProb > 0 && count === 0) {
      if (muteCount === muteBars) {
         // console.log('mute off')
        muteStat = false
        muteCount = 0
        // this.setState({mute: false, muteCount: 0})
      } else {
        if (muteStat) {
          // this.setState({muteCount: this.state.muteCount + 1})
          muteCount++
          console.log('mute cont' + muteCount)
        } else if (Math.random() < parseFloat(muteProb)) {
           // console.log('mute on')
          muteStat = true
          muteCount++
          // this.setState({mute: true, muteCount: 1})
        }
      }
    } // end random mute

    let volume = 1.0
    let mute
    if (muteStat) mute = 0.0
    else mute = 1.0

    let source = context.createBufferSource()
    let voice = context.createBufferSource()

    let voiceCount
    if (triplet) voiceCount = (count * 4 * 2) / (denominator * 3)
    else voiceCount = (count * 4) / denominator
     // console.log('voiceCount: ' + voiceCount)
    let deadlineVoice = deadline

     voice.buffer = maleVoice[voiceCount]
     if (voiceCount === 1) {
      deadlineVoice -= 0.02
    } else if (voiceCount === 2) {
      deadlineVoice -= 0.02
    } else if (voiceCount === 3) {
      deadlineVoice -= 0.01
    } else if (voiceCount === 4) {
      deadlineVoice -= 0.01
    } else if (voiceCount === 5) {
      deadlineVoice -= 0.01
    } else if (voiceCount === 6) {
      deadlineVoice -= 0.01
    }

    if (count === 0) {
      source.buffer = cowbell[1]
      volume = 1.0 * mute
    } else {
      source.buffer = cowbell[2]
      volume = 0.7 * mute
      if ((count + 1) % numerator === 0) {
        barCount++
        if (this.state.restBars > 0) 
         this.setState({restBars: this.state.restBars - 1})
      }
    }

    if (triplet) {
      if (count % 3 !== 2) volume *= this.state.evenVol
    } else {
      if (count % 2 === 0) volume *= this.state.evenVol
    }

    if (this.state.voice === 'c') { source.connect(gainNode) } else if (this.state.voice === 'v') { voice.connect(gainNode) } else if (this.state.voice === 'c+v') {
      source.connect(gainNode)
      voice.connect(gainNode)
    }

    gainNode.connect(context.destination)
    gainNode.gain.value = volume
    source.start(deadline)
    if (this.state.voice) voice.start(deadlineVoice)

    count = (count + 1) % numerator
    this.params.muteCount = muteCount
    this.params.muteStat = muteStat
    this.params.count = count
    this.params.barCount = barCount

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
     return
    }

    if (event.target.name === 'evenVol') {
      if (this.state.evenVol) 
        this.setState({evenVol: parseFloat(event.target.value)}) 
      else this.setState({evenVol: 1.0}) 
      return
    }

    if (event.target.name === 'voice') { // c, c+v, v, rotation
      if (this.state.voice === 'c') this.setState({voice: 'v'})
      else if (this.state.voice === 'v') this.setState({voice: 'c+v'})
      else this.setState({voice: 'c'})
      return
    }

//  Temp tap: https://www.all8.com/tools/bpm.htm
    if (event.target.name === 'tempo_tap') {
      let timeSeconds = new Date()
      let msecs = timeSeconds.getTime()

      if ((msecs - this.tap.msecsPrevious) > 3000) { // timeout 3 sec
        this.tap.count = 0
      }

      if (this.tap.count === 0) {
        this.tap.msecsFirst = msecs
        this.tap.count = 1
      } else {
        let newBpm = 60000 * this.tap.count / (msecs - this.tap.msecsFirst)
        this.setState({bpm: newBpm.toFixed(1)})
        if(this.state.playing)
          clock.timeStretch(context.currentTime, this.tickEvents, 
          this.state.bpm / newBpm)

        this.tap.count++
      }
      this.tap.msecsPrevious = msecs
      return
    }

    if (event.target.name === 'bpm_number') {
      // console.log('bpm change')
      let bpm_frac = parseFloat(event.target.value, 10)
      let newBpm =  Math.floor(this.state.bpm) + 0.1*bpm_frac
      this.setState({bpm: newBpm, bpm_frac: bpm_frac})

      if (this.state.playing)
       clock.timeStretch(context.currentTime, this.tickEvents, 
            this.state.bpm / newBpm)

      return
    }

    if (event.target.name === 'bpm_slider') {
      let newBpm = parseFloat(event.target.value, 10)
      this.setState({bpm: newBpm.toFixed(1), bpm_frac: 0.0})
      if (this.state.playing)
        clock.timeStretch(context.currentTime, this.tickEvents, 
        this.state.bpm / newBpm)
      return
    }

    if (event.target.name === 'swing') {
      if (event.target.value !== 15){
        let swingVal = parseFloat(event.target.value/10, 10)
        this.params.swing = true
        this.setState({swingVal: swingVal}) 
      } else {
        this.params.swing = false
        this.setState({swingVal: 1.5}) 
      }

      clock.setTimeout(function (event) {
          this.startStop({target: {name: 'restart'}})
      }.bind(this), 0.02)
      return
    }

    if (event.target.name === 'increment') { 
      // this.setState({increment: parseInt(event.target.value, 10)}) 
      this.params.increment = parseInt(event.target.value, 10)
      return
    }

    if (event.target.name === 'muteProb') { 
      // this.setState({muteProb: parseFloat(event.target.value, 10)}) 
      this.params.muteProb = parseFloat(event.target.value, 10)
      return
    }

    if (event.target.name === 'timer') {
      this.params.timer = parseInt(event.target.value, 10)
      this.setState({rest: this.params.timer})
      return
    }

    if (event.target.name === 'barTimer') {
      this.params.barTimer = parseInt(event.target.value, 10)
      this.setState({restBars: this.params.barTimer})
      return
    }

    if (event.target.name === 'perBars') { 
      this.setState({perBars: parseInt(event.target.value, 10)}) 
      return
    }

    if (event.target.name === 'muteBars') { 
      this.setState({muteBars: parseInt(event.target.value, 10)}) 
      return
    }

    if (event.target.name === 'preset') {
      const preset = this.presets[event.target.value]
      this.setState({
        count: 0,
        preset: preset.value,
        swingVal: 1.5
      })
      this.params.numerator = preset.numerator
      this.params.denominator = preset.denominator
      this.params.triplet =  preset.triplet

      if (this.state.playing) {
        clock.setTimeout(function (event) {
          console.log('restarting')
          this.startStop({target: {name: 'restart'}})
        }.bind(this), 0.02)
      }
      return
    } // end preset

  } // end handleChange()

  handleWindowClose(event) { // finishing clean up
    this.startStop({target: {name: 'stop'}})
    clock.stop()
    timerClock.stop()
/*
    context = null
    clock = null
    timerClock = null
    gainNode = null
*/
  }

} // end App

export default App
