import React, { Component } from 'react';
// import logo from './logo.svg';
import packageJSON from '../package.json'
import './timePitchPlayer.css';
// import BufferLoader from './buffer-loader'


const version = (packageJSON.homepage + packageJSON.subversion).slice(-10)
const homepage = 'https://goto920.github.io/TimePitchPlayer.html'

window.AudioContext = window.AudioContext || window.webkitAudioContext
window.OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext

var context

class App extends Component {

  constructor (props){ 
    super(props)

    this.params = {
      inputAudio: undefined,
      currentFrame: undefined,
      bufferSize: 2048, // process unit
      gainNode: undefined,
      effector: undefined
    }

    this.state = {
      // totalTime: 0,
      currentSpeed: 100,
      pitchShiftSemitone: 0,
      pitchShiftCent: 0,
      currentTime: 0,
      currentVolume: 70,
      startButtonStr: 'NotReady'
    }
    this.setState = this.setState.bind(this)
    this.handleWindowClose = this.handleWindowClose.bind(this)
    this.loadFile = this.loadFile.bind(this)
    this.handleSpeedSlider = this.handleSpeedSlider.bind(this)
    this.handlePitchSlider = this.handlePitchSlider.bind(this)
    this.handleTimeSlider = this.handleTimeSlider.bind(this)
    this.handleVolumeSlider = this.handleVolumeSlider.bind(this)
    this.handlePlay = this.handlePlay.bind(this)
    this.audioEffect = this.audioEffect.bind(this)
  } // end constructor

  handleWindowClose(event) { 
    context.close()
  }

  componentWillMount () { // before render()
    window.addEventListener('beforeClosing', this.handleWindowClose)
  }
  
  componentDidMount () { // after render()
    context = new window.AudioContext()
    this.params.gainNode = context.createGain()
  }

  componentWillUnmount () { // before closing app
    window.removeEventListener('beforeClosing', this.handleWindowClose)
  }


  render() {
    const {loadFile,handleSpeedSlider, handlePitchSlider, 
           handleTimeSlider, handleVolumeSlider, handlePlay} 
           = this // func

    const {inputAudio} = this.params

    let totalTime
    if (inputAudio === undefined) totalTime = 0
    else totalTime = inputAudio.duration

    const {currentSpeed, 
           pitchShiftSemitone, pitchShiftCent,
           currentTime, currentVolume, startButtonStr} = this.state // state
    return (
      <div className="timePitchPlayer">
      Variable Time Pitch Player
      <hr />
      Input File: &nbsp; 
        <span className='selectFile'>
        <input type='file' name='loadFile' 
        accept='audio/*' onChange={loadFile} />
        </span>
      <hr />
      Playback Speed(%): {currentSpeed} <br />
      <span className='slider'> 
       <center>
       025<input type='range' name='speedSlider' min='25' max='200'
        value = {currentSpeed} onChange={handleSpeedSlider} />200 
       </center>
      </span>
      <hr />
      <span className='slider'> 
      PitchShift: {pitchShiftSemitone} semitone, {pitchShiftCent} Cents <br />
       <center>
       -6<input type='range' name='pitchShiftSemitoneSlider' 
        min='-6' max='6' value = {pitchShiftSemitone} 
        onChange={handlePitchSlider} />6<br />
       -100<input type='range' name='pitchShiftCentSlider' 
        min='-100' max='100' value = {pitchShiftCent} 
        onChange={handlePitchSlider} />100
       </center>
      </span>
      <hr />
      <span className='slider'> 
      Time: {('000' + parseFloat(currentTime).toFixed(1)).slice(-5)}
         /{('000' + parseFloat(totalTime).toFixed(1)).slice(-5)}<br />
        <center>
        <input type='range' name='timeSlider' min='0' max={totalTime}
        step='0.01' value = {currentTime} onChange={handleTimeSlider} />
        </center>
      </span>
      <hr />
      <span className='slider'> 
      Volume: {currentVolume}<br />
       <center>
       000<input type='range' name='volumeSlider' min='0' max='100'
        value = {currentVolume} onChange={handleVolumeSlider} />100<br />
       </center>
      </span>
      <hr />
      <span>
      <button name='startPause' onClick={handlePlay}> 
      {startButtonStr}
      </button> &nbsp;&nbsp;
      <button name='rewind' onClick={handlePlay}> 
      Rewind
      </button> &nbsp;&nbsp;
      <button name='save' onClick={handlePlay}> 
      Save
      </button>
      </span>
      <hr />
       Version: {version}, <a href={homepage} target='_blank'>Manual/Update</a>
      </div>
    );
  }
/////////////////////////////////////////////////////

  loadFile (event) {
   if (event.target.name !== 'loadFile') return
   if (event.target.files.length === 0) return

   this.setState({totalTime: 0})
   this.setState({startButtonStr: 'NotReady'})
   let file = event.target.files[0]

   let reader = new FileReader()
   reader.onload = function (e) {
      context.decodeAudioData(reader.result,
      function (buffer) {
        // sampleRate, length, duration, numberOfChannels
        this.params.currentFrame = 0
        this.params.inputAudio = buffer 
        this.setState({startButtonStr: 'Start', currentTime: 0})
      }.bind(this), 
      function (error) {
      })
   }.bind(this)
   reader.readAsArrayBuffer(file)
 
  } // end loadFile()

// UI handlers
  handleSpeedSlider(event) { 
     if (event.target.name !== 'speedSlider') return
     this.setState({currentSpeed: event.target.value})
  }

  handlePitchSlider(event) { 

     if (event.target.name === 'pitchShiftSemitoneSlider'){
       this.setState({pitchShiftSemitone: event.target.value})
     } else if (event.target.name === 'pitchShiftCentSlider'){
       this.setState({pitchShiftCent: event.target.value})
     } else return 

     this.params.pitchShift 
         = 100*this.state.pitchShiftSemitone + this.state.pitchShiftcent
  }

  handleTimeSlider(event) { 
     if (event.target.name !== 'timeSlider') return

     if (context.state === 'suspended' 
          && this.params.currentSource !== undefined){ 
        this.params.currentSource.stop()
        this.setState({currentTime: event.target.value})
     }

  }

  handleVolumeSlider(event) { 
     if (event.target.name !== 'volumeSlider') return
     this.params.gainNode.gain.value = event.target.value/100
     this.setState({currentVolume: event.target.value})
  }

  handlePlay(event) { 
     let {inputAudio,gainNode} = this.params // read only

     if (event.target.name === 'startPause') {
        if (this.state.startButtonStr === 'Start'
           || this.state.startButtonStr === 'Resume'){ 

         if (context.state === 'suspended') context.resume()

         this.params.currentFrame 
            = this.state.currentTime * inputAudio.sampleRate
         let source = context.createBufferSource()  
         source.buffer = inputAudio
         this.params.currentSource = source
         this.params.effector = this.audioEffect()
         source.connect(this.params.effector)
         this.params.effector.connect(gainNode)
         gainNode.connect(context.destination)
         source.start(0, this.state.currentTime)
         this.setState({ startButtonStr: 'Pause' })

       } else if (this.state.startButtonStr === 'Pause'){
          context.suspend()
          this.params.currentSource.stop()
          this.params.effector.disconnect()
          this.params.effector.onaudioprocess = null
          this.setState({ startButtonStr: 'Resume' })
       }

      } else if (event.target.name === 'rewind') {
         if (this.params.currentSource !== undefined){ 
           this.params.currentSource.stop()
           context.suspend()
           this.params.currentFrame = 0
           this.params.effector.disconnect()
           this.params.effector.onaudioprocess=null
           this.setState({currentTime: 0, startButtonStr: 'Start'})
         }
      } else if (event.target.name === 'save') {
         // put codes here
     } 
  }


// https://noisehack.com/custom-audio-effects-javascript-web-audio-api/
// https://developer.mozilla.org/ja/docs/Web/API/AudioContext/createScriptProcessor
  audioEffect(){
    let bufSize = 1024
    let node = context.createScriptProcessor(bufSize,2,2)
    node.onaudioprocess = function(e) {
       let inputL = e.inputBuffer.getChannelData(0)
       let inputR = e.inputBuffer.getChannelData(1)
       let outputL = e.outputBuffer.getChannelData(0)
       let outputR = e.outputBuffer.getChannelData(1)
       for (let i=0; i < bufSize; i++){
         outputL[i] = inputL[i]
         outputR[i] = inputR[i]
       }

      this.params.currentFrame += bufSize
      this.setState({
         currentTime: 
           this.params.currentFrame/this.params.inputAudio.sampleRate
      })
    }.bind(this)
    
    return node 
  }// end audioEffect

}

export default App;
