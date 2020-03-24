import React, {Component} from 'react';
import './App.css';
import BufferLoader from './buffer-loader';
import click1 from './cowbell_high.mp3';
import click2 from './cowbell_mid.mp3';
import packageJSON from '../package.json';
import {RFFT} from 'fftw-js';
import Windowing from 'fft-windowing';
import {autocorrelation} from 'autocorrelation';
import Stats from 'statsjs';

const version = (packageJSON.homepage + packageJSON.subversion).slice(-10);
const homepage = 'https://goto920.github.io' + packageJSON.homepage.slice(0,-8);

window.AudioContext = window.AudioContext || window.webkitAudioContext
const audioCtx = new window.AudioContext()

var click1Sample = undefined, click2Sample = undefined;

class App extends Component {
  constructor (props){
    super(props);
    this.params = {
       inputAudio: undefined,
       outputAudio: undefined,
       playing: undefined,
       beginTime: undefined,
       taps: [],
       tapBpm: undefined,
       estBpm: undefined,
       testClick: [],
       tapLatency: 0,
       peaks: undefined
    }

    this.state = {
      startButtonStr: 'Wait'
    }

    this.loadFile = this.loadFile.bind(this);
    this.handlePlay = this.handlePlay.bind(this);
    this.handleTap = this.handleTap.bind(this);
    this.analyze = this.analyze.bind(this);
    this.addClick = this.addClick.bind(this);
    this.playAudio = this.playAudio.bind(this);
    this.calcPower = this.calcPower.bind(this);
    this.calcFlux = this.calcFlux.bind(this);
    this.calcMatrix = this.calcMatrix.bind(this);
  } // end constructor

  componentDidMount () { // before render()
    window.addEventListener('beforeClosing', this.handleWindowClose);
    let inputFiles = [];
    inputFiles.push(click1); 
    inputFiles.push(click2);
    let bufferLoader =  new BufferLoader(
      audioCtx, inputFiles, function (bufferList) {
        click1Sample = bufferList[0];
        click2Sample = bufferList[1];
      }
    );

   bufferLoader.load()
  }

  componentWillUnmount () { // before closing app
    window.removeEventListener('beforeClosing', this.handleWindowClose);
  }

  render () {
    const {loadFile, handlePlay, handleTap} = this;
    const {startButtonStr} = this.state;
    return (
      <div className="App">
      Beat Tracking by goto@kmgoto.jp
      <hr />
      Input File: <br />
      <span className='selectFile'>
          <input type='file' name='loadFile' 
          accept='audio/*' onChange={loadFile} /><br />
      </span>
      <span>
          <button name='startPause' onClick={handlePlay}> 
          {startButtonStr}
          </button> &nbsp;&nbsp;
          {startButtonStr === 'Analyze' &&
            <button name='tap' onClick={handleTap}> 
            TapBeat </button> } &nbsp;&nbsp;
      </span>
      <hr />
        Version: {version}, &nbsp;
        <a href={homepage} 
         target="_blank" rel="noopener noreferrer">Manual/Update</a>
      </div>
    );
  } // end render

  loadFile (event) {
    if (event.target.name !== 'loadFile') return;
    if (event.target.files.length === 0) return; // empty file name

    this.setState({totalTime: 0});
    this.setState({startButtonStr: 'Wait'});
    let file = event.target.files[0];

    let reader = new FileReader();

    reader.onload = function (e) {
       audioCtx.decodeAudioData(reader.result, 
        function(audioBuffer) {
          this.params.inputAudio = audioBuffer;
          // this.setState({startButtonStr: 'TapTest'});
          this.setState({startButtonStr: 'PlayAndTap'});
          // this.setState({startButtonStr: 'startAnalysis'});
        }.bind(this),
        function (error) { console.log ("Filereader error: " + error.err);})
    }.bind(this)
    reader.readAsArrayBuffer(file);
  }

  handlePlay (event) {

    if (event.target.name !== 'startPause') return;

    if (this.state.startButtonStr === 'TapTest') {
      this.params.testClick = [];
      this.params.taps = [];
      this.playAudio(click1Sample);
      this.setState({startButtonStr: 'CheckTap'});
    }

    if (this.state.startButtonStr === 'CheckTap') {
      console.log(this.params.testClick);
      console.log(this.params.taps);
      this.params.taps = [];
    }

    if (this.state.startButtonStr === 'PlayAndTap') {
      this.playAudio(this.params.inputAudio);
      this.setState({startButtonStr: 'Analyze'});
    }

    if (this.state.startButtonStr === 'Analyze') {
      if (this.params.playing !== undefined) {
        this.params.playing.disconnect();
        this.params.playing.stop();
        this.params.playing = undefined;
      }
      this.setState({startButtonStr: 'Processing'});
      console.log (this.params.taps); // debug
      let interval = this.params.taps[1] - this.params.taps[0];
      for (let i = 2; i < this.params.taps.length; i++){
        interval = 0.8*interval 
            + 0.2*(this.params.taps[i] - this.params.taps[0])/i;
      }
      this.params.tapBpm = 60/interval;
      this.params.estBpm = this.params.tapBpm;
      console.log ('tapBpm ', this.params.tapBpm);
      this.analyze();
      this.setState({startButtonStr: 'PlayWithClick'});
    }

    if (this.state.startButtonStr === 'PlayWithClick') {
      console.log('PlayClick');
      this.playAudio(this.params.outputAudio);
    }

  }

  handleTap (event) {
    if (event.target.name !== 'tap') return;
    if (this.params.beginTime === undefined) return;

    let diff = audioCtx.currentTime - this.params.beginTime;

    if (this.state.startButtonStr === 'CheckTap') {
      this.params.taps.push(audioCtx.currentTime);
    } else {
      this.params.taps.push(diff);
    }
  }

  analyze () {
    const {inputAudio} = this.params;
    const {sampleRate, length, duration, numberOfChannels} = inputAudio;
    let mono = inputAudio.getChannelData(0);

    if (numberOfChannels === 2) {
      let left = inputAudio.getChannelData(0);
      let right = inputAudio.getChannelData(1);

      for (let i=0; i < length; i++){
           mono[i] = (left[i] + right[i])/2.0;
      }
      this.params.outputAudio = audioCtx.createBuffer(1,length,sampleRate);
//      this.params.outputAudio.copyToChannel(mono,0,0);
    }  // end stereo case 

    let size = 1024;
    let samples = new Float32Array(size);
    let lastPowerSpec = undefined, currentPowerSpec;
    let shift = size/2;
    let flux = [];
    let fftr = new RFFT(size);

    for (let n = 0; n < size; n++){ // initial
        if (n < shift) samples[n] = 0.0; // padding 0
        else samples[n] = mono[n - shift];
    }

    currentPowerSpec = this.calcPower(fftr.forward(Windowing.hann(samples)));
    // console.log ('flux[0]');

    flux[0] = this.calcFlux(lastPowerSpec, currentPowerSpec);

    // middle 
    for (let i = 1; i <= length/shift; i++){
      for (let n = 0; n < size; n++){
        if (shift*i + n < length)
          samples[n] = mono[shift*i + n];
        else
          samples[n] = 0;
      }
      currentPowerSpec =  this.calcPower(fftr.forward(Windowing.hann(samples)));

      flux[i] = this.calcFlux(lastPowerSpec, currentPowerSpec);
      lastPowerSpec = currentPowerSpec;
      // console.log ('flux[',i,']');
    }

    console.log ('FFT log power flux calculation completed');

    this.calcMatrix(flux);

    // tempo, beat estimation

  } // end analyze

  calcPower(fftresult){ // log power

    let N = fftresult.length; // power of two + 1
    let retval = [];
    let C = 1000.0/2; 
    // console.log('N = ', N);

    for (let i = 0; i < N/2; i++){
      if (i === 0) 
        retval[i] = fftresult[0]*fftresult[0]; // DC
      else if (i === N/2)
        retval[i] = fftresult[i]*fftresult[i]; // real only
      else
        retval[i] = fftresult[i]*fftresult[i]
               + fftresult[N-i]*fftresult[N-i]; // real and imaginary

      retval[i] = Math.log(1 + C*retval[i]);
    }

    return retval;
  }

  calcFlux(last, current){
    let retval = 0;

    for (let f = 1; f < current.length; f++){ // DC is ignored
         let diff; 
         if (last === undefined) 
           diff = Math.max(0, current[f]);
         else  
           diff = Math.max(0, current[f] - last[f]);

         retval += diff;
    }

    return retval;
  }

  calcMatrix (flux){

    let matrix = new Array(100); // max 93
        matrix[0] = [];
    for (let i = 1; i < 100; i++) 
        matrix[i] = new Array(i); // triangle

    console.log('calcMatrix');

// median filter on flux
    for (let i = 0; i + 4 < flux.length; i++) { 
      let median = Stats(flux.slice(i,i+4)).median();
      if (flux[i+2] < median) flux[i+2] = 0;
    } 

// 512 windows of 512 samples shift= 5.461 sec at 48kHz
// 240bpm interval 60/240 = 0.25 sec (j = 23.4), 60bpm j 93.8)

    for (let n = 0; 512*(n+1) < flux.length; n++) { // n: window #
      let i = 512*n; // beginning of the window 
      for (let interval = 23; interval < 94; interval++)
        for (let phase = 0; phase < interval; phase ++)
          for (let m = 0; phase + interval*m < 512 ; m++) {
             if (m === 0) 
               matrix[interval][phase] = flux[i + phase]; // initial
             else 
               matrix[interval][phase] = 0.9*matrix[interval][phase] 
                                       + 0.1*flux[i + phase + interval*m];
          } // end for m
// find large values
// debug output
      if (n < 10){
        for (let interval = 23; interval < 94; interval++){ 
          let bpm = 60/(interval*512/this.params.inputAudio.sampleRate);
          let max =  Stats(matrix[interval]).max();
          let index = matrix[interval].indexOf(max);
          if (this.params.estBpm !== undefined 
            && bpm > this.params.estBpm - 5
            && bpm < this.params.estBpm + 5) {
            console.log (n, interval, index, max, bpm);
          }
        }
      } // end if n

    } // end for n

    console.log('===END calcMatrix');
  } // end function

  playAudio(input){

    this.params.beginTime = audioCtx.currentTime;
    this.params.playing = audioCtx.createBufferSource();
    let music = this.params.playing;
    music.buffer = input;
    music.connect(audioCtx.destination);
    music.start(0);

  }

  addClick(latency){

    const {inputAudio} = this.params;
    const {sampleRate, length, duration, numberOfChannels} = inputAudio;
    let outputAudio 
       = audioCtx.createBuffer(numberOfChannels, length, sampleRate);
    let clickAudio 
       = audioCtx.createBuffer(2, length, sampleRate);

    this.params.outputAudio = outputAudio;

    let taps = this.params.taps;
    let click1L = click1Sample.getChannelData(0);
    let click1R = click1Sample.getChannelData(1);

    let mean = 0;
    for (let i=0; i < taps.length; i++){
      if (i+1 < taps.length) mean += taps[i+1] - taps[i];
      let offset = Math.round(sampleRate*taps[i]) - latency;
      clickAudio.copyToChannel(click1L, 0, offset);
      clickAudio.copyToChannel(click1R, 1, offset);
    }
    mean /= taps.length - 1;
    console.log ('bpm (bar, 1/4 note): ', 60/mean, 60*4/mean);

    if (numberOfChannels === 2) {
      let left = inputAudio.getChannelData(0);
      let right = inputAudio.getChannelData(1);
      let leftOut = outputAudio.getChannelData(0);
      let rightOut = outputAudio.getChannelData(1);
      let clickL = clickAudio.getChannelData(0);
      let clickR = clickAudio.getChannelData(1);

      for (let i = 0; i < left.length; i++){
        leftOut[i] = left[i] + clickL[i];
        rightOut[i] = right[i] + clickR[i];
      }

    } else if (numberOfChannels === 1){
      let mono = inputAudio.getChannelData(0);
      let monoOut = outputAudio.getChannelData(0);
      for (let i = 0; i < mono.length; i++) {
        monoOut[i] = mono[i];
      }
    }
//    console.log(outputAudio.duration);

  }

} // end class

export default App;
