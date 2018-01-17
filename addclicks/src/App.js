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
      startButtonStr: 'not ready',
      stateStr: 'No sound data',
      currentPos: 0,
      click: 'pre',
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
//    clock.start()
  }

  componentWillUnMount() { // before closing app
    window.removeEventListener('beforeunload', this.handleWindowClose)
  }

  handleWindowClose (event) { // clean up before exit
    clock.stop()
    context.close()
  }
  
  render() {
    const {handleStartStop,handleTap,loadFile,handleClick,
      handleTimeSlider} = this
    const {playing,bpm,startButtonStr,stateStr,songLength,currentPos} 
      = this.state

    return (
     <div className='addClicks'>
     Add clicks to a music track for practice
     <hr />
     sound file: &nbsp; 
     <input type='file' name='loadFile' 
     accept='audio/*' onChange={loadFile} />
     <hr />
     &nbsp; <button name='startPause' onClick={handleStartStop}>
     {startButtonStr}
     </button> 
     <button name='stop' onClick={handleStartStop}>Stop</button> 
     &nbsp;
     {('000' + parseFloat(currentPos).toFixed(1)).slice(-5)}/{parseFloat(songLength).toFixed(1)}:<br /> 
     <span className='timeSlider'>
     <input type='range' name='timeSlider' min='-10' 
       max={songLength} step='0.01' value={currentPos} 
       onChange={handleTimeSlider} />
     </span>
     <hr />
     BPM: {('000' + parseFloat(bpm).toFixed(1)).slice(-5)}
     <hr />
     <button name='tempo_tap' onClick={handleTap}>Tap</button> &nbsp;
     (timeout: 3 sec)
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
//      this.setState({stateStr: 'decoding...(wait)'})
      context.decodeAudioData(reader.result,
        function(buffer) {
          this.params.inputAudio = buffer
          console.log('decoded')
//          this.setState({decoded: true, stateStr: 'ready to play'})
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
    const {startButtonStr} = this.state

    if (event.target.name === 'stop'){
      currentSource.stop()
      this.params.scheEvent.clear()
      this.setState({startButtonStr: 'Play', currentPos: 0.0})
      return
    }

    if (event.target.name === 'startPause'){
      if (startButtonStr === 'Play') {
        let source = context.createBufferSource()
        source.buffer = inputAudio
        source.connect(context.destination)
        this.params.beginAt = context.currentTime
        source.start(10.0)
        this.params.currentSource = source
        this.setState({startButtonStr: 'Pause'})
        clock.start()
        this.params.scheEvent = clock.callbackAtTime(
          function(event) {
            if (this.state.currentPos > inputAudio.duration) {
              // event.cancel()
              this.handleStartStop({target:{name:'stop'}})
            }
            this.setState({
             currentPos: context.currentTime - this.params.beginAt})
          }.bind(this), 0
         ).repeat(0.1)
          .tolerance({early: 0.0, late: 1.0})
      } else if (startButtonStr === 'Pause'){
        this.params.pausedAt = this.state.currentPos 
               + context.currentTime - this.params.beginAt
        this.setState({startButtonStr: 'Resume', 
                       currentPos: this.params.pausedAt})
        currentSource.stop()
        this.params.scheEvent.clear()
        console.log('paused at: ' + this.params.pausedAt)
      } else if (startButtonStr === 'Resume'){
        this.params.beginAt = context.currentTime
        this.params.scheEvent = clock.callbackAtTime(
          function(event) {
            if (this.state.currentPos > inputAudio.duration) {
               // event.cancel()
               this.handleStartStop({target:{name:'stop'}})
            }
            this.setState({currentPos: this.params.pausedAt 
                + context.currentTime - this.params.beginAt})
          }.bind(this), 0
         ).repeat(0.1)
          .tolerance({early: 0.1, late: 1.0})

        this.setState({startButtonStr: 'Pause'})
        let source = context.createBufferSource()
        this.params.currentSource = source
        source.buffer = inputAudio
        source.connect(context.destination)
        source.start(0, this.params.pausedAt);
        console.log('resume at: ' + this.params.pausedAt)
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
    if (event.target.name !== 'click') return

    if (event.target.value === 'off') this.setState({click: 'off'})
    else if (event.target.value === 'pre1') this.setState({click: 'pre1'})
    else if (event.target.value === 'pre2') this.setState({click: 'pre1'})
    else if (event.target.value === 'all') this.setState({click: 'all'})
    else console.log('click undefined value: ' + event.target.value)

    return
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
     this.setState({currentPos: parseFloat(event.target.value)})
  }

}

export default App;
