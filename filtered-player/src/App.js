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
var m = usText; // default

window.AudioContext = window.AudioContext || window.webkitAudioContext
window.OfflineAudioContext = window.OfflineAudioContext 
     || window.webkitOfflineAudioContext;

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
      outputAudio: null,
      filename: null,
      currentSource: null,
      isPlaying: false,
      effectNode: null,
      fftShift: 512,
    }

    this.counter = 0;

    this.state = {
      ja: false,
      playingAt: 0, 
      A: 0, B: 0,
      filterType: "bypass",
      centerWidth: 0.2,
      playVolume: 80,
      startButtonStr: 'startPlay', // Start/Pause
      processButtonStr: 'NotReady', 
       // NotReady/Process/Abort/Play
      saveButtonStr: 'NotReady' 
       // NotReady/Save/Abort
    }

    this.loadFile = this.loadFile.bind(this);
    this.handleLang = this.handleLang.bind(this);
    this.handleTimeSlider = this.handleTimeSlider.bind(this);
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

    const rangeStyle = {width: '85%', cursor: 'pointer'};

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
       <select name="centerWidth" defaultValue="0.2"
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
       <span>
       4A) Batch Processing: &nbsp; 
          <button name='processOffline' onClick={this.handleOffline} >
          {this.state.processButtonStr}</button> <br />
       4B) Realtime play: &nbsp;
          <button name='startPause' onClick={this.handlePlay} >
          {this.state.startButtonStr}</button> (high spec PC only)<br />
       </span> 
       <hr />
       5) Play processed part: 
       <hr />
       6) Save processed part:
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
 
    let reader = new FileReader();
    reader.onload = function(e) {
      audioCtx.decodeAudioData(reader.result, 
        function(audioBuffer) {
          this.params.inputAudio = audioBuffer;

          if (audioBuffer.numberOfChannels === 2){
            this.setState({playingAt: 0});
            this.setState({startButtonStr: 'Play'});
            this.setState({A: 0, B: audioBuffer.duration});
            this.setState({processButtonStr: 'Process', 
                           saveButtonStr: 'SaveAll'});
            effector = null;
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

  handleTimeSlider(e){
    if (this.params.isPlaying) return;

    if (e.target.name !== 'timeSlider') return;

    this.setState({playingAt: parseFloat(e.target.value)});
  }

  handleTimeRange(value){
    if (this.params.isPlaying) return;

    this.setState({A: parseFloat(value[0]), B: parseFloat(value[1])});
  }

  handlePlay(e){
    let source = null;

    if (e.target.name === 'startPause'){

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

        this.params.outputAudio =  audioCtx.createBuffer(
          modified.numberOfChannels, modified.length, modified.sampleRate);

        this.counter = 0;
        effectNode.onaudioprocess = function(e) {

          let inputBuffer = e.inputBuffer;
          let outputBuffer = e.outputBuffer;

//          effector.copy(inputBuffer, outputBuffer); // for test
          effector.process(inputBuffer, outputBuffer);
// save data

/*
         let leftOut = outputBuffer.getChannelData(0);
         let rightOut = outputBuffer.getChannelData(1);
         let processedLeft = this.params.outputAudio.getChannelData(0);
         let processedRight = this.params.outputAudio.getChannelData(1);

         for (let sample = 0; sample < this.params.fftShift; sample++){
           let offset = this.counter*this.params.fftShift;
           processedLeft[offset + sample] = leftOut[sample];
           processedRight[offset + sample] = rightOut[sample];
         }
*/

         if (this.state.playingAt*inputBuffer.sampleRate >= modified.length){
            source.stop();
            effectNode.disconnect();
            effectNode.onaudioprocess = null;
            // effector = null;
            // this.fakeDownload(this.params.outputAudio);
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

    if (e.target.name === 'processOffline' || e.target.name === 'saveAll') {

      let modified = null; 
      if (e.target.name === 'saveAll') {
        modified = this.addOneSec(this.params.inputAudio, 
           0, 
           this.params.inputAudio.length);
      } else { 
        modified = this.addOneSec(this.params.inputAudio,
           this.state.A*this.params.inputAudio.sampleRate,
           this.state.B*this.params.inputAudio.sampleRate);
      }

      let offlineCtx = new OfflineAudioContext(
        modified.numberOfChannels, modified.length, modified.sampleRate
      );

      let source = offlineCtx.createBufferSource();     
      source.buffer = modified;

       let effectNode = null;
       if (offlineCtx.createJavaScriptNode){ 
         effectNode = offlineCtx.createJavaScriptNode(this.params.fftShift,2,2);
       } else if (offlineCtx.createScriptProcessor) {
         effectNode = offlineCtx.createScriptProcessor(this.params.fftShift,2,2)
       } else {
         console.log ('offlineCtx scriptprocessor not supported');
         effectNode = null;
       }  // end if audioCtx
       this.params.effectNode = effectNode;

      source.connect(effectNode);
      effectNode.connect(offlineCtx.destination);

/* To store the result */
      let output 
        = audioCtx.createBuffer(modified.numberOfChannels, 
           modified.length, modified.sampleRate);
      let leftOut = output.getChannelData(0);
      let rightOut = output.getChannelData(1);

      let offset = 0;
      effectNode.onaudioprocess = function(e) {
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
      offlineCtx.startRendering();
      offlineCtx.oncomplete = function(e) {
        // e.renderedBuffer; // useless (bug?)
        let source = audioCtx.createBufferSource();
        source.buffer = output;
        source.connect(gainNode); 
        gainNode.connect(audioCtx.destination);
        source.start();
        if (e.target.name === 'saveAll') this.fakeDownload(output);
      }.bind(this);

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
    if (this.params.outputAudio !== null)
      this.fakeDownload(this.params.outputAudio);
  } // end handleSave

  fakeDownload(audioBuffer){

    const words = this.params.filename.split('.');
    let outFileName = words[0] + '-modified.wav';
    let blob = new Blob([toWav(audioBuffer)], {type: 'audio/vnd.wav'});
    saveAs(blob,outFileName);

  } // end fakeDownload
 
} // end class

export default App;
