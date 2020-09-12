import React, {Component} from 'react';
// import logo from './logo.svg';
import './App.css';
import packageJSON from '../package.json';
import messages from './language.json'; // US and JA message
// File Saver
import * as toWav from 'audiobuffer-to-wav';
import {saveAs} from 'file-saver';
// FFT
// import {RFFT} from 'fftw-js';
//import Windowing from 'fft-windowing';
import Effector from './effectorClass.js';

// Global variables
const version = (packageJSON.homepage + packageJSON.subversion).slice(-11);
const jaText = messages.ja;
const usText = messages.us;
var m = usText; // default

window.AudioContext = window.AudioContext || window.webkitAudioContext

var audioCtx = null;
var gainNode = null;
var effector = null;

var iOS = false;
if(  navigator.userAgent.match(/iPhone/i) 
  || navigator.userAgent.match(/iPod/i)
  || navigator.userAgent.match(/iPad/i)){
  iOS = true;
}


////////////////////////
class App extends Component {
  constructor (props){
    super(props);

    this.params = {
      inputAudio: null,
      filename: null,
      currentSource: null,
      isPlaying: false,
      effectNode: null,
      fftShift: 512,
      filterType: 'bypass',
      vocalWidth: 0.2
    }

    this.counter = 0;

    this.state = {
      ja: false,
      playingAt: 0, 
      playVolume: 80,
      startButtonStr: 'startPlay', // Start/Pause
      testButtonStr: 'test60sec', // test60sec
      saveButtonStr: 'Save' // convert all and save/ abort
    }

    this.loadFile = this.loadFile.bind(this);
    this.handleLang = this.handleLang.bind(this);
    this.handleTimeSlider = this.handleTimeSlider.bind(this);
    this.handleVolumeSlider = this.handleVolumeSlider.bind(this);
    this.handlePlay = this.handlePlay.bind(this);
    this.handleOffline = this.handleOffline.bind(this);
    this.handleSave = this.handleSave.bind(this);
    this.selectFilter = this.selectFilter.bind(this);
    this.fakeDownload = this.fakeDownload.bind(this);
  }

  handleWindowClose(event) { 
    audioCtx.close();
  }

  componentDidMount () { // after render()
    audioCtx = new window.AudioContext();
    gainNode = audioCtx.createGain();
    window.addEventListener('beforeClosing', this.handleWindowClose);
  }
 
    componentWillUnmount () { // before closing app
    window.removeEventListener('beforeClosing', this.handleWindowClose)
  }

// GUI 
  render(){

    let duration = 0;
    if (this.params.inputAudio)
      duration = this.params.inputAudio.duration;

    let startBStyle = {};
    if (this.state.startButtonStr === 'Pause') startBStyle = {color: 'green'};

    return(
      <div className="App">
       {m.title}
       <span className='small-button'> &nbsp;&nbsp;
       <button name='language' onClick={this.handleLang}>
       {this.state.ja ? 'En(US)' : '日本語'}</button> 
       </span>
       <hr />
       Select stereo audio file (from local strage or cloud)<br/>
       <span className='selectFile'>
       <input type='file' name='loadFile' 
          accept='audio/*' onChange={this.loadFile} /><br />
       </span>
       <hr />
       <span className='selector'>
       Filter: &nbsp;
       <select name='selectFilter' defaultValue='bypass' 
        onChange={this.selectFilter}>
       <option value='bypass'>bypass</option>
       <option value='drumCover'>drumCover</option>
       <option value='karaokeMale'>karaokeMale</option>
       <option value='karaokeFemale'>karaokeFemale</option>
       <option value='percussive'>percussive</option>
       <option value='harmonic'>harmonic</option>
       <option value='customWithGUI'>customWithGUI</option>
       </select> 
       &nbsp; vocalWidth: &nbsp;
       <select name='vocalWidth' defaultValue='0.2' 
        onChange={this.selectFilter}>
       <option value='0.1'>0.1</option>
       <option value='0.2'>0.2</option>
       <option value='0.3'>0.3</option>
       <option value='0.4'>0.4</option>
       <option value='0.5'>0.5</option>
       <option value='0.6'>0.6</option>
       <option value='0.7'>0.7</option>
       </select>
       </span>
       <hr />
       Time: {this.state.playingAt.toFixed(2)} <br />
        <span className='slider'> 
        <center>
        000 <input type='range' name='timeSlider' min='0' max={duration}
        value = {this.state.playingAt} step='1'
        onChange={this.handleTimeSlider} /> &nbsp;
        {Math.round(duration)}<br />
        </center>
        </span>
       <hr />
        Vol: {this.state.playVolume} <br />
        <span className='slider'> 
         <center>
         000 <input type='range' name='volumeSlider' min='0' max='150'
         value = {this.state.playVolume} 
           onChange={this.handleVolumeSlider} /> 150<br />
         </center>
        </span>
       <hr />
       <span>
       <button name='startPause' onClick={this.handlePlay} 
          style={startBStyle}>{this.state.startButtonStr}
       </button> &nbsp;&nbsp;
       <button name='rewind' onClick={this.handlePlay}>Rewind</button>
       </span>
       <hr />
       <span>
       <button name='testPlay' onClick={this.handleOffline} 
          style={startBStyle}>{this.state.testButtonStr}
       </button> &nbsp;&nbsp;
       <button name='saveAll' onClick={this.handleOffline}>
       {this.state.saveButtonStr}</button>
       </span>
       <hr />
        Version: {version}, &nbsp;
        <a href={m.homepage} 
         target="_blank" rel="noopener noreferrer">{m.guide}</a>
      </div>
    );
  } // end render()

// event handlers
  loadFile (e) {
    if (e.target.name !== 'loadFile') return;
    if (e.target.files.length === 0) return;
    if (this.params.isPlaying) return;

    let file = e.target.files[0]; 
    this.params.filename = file.name;
 
    let reader = new FileReader();
    reader.onload = function(e) {
      audioCtx.decodeAudioData(reader.result, 
        function(audioBuffer) {
          this.params.inputAudio = audioBuffer;
          this.setState({playingAt: 0});
          this.setState({startButtonStr: 'Play'});
          effector = new Effector(this.params.fftShift,audioBuffer.sampleRate);
        }.bind(this),
          function (error) { console.log ("Filereader error: " + error.err) 
        }
      );

    }.bind(this);

    reader.readAsArrayBuffer(file);

  }

  handleLang(e){
    if (e.target.name !== 'language') return;

    if (this.state.ja) {
      m = usText; this.setState({ja: false}); 
    } else {
      m = jaText; this.setState({ja: true}); 
    }
  }

  handleVolumeSlider(e){
    if (e.target.name !== 'volumeSlider') return;

    let vol = parseInt(e.target.value);
    gainNode.gain.value = vol/100.0;
    this.setState({playVolume: vol});
    return;
  }

  handleTimeSlider(e){
    if (this.params.isPlaying) return;

    if (e.target.name !== 'timeSlider') return;

    this.setState({playingAt: parseFloat(e.target.value)});
  }

  handlePlay(e){
    let source = null;

    if (e.target.name === 'startPause') {

      if (this.state.startButtonStr === 'Play'){

       if (this.params.isPlaying 
          || this.params.inputAudio.numberOfChannels !== 2) return;

       this.params.isPlaying = true;

// unlock iOS
       if(iOS) {
         let buffer = audioCtx.createBuffer(1,1,44100); 
         source = audioCtx.createBufferSource();
         source.buffer = buffer;
         source.connect (audioCtx.destination);
         source.start();
       } 
// End unlock iOS

// Playing
       source = audioCtx.createBufferSource();
       this.params.currentSource = source;

       // add 0.5 sec (sampleRate/2) at the beginning and the end
       let original = this.params.inputAudio;
       let modified = audioCtx.createBuffer(
           original.numberOfChannels, 
           original.length + original.sampleRate,
           original.sampleRate
       ); 

       for (let channel = 0; channel < modified.numberOfChannels; channel++){
         let from = original.getChannelData(channel);
         let to = modified.getChannelData(channel);
         for (let sample = 0; sample < modified.sampleRate/2; sample++) 
            to[sample] = 0;
         for (let sample = modified.sampleRate/2; 
            sample < original.length; sample++) 
            to[sample] = from[sample - modified.sampleRate/2];
         for (let sample = original.length; sample < modified.length; sample++)
            to[sample] = 0; 
       }

       source.buffer = modified;

// Create effectNode
       // effector = new Effector(audioCtx, this.params.fftShift, modified);
       let effectNode;
       let channels = this.params.inputAudio.numberOfChannels;
       let bufferSize = this.params.fftShift; // 1024 window half step

       if (audioCtx.createJavaScriptNode) {
          effectNode 
           = audioCtx.createJavaScriptNode(bufferSize,channels,channels);
          console.log ('createJavaScriptNode');
       } else if (audioCtx.createScriptProcessor) {
         effectNode = audioCtx.createScriptProcessor(bufferSize, 
          channels,channels);
          console.log ('createScriptProcessor');
        } // end if audioCtx
        this.params.effectNode = effectNode;


// Connect
        source.connect(effectNode)
        effectNode.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        source.start(0,this.state.playingAt);

// test filters (GUI)
//        effector.addFilter(-1,0,1,40000,'M');
//        effector.addFilter(-0.2,300,0.2,40000,'M');
//        effector.addFilter(-1,0,1,40000,'P');
//        effector.addFilter(-1,0,1,40000,'H');
//        effector.presetFilter('karaokeMale');
//        effector.presetFilter('drumCover');
//        effector.presetFilter('percussive');
//        effector.presetFilter('harmonic');
//        effector.presetFilter('bypass');

        this.counter = 0;
        effectNode.onaudioprocess = function(e) {

          let inputBuffer = e.inputBuffer;
          let outputBuffer = e.outputBuffer;

//          effector.copy(inputBuffer, outputBuffer); // for test
          effector.process(inputBuffer, outputBuffer);

          if (this.state.playingAt*inputBuffer.sampleRate >= modified.length){
            source.stop();
            effectNode.disconnect();
            effectNode.onaudioprocess = null;
            effector = null;
            return;
          }

          this.counter++;
          let update = 20;
          if (this.counter % update === 0) { 
             this.setState({playingAt: this.state.playingAt 
             + (update*inputBuffer.length)/inputBuffer.sampleRate});
          }


          return; 
        }.bind(this) // end onaudioprocess function(e)

        this.setState({startButtonStr: 'Pause'});

        return;
      } // end Play

      if (this.state.startButtonStr === 'Pause'){

        if (!this.params.isPlaying) return;

        this.params.currentSource.disconnect();
        this.params.effectNode.disconnect();
        this.params.effectNode.onaudioprrocess = null;
        gainNode.disconnect();
        this.params.currentSource.stop();
        this.setState({startButtonStr: 'Play'});
        this.params.isPlaying = false;

        return;
      } // end Pause

    } // end startPause

    if (e.target.name === 'rewind') {
      if (this.params.isPlaying) return;
      this.setState({playingAt: 0});
      return;
    }

  } // end handlePlay()


  selectFilter(e){

    if (e.target.name === 'selectFilter' && effector !== null) {

      switch(e.target.value){
        case 'drumCover': 
        case 'karaokeMale': 
        case 'karaokeFemale': 
          effector.presetFilter(e.target.value, this.params.vocalWidth);
        break;
        case 'percussive': case 'harmonic':
          effector.presetFilter(e.target.value, 0);
        break;
        case 'bypass': 
        case 'customWithGUI': 
          effector.presetFilter('bypass', 0);
        break; // customWithGUI not implemented
        default:
      }
      this.params.filterType = e.target.value;
    } 

    if (e.target.name === 'vocalWidth' 
       && effector !== null && this.params.filterType !== null) {
       this.params.vocalWidth = parseFloat(e.target.value);
       effector.presetFilter(this.params.filterType, this.params.vocalWidth);
    }

  }

  handleOffline(e){

    if (e.target.name === 'testPlay') {

       let original = this.params.inputAudio;
       let modified = audioCtx.createBuffer(
           original.numberOfChannels, 
           original.length + original.sampleRate,
           original.sampleRate
       ); 

       for (let channel = 0; channel < modified.numberOfChannels; channel++){
         let from = original.getChannelData(channel);
         let to = modified.getChannelData(channel);
         for (let sample = 0; sample < modified.sampleRate/2; sample++) 
            to[sample] = 0;
         for (let sample = modified.sampleRate/2; 
            sample < original.length; sample++) 
            to[sample] = from[sample - modified.sampleRate/2];
         for (let sample = original.length; sample < modified.length; sample++)
            to[sample] = 0; 
       }


// Process offline
      let inputBuffer =  audioCtx.createBuffer(
         modified.numberOfChannels, this.params.fftShift, modified.sampleRate);
      let outputBuffer =  audioCtx.createBuffer(
         modified.numberOfChannels, this.params.fftShift, modified.sampleRate);
      let processedOut =  audioCtx.createBuffer(
         modified.numberOfChannels, modified.length, modified.sampleRate);

      this.counter = 0;
      for (let chunk = 0; chunk < modified.length; 
        chunk += this.params.fftShift) {

        let leftIn = inputBuffer.getChannelData(0);
        let rightIn = inputBuffer.getChannelData(1);


        let sourceL = modified.getChannelData(0);
        let sourceR = modified.getChannelData(1);

        for (let sample = 0; sample < this.params.fftShift; sample++){
          leftIn[sample] = sourceL[chunk + sample];
          rightIn[sample] = sourceR[chunk + sample];
        }

        // effector.copy(inputBuffer, outputBuffer); // test
        effector.process(inputBuffer, outputBuffer); // test

        let leftOut = outputBuffer.getChannelData(0);
        let rightOut = outputBuffer.getChannelData(1);
        let processedLeft = processedOut.getChannelData(0);
        let processedRight = processedOut.getChannelData(1);

        for (let sample = 0; sample < this.params.fftShift; sample++){
          processedLeft[chunk + sample] = leftOut[sample];
          processedRight[chunk + sample] = rightOut[sample];
        }

        this.counter++;
        let update = 20;
        if (this.counter % update === 0) { 
           // let doNothing = function() {}
           // setTimeout(doNothing,1000);
           this.setState({playingAt: this.state.playingAt 
           + (update*inputBuffer.length)/inputBuffer.sampleRate});
           console.log(this.counter);
        }

    } // end for chunk

    this.fakeDownload(processedOut);

   } // end if testPlay

  } 

  handleSave(e){ // offline processing (may work for this)
  } // end handleSave

  fakeDownload(audioBuffer){

    const words = this.params.filename.split('.');
    let outFileName = words[0] + '-modified.wav';
    let blob = new Blob([toWav(audioBuffer)], {type: 'audio/vnd.wav'});
    saveAs(blob,outFileName);

  } // end fakeDownload
 
} // end class

export default App;
