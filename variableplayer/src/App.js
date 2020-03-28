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
      playPitch: 0, // in semi-tone unit (real value)
      playPitchSemi: 0, // in semi-tone (integer part)
      playPitchCents: 0, // percent for one semitone
      playVolume: 80, // in percent
      startButtonStr: 'loadFile!', 
      loopButtonStr: 'LoopAB',
      saveButtonStr: 'ExportWav'
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
    if (saveButtonStr === 'AbortExport')
      saveBStyle = {color: 'green'}
    else  
      saveBStyle = {}

    return (
      <div className="App">
      Variable speed/pitch audio player<br /> 
      with soundtouchjs by KG
      <hr />
      1) Input Audio (local file): <br />
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
      Pitch (semi-tone.cents): {playPitch} <br />
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
        2) <button name='startPause' onClick={handlePlay} style={startBStyle}> 
        {startButtonStr}
        </button> &nbsp;&nbsp;
        <button name='LoopAB' onClick={handleLoop} style={loopBStyle}>
        {loopButtonStr}</button> &nbsp;&nbsp;
        <button name='reset' onClick={handleLoop}> 
        ResetAB
        </button> <hr />
        3) <button name='save' onClick={handleSaveB} style={saveBStyle}> 
        {saveButtonStr}
        </button> (At playback speed, vol. 100%)
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

   if (event.target.name !== 'loadFile') return;
   if (event.target.files.length === 0) return;
   if (this.params.isPlaying) return;

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
        }.bind(this),
        function (error) { console.log ("Filereader error: " + error.err) })

   }.bind(this)

   reader.readAsArrayBuffer(file)

 } // end loadFile()

// UI handlers
  handleSpeedSlider(event) { 
     console.log('handleSpeedSlider');
     if (event.target.name !== 'speedSlider') return
     if (shifter) shifter.tempo = event.target.value/100.0
     this.setState({playSpeed: event.target.value})
  }

  handlePitchSlider(event) { 
     console.log('handlePitchSlider');

     let pitchSemi;

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
     console.log('handleTimeSlider');

     if (event.target.name !== 'timeSlider') return

     if (this.state.startButtonStr === 'PlayFromA') {
        let value = event.target.value;
        this.setState({playingAt: value, playingAtSlider: value});
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

// Unlock iOS 
   if (iOS){
     let buffer = audioCtx.createBuffer(1,1,44100); 
     let source = audioCtx.createBufferSource();
     source.buffer = buffer;
     source.connect (audioCtx.destination);
     source.start();
   }
// End unlock

// startPause or LoopAB
   if (event.target.name === 'startPause' 
    || event.target.name === 'LoopAB') {

     let timeA = this.state.timeA;
     let timeB = this.state.timeB;
     if (timeB <= timeA) timeB = timeA + 1;

// Pause
     if (this.state.startButtonStr === 'Pause'){
       if (!this.params.isPlaying) return;

       this.setState({timeA: this.state.playingAtSlider});
       this.setState({playingAt: this.state.playingAtSlider});

       if (shifter === null) return

       shifter.disconnect(); shifter.off(); shifter = null;
       this.params.isPlaying = false;
       this.setState({ startButtonStr: 'PlayFromA' })
       return;
     } // end pause 

// PlayFromA
     if (event.target.name === 'startPause' 
       && this.state.startButtonStr === 'PlayFromA') {
       if (this.params.isPlaying) return;
       timeB = audioBuffer.duration;
     }

// PlayFromA/LoopAB
    if (this.state.startButtonStr === 'PlayFromA'
       || this.state.loop) {
      console.log ('Play AB', timeA, timeB);

     let partialAudioBuffer = audioCtx.createBuffer(2,
          (timeB - timeA) *audioBuffer.sampleRate, audioBuffer.sampleRate);
     let left  = audioBuffer.getChannelData(0);
     let right = audioBuffer.getChannelData(1);

     left  = left.subarray(timeA*audioBuffer.sampleRate, 
           timeB*audioBuffer.sampleRate);

     let tmp = partialAudioBuffer.getChannelData(0);
     for (let sample=0; sample < left.length; sample++) 
        tmp[sample] = left[sample];
         //partialAudioBuffer.copyToChannel(left,0,0);

     if (audioBuffer.numberOfChannels >= 2) {
       tmp = partialAudioBuffer.getChannelData(0);
       right = right.subarray(timeA*audioBuffer.sampleRate, 
        timeB*audioBuffer.sampleRate);

       for (let sample=0; sample < right.length; sample++) 
         tmp[sample] = right[sample];
        // partialAudioBuffer.copyToChannel(right,1,0);
     }

     shifter = new PitchShifter(audioCtx, partialAudioBuffer, 4096)
     shifter.tempo = this.state.playSpeed/100.0
     shifter.pitch = Math.pow(2.0,this.state.playPitch/12.0)

     shifter.on('play', detail => {
       let setTime 
           = parseFloat(this.state.timeA) + parseFloat(detail.timePlayed);
       this.setState({playingAt: setTime}); 
       // if(!iOS) 
       this.setState({playingAtSlider: setTime})

       if (detail.percentagePlayed === 100) {
         shifter.disconnect();
         shifter.off(); 
         shifter = null;
         this.params.isPlaying = false;
         if (this.params.loop) 
              this.handlePlay({target: {name: 'LoopAB'}});
       }

     }); // end shifter.on
 
     this.params.isPlaying = true; 
     shifter.connect(gainNode);
     gainNode.connect(audioCtx.destination);

     if (event.target.name === 'startPause' 
         && this.state.startButtonStr === 'PlayFromA') 
              this.setState({startButtonStr: 'Pause'});

     console.log ('Play AB END');
     return;
   } // end playing

    return;
  }


    return;
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
    console.log('fakeDownload');

    const words = this.params.filename.split('.');
    let outFileName = 
         words[0]
       + '&s' + parseInt(this.state.playSpeed)
       + '&p' + parseInt(this.state.playPitch*100)
       + '.wav';
    let blob = new Blob([toWav(audioBuffer)], {type: 'audio/wav'});
    saveAs(blob,outFileName);

    console.log('fakeDownLoad end', outFileName);
  }

  handleSaveB(event) { 
    console.log ('handleSaveB');

    if (event.target.name !== 'save') return;

    const {audioBuffer} = this.params;

    if (this.state.saveButtonStr === 'AbortExport') {
      shifter.disconnect();
      shifter.off();
      this.params.isPlaying = false;
      this.setState({saveButtonStr: 'ExportWav'});
      console.log ('handleSaveB: AbortExport');
      return;
    }

    if (this.state.saveButtonStr !== 'ExportWav') return;

    console.log ('handleSaveB: ExportWav', 'playing', this.params.isPlaying);

    if (this.params.isPlaying) return;

// Unlock iOS 
   if (iOS){
     let buffer = audioCtx.createBuffer(1,1,44100); 
     let source = audioCtx.createBufferSource();
     source.buffer = buffer;
     source.connect (audioCtx.destination);
     source.start();
   }
// End unlock

// https://www.gmass.co/blog/record-audio-mobile-web-page-ios-android/
// https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode/onaudioprocess

    let saverNode = null;
    let bufferSize = 4096;
    let channels = audioBuffer.numberOfChannels;

    shifter = new PitchShifter(audioCtx, audioBuffer, bufferSize);
    shifter.tempo = this.state.playSpeed/100.0;
    shifter.pitch = Math.pow(2.0,this.state.playPitch/12.0);

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
      let setTime = 
          parseFloat(this.state.timeA) + parseFloat(detail.timePlayed);
      this.setState({playingAt: setTime}); 
      // if(!iOS) 
      this.setState({playingAtSlider: setTime});

      if (detail.percentagePlayed === 100) {
          shifter.disconnect(); shifter.off();

/* Safari does not implement copyToChannel() */
/*
          this.params.exportBuffer.copyToChannel(this.params.exportDataL,0,0)
          this.params.exportBuffer.copyToChannel(this.params.exportDataR,1,0)
*/

       let tmp = this.params.exportBuffer.getChannelData(0);
       for (let sample=0; sample < this.params.exportDataL.length; sample++) 
           tmp[sample] = this.params.exportDataL[sample];

       if (this.exportBuffer.numberOfChannels >= 2) {
        tmp = this.params.exportBuffer.getChannelData(1);
        for (let sample=0; sample < this.params.exportDataR.length; sample++) 
           tmp[sample] = this.params.exportDataR[sample];

       }

         this.fakeDownload(this.params.exportBuffer);
         this.params.save = false;
         this.setState({saveButtonStr: 'ExportWav'});
         this.params.isPlaying = false;
        }
     });

    this.params.isPlaying = true;
    shifter.connect(saverNode);
    saverNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    this.setState({saveButtonStr: 'AbortExport'});
    console.log ('handleSaveB: ExportWav END');

    return;
  } // end handleSaveB

  handleLoop(event) {
    console.log ('handleLoop');

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
        console.log ('handleLoop: LoopAB', 'playing', this.params.isPlaying);

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
        console.log ('handleLoop: StopLoop',  
                 'playing', this.params.isPlaying);
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

// reset
    if (event.target.name === 'reset') {
      console.log ('handleLoop: reset')

      if (shifter) { shifter.disconnect(); shifter.off(); shifter = null; }
      this.setState({startButtonStr: 'PlayFromA', 
          playingAt: 0, timeA: 0, timeB: this.params.audioBuffer.duration})
      this.setState({playingAtSlider: 0});

      this.params.loop = false;
      this.params.isPlaying = false;
      this.setState ({loopButtonStr: 'LoopAB'});

    return;
   } // end reset
  }
 
} // end class

export default App;
