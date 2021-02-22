import React, {Component} from 'react';
// import logo from './logo.svg';
import './App.css';
import packageJSON from '../package.json';
import messages from './language.json'; // US and JA message
// File Saver
import * as toWav from 'audiobuffer-to-wav';
import {saveAs} from 'file-saver';
// FFT
// import {FFTR} from 'kissfft-js';
// import Windowing from 'fft-windowing';
import {Range} from 'rc-slider';
import 'rc-slider/assets/index.css';

// Global variables
const version =  packageJSON.subversion;
const jaText = messages.ja;
const usText = messages.us;
let m = usText;
if (window.navigator.language.slice(0,2) === 'ja') m = jaText;

let AudioContext = window.AudioContext || window.webkitAudioContext
let OfflineAudioContext = window.OfflineAudioContext || window.OfflinewebkitAudioContext
let offlineCtx = null;

let iOS = false;
if( navigator.userAgent.match(/iPhone/i) 
   || navigator.userAgent.match(/iPod/i)
   || navigator.userAgent.match(/iPad/i)){
   iOS = true;
}

let audioWorkletAvailable = false;
let context = new OfflineAudioContext(1, 1, 44100);
if (context.audioWorklet && 
    typeof context.audioWorklet.addModule === 'function'){
    audioWorkletAvailable = true;
}
// if (context) context.close(); // no close() for OfflineAudioContext

////////////////////////

class App extends Component {

  constructor (props){
    console.log ('constructor');
    super();
    this.audioCtx = null;
    this.gainNode = null;
    this.effectorNode = null;

    this.params = {
      inputAudio: null,
      outputAudio: null,
      outputLength: 0,
      filename: null,
      currentSource: null,
      isPlaying: false,
      isBatchPlaying: false,
      isRendering: false,
      playStartTime: 0,
      effectNode: null,
      fftShift: 512,
      sliderTimer: null, 
    }
   
    this.counter = 0;
    this.state = {
      modLoaded: false,
      ja: (m === jaText),
      playingAt: 0, 
      A: 0, B: 0,
      filterType: "bypass",
      centerWidth: 0.2,
      playVolume: 75,
      startButtonStr: 'NotYet', // Start/Pause
      processBatchButtonStr: 'NotYet', 
       // NotYet/Start/Abort
      playBatchButtonStr: 'NotYet', 
       // NotYet/Play/Pause
      saveButtonStr: 'NotYet' 
       // NotYet/Save/Abort
    }

    this.loadFile = this.loadFile.bind(this);
    this.loadModule = this.loadModule.bind(this);
    this.handleLang = this.handleLang.bind(this);
    this.handleTimeRange = this.handleTimeRange.bind(this);
    this.handleVolumeSlider = this.handleVolumeSlider.bind(this);
    this.handlePlay = this.handlePlay.bind(this);
    // this.handleSave = this.handleSave.bind(this);
    // this.selectFilter = this.selectFilter.bind(this);
    // this.fakeDownload = this.fakeDownload.bind(this);
    this.updateTime = this.updateTime.bind(this);
  }

  updateTime(){
    if (this.audioCtx === null) return;
    this.setState({
     playingAt: this.audioCtx.currentTime - this.params.playStartTime
    });
  }

  handleWindowClose(event) { 
    if (this.audioCtx !== null) this.audioCtx.close();
  }

  componentDidMount () { // after render()
    window.addEventListener('beforeClosing', this.handleWindowClose);
  }
 
    componentWillUnmount () { // before closing app
    window.removeEventListener('beforeClosing', this.handleWindowClose)
  }

// load module
  async loadModule(audioContext) {

    if (audioContext === null) return false;

    try {
      await audioContext.audioWorklet.addModule(`worklet/bundle.js`);
    } catch(e) {
      alert(e + '\n audioWorklet: load failed');
      return false;
    }

    return true;
  }


// GUI 
  render(){

    let duration = 0;
    if (this.params.inputAudio)
      duration = this.params.inputAudio.duration;

    let startBStyle = {};

    const rangeStyle = {width: '85%', cursor: 'pointer'};
    const dotted = {border: 'none', borderTop: '1px dotted blue'};

    if (!audioWorkletAvailable) {
      return(
       <div classname="App">
       {m.sorry}
       </div>
      );
    } else return(
      <div className="App">
       {m.title}
       <span className='small-button'> &nbsp;&nbsp;
       <button name='language' onClick={this.handleLang}>
       {this.state.ja ? 'En(US)' : '日本語'}</button> 
       </span>
       <hr />
       1) Select stereo audio file (local/cloud)<br/>
       <span className='selectFile'>
       <input type='file' name='loadFile' 
          accept='audio/*' onChange={this.loadFile} /><br />
       </span>
       <hr />
       <span className='selector'>
       2) Filter: &nbsp;
       <select name="selectFilter" value={this.state.filterType}
        onChange={this.selectFilter}>
       <option value="bypass">bypass</option>
       <option value="drumCover">drumCover</option>
       <option value="karaokeMale">karaokeMale</option>
       <option value="karaokeFemale">karaokeFemale</option>
       <option value="percussive">percussive</option>
       <option value="harmonic">harmonic</option>
       <option value="setWithGUI">setWithGUI</option>
       </select><br />
       centerWidth: &nbsp; 
       <select name="centerWidth" 
       value = {this.state.centerWidth} onChange={this.selectFilter}>
       <option value="0.1Total: 242.">0.1</option>
       <option value="0.2">0.2</option>
       <option value="0.3">0.3</option>
       <option value="0.4">0.4</option>
       <option value="0.5">0.5</option>
       <option value="0.6">0.6</option>
       <option value="0.7">0.7</option>
       </select>
       &nbsp; Range: {-this.state.centerWidth/2} -- {this.state.centerWidth/2}
       </span>
       <hr />
        <span>
        3) Time Range: {this.state.A.toFixed(2)} -- {this.state.B.toFixed(2)}
        <center>
        <Range style = {rangeStyle} min={0} max={duration} 
           value = {[this.state.A,this.state.playingAt,this.state.B]} 
           allowCross={false}
     trackStyle={[{ backgroundColor: 'red' }, { backgroundColor: 'green' }]}
     handleStyle={[{backgroundColor: 'yellow' }, 
                   {backgroundColor: 'gray' },
                   {backgroundColor: 'yellow' }]}
           onChange={this.handleTimeRange}
           />
        </center>
        Total: {duration.toFixed(2)} sec &nbsp;&nbsp; 
        Current: {this.state.playingAt.toFixed(2)}
        </span>
       <hr />
       4) Player control: &nbsp;
          <span className="small-button">
          <button name='startPause' style={startBStyle} 
          onClick={this.handlePlay} >
          {this.state.startButtonStr}</button> &nbsp;&nbsp; 
          <button name="stop" onClick={this.handlePlay} >Rewind</button><br />
       <hr />
       5) Export output buffer: &nbsp;
          <button name="save" onClick={this.handleSave} >
          {this.state.saveButtonStr}</button> 
       </span> 
       
       <hr />
        Playback Vol: {this.state.playVolume} <br />
        <span className='slider'> 
         <center>
         000 <input type='range' name='volumeSlider' min='0' max='150'
         value = {this.state.playVolume} 
           onChange={this.handleVolumeSlider} /> 150<br />
         </center>
        </span>
       <hr />
        Version: {version}, &nbsp;
        <a href={m.homepage} 
         target="_blank" rel="noopener noreferrer">{m.guide}</a>
       <hr />
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

    let context = new OfflineAudioContext(1, 1, 44100);
    if (context.audioWorklet
      && typeof context.audioWorklet.addModule === 'function') {
      console.log(context.audioWorklet);
    } else {
      console.log('Missing context.audioWorklet');
      console.log(context.audioWorklet);
    }

    this.audioCtx = new AudioContext({
      latencyHint: 10.0
    }
    );
    this.gainNode = this.audioCtx.createGain();
    this.loadModule(this.audioCtx);
 
    let reader = new FileReader();
    reader.onload = function(e) {
      this.audioCtx.decodeAudioData(reader.result, 
        function(audioBuffer) {
          this.params.inputAudio = audioBuffer;
          if (false) {
            const buffer = this.audioCtx.createBuffer(1,1,44100); 
            const source = this.audioCtx.createBufferSource();
            source.buffer = buffer;
            source.connect (this.audioCtx.destination);
            source.start();
          }

          if (this.params.inputAudio.numberOfChannels === 2){
            this.setState({playingAt: 0});
            this.setState({startButtonStr: 'Play'});
            this.setState({A: 0, B: this.params.inputAudio.duration});
            this.setState({processBatchButtonStr: 'Start', 
                           saveButtonStr: 'NotYet'});
          } else {
            alert('Stereo file only');
            return;
          }

          console.log('audio file loaded');

        }.bind(this),
          function (error) { console.log ("Filereader error: " + error.err) 
        }
      );

    }.bind(this);

    reader.readAsArrayBuffer(file);

  }

       // add 0.5 sec each at the beginning and the end
  addSilence(original) {

    const modified = this.audioCtx.createBuffer(
      original.numberOfChannels,
      original.length + original.sampleRate,
      original.sampleRate
    );

    for (let channel = 0; channel < modified.numberOfChannels; channel++){
      const from = original.getChannelData(channel);
      const to = modified.getChannelData(channel);

      for (let sample = 0; sample < modified.sampleRate/2; sample++)
         to[sample] = 0;
      for (let sample = modified.sampleRate/2;
         sample < original.length; sample++)
         to[sample] = from[sample - modified.sampleRate/2];
      for (let sample = original.length; sample < modified.length; sample++)
         to[sample] = 0;
   }

   return modified;
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
    this.gainNode.gain.value = vol/100.0;
    this.setState({playVolume: vol});
    return;
  }

  handleTimeRange(value){
    if (this.params.isPlaying) return;

    this.setState({
      A: parseFloat(value[0]), 
      playingAt: parseFloat(value[1]),
      B: parseFloat(value[2])
    });
  }

  handlePlay(e){

    if (e.target.name === 'stop'){
      if (this.state.startButtonStr !== 'NotYet') {
        clearInterval(this.params.sliderTimer);

        if (this.params.currentSource !== null){
          this.params.currentSource.stop();
          this.params.currentSource = null;
        }

        // this.params.outputLength = this.state.playingAt - this.state.A;
        this.setState({playingAt: this.state.A, startButtonStr: 'Play',
          saveButtonStr: 'Export'});
        this.params.isPlaying = false;
      }
      return;
    }

    if (e.target.name === 'startPause'){

      if (this.state.startButtonStr === 'Play'){ 
        if (this.audioCtx === null) this.audioCtx = new window.AudioContext();

        if (this.params.isPlaying 
           || this.params.inputAudio.numberOfChannels !== 2) return;

// PlayThread
       this.params.isPlaying = true;
       const effectNode = new AudioWorkletNode(
         this.audioCtx,'filter-processor', {  
           processorOptions: {
             sampleRate: this.params.inputAudio.sampleRate,
             fftShift: this.params.fftShift
           }
       });
       this.params.effectNode = effectNode;
       const source = this.audioCtx.createBufferSource();
       this.params.currentSource = source;
       source.buffer = this.params.inputAudio;

       source.connect(effectNode);
       effectNode.connect(this.gainNode);
       this.gainNode.connect(this.audioCtx.destination);
       source.start(0,this.state.playingAt,this.state.B - this.state.playingAt);

       this.params.playStartTime 
          = this.audioCtx.currentTime - this.state.playingAt;
       this.params.sliderTimer = setInterval(this.updateTime,100);

       this.counter = 0;
       this.setState({startButtonStr: 'Pause'});

       source.onended = function() {
         console.log('Source End');
         clearInterval(this.params.sliderTimer);
       }.bind(this);

       return;
     } // end Play

     if (this.state.startButtonStr === 'Pause'){

        if (!this.params.isPlaying) return;

          this.params.currentSource.stop();
          this.params.isPlaying = false;
          clearInterval(this.params.sliderTimer);
          this.setState({ startButtonStr: 'Play' });
        
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

    if (e.target.name === 'selectFilter' && this.effector !== null) {

      switch(e.target.value){
        case 'drumCover': 
        case 'karaokeMale': 
        case 'karaokeFemale': 
          this.effector.presetFilter(e.target.value, this.state.centerWidth);
        break;
        case 'percussive': case 'harmonic':
          this.effector.presetFilter(e.target.value, 0);
        break;
        case 'bypass': 
        case 'customWithGUI': 
          this.effector.presetFilter('bypass', 0);
        break; // customWithGUI not implemented
        default:
      }

      this.setState({filterType: e.target.value});
    } 

    if (e.target.name === 'centerWidth' 
       && this.effector !== null && this.state.filterType !== null) {
       this.effector.presetFilter(this.state.filterType, parseFloat(e.target.value));
       this.setState({centerWidth: parseFloat(e.target.value)});
    }

  } // End selectFilter()

  handleSave(e){ // offline processing (may work for this)

    if (e.target.name !== 'save') return;

    if (this.params.outputAudio !== null)
      this.fakeDownload(
       this.trimOutput(this.params.outputAudio, this.params.outputLength));

  } // end handleSave


  fakeDownload(audioBuffer){

    const words = this.params.filename.split('.');
    let outFileName = words[0] + '-modified.wav';
    let blob = new Blob([toWav(audioBuffer)], {type: 'audio/vnd.wav'});
    saveAs(blob,outFileName);

  } // end fakeDownload
 
} // end class

export default App;
