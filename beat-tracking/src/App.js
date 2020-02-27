import React, {Component} from 'react';
// import logo from './logo.svg';
import './App.css';
// import BufferLoader from './buffer-loader';
import packageJSON from '../package.json';
// import clickSound from '';
import {RFFT} from 'fftw-js';
import Windowing from 'fft-windowing';

const version = (packageJSON.homepage + packageJSON.subversion).slice(-10);
const homepage = 'https://goto920.github.io' + packageJSON.homepage.slice(0,-8);

window.AudioContext = window.AudioContext || window.webkitAudioContext
const audioCtx = new window.AudioContext()

class App extends Component {
  constructor (props){
    super(props);
    this.params = {
       inputAudio: undefined,
       outputAudio: undefined,
       peaks: undefined
    }

    this.state = {
      startButtonStr: 'Wait'
    }

    this.loadFile = this.loadFile.bind(this);
    this.handlePlay = this.handlePlay.bind(this);
    this.analyze = this.analyze.bind(this);
    this.playAudio = this.playAudio.bind(this);
    this.calcPower = this.calcPower.bind(this);
    this.calcFlux = this.calcFlux.bind(this);
    this.findPeaks = this.findPeaks.bind(this);
  } // end constructor

  componentDidMount () { // before render()
    window.addEventListener('beforeClosing', this.handleWindowClose);
  }

  componentWillUnmount () { // before closing app
    window.removeEventListener('beforeClosing', this.handleWindowClose);
  }

  render () {
    const {loadFile, handlePlay} = this;
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
          this.setState({startButtonStr: 'startAnalysis', currentTime: 0});
        }.bind(this),
        function (error) { console.log ("Filereader error: " + error.err);})
    }.bind(this)
    reader.readAsArrayBuffer(file);
  }

  handlePlay (event) {
    if (event.target.name !== 'startPause') return;

    if (this.state.startButtonStr === 'startAnalysis') this.analyze();
    if (this.state.startButtonStr === 'Play') this.playAudio();
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
    console.log ('flux[0]');

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
      console.log ('flux[',i,']');
    }

    console.log ('FFT completed');

    // Peak
    this.findPeaks(flux);
    // tempo, beat estimation

    this.setState({startButtonStr: 'Play'});

  } // end analyze

  calcPower(fftresult){
    let N = fftresult.length; // power of two + 1
    let retval = [];

    for (let i = 0; i < N/2; i++){
     if (i === 0) 
       retval = fftresult[0]*fftresult[0];
     else
       retval = fftresult[i]*fftresult[i]
              + fftresult[N-i]*fftresult[N-i];
    }

    return retval;
  }

  calcFlux(last, current){
    let retval = {low: 0, mid: 0, high: 0, presence: 0};
    let low = 4; // 172Hz  Unit 44100/(2*512) = 43Hz
    let mid = 20; // 860 Hz 
    let high = 100; // 4300 Hz

    for (let i = 1; i < current.length; i++){ // DC is ignored
         let diff; 
         if (last === undefined) 
           diff = Math.max(0, current[i]);
         else  
           diff = Math.max(0, current[i] - last[i]);

         if (i <= low)        retval.low += diff;
         else if (i <= mid)   retval.mid += diff;
         else if (i <= high)  retval.high += diff;
         else                 retval.presence += diff;
    }

    return retval;
  }

  findPeaks(flux){
    let t = 0.8, range = 2.0;

    let av_low  = flux[0].low,  av2_low = 0;
    let av_mid  = flux[0].mid,  av2_mid = 0;
    let av_high = flux[0].high, av2_high = 0;
    let av_presence = flux[0].presence, av2_presence = 0;

    console.log ('#', flux.length);
/*
    console.log (0, flux[0].low, flux[0].mid, 
       flux[0].high, flux[0].presence, '#'); // debug
*/

    let max_low = 1, max_mid = 1, max_high = 1, max_presence = 1;
    let low_last_index = 0, mid_last_index = 0, 
        high_last_index = 0, presence_last_index = 0;

    for (let i=1; i < flux.length; i++){
      let low=0, high=0, mid=0, presence=0;

      // substract local average and log
      if (flux[i].low <= range*av_low) low = 0; 
      else {
        low = Math.log10(1+flux[i].low - range*av_low);
        if (low <= 0.5*max_low) low = 0;
        if (low > max_low) max_low = low;
      }

      if (flux[i].mid <= range*av_mid) mid = 0; 
      else {
        mid = Math.log10(1+flux[i].mid - range*av_mid);
        if (mid > max_mid) max_mid = mid;
        else if (mid <= 0.5*max_mid) mid = 0;
      }    

      if (flux[i].high <= range*av_high) high = 0; 
      else {
        high = Math.log10(1+flux[i].high - range*av_high);
        if (high > max_high) max_high = high;
        else if (high <= 0.5*max_high) high = 0;
      }

      if (flux[i].presence <= range*av_presence) presence = 0; 
      else {
        presence = Math.log10(1 + flux[i].presence - range*av_presence);
        if (presence > max_presence) max_presence = presence;
        else if (presence <= 0.5*max_presence) presence = 0;
      }

      if (low > 0 && i - low_last_index > 15){ // 2XXbpm
        let interval = i - low_last_index;
        if (low_last_index === 0) 
          console.log (i, low,  interval, '#initial'); // debug
        else {
          let bpm_low = (44100*60)/(512*interval);
          console.log (i, low,  interval, '#bpm', bpm_low)  ; // debug
        }
        low_last_index = i;
      }
//        console.log (i, low, mid, high, presence, '#'); // debug

      av_low = t*av_low + (1-t)*flux[i].low;
      av2_low = t*av2_low 
        + (1-t)*(flux[i].low - av_low)*(flux[i].low - av_low);

      av_mid = t*av_mid + (1-t)*flux[i].mid;
      av2_mid = t*av2_mid
        + (1-t)*(flux[i].mid - av_mid)*(flux[i].mid - av_mid);

      av_high = t*av_high + (1-t)*flux[i].high;
      av2_high = t*av2_high
        + (1-t)*(flux[i].high - av_high)*(flux[i].high - av_high);

      av_presence = t*av_presence + (1-t)*flux[i].presence;
      av2_presence = t*av2_presence
        + (1-t)*(flux[i].presence - av_presence)*(flux[i].presence - av_presence);

    }

  }

  playAudio(){
    // console.log('playAudio');
    let music = audioCtx.createBufferSource();
    music.buffer = this.params.outputAudio;
    music.connect(audioCtx.destination);
    music.start();
  }

} // end class

export default App;
