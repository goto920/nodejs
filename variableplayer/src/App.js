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
var shifter = null // null

class App extends Component {

  constructor (props){
    super(props)

    this.params = {
      audioBuffer: undefined,
    }

    this.state = {
      playingAt: 0,
      timeA: 0,
      timeB: 0,
      playSpeed: 100, // in percent
      playPitch: 0, // in semi-tone (real value)
      playPitchSemi: 0, // in semi-tone (integer part)
      playPitchCents: 0, // percent for one semitone
      playVolume: 80, // in percent
      startButtonStr: 'loadFile!', 
      loopButtonStr: 'LoopAB'
    }

    this.setState = this.setState.bind(this)
    this.handleWindowClose = this.handleWindowClose.bind(this)
    this.loadFile = this.loadFile.bind(this)
    this.fetchFile = this.fetchFile.bind(this)
    this.handleSpeedSlider = this.handleSpeedSlider.bind(this)
    this.handlePitchSlider = this.handlePitchSlider.bind(this)
    this.handleTimeSlider = this.handleTimeSlider.bind(this)
    this.handleVolumeSlider = this.handleVolumeSlider.bind(this)
    this.handlePlay = this.handlePlay.bind(this)
    this.handleSave = this.handleSave.bind(this)
    this.timer = this.timer.bind(this);
    this.handleLoop = this.handleLoop.bind(this)
    
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
    clearInterval(this.state.intervalId);
  }

  timer(){
    if (shifter !== null ) {
      this.setState({playingAt: 
         parseFloat(this.state.timeA) + parseFloat(shifter.timePlayed)});
      if (shifter.percentagePlayed === 100) 
        this.handlePlay({target: {name: 'LoopAB'}});
    }

  } // end timer

  render() {
    const {loadFile, fetchFile, 
           handleSpeedSlider, handlePitchSlider, handleVolumeSlider, 
           handleTimeSlider, handlePlay, handleSave, handleLoop} = this
    const {playingAt, timeA, timeB,
           playSpeed, playPitch, playPitchSemi, playPitchCents,
           playVolume, startButtonStr, loopButtonStr} = this.state

    let duration = 0;
    if (this.params.audioBuffer !== undefined) 
       duration = this.params.audioBuffer.duration

    return (
      <div className="App">
      Variable speed/pitch audio player<br /> 
      with soundtouchjs by KG
      <hr />
      Input Audio (local file): <br />
        <span className='selectFile'>
        <input type='file' name='loadFile' 
        accept='audio/*' onChange={loadFile} /><br />
        </span>
{/*
        <span className='selectFile'>
        URL and Enter <input type='url' name='fetchFile' 
        accept='audio/*' onKeyPress={fetchFile} />
        </span>
*/}
      <hr />

      Speed(%): {playSpeed} <br />
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
        Time: {Math.round(playingAt)}<br />
        <span className='slider'> 
        <center>
        0<input type='range' name='timeSlider'
        min='0' max={duration}
        value = {playingAt} step='1'
        onChange={handleTimeSlider} />
        {Math.round(duration)}<br />
        </center>
        <button name='setA' onClick={handleLoop} >setA</button>
        : {Math.round(timeA*10)/10} &nbsp;&nbsp;
        <button name='setB' onClick={handleLoop} >setB</button>
        : {Math.round(timeB*10)/10}
        </span>
        <hr />
      Volume: {playVolume}<br />
        <span className='slider'> 
         <center>
         0<input type='range' name='volumeSlider' min='0' max='150'
         value = {playVolume} onChange={handleVolumeSlider} />150<br />
         </center>
        </span>
      <hr />

      <span>
        <button name='startPause' onClick={handlePlay}> 
        {startButtonStr}
        </button> &nbsp;&nbsp;
        <button name='LoopAB' onClick={handleLoop} >
        {loopButtonStr}</button> &nbsp;&nbsp;
        <button name='reset' onClick={handlePlay}> 
        ResetAB
        </button> &nbsp;&nbsp;
{/*
        <button name='save' onClick={handleSave}> 
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
   this.setState({startButtonStr: 'loadFile!'})
   let file = event.target.files[0]

   let reader = new FileReader()

   reader.onload = function (e) {

      audioCtx.decodeAudioData(reader.result, 
        function(audioBuffer) {
          this.params.audioBuffer = audioBuffer
          this.setState({startButtonStr: 'PlayFromA', playingAt: 0})
          this.setState({timeA: 0})
          this.setState({timeB: audioBuffer.duration})
//          console.log ("read")
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
   this.setState({startButtonStr: 'loadFile!'})

   if (shifter) { shifter.off() }
   console.log('fetchFile: ' + url);

   fetch(url)
     .then(response => response.arrayBuffer())
     .then(buffer => {
       audioCtx.decodeAudioData(buffer, audioBuffer => {
          this.params.audioBuffer = audioBuffer;
          this.setState({startButtonStr: 'PlayFromA'});
          this.setState({timeA: 0, timeB: audioBuffer.duration});
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

     if (this.state.startButtonStr === 'PlayFromA') {
        this.setState({playingAt: event.target.value});
     }
  }

  handleVolumeSlider(event) { 
     if (event.target.name !== 'volumeSlider') return
     let vol = event.target.value*1.0
     gainNode.gain.value = vol/100.0
     this.setState({playVolume: vol})
  }

  handlePlay(event) { 

     const {audioBuffer} = this.params;
//     const {timeA, timeB} = this.state;

// Unlock iOS 
     let buffer = audioCtx.createBuffer(1,1,22050); 
     let source = audioCtx.createBufferSource();
     source.buffer = buffer;
     source.connect (audioCtx.destination);
     source.start();
// End unlock

     let timeB = this.state.timeB;
     let timeA = this.state.timeA;

     if (event.target.name === 'LoopAB') {
       if (timeB <= timeA) timeB = timeA + 10;

       let partialAudioBuffer = 
          audioCtx.createBuffer(2,
           (timeB-timeA)*audioBuffer.sampleRate, 
           audioBuffer.sampleRate);
       let left  = audioBuffer.getChannelData(0);
       let right = audioBuffer.getChannelData(1);

       left  = left.subarray(
         timeA*audioBuffer.sampleRate, timeB*audioBuffer.sampleRate);
         partialAudioBuffer.copyToChannel(left,0,0);

       if (audioBuffer.numberOfChannels === 2) {
         right = right.subarray(
         timeA*audioBuffer.sampleRate, timeB*audioBuffer.sampleRate);
         partialAudioBuffer.copyToChannel(right,1,0);
       }

       shifter = new PitchShifter(audioCtx, partialAudioBuffer, 1024)
       shifter.tempo = this.state.playSpeed/100.0
       shifter.pitch = Math.pow(2.0,this.state.playPitch/12.0)

       shifter.connect(gainNode)
       gainNode.connect(audioCtx.destination)

       let intervalId = setInterval(this.timer, 1000);
       this.setState({intervalId: intervalId});

     } // end ABloop

     if (event.target.name === 'startPause') {

       if (this.state.startButtonStr === 'Pause'){

         this.setState({timeA: this.state.playingAt});
         clearInterval(this.state.intervalId);

         if (shifter === null) return
          this.setState({PlayingAt: 
            parseFloat(timeA) + parseFloat(shifter.timePlayed)});

          shifter.disconnect();
          shifter.off();
          shifter = null;
          this.setState({ startButtonStr: 'PlayFromA' })

       } 

       if (this.state.startButtonStr === 'PlayFromA') {
         if (this.state.loopButtonStr !== 'LoopAB') return;

         let partialAudioBuffer = 
            audioCtx.createBuffer(2,
             (audioBuffer.duration - this.state.timeA)
              *audioBuffer.sampleRate, 
              audioBuffer.sampleRate);
         let left  = audioBuffer.getChannelData(0);
         let right = audioBuffer.getChannelData(1);

         left  = left.subarray(
           this.state.timeA*audioBuffer.sampleRate, 
           audioBuffer.duration*audioBuffer.sampleRate);
           partialAudioBuffer.copyToChannel(left,0,0);

         if (audioBuffer.numberOfChannels === 2) {
           right = right.subarray(
           this.state.timeA*audioBuffer.sampleRate, 
           audioBuffer.duration*audioBuffer.sampleRate);
           partialAudioBuffer.copyToChannel(right,1,0);
         }

       shifter = new PitchShifter(audioCtx, partialAudioBuffer, 1024)
       shifter.tempo = this.state.playSpeed/100.0
       shifter.pitch = Math.pow(2.0,this.state.playPitch/12.0)

       shifter.connect(gainNode)
       gainNode.connect(audioCtx.destination)

       let intervalId = setInterval(this.timer, 1000);
       this.setState({intervalId: intervalId});
       this.setState({startButtonStr: 'Pause'});

       }

     } 

     if (event.target.name === 'reset') {

        if (shifter) {
          shifter.disconnect();
          shifter.off();
          shifter = null; // null
          clearInterval(this.state.intervalId);
        }

        this.setState({startButtonStr: 'PlayFromA', 
          playingAt: 0, timeA: 0, timeB: audioBuffer.duration})

     } // end if

     if (event.target.name === 'Save') {
        shifter.disconnect()
        shifter.off();
        shifter = null; // null
     } // end if

  } // end handlePlay()

  handleSave(event) { 
  }

  handleLoop(event) {
    if (event.target.name === 'setA') {
      this.setState ({timeA: this.state.playingAt});
    }
    if (event.target.name === 'setB'){
      if (this.state.playingAt >=  this.state.timeA)
        this.setState ({timeB: parseFloat(this.state.playingAt)});
      else
        this.setState ({timeB: parseFloat(this.state.timeA) + parseFloat(10)});
    }

    if (event.target.name === 'LoopAB'){

      if (this.state.loopButtonStr === 'LoopAB'){ 
        if (this.state.startButtonStr !== 'PlayFromA') return;

        if (shifter){
          shifter.disconnect();
          shifter.off();
        }

        this.handlePlay({target: {name: 'LoopAB'}});
        this.setState ({loopButtonStr: 'StopLoop'});

      } 
      else if (this.state.loopButtonStr === 'StopLoop'){

        if (shifter){
          shifter.disconnect();
          shifter.off();
        }

        clearInterval(this.state.intervalId);
        this.setState ({loop: false});
        this.setState ({loopButtonStr: 'LoopAB'});
      }
    }
  }
 
} // end class

export default App;
