import React, { Component } from 'react';
// import logo from './logo.svg';
// import './App.css';
import './addClicks.css'

window.AudioContext = window.AudioContext || window.webkitAudioContext
var context

class App extends Component {
  constructor (props) {
    super(props)
    this.setState = this.setState.bind(this)
    this.inputAudio = undefined
    this.currentSource = undefined
    this.state = {
      playing: false,
      decoded: false,
      click: 'pre',
      bpm: 0 
    }

    this.tap = {
      firstTapMsecs: 0,
      count: 0,
      msecsFirst: 0,
      msecsPrevious: 0
    }

    this.loadFile = this.loadFile.bind(this)
    this.handleStartStop = this.handleStartStop.bind(this)
    this.handleTap = this.handleTap.bind(this)
    this.handleClick = this.handleClick.bind(this)
    this.handleWindowClose = this.handleWindowClose.bind(this)
  }

  componentWillMount () { // before render()
    window.addEventListener('beforeunload', this.handleWindowClose)
  }

  componentDidMount () {  // after render()
    context = new window.AudioContext()
  }

  componentWillUnMount() { // before closing app
    window.removeEventListener('beforeunload', this.handleWindowClose)
  }

  handleWindowClose (event) { // clean up before exit
    // clock.stop()
    context.close()
  }
  
  render() {
    const {handleStartStop,handleTap,loadFile,handleClick} = this
    const {playing,decoded,bpm} = this.state

    return (
     <div className='addClicks'>
     Add clicks to a music track for practice
     <hr />
     Select sound file: <br />
     <input type='file' accept='audio/*' onChange={loadFile} /><br />
     <hr />
     {decoded ? 'Ready to Play' : 'Not loaded'}&nbsp;
     <button name='startStop' onClick={handleStartStop}>
     {playing ? 'Stop' : 'Start'}
     </button> &nbsp;
     BPM: {parseFloat(bpm).toFixed(1)}
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
      context.decodeAudioData(reader.result,
        function(buffer) {
          this.inputAudio = buffer
          this.setState({decoded: true})
        }.bind(this),
        function(error){ 
          console.log('ERROR decodeAudioData:') 
        })
    }.bind(this)

    reader.readAsArrayBuffer(file)
    return
  }

  handleStartStop(event){
    if (event.target.name !== 'startStop') return

    const {playing} = this.state
    let {currentSource} = this

    if (!playing) {
      if (currentSource !== undefined) currentSource.stop()
      let source = context.createBufferSource()
      source.buffer = this.inputAudio
      source.connect(context.destination)
      source.start()
      this.currrentSource = source
      this.setState({playing: true})
    } else {
      if (currentSource !== undefined) currentSource.stop()
      this.currentSource = undefined
      this.setState({playing: false})
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

}

export default App;
