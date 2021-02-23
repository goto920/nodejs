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
// import Slider, {Range} from 'rc-slider';
import {Range} from 'rc-slider';
import 'rc-slider/assets/index.css';

// Global variables
const version = (packageJSON.homepage + packageJSON.subversion).slice(-11);
const jaText = messages.ja;
const usText = messages.us;
var m;
if (window.navigator.language.slice(0,2) === 'ja') m = jaText;
   else m = usText;

window.AudioContext = window.AudioContext || window.webkitAudioContext
window.OfflineAudioContext = window.OfflineAudioContext 
     || window.webkitOfflineAudioContext;

var audioCtx = null;
var offlineCtx = null;
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
    super();

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
    }

    this.counter = 0;

    this.state = {
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
    this.handleLang = this.handleLang.bind(this);
//    this.handleTimeSlider = this.handleTimeSlider.bind(this);
    this.handleTimeRange = this.handleTimeRange.bind(this);
    this.handleVolumeSlider = this.handleVolumeSlider.bind(this);
    this.handlePlay = this.handlePlay.bind(this);
    this.handleOffline = this.handleOffline.bind(this);
    this.handleSave = this.handleSave.bind(this);
    this.selectFilter = this.selectFilter.bind(this);
    this.fakeDownload = this.fakeDownload.bind(this);
    // this.addOneSec = this.addOneSec(this);
  }

  handleWindowClose(event) { 
    audioCtx.close();
  }

  componentDidMount () { // after render()
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

    const rangeStyle = {width: '85%', cursor: 'pointer'};
    const dotted = {border: 'none', borderTop: '1px dotted blue'};

    return(
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
           value = {[this.state.A,this.state.playingAt, this.state.B]} 
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
       <span className="small-button">
       4) Processing: Batch or Realtime<br />
       Batch: &nbsp; 
          <button name='startBatch' style={startBStyle}
          onClick={this.handleOffline} >
          {this.state.processBatchButtonStr}</button> &nbsp;&nbsp;
          Play: &nbsp;&nbsp;
          <button name='playBatch' style={startBStyle}
          onClick={this.handleOffline} >
          {this.state.playBatchButtonStr}</button> &nbsp;&nbsp;
          <button name='stopBatchPlay' onClick={this.handleOffline} >
          Stop</button>
       <hr style={dotted} />
       Realtime: &nbsp;
          <button name='startPause' style={startBStyle} 
          onClick={this.handlePlay} >
          {this.state.startButtonStr}</button> &nbsp;&nbsp; 
          <button name="stop" onClick={this.handlePlay} >Stop</button><br />
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

    if (audioCtx === null) {
      audioCtx = new window.AudioContext({ latencyHint: "playback" });
      gainNode = audioCtx.createGain();
    }
 
    let reader = new FileReader();
    reader.onload = function(e) {
      audioCtx.decodeAudioData(reader.result, 
        function(audioBuffer) {
          this.params.inputAudio = audioBuffer;

          if (audioBuffer.numberOfChannels === 2){
            this.setState({playingAt: 0});
            this.setState({startButtonStr: 'Play'});
            this.setState({A: 0, B: audioBuffer.duration});
            this.setState({processBatchButtonStr: 'Start', 
                           saveButtonStr: 'NotYet'});
            // effector = null;
            effector 
              = new Effector(this.params.fftShift,audioBuffer.sampleRate);
          }

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

/*
  handleTimeSlider(e){
    if (this.params.isPlaying) return;
    if (e.target.name !== 'timeSlider') return;
    this.setState({playingAt: parseFloat(e.target.value)});
  }
*/

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
        if (this.params.currentSource !== null){
          this.params.currentSource.stop();
          this.params.currentSource = null;
        }

        let effectNode = this.params.effectNode;
        if (effectNode !== null){
          effectNode.disconnect();
          effectNode.onaudioprocess = null;
        }
        this.params.outputLength = this.state.playingAt - this.state.A;
        this.setState({playingAt: this.state.A, startButtonStr: 'Play',
          saveButtonStr: 'Export'});
        this.params.isPlaying = false;
      }
      return;
    }

    if (e.target.name === 'startPause'){

      if (this.state.startButtonStr === 'Play'){ 

       if (this.params.isPlaying 
          || this.params.inputAudio.numberOfChannels !== 2) return;

       this.params.isPlaying = true;

// unlock iOS
       if(iOS) {
         let buffer = audioCtx.createBuffer(1,1,44100); 
         let source = audioCtx.createBufferSource();
         source.buffer = buffer;
         source.connect (audioCtx.destination);
         source.start();
       } 
// End unlock iOS

// Playing
       let source = audioCtx.createBufferSource();
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
       let channels = this.params.inputAudio.numberOfChannels;
       let bufferSize = this.params.fftShift; // 1024 window half step

       let effectNode = null;
       if (audioCtx.createScriptProcessor) {
         effectNode = audioCtx.createScriptProcessor(bufferSize, 
          channels,channels);
          console.log ('createScriptProcessor');
       } else if (audioCtx.createJavaScriptNode) {
         effectNode 
           = audioCtx.createJavaScriptNode(bufferSize,channels,channels);
          console.log ('createJavaScriptNode');
       } 
       this.params.effectNode = effectNode;

// Connect
        source.connect(effectNode)
        effectNode.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        source.start(0,this.state.playingAt);

        this.params.outputAudio =  audioCtx.createBuffer(
          modified.numberOfChannels, modified.length, modified.sampleRate);

        this.counter = 0;
        effectNode.onaudioprocess = function(e) {

          let inputBuffer = e.inputBuffer;
          let outputBuffer = e.outputBuffer;
          effector.process(inputBuffer, outputBuffer);

         let leftOut = outputBuffer.getChannelData(0);
         let rightOut = outputBuffer.getChannelData(1);

        // save data
         let processedLeft = this.params.outputAudio.getChannelData(0);
         let processedRight = this.params.outputAudio.getChannelData(1);

         for (let sample = 0; sample < this.params.fftShift; sample++){
           let offset = this.counter*this.params.fftShift;
           processedLeft[offset + sample] = leftOut[sample];
           processedRight[offset + sample] = rightOut[sample];
         }

         if (this.state.playingAt*inputBuffer.sampleRate >= modified.length){
            source.stop();
            this.params.currentSource = null;
            effectNode.disconnect();
            effectNode.onaudioprocess = null;
            // effector = null;
            this.setState({startButtonStr: 'Play', saveButtonStr: 'Save'});
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
          effector.presetFilter(e.target.value, this.state.centerWidth);
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

      this.setState({filterType: e.target.value});
    } 

    if (e.target.name === 'centerWidth' 
       && effector !== null && this.state.filterType !== null) {
       effector.presetFilter(this.state.filterType, parseFloat(e.target.value));
       this.setState({centerWidth: parseFloat(e.target.value)});
    }

  }

  handleOffline(e){

    if (e.target.name === 'playBatch') {
      if (this.state.playBatchButtonStr === 'Play'){
        // console.log('batchPlay');
        if (this.params.isBatchPlaying) return;

        let source = audioCtx.createBufferSource()
        this.params.currentSource = source;

        source.buffer = this.params.outputAudio;
        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        source.start(0,this.state.playingAt);
        this.setState({playBatchButtonStr: 'Pause'});
        this.params.playStartTime = audioCtx.currentTime;
        this.params.isBatchPlaying = true;

      } else if (this.state.playBatchButtonStr === 'Pause'){
        if (!this.params.isBatchPlaying) return;

        this.params.currentSource.stop();
        this.setState({
           playingAt: audioCtx.currentTime - this.params.playStartTime
        });
      }

      return;
    }

    if (e.target.name === 'stopBatchPlay'){
        // console.log('batchPlay Stop');
      if (!this.params.isBatchPlaying) return;

      if (this.params.currentSource !== null){
        let source = this.params.currentSource;
        source.stop();
        // this.params.currentSource = null;
      }
      this.params.isPlaying = false;
      this.params.outputLength = this.state.playingAt - this.state.A;
      this.setState({
         playBatchButtonStr: 'Play',
         processBatchButtonStr: 'Start'});
      return;
    }

    if (e.target.name === 'startBatch') {

      if (this.state.processBatchButtonStr === 'Abort'){

        if (this.params.isRendering){
          this.params.isRendering = false;
          this.setState({
            processBatchButtonStr: 'Start',
            playBatchButtonStr: 'Play',
          });
          this.params.isBatchPlaying = false;
          offlineCtx = null;
          this.params.outputAudio 
           = this.trimOutput(this.params.outputAudio,
             this.state.playingAt - this.state.A);
          this.setState({playingAt: this.state.A});
         }

        return;

      } else if (this.state.processBatchButtonStr !== 'Start') return;

      let modified = this.addOneSec(this.params.inputAudio,
           this.state.A*this.params.inputAudio.sampleRate,
           this.state.B*this.params.inputAudio.sampleRate);

      offlineCtx = new OfflineAudioContext(
        modified.numberOfChannels, modified.length, modified.sampleRate
      );

      let source = offlineCtx.createBufferSource();     
      this.params.currentSource = source;
      source.buffer = modified;

       let effectNode = null;
       if (offlineCtx.createScriptProcessor) {
         effectNode = offlineCtx.createScriptProcessor(this.params.fftShift,2,2)
         console.log ('Offline createScriptProcessor');
       } else if (offlineCtx.createJavaScriptNode){ 
         effectNode = offlineCtx.createJavaScriptNode(this.params.fftShift,2,2);
         console.log ('Offline createJavaScriptNode');
       } else {
         console.log (
           'offlineCtx JavaScriptNode/ScriptProcessor not found');
         effectNode = null;
         return;
       }  // end if audioCtx
       this.params.effectNode = effectNode;

      source.connect(effectNode);
      effectNode.connect(offlineCtx.destination);

/* To store the result */
      let output 
        = audioCtx.createBuffer(modified.numberOfChannels, 
           modified.length, modified.sampleRate);
      this.params.outputAudio = output;
      let leftOut = output.getChannelData(0);
      let rightOut = output.getChannelData(1);

      let offset = 0;
      effectNode.onaudioprocess = function(e) {

         if (!this.params.isRendering) return; // For Abort
        
         let input = e.inputBuffer; // input is OK
         // let output = e.outputBuffer; // does not work as expected

         let processed = audioCtx.createBuffer(2,input.length,input.sampleRate);

         effector.process(input,processed);

         let processedL = processed.getChannelData(0);
         let processedR = processed.getChannelData(1);

         for (let i = 0; i < input.length; i++){
            leftOut[offset + i] = processedL[i]; 
            rightOut[offset + i] = processedR[i];
         }

         if (offset/this.params.fftShift % 20 === 0)  
            this.setState({playingAt: offset/input.sampleRate});

         offset += this.params.fftShift;

      }.bind(this);

      source.start();
      this.params.isRendering = true;
      offlineCtx.startRendering();
      this.setState({processBatchButtonStr: 'Abort'});

      offlineCtx.oncomplete = function(e) {
        // e.renderedBuffer; // useless (bug?)
        this.params.isBatchPlaying = false;
        this.params.outputLength = this.state.playingAt - this.state.A;
        this.setState({
          playBatchButtonStr: 'Play',
          processBatchStr: 'Start',
          saveButtonStr: 'Export'}
        );
      }.bind(this);

     return;
   } // end if testPlay

  } 

  addOneSec(inputAudio, begin, end) { // begin, end in sample number

    let modified = audioCtx.createBuffer(
           inputAudio.numberOfChannels, 
           (end - begin) + inputAudio.sampleRate,
           inputAudio.sampleRate
    );

    let inL = inputAudio.getChannelData(0);
    let inR = inputAudio.getChannelData(1);
    let outL = modified.getChannelData(0);
    let outR = modified.getChannelData(1);

    let offset = inputAudio.sampleRate/2;
    for (let i = 0; i < offset; i++){ outL[i] = 0; outR[i] = 0; }
    for (let i = begin; i < end; i++){
      outL[offset + i] = inL[i]; outR[offset + i] = inR[i]; }
    for (let i = 0; i < offset; i++){ 
      outL[offset + end + i] = 0; outR[offset + end + i] = 0;}

    return modified;
  }

  handleSave(e){ // offline processing (may work for this)

    if (e.target.name !== 'save') return;

    if (this.params.outputAudio !== null)
      this.fakeDownload(
       this.trimOutput(this.params.outputAudio, this.params.outputLength));

  } // end handleSave


  trimOutput(audioBuffer,duration){

    let modified = audioCtx.createBuffer(
           audioBuffer.numberOfChannels, 
           audioBuffer.sampleRate * duration,
           audioBuffer.sampleRate
    );

    let inL = audioBuffer.getChannelData(0);
    let inR = audioBuffer.getChannelData(1);
    let outL = modified.getChannelData(0);
    let outR = modified.getChannelData(1);

    for (let i=0; i < modified.length; i++){ 
      outL[i] = inL[i]; 
      outR[i] = inR[i];
    }

    return modified;
  }

  fakeDownload(audioBuffer){

    const words = this.params.filename.split('.');
    let outFileName = words[0] + '-modified.wav';
    let blob = new Blob([toWav(audioBuffer)], {type: 'audio/vnd.wav'});
    saveAs(blob,outFileName);

  } // end fakeDownload
 
} // end class

export default App;
