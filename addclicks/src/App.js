import React, { Component } from 'react'
import './addClicks.css'
import WAAClock from 'waaclock'
import BufferLoader from './buffer-loader'
import clickSound from './cowbell-mid.mp3'
import {analyze,guess} from 'web-audio-beat-detector'

window.AudioContext = window.AudioContext || window.webkitAudioContext
window.OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext

var context
var offlineContext
var clock
var cowbell_mid_sound


class App extends Component {
  constructor (props) {
    super(props)
    this.params = {
      inputAudio: undefined,
      clickTrack: undefined,
      bpm: undefined,
      offset: undefined,
      currentSource: undefined,
      currentClick: undefined,
      beginAt: undefined,
      pausedAt: undefined,
      scheEvent: undefined
    }

    this.state = {
      playing: 'stopped', // 'not playing', 'paused', 'playing'
      startButtonStr: 'Wait',
      songLength: 0,
      currentPos: 0,
      click: 'pre',
      clickVolume: 0.7,
      bpm: 0
    }

    this.tap = {
      firstTapMsecs: 0,
      count: 0,
      msecsFirst: 0,
      msecsPrevious: 0
    }

    this.setState = this.setState.bind(this)
    this.loadFile = this.loadFile.bind(this)
    this.handleStartStop = this.handleStartStop.bind(this)
    this.handleTap = this.handleTap.bind(this)
    this.handleClick = this.handleClick.bind(this)
    this.handleTimeSlider = this.handleTimeSlider.bind(this)
    this.handleWindowClose = this.handleWindowClose.bind(this)
    this.makeClickTrack = this.makeClickTrack.bind(this)
    this.Analyze = this.Analyze.bind(this)
  }

  componentWillMount () { // before render()
    window.addEventListener('beforeunload', this.handleWindowClose)
  }

  componentDidMount () { // after render()
    context = new window.AudioContext()

    let inputFiles = []
    inputFiles.push(clickSound)

    let bufferLoader = new BufferLoader(
      context, inputFiles, function (bufferList) {
        cowbell_mid_sound = bufferList[0]
        // console.log(cowbell_mid_sound)
      }
    )
    bufferLoader.load()

    clock = new WAAClock(context)
    clock.start()
  }

  componentWillUnMount () { // before closing app
    window.removeEventListener('beforeunload', this.handleWindowClose)
  }

  handleWindowClose (event) { // clean up before exit
    if (this.params.scheEvent !== undefined) this.params.scheEvent.clear()
    clock.stop()
    context.close()
    // offlineContext.close()
  }

  render () {
    const {handleStartStop, handleTap, loadFile, handleClick,
      handleTimeSlider} = this
    const {bpm, startButtonStr, songLength, currentPos, clickVolume} =
      this.state

    return (
      <div className='addClicks'>
     Music file player with clicks
        <hr />
     File: &nbsp;
        <span className='selectFile'>
          <input type='file' name='loadFile'
            accept='audio/*' onChange={loadFile} />
        </span>
        <hr />
        <button name='startPause' onClick={handleStartStop}>
          {startButtonStr}
        </button>&nbsp;&nbsp;
        <span className='small-button'>
          <button name='stop' onClick={handleStartStop}>Stop</button>
        </span>
     &nbsp; Time: &nbsp;
        { ('   ' + parseFloat(currentPos).toFixed(1)).slice(-5)}/
        {('000' + parseFloat(songLength).toFixed(1)).slice(-5)}
        <br />
        <span className='tinyButton'>
          <button name='timeStep' value='-1' onClick={handleTimeSlider}>-</button>
        </span>
        <span className='timeSlider'>
          <input type='range' name='timeSlider' min='-10'
            max={songLength} step='0.01' value={currentPos}
            onChange={handleTimeSlider} />
        </span>
        <span className='tinyButton'>
          <button name='timeStep' value='1' onClick={handleTimeSlider}>+</button>
        </span>
        <hr />
     BPM: {('000' + parseFloat(bpm).toFixed(1)).slice(-5)}
        <hr />
        <span className='small-button'>
          <button name='tempo_tap' onClick={handleTap}>Tap</button></span>
     &nbsp; (3 sec timeout)
        <hr />
     Click: off
        <input type='radio' name='clickOn' value='off' onClick={handleClick} />,
     1Bar preCount
        <input type='radio' name='clickOn' value='pre1'
          defaultChecked onClick={handleClick} />,
     2Bar preCount
        <input type='radio' name='clickOn' value='pre2'
          defaultChecked onClick={handleClick} />,
     all
        <input type='radio' name='clickOn' value='all' onClick={handleClick} />
        <hr />
     Click Vol.:&nbsp; {parseFloat(clickVolume, 10).toFixed(2)} &nbsp;
        <span className='shortSlider'>
          <input type='range' name='clickVolume' min='0.0'
            max='1.0' step='0.01' value={clickVolume}
            onChange={handleClick} />
        </span>

        <hr />
        <a href='url'>Save to a file (To be implemented)</a>
        <hr />
     link to user guide and updates
      </div>
    )
  }

  loadFile (event) {
    if (event.target.name !== 'loadFile') return
    if (event.target.files.length === 0) return
    let file = event.target.files[0]
    let reader = new FileReader()
    reader.onload = function (e) {
      context.decodeAudioData(reader.result,
        function (buffer) {
          this.params.inputAudio = buffer
          this.params.bpm = undefined
          this.params.offset = undefined
          this.makeClickTrack(this.params.inputAudio)
        }.bind(this),
        function (error) {
          console.log('ERROR decodeAudioData:')
        })
    }.bind(this)

    reader.readAsArrayBuffer(file)
  }

  // https://github.com/chrisguttandin/web-audio-beat-detector
  makeClickTrack(audioBuffer) {
    let channels=2
    let samplingRate = 44100
    offlineContext = new window.OfflineAudioContext(channels, audioBuffer.length, samplingRate)

     guess(audioBuffer,0,30) // 30 sec (use offset only)
       .then(({bpm, offset}) => {
          this.params.offset = offset
          this.Analyze(audioBuffer,offset,10) }) // end guess

  }

  Analyze(audioBuffer,from,duration) {
    analyze(audioBuffer,from,duration)
    .then((bpm) => {
      this.params.bpm = bpm
      console.log(from + ': bpm: ' + this.params.bpm)
      let count
      for(let beat=0; beat < 8; beat++){ 
        if (from + 60/this.params.bpm * beat < audioBuffer.duration){
          count = offlineContext.createBufferSource()
          count.buffer = cowbell_mid_sound
          count.connect(offlineContext.destination)
          count.start(from + 60/this.params.bpm * beat)
        }
      }

      from += 60/this.params.bpm * 8
      if (from < audioBuffer.duration){
        this.Analyze(audioBuffer,from,duration)
      } else {
        console.log('StartRendering')
        offlineContext.startRendering()
          .then((renderedBuffer) => {
          this.params.clickTrack = renderedBuffer
          console.log('Rendering complete, offset = ' + this.params.offset)
          this.setState({startButtonStr: 'Play',
            songLength: this.params.inputAudio.duration})
          })
        
      } 
    })
    .catch((err) => { console.log(err) 
        console.log('StartRendering anyway')
        offlineContext.startRendering()
          .then((renderedBuffer) => {
          this.params.clickTrack = renderedBuffer
          console.log('Rendering complete, offset = ' + this.params.offset)
          this.setState({startButtonStr: 'Play',
            songLength: this.params.inputAudio.duration})
          })
    }) // use current bpm
  } // End Analyze

  handleStartStop (event) {
    const {inputAudio, currentSource, currentClick} = this.params
    const {startButtonStr, currentPos} = this.state

    if (event.target.name === 'stop') {
      currentSource.stop()
      currentClick.stop()
      if (this.params.scheEvent !== undefined) {
        this.params.scheEvent.clear()
        this.params.scheEvent = undefined
      }
      this.setState({startButtonStr: 'Play', currentPos: 0.0})
      return
    }

    if (event.target.name === 'startPause') {
      if (startButtonStr === 'Play') {
        let count = context.createBufferSource()
        count.buffer = this.params.clickTrack
        count.connect(context.destination)

        let source = context.createBufferSource()
        source.buffer = inputAudio
        source.connect(context.destination)
        this.params.beginAt = context.currentTime
        source.start(context.currentTime, parseFloat(currentPos, 10))
        count.start(context.currentTime, parseFloat(currentPos, 10))

        this.params.currentSource = source
        this.params.currentClick = count

        this.setState({startButtonStr: 'Pause'})
        this.params.scheEvent = clock.callbackAtTime(
          function (event) {
            if (this.state.currentPos > inputAudio.duration) {
              this.handleStartStop({target: {name: 'stop'}})
            }
            this.setState({currentPos: this.state.currentPos + 0.1})
          }.bind(this), context.currentTime + 0.1)
          .repeat(0.1)
          .tolerance({early: 0.0, late: 0.1})
      } else if (startButtonStr === 'Pause') {
        currentSource.stop()
        currentClick.stop()
        if (this.params.scheEvent !== undefined) {
          this.params.scheEvent.clear()
          this.params.scheEvent = undefined
        }
        this.setState({startButtonStr: 'Resume'})
      } else if (startButtonStr === 'Resume') {
        let source = context.createBufferSource()
        source.buffer = inputAudio
        source.connect(context.destination)
        let count = context.createBufferSource()
        count.buffer = this.params.clickTrack
        count.connect(context.destination)

        this.params.currentSource = source
        this.params.currentClick = count
/*
        source.start(context.currentTime, currentPos)
        count.start(context.currentTime, currentPos)
*/
        source.start()
       // count.start(context.currentTime, 3)

        this.params.scheEvent = clock.callbackAtTime(
          function (event) {
            if (this.state.currentPos > inputAudio.duration) {
              this.handleStartStop({target: {name: 'stop'}})
            }
            this.setState({currentPos: this.state.currentPos + 0.1})
          }.bind(this), context.currentTime + 0.1)
          .repeat(0.1)
          .tolerance({early: 0.0, late: 0.1})
        this.setState({startButtonStr: 'Pause'})
      }
      return
    }

  }

  handleClick (event) {
    if (event.target.name === 'click') {
      if (event.target.value === 'off') this.setState({click: 'off'})
      else if (event.target.value === 'pre1') this.setState({click: 'pre1'})
      else if (event.target.value === 'pre2') this.setState({click: 'pre1'})
      else if (event.target.value === 'all') this.setState({click: 'all'})
      else console.log('click undefined value: ' + event.target.value)
      return
    }

    if (event.target.name === 'clickVolume') {
      this.setState({clickVolume: parseFloat(event.target.value, 10)})
    }
  }

  handleTap (event) {
    if (event.target.name !== 'tempo_tap') return

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
      this.setState({bpm: newBpm})
      this.tap.count++
    }
    this.tap.msecsPrevious = msecs
  }

  handleTimeSlider (event) {
    if (event.target.name === 'timeSlider') {
      this.setState({currentPos: parseFloat(event.target.value)})
      return
    }

    if (event.target.name === 'timeStep') {
      this.setState({currentPos: this.state.currentPos +
            parseFloat(event.target.value)})
    }
  } // end handleTimeSlider
}

export default App
