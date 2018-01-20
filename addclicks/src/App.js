import React, { Component } from 'react';
import './addClicks.css'
import WAAClock from 'waaclock'
// import logo from './logo.svg'
// import './App.css'

window.AudioContext = window.AudioContext || window.webkitAudioContext
var context
var clock

class App extends Component {
  constructor (props) {
    super(props)
    this.params = {
       inputAudio: undefined,
       currentSource: undefined,
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
  }

  componentWillMount () { // before render()
    window.addEventListener('beforeunload', this.handleWindowClose)
  }

  componentDidMount () {  // after render()
    context = new window.AudioContext()
    clock = new WAAClock(context)
    clock.start()
  }

  componentWillUnMount() { // before closing app
    window.removeEventListener('beforeunload', this.handleWindowClose)
  }

  handleWindowClose (event) { // clean up before exit
    if(this.params.scheEvent !== undefined) this.params.scheEvent.clear()
    clock.stop()
    context.close()
  }
  
  render() {
    const {handleStartStop,handleTap,loadFile,handleClick,
      handleTimeSlider} = this
    const {playing,bpm,startButtonStr,songLength,currentPos,clickVolume} 
      = this.state

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
     &nbsp; <button name='startPause' onClick={handleStartStop}>
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
     <input type='radio' name='clickOn' value='off' onClick={handleClick}/>, 
     1Bar preCount
     <input type='radio' name='clickOn' value='pre1' 
        defaultChecked={true} onClick={handleClick}/>,
     2Bar preCount
     <input type='radio' name='clickOn' value='pre2' 
        defaultChecked={true} onClick={handleClick}/>,
     all
     <input type='radio' name='clickOn' value='all' onClick={handleClick}/>
     <hr />
     Click Vol.:&nbsp; {parseFloat(clickVolume,10).toFixed(2)} &nbsp;
     <span className='shortSlider'>
     <input type='range' name='clickVolume' min='0.0'
       max='1.0' step='0.01' value={clickVolume} 
       onChange={handleClick} />
     </span>

     <hr />
     <a href="url">Save to a file (To be implemented)</a>
     <hr />
     link to user guide and updates
     </div>
    )
  }

  loadFile(event){

    if (event.target.name !== 'loadFile') return

    if (event.target.files.length === 0) return

    let file = event.target.files[0]

    let reader = new FileReader()
    reader.onload = function(e) {
      context.decodeAudioData(reader.result,
        function(buffer) {
          this.params.inputAudio = buffer
          // console.log('decoded')
          this.setState({startButtonStr: 'Play',
                         songLength: this.params.inputAudio.duration})
        }.bind(this),
        function(error){ 
          console.log('ERROR decodeAudioData:') 
        })
    }.bind(this)

    reader.readAsArrayBuffer(file)
    return
  }

  handleStartStop(event){
    const {inputAudio,currentSource} = this.params
    const {startButtonStr,currentPos} = this.state

    if (event.target.name === 'stop'){
      currentSource.stop()
      if (this.params.scheEvent !== undefined) {
         this.params.scheEvent.clear()
         this.params.scheEvent = undefined
      }
      this.setState({startButtonStr: 'Play', currentPos: 0.0})
      return
    }

    if (event.target.name === 'startPause'){
      if (startButtonStr === 'Play') {
        let source = context.createBufferSource()
        source.buffer = inputAudio
        source.connect(context.destination)
        this.params.beginAt = context.currentTime
        source.start(context.currentTime,parseFloat(currentPos,10))
        this.params.currentSource = source
        this.setState({startButtonStr: 'Pause'})
        this.params.scheEvent = clock.callbackAtTime(
          function(event) {
            if (this.state.currentPos > inputAudio.duration){
              this.handleStartStop({target: {name: 'stop'}})
            }
            this.setState({currentPos: this.state.currentPos + 0.1})
          }.bind(this), context.currentTime + 0.1)
          .repeat(0.1)
          .tolerance({early: 0.0, late: 0.1})
      } else if (startButtonStr === 'Pause'){
        currentSource.stop()
        if (this.params.scheEvent !== undefined) {
          this.params.scheEvent.clear()
          this.params.scheEvent = undefined
        }
        this.setState({startButtonStr: 'Resume'})
      } else if (startButtonStr === 'Resume'){
        let source = context.createBufferSource()
        source.buffer = inputAudio
        source.connect(context.destination)
        this.params.currentSource = source
        source.start(context.currentTime, currentPos)

        this.params.scheEvent = clock.callbackAtTime(
          function(event) {
            if (this.state.currentPos > inputAudio.duration){
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
   
    if (event.target.name === 'stop') {
      currentSource.stop()
      this.params.startButtonStr = 'play'
      if (this.params.scheEvent) this.params.scheEvent.cancel()
      return
    }

  }

  handleClick (event){
    if (event.target.name === 'click') {
      if (event.target.value === 'off') this.setState({click: 'off'})
      else if (event.target.value === 'pre1') this.setState({click: 'pre1'})
      else if (event.target.value === 'pre2') this.setState({click: 'pre1'})
      else if (event.target.value === 'all') this.setState({click: 'all'})
      else console.log('click undefined value: ' + event.target.value)
      return
    }

    if (event.target.name === 'clickVolume') {
      this.setState({clickVolume: parseFloat(event.target.value,10)}) 
      return
    }
  }

  handleTap (event){

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

  handleTimeSlider(event){
    if (event.target.name === 'timeSlider'){
      this.setState({currentPos: parseFloat(event.target.value)})
      return
    }

    if (event.target.name === 'timeStep'){
      this.setState({currentPos: this.state.currentPos 
            + parseFloat(event.target.value)})
      return
    }
  } // end handleTimeSlider

}

export default App;
