import React, { Component } from 'react';
// import logo from './logo.svg';
import './App.css';
import {PitchShifter} from 'soundtouchjs'
import packageJSON from '../package.json'
import {saveAs} from 'file-saver';
import * as toWav from 'audiobuffer-to-wav';
// import {fetch as fetchPolyfill} from 'whatwg-fetch';

const version = (packageJSON.homepage + packageJSON.subversion).slice(-10)
const homepage = 'https://goto920.github.io/demos/variableplayer/'

window.AudioContext = window.AudioContext || window.webkitAudioContext

var audioCtx;
var gainNode;
// =  audioCtx.createGain()
var shifter = null // null

var iOS = false;
if(  navigator.userAgent.match(/iPhone/i) 
  || navigator.userAgent.match(/iPod/i)
  || navigator.userAgent.match(/iPad/i)){
  iOS = true;
}


class App extends Component {

  constructor (props){
    super(props)

    this.params = {
      filename: undefined,
      audioBuffer: undefined,
      isPlaying: false,
      loop: false,
      exportDataL: undefined,
      exportDataR: undefined,
      exportBuffer: undefined,
      save: false
    }

    this.state = {
      playingAt: 0,
      playingAtSlider: 0,
      timeA: 0,
      timeB: 0,
      playSpeed: 100, // in percent
      playPitch: 0, // in semi-tone (real value)
      playPitchSemi: 0, // in semi-tone (integer part)
      playPitchCents: 0, // percent for one semitone
      playVolume: 80, // in percent
      startButtonStr: 'loadFile!', 
      loopButtonStr: 'LoopAB',
      saveButtonStr: 'Save'
    }

    this.setState = this.setState.bind(this)
    this.handleWindowClose = this.handleWindowClose.bind(this)
    this.loadFile = this.loadFile.bind(this)
    this.handleSpeedSlider = this.handleSpeedSlider.bind(this)
    this.handlePitchSlider = this.handlePitchSlider.bind(this)
    this.handleTimeSlider = this.handleTimeSlider.bind(this)
    this.handleVolumeSlider = this.handleVolumeSlider.bind(this)
    this.handlePlay = this.handlePlay.bind(this);
    this.handleSaveA = this.handleSaveA.bind(this);
    this.handleSaveB = this.handleSaveB.bind(this);
    this.fakeDownload = this.fakeDownload.bind(this);
    this.handleLoop = this.handleLoop.bind(this);
    
  } // end constructor

  handleWindowClose(event) { 
    audioCtx.close()
  }

  componentDidMount () { // after render()
    audioCtx = new window.AudioContext()
    gainNode = audioCtx.createGain()
    window.addEventListener('beforeClosing', this.handleWindowClose)
  }

  componentWillUnmount () { // before closing app
    window.removeEventListener('beforeClosing', this.handleWindowClose)
  }

  render() {
    const {loadFile, 
           handleSpeedSlider, handlePitchSlider, handleVolumeSlider, 
           handleTimeSlider, handlePlay, handleSaveA, handleSaveB, handleLoop} = this
    const {playingAt, playingAtSlider,timeA, timeB,
           playSpeed, playPitch, playPitchSemi, playPitchCents,
           playVolume, startButtonStr, loopButtonStr, saveButtonStr} 
           = this.state

    let duration = 0;
    if (this.params.audioBuffer !== undefined) 
       duration = this.params.audioBuffer.duration

    let startBStyle; 
    if (startButtonStr === 'Pause')
      startBStyle = {color: 'green'}
    else  
      startBStyle = {}

    let loopBStyle; 
    if (loopButtonStr === 'StopLoop')
      loopBStyle = {color: 'green'}
    else  
      loopBStyle = {}

    let saveBStyle; 
    if (saveButtonStr === 'Please Wait!')
      saveBStyle = {color: 'green'}
    else  
      saveBStyle = {}

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
        value = {playingAtSlider} step='1'
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
        <button name='startPause' onClick={handlePlay} style={startBStyle}> 
        {startButtonStr}
        </button> &nbsp;&nbsp;
        <button name='LoopAB' onClick={handleLoop} style={loopBStyle}>
        {loopButtonStr}</button> &nbsp;&nbsp;
        <button name='reset' onClick={handlePlay}> 
        ResetAB
        </button> <hr />
        <button name='save' onClick={handleSaveB} style={saveBStyle}> 
        {saveButtonStr}
        </button>
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
   this.params.filename = file.name;

   let reader = new FileReader()

   reader.onload = function (e) {

      audioCtx.decodeAudioData(reader.result, 
        function(audioBuffer) {
          this.params.audioBuffer = audioBuffer
          this.setState({startButtonStr: 'PlayFromA', 
             playingAt: 0, playingAtSlider: 0})
          this.setState({timeA: 0})
          this.setState({timeB: audioBuffer.duration})
//          console.log ("read")
        }.bind(this),
        function (error) { console.log ("Filereader error: " + error.err) })

   }.bind(this)

   reader.readAsArrayBuffer(file)

 } // end loadFile()

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
        this.setState({playingAtSlider: this.state.playingAt});
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
     let buffer = audioCtx.createBuffer(1,1,44100); 
     let source = audioCtx.createBufferSource();
     source.buffer = buffer;
     source.connect (audioCtx.destination);
     source.start();
// End unlock

     let timeB = this.state.timeB;
     let timeA = this.state.timeA;

     if (event.target.name === 'LoopAB') {
       if (this.params.isPlaying) return;

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

       shifter = new PitchShifter(audioCtx, partialAudioBuffer, 4096)
       shifter.tempo = this.state.playSpeed/100.0
       shifter.pitch = Math.pow(2.0,this.state.playPitch/12.0)

       shifter.on('play', detail => {
         console.log ('timePlayed', detail.timePlayed);
         this.setState({playingAt: 
           parseFloat(this.state.timeA) + parseFloat(detail.timePlayed)});
         if(!iOS) this.setState({playingAtSlider: this.state.playingAt})

         if (detail.percentagePlayed === 100){ 
           this.params.isPlaying = false;
           if (this.params.loop) this.handlePlay({target: {name: 'LoopAB'}});
         }
       });

       this.params.isPlaying = true;
       shifter.connect(gainNode)
       gainNode.connect(audioCtx.destination)

     } // end ABloop

     if (event.target.name === 'startPause') {


       if (this.state.startButtonStr === 'Pause'){
         if (!this.params.isPlaying) return;
         this.setState({timeA: this.state.playingAtSlider});
         this.setState({playingAt: this.state.playingAtSlider});

         if (shifter === null) return

          shifter.disconnect();
          shifter.off();
          shifter = null;
          this.params.isPlaying = false;
          this.setState({ startButtonStr: 'PlayFromA' })

       } 

       if (this.state.startButtonStr === 'PlayFromA') {
         if (this.params.isPlaying) return;

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

       shifter = new PitchShifter(audioCtx, partialAudioBuffer, 4096)
       shifter.tempo = this.state.playSpeed/100.0
       shifter.pitch = Math.pow(2.0,this.state.playPitch/12.0)

       shifter.on('play', detail => {
         this.setState({playingAt: 
         parseFloat(this.state.timeA) + parseFloat(detail.timePlayed)});
         if(!iOS) this.setState({playingAtSlider: this.state.playingAt})

         if (detail.percentagePlayed === 100) {
           shifter.disconnect();
           shifter.off(); 
           shifter = null;
           this.params.isPlaying = false;
         }
       });
 
       this.params.isPlaying = true; 
       shifter.connect(gainNode)
       gainNode.connect(audioCtx.destination)

       this.setState({startButtonStr: 'Pause'});

       }

     } 

     if (event.target.name === 'reset') {

      if (!this.isPlaying) return;

        if (shifter) {
          shifter.disconnect();
          shifter.off();
          shifter = null; // null
        }

        this.setState({startButtonStr: 'PlayFromA', 
          playingAt: 0, timeA: 0, timeB: audioBuffer.duration})
        this.setState({playingAtSlider: this.state.playingAt});

     } // end if

  } // end handlePlay()

  handleSaveA(event) { 

    const {audioBuffer} = this.params;

    if (this.state.isPlayng) return;

    console.log ('handleSaveA');

    const offlineCtx = new OfflineAudioContext(
       audioBuffer.numberOfChannels,
       parseInt(audioBuffer.length*(100.0/this.state.playSpeed)),
       audioBuffer.sampleRate);

    shifter = new PitchShifter(offlineCtx, audioBuffer, 512);
    shifter.tempo = this.state.playSpeed/100.0;
    shifter.pitch = Math.pow(2.0,this.state.playPitch/12.0);
  //  shifter.connect(gainNode); // offlineAudiocontext cannot use gainNode

    this.params.isPlaying = true;
    shifter.connect(offlineCtx.destination);
    offlineCtx.startRendering();

    offlineCtx.oncomplete = function(e) {
      console.log('offline rendering complete:', e.renderedBuffer);
      let source = audioCtx.createBufferSource();
      source.buffer = e.renderedBuffer;
      // source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start();

//      this.fakeDownload(e.renderedBuffer);
    }.bind(this);

  }

  fakeDownload(audioBuffer){
   // let blob = new Blob(, {type: 'audio/x-wav'})
    const words = this.params.filename.split('.');
    let outFileName = 
         words[0]
       + '&s' + parseInt(this.state.playSpeed)
       + '&p' + parseInt(this.state.playPitch*100)
       + '.wav';
    let blob = new Blob([toWav(audioBuffer)], {type: 'audio/wav'});
    saveAs(blob,outFileName);

    console.log('Output ', outFileName);
  }

  handleSaveB(event) { 

    const {audioBuffer} = this.params;
    if (this.params.isPlaying) return;
    if (this.params.save) return;

    console.log ('handleSaveB');

// https://www.gmass.co/blog/record-audio-mobile-web-page-ios-android/
// https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode/onaudioprocess

    let saverNode = null;
    let bufferSize = 4096;
    let channels = audioBuffer.numberOfChannels;

    shifter = new PitchShifter(audioCtx, audioBuffer, bufferSize);
    shifter.tempo = this.state.playSpeed/100.0;
    shifter.pitch = Math.pow(2.0,this.state.playPitch/12.0);
    this.params.save = true;

    if (audioCtx.createJavaScriptNode) {
      saverNode = audioCtx.createJavaScriptNode(bufferSize,channels,channels);
    } else if (audioCtx.createScriptProcessor) {
      saverNode = audioCtx.createScriptProcessor(bufferSize,channels,channels);
    } else {
      console.log ('createScript is not supported');
      return;
    }

/* Storage */

    this.params.exportBuffer = audioCtx.createBuffer( 
      channels, 
      parseInt(audioBuffer.length*(100/this.state.playSpeed)), 
      audioBuffer.sampleRate);
    this.params.exportDataL = new Float32Array(this.params.exportBuffer.length);
    this.params.exportDataR = new Float32Array(this.params.exportBuffer.length);

    this.params.save = true;

/* Script Processor */
    let index = 0;
    saverNode.onaudioprocess = function(event){
      let inputBuffer = event.inputBuffer;
      let outputBuffer = event.outputBuffer;


      for (let channel = 0; channel < inputBuffer.numberOfChannels; channel++){
         let inputData = inputBuffer.getChannelData(channel);
         let outputData = outputBuffer.getChannelData(channel);

        for (let sample = 0; sample < inputBuffer.length; sample++) {
          outputData[sample] = inputData[sample];
          if (channel === 0) 
             this.params.exportDataL[index + sample] = inputData[sample];
          else 
             this.params.exportDataR[index + sample] = inputData[sample];
        }
      }

      index += inputBuffer.length;

    }.bind(this);

    shifter.on('play', detail => {
      this.setState({playingAt: 
         parseFloat(this.state.timeA) + parseFloat(detail.timePlayed)});

        if (detail.percentagePlayed === 100) {
          this.params.exportBuffer.copyToChannel(this.params.exportDataL,0,0)
          this.params.exportBuffer.copyToChannel(this.params.exportDataR,1,0)
          this.fakeDownload(this.params.exportBuffer);
          this.params.save = false;
          this.setState({saveButtonStr: 'Save'});
          this.params.isPlaying = false;
        }
     });

    this.params.isPlaying = true;
    shifter.connect(saverNode);
    saverNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    this.setState({saveButtonStr: 'Please Wait!'});

  } // end handleSaveB

  handleLoop(event) {

    if (event.target.name === 'setA') {
      this.setState ({timeA: this.state.playingAtSlider});
    }
    if (event.target.name === 'setB'){
      if (this.state.playingAt >=  this.state.timeA)
        this.setState ({timeB: parseFloat(this.state.playingAt)});
      else
        this.setState ({timeB: parseFloat(this.state.timeA) + parseFloat(10)});
    }

    if (event.target.name === 'LoopAB'){

      if (this.state.loopButtonStr === 'LoopAB'){ 
        if (this.params.isPlaying) return;

        if (shifter){
          shifter.disconnect();
          shifter.off();
        }

        this.setState ({loopButtonStr: 'StopLoop'});
        this.params.loop = true;
        this.handlePlay({target: {name: 'LoopAB'}});

      } 
      else if (this.state.loopButtonStr === 'StopLoop'){
        if (!this.params.isPlaying) return;

        if (shifter){
          shifter.disconnect();
          shifter.off();
          shifter = null;
        }

        this.params.loop = false;
        this.params.isPlaying = false;
        this.setState ({loopButtonStr: 'LoopAB'});
      }
    }
  }
 
} // end class

export default App;
