import React, { Component } from 'react';
// import logo from './logo.svg';
import './App.css';
import {PitchShifter} from 'soundtouchjs'
import packageJSON from '../package.json'

const version = (packageJSON.homepage + packageJSON.subversion).slice(-10)
const homepage = 'https://goto920.github.io/demos/variableplayer/'

window.AudioContext = window.AudioContext || window.webkitAudioContext

var audioCtx;
var gainNode;
// =  audioCtx.createGain()
var shifter = 0 // null

class App extends Component {

  constructor (props){
    super(props)

    this.params = {
      audioBuffer: 0
    }

    this.state = {
      playSpeed: 100, // in percent
      playPitch: 0, // in semi-tone (real value)
      playPitchSemi: 0, // in semi-tone (integer part)
      playPitchCents: 0, // percent for one semitone
      playVolume: 70, // in percent
      startButtonStr: 'Wait' 
    }

    this.setState = this.setState.bind(this)
    this.handleWindowClose = this.handleWindowClose.bind(this)
    this.loadFile = this.loadFile.bind(this)
    this.fetchFile = this.fetchFile.bind(this)
    this.handleSpeedSlider = this.handleSpeedSlider.bind(this)
    this.handlePitchSlider = this.handlePitchSlider.bind(this)
//    this.handleTimeSlider = this.handleTimeSlider.bind(this)
    this.handleVolumeSlider = this.handleVolumeSlider.bind(this)
    this.handlePlay = this.handlePlay.bind(this)
    
  } // end constructor

  handleWindowClose(event) { 
    audioCtx.close()
  }

  componentWillMount () { // before render()
    window.addEventListener('beforeClosing', this.handleWindowClose)
  }
  
  componentDidMount () { // after render()
    audioCtx = new window.AudioContext()
    gainNode = audioCtx.createGain()
  }

  componentWillUnmount () { // before closing app
    window.removeEventListener('beforeClosing', this.handleWindowClose)
  }


  render() {
    const {loadFile, fetchFile, 
           handleSpeedSlider, handlePitchSlider, handleVolumeSlider, 
           handlePlay} = this
    const {playSpeed, playPitch, playPitchSemi, playPitchCents,
           playVolume, startButtonStr} = this.state

    return (
      <div className="App">
      Variable speed/pitch audio player<br /> 
      with soundtouchjs by KG
      <hr />
      Input Audio (url or local file): <br />
        <span className='selectFile'>
        <input type='file' name='loadFile' 
        accept='audio/*' onChange={loadFile} /><br />
        </span>
        <span className='selectFile'>
        URL and Enter <input type='url' name='fetchFile' 
        accept='audio/*' onKeyPress={fetchFile} />
        </span>
      <hr />

      Playback Speed(%): {playSpeed} <br />
        <span className='slider'> 
         <center>
         025<input type='range' name='speedSlider' min='25' max='200'
         value = {playSpeed} onChange={handleSpeedSlider} />200 
         </center>
        </span>
      <hr />
      Pitch (semi-tone): {playPitch} <br />
        <span className='slider'> 
         <center>
         -12<input type='range' name='pitchSliderSemi' min='-12' max='12'
         value = {playPitchSemi} onChange={handlePitchSlider} />12<br />
         -100<input type='range' name='pitchSliderCents' min='-100' max='100'
         value = {playPitchCents} onChange={handlePitchSlider} />100<br />
         </center>

        </span>
      <hr />

      Volume: {playVolume}<br />
        <span className='slider'> 
         <center>
         000<input type='range' name='volumeSlider' min='0' max='150'
         value = {playVolume} onChange={handleVolumeSlider} />150<br />
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
{/*
        <button name='save' onClick={handlePlay}> 
        Save
        </button>
*/}

      </span>
      <hr />
        Version: {version}, &nbsp;
        <a href={homepage} 
         target="_blank" rel="noopener noreferrer">Manual/Update</a>
      </div>
    ) // end return

  } // end render()

///////////////////////////////////////////////////

  loadFile (event) {
   if (event.target.name !== 'loadFile') return
   if (event.target.files.length === 0) return

   this.setState({totalTime: 0})
   this.setState({startButtonStr: 'Wait'})
   let file = event.target.files[0]

   let reader = new FileReader()

   reader.onload = function (e) {

      audioCtx.decodeAudioData(reader.result, 
        function(audioBuffer) {
          this.params.audioBuffer = audioBuffer
          shifter = new PitchShifter(audioCtx, audioBuffer, 1024)
          shifter.tempo = this.state.playSpeed/100.0
          shifter.pitch = Math.pow(2.0,this.state.playPitch/12.0)
          this.setState({startButtonStr: 'Start', currentTime: 0})
          console.log ("read")
        }.bind(this),
        function (error) { console.log ("Filereader error: " + error.err) })

   }.bind(this)

   reader.readAsArrayBuffer(file)

 } // end loadFile()
   
fetchFile (event) {

   if (event.target.name !== 'fetchFile') return

   let code = event.keyCode || event.charCode 
   if (code !== 13) return

//   console.log ("Got enter")

   let url = event.target.value 
   this.setState({startButtonStr: 'Wait'})

   if (shifter) { shifter.off() }
   console.log('fetchFile: ' + url)

   fetch(url)
     .then(response => response.arrayBuffer())
     .then(buffer => {
       audioCtx.decodeAudioData(buffer, audioBuffer => {
          this.params.audioBuffer = audioBuffer
          shifter = new PitchShifter(audioCtx, audioBuffer, 1024)
          shifter.tempo = this.state.playSpeed/100.0
          shifter.pitch = Math.pow(2.0,this.state.playPitch/12.0)
          this.setState({startButtonStr: 'Start', currentTime: 0})
       })  // end decode 
     }) // end then

} // end fetchFile()

// UI handlers
  handleSpeedSlider(event) { 
     if (event.target.name !== 'speedSlider') return
     if (shifter) shifter.tempo = event.target.value/100.0
     this.setState({playSpeed: event.target.value})
  }

  handlePitchSlider(event) { 

     let pitchSemi

     if (event.target.name === 'pitchSliderSemi' ){
       pitchSemi = event.target.value*1.0 + this.state.playPitchCents/100.0
       this.setState({playPitchSemi: event.target.value})
     } 

     if (event.target.name === 'pitchSliderCents' ){
       pitchSemi = this.state.playPitchSemi*1.0 + event.target.value/100.0
       this.setState({playPitchCents: event.target.value})
     }

     if (shifter) {
       shifter.pitch = Math.pow(2.0, pitchSemi/12.0)
     }

     this.setState({playPitch: pitchSemi})

  }

  handleTimeSlider(event) { 
     if (event.target.name !== 'timeSlider') return
  }

  handleVolumeSlider(event) { 
     if (event.target.name !== 'volumeSlider') return
     let vol = event.target.value*1.0
     gainNode.gain.value = vol/100.0
     this.setState({playVolume: vol})
  }

  handlePlay(event) { 

// Unlock iOS 
     let buffer = audioCtx.createBuffer(1,1,22050); 
     let source = audioCtx.createBufferSource();
     source.buffer = buffer;
     source.connect (audioCtx.destination);
     source.start();
// End unlock

     if (event.target.name === 'startPause') {

       if (this.state.startButtonStr === 'Start'
           || this.state.startButtonStr === 'Resume'){ 

        shifter.connect(gainNode)
        gainNode.connect(audioCtx.destination)
        this.setState({ startButtonStr: 'Pause' })

       } else if (this.state.startButtonStr === 'Pause'){
        if (!shifter) return

        shifter.disconnect()
        this.setState({ startButtonStr: 'Resume' })

       }

     } 

     if (event.target.name === 'rewind') {

        if (!shifter) return
        shifter.disconnect()
        shifter.off()
        shifter = 0 // null

        shifter = new PitchShifter(audioCtx, this.params.audioBuffer, 1024)
        shifter.tempo = this.state.playSpeed/100.0
        shifter.pitch = Math.pow(2.0,this.state.playPitch/12.0)

        this.setState({startButtonStr: 'Start', currentTime: 0})
     } // end if

     if (event.target.name === 'Save') {
        shifter.disconnect()
     } // end if

  } // end handlePlay()
 
} // end class

export default App;
