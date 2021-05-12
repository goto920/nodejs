/**
 * FFT filter with pan and percussive/harmonic separation

 * @class FilterProcessor
 * @extends AudioWorkletProcessor
 * written by goto@kmgoto.jp (goto@nanzan-u.ac.jp)
 * 
 * browserify filter-processor.js -p esmify > bundle.js
 *   Requirement
 *     npm install -g browserify
 *     npm install esmify --save-dev
 *     npm install browser-resolve --save-dev
 *
 * References (in BibTeX format)
 @inproceedings{Barry2004,
  title={Sound source separation: Azimuth discrimination and resynthesis},
  author={Barry, Dan and Lawlor, Bob and Coyle, Eugene},
  booktitle={7th International Conference on Digital Audio Effects, DAFX 04},
  year={2004}
}
@inproceedings{Fitzgerald2010,
  title={Harmonic/percussive separation using median filtering},
  author={Fitzgerald, Derry},
  booktitle={Proceedings of the International Conference 
  on Digital Audio Effects (DAFx)},
  volume={13},
  year={2010}
}
 */

import { FFTR } from 'kissfft-js';
import { ProcessFFT } from './wasm/process_fft'; 

class FilterProcessor extends AudioWorkletProcessor {

  constructor(options) {
    super();

    this.sampleRate = options.processorOptions.sampleRate;
    this.fftShift   = options.processorOptions.fftShift; 
    // 512 windowSize = 2*512 = 1024

    this.processFFT = new ProcessFFT(
          2*this.fftShift, parseFloat(this.sampleRate));

    this.ioSize  = 128; // # samples per process (from the spec)
    console.log('Worklet options: ' + this.sampleRate + ' ' + this.fftShift);

    this.fftr = new FFTR(2*this.fftShift); // kissfft-js
    this.hannWindow = [];
    for(let n = 0; n < 2*this.fftShift; n++)
      this.hannWindow[n] = 0.5*(1 - Math.cos(2*Math.PI*n/(2*this.sstShift)));

    this.fftObjBuffer = []; // up to 17
    this.inputBuffer = [[],[]];
    this.outputBuffer = [[],[]]; 
    this.filterChain = [];
       // fromPan, fromFreq, toPan, toFreq, action 
       // ('T': through, 'M': mute, 'P': percussive, 'H': harmonic)
    // this.port.onmessage = this.onmessage.bind(this);
    this.port.onmessage = (e) => {
      const { data } = e;
      console.log('worklet recvd: ', data);
      const res = {type: 'return', arg: ''};
      switch(data.function){
        case 'presetFilter':
          this.processFFT.presetFilter(data.type, data.arg); 
          res.arg = 'OK'; 
          break;
        default: res.arg = 'NG';
      }
      this.port.postMessage(res);
    } // end onmessage() (should be in the constructor)

  } // end constructor()

  applyHannWindow(input){
    const retval = input;
    retval.map ((x,index) => x*this.hannWindow[index]);
    return retval;
  }

  process(inputs, outputs) { // Unit is 128 samples for AudioWorklet 
    // return true to continue on Chrome

    const input = inputs[0];
    const output = outputs[0];

/*
  inputs[n][m][i] will access n-th input, m-th channel of that input, 
  and i-th sample of that channel.
  https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process
 */

    if (input.length !== 2) return true; // Stereo Only

    // Store input audio samples in buffer for one fft Window (fftShift*2)
    if (this.inputBuffer[0].length === 0){
      this.inputBuffer[0] = [...input[0]];
      this.inputBuffer[1] = [...input[1]];
    } else {
      this.inputBuffer[0].push(...input[0]);
      this.inputBuffer[1].push(...input[1]);
    }

    // FFT if there are 1024 samples (===) should work
    if (this.inputBuffer[0].length >= 2*this.fftShift) {
      // console.log('FFT ibuf len = ', this.inputBuffer[0].length);

    // FFT forward
      let fftCoef = this.justFFT(this.inputBuffer);
      this.inputBuffer[0].splice(0,this.fftShift); 
      this.inputBuffer[1].splice(0,this.fftShift);
     
if (true) {
      // prepare float vector for C++ class method arg
      const ret = this.processFFT.process([...fftCoef[0],...fftCoef[1]]);
      fftCoef[0].set(ret.subarray(0, ret.length/2));
      fftCoef[1].set(ret.subarray(ret.length/2,ret.length));

      // extract data from returned float vector
      for (let i = 0; i < ret.size(); i++) {
         if (i < ret.size()/2) fftCoef[0][i] = ret.get(i);
         else fftCoef[1][i-ret.size()/2] = ret.get(i);
      }
      ret.delete(); 
}
      
    // Inverse
    const pcmData = [  
      this.fftr.inverse(fftCoef[0]).map(x => x/(2*this.fftShift)), 
      this.fftr.inverse(fftCoef[1]).map(x => x/(2*this.fftShift)) 
    ]; // divide by windowSize

    // Store the output samples with overlap addition
    const len  = this.outputBuffer[0].length;
    const base = Math.max(0, len - this.fftShift);

    for (let sample = 0; sample < 2*this.fftShift; sample++){
      if (base + sample < len) { // overlap addition
        // this.outputBuffer[0][base + sample] += pcmData[0][sample];
        // this.outputBuffer[1][base + sample] += pcmData[1][sample];
      } else { // new output
        this.outputBuffer[0][base + sample] = pcmData[0][sample];
        this.outputBuffer[1][base + sample] = pcmData[1][sample];
      }
    }

    } // end if (this.inputBuffer[0].length >= 2*this.fftShift)

    // no output because the last fftShift samples are to be overlaped
    // add delay
    if (this.outputBuffer[0].length < 64*this.fftShift) return true;

    // output 128 (this.ioSize) samples
    output[0].set(this.outputBuffer[0].slice(0,this.ioSize));
    output[1].set(this.outputBuffer[1].slice(0,this.ioSize));
    // delete output samples from the head
    this.outputBuffer[0].splice(0,this.ioSize);
    this.outputBuffer[1].splice(0,this.ioSize);

    return true;
  } // end process()

  justFFT(inputSamples){

   return [ 
     this.fftr.forward(this.applyHannWindow(inputSamples[0])).slice(),
     this.fftr.forward(this.applyHannWindow(inputSamples[1])).slice()
   ]; 
  }

} // end of the class
  
registerProcessor('filter-processor', FilterProcessor);
