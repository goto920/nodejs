import React, {Component} from 'react';
// import logo from './logo.svg';
import './App.css';
import packageJSON from '../package.json';
import messages from './language.json'; // US and JA message
// File Saver
import * as toWav from 'audiobuffer-to-wav';
import {saveAs} from 'file-saver';
// FFT
import {RFFT} from 'fftw-js';
import Windowing from 'fft-windowing';

// Global variables
const version = (packageJSON.homepage + packageJSON.subversion).slice(-11);
const jaText = messages.ja;
const usText = messages.us;
var m = usText; // default

window.AudioContext = window.AudioContext || window.webkitAudioContext

var audioCtx = null;
var offlineCtx = null;
var gainNode = null;

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
      isPlaying: false,
    }

    this.state = {
      ja: false,
      playingAt: 0, 
      playVolume: 80,
      startButtonStr: 'loadFile!' // Start/Pause
    }

    this.loadFile = this.loadFile.bind(this);
    this.handleLang = this.handleLang.bind(this);
    this.handleTimeSlider = this.handleTimeSlider.bind(this);
    this.handleVolumeSlider = this.handleVolumeSlider.bind(this);
    this.handlePlay = this.handlePlay.bind(this);
    this.handleSave = this.handleSave.bind(this);
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
       <span className='selectFile'>
       <input type='file' name='loadFile' 
          accept='audio/*' onChange={this.loadFile} /><br />
       </span>
       <hr />
       Time: {this.state.playingAt} <br />
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
        </button>
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
  }

  handleTimeSlider(e){
    if (this.params.isPlaying) return;
    if (e.target.name !== 'timeSlider') return;

    this.setState({playingAt: parseFloat(e.target.value)});
  }

  handlePlay(e){

// unlock iOS
    if(iOS) {
      let buffer = audioCtx.createBuffer(1,1,44100); 
      let source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect (audioCtx.destination);
      source.start();
    }
// End unlock
  } // end handlePlay()

  handleSave(e){
    if(iOS) {
      let buffer = audioCtx.createBuffer(1,1,44100); 
      let source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect (audioCtx.destination);
      source.start();
    }
  }
  
}

export default App;
