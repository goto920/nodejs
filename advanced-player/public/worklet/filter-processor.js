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
// import Windowing from 'fft-windowing'; // did not work in worklet

class FilterProcessor extends AudioWorkletProcessor {

  constructor(options) {
    super();

    this.sampleRate = options.processorOptions.sampleRate;
    this.fftShift   = options.processorOptions.fftShift; 
    // 512 windowSize = 2*512 = 1024
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


    this.port.onmessage = (e) => {
      const { data } = e;
      console.log('worklet recvd: ', data);
      const res = {type: 'return', arg: ''};
      switch(data.function){
        case 'presetFilter':
          this.presetFilter(data.type, data.arg); res.arg = 'OK'; break;
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

  addFilter(fromPan, fromFreq, toPan, toFreq, action){ 

    let fromFreqIndex = Math.min(this.fftShift, 
            Math.round(this.fftShift*(2*fromFreq/this.sampleRate)));
    let toFreqIndex = Math.min(this.fftShift, 
            Math.round(this.fftShift*(2*toFreq/this.sampleRate)));

    this.filterChain.push({
      fromPan: fromPan, fromFreqIndex: fromFreqIndex,
      toPan: toPan, toFreqIndex: toFreqIndex,
      action: action
    });

  } // end addFilter()


  clearAllFilter(){ this.filterChain.length = 0; }

  presetFilter(type, option){

     this.clearAllFilter();
     console.log('filter, option ', type, option);

     let width;
     switch (type){
       case 'bypass': break;
       case 'drumCover':
         width = option;
         this.addFilter(-1,0,1,30000,"H");
         this.addFilter(-width/2,220,width/2,4000,"T");
         this.addFilter(-1.0,220,-0.9,4000,"T");
         this.addFilter(0.9,220,1.0,4000,"T");
       break;
       case 'karaokeMale':
         width = option;
         this.addFilter(-width/2,220,width/2,8000,"M");
       break;
       case 'karaokeFemale':
         width = option;
         this.addFilter(-width/2,350,width/2,8000,"M");
       break;
       case 'percussive':
         this.addFilter(-1,0,1,30000,"P");
       break;
       case 'harmonic':
         this.addFilter(-1,0,1,30000,"H");
       break;
       default:
     }
  } // end presetFilter()

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

    /* // fot Test
      const fftCoef = this.justFFT(this.inputBuffer);
      this.inputBuffer[0].splice(0,this.fftShift); 
      this.inputBuffer[1].splice(0,this.fftShift);
    */

    // process effect
    const fftObj = this.calcFFT(this.inputBuffer);
      // Shift by deleting fftShift samples from the head
    this.inputBuffer[0].splice(0,this.fftShift); 
    this.inputBuffer[1].splice(0,this.fftShift);
    if (fftObj === null) return true;

    const fftCoef = this.fftFilter(fftObj);

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
    if (this.outputBuffer[0].length < 64*this.fftShift) return true;

    // output 128 (this.ioSize) samples
    output[0].set(this.outputBuffer[0].slice(0,this.ioSize));
    output[1].set(this.outputBuffer[1].slice(0,this.ioSize));
    // delete output samples from the head
    this.outputBuffer[0].splice(0,this.ioSize);
    this.outputBuffer[1].splice(0,this.ioSize);

    return true;
  } // end process()

  calcFFT (inputSamples){

    const fftCoef = [
      this.fftr.forward(this.applyHannWindow(inputSamples[0])).slice(),
      this.fftr.forward(this.applyHannWindow(inputSamples[1])).slice()
    ]; // 0: Left, 1: Right

    const power = [
        new Float32Array(this.fftShift + 1),
        new Float32Array(this.fftShift + 1) 
    ]; // 0: Left, 1: Right plus1 for DC
    
    for (let freqBin = 0; freqBin <= this.fftShift; freqBin++){
      power[0][freqBin] = fftCoef[0][2*freqBin]* fftCoef[0][2*freqBin]
               + fftCoef[0][2*freqBin+1]* fftCoef[0][2*freqBin+1]
      power[1][freqBin] = fftCoef[1][2*freqBin]* fftCoef[1][2*freqBin]
               + fftCoef[1][2*freqBin+1]* fftCoef[1][2*freqBin+1]
     }

     const fftObj = {
       fftCoef: fftCoef,
       pan: [],
       power: power,
       percL: [],
       percR: []
     }

     this.calcPan(fftObj); // values returned in fftObj
     this.fftObjBuffer.push(fftObj); // append to the buffer

     const fftObjRet = this.calcPerc(this.fftObjBuffer); 
      // fftObj returned if there are enough samples
     return fftObjRet;

   } // end calcFFT

   calcPan (fftObj) {

     const fft = fftObj.fftCoef;
     const numCoef = fft[0].length/2;
     const pan = new Float32Array(numCoef);
     const panAmp = new Float32Array(numCoef);

/*
  Note: frequency-domain data is stored from dc up to 2pi. 
  so cx_out[0] is the dc bin of the FFT and cx_out[nfft/2] is 
  the Nyquist bin (if exists)
*/

//    console.log('numCoef', numCoef);

    for(let freqBin = 0; freqBin < numCoef; freqBin++){
      const base = 2*freqBin; 

      const innerProd 
          = fft[0][base]*fft[1][base] + fft[0][base+1]*fft[1][base+1]
      const crossProd 
          = fft[0][base]*fft[1][base+1] - fft[0][base+1]*fft[1][base]
         // Don't forget minus

      const abs = Math.sqrt(
         Math.pow(fft[0][base] + fft[1][base],2)
       + Math.pow(fft[0][base+1] + fft[1][base+1],2)
      );

      const absL = Math.sqrt( 
          Math.pow(fft[0][base],2) + Math.pow(fft[0][base+1],2));
      const absR = Math.sqrt(
          Math.pow(fft[1][base],2) + Math.pow(fft[1][base+1],2));
      const absLR = Math.sqrt(
        Math.pow(fft[0][base] - fft[1][base],2)
        + Math.pow(fft[0][base+1] - fft[1][base+1],2)
      );

      let frac = 0; 
      if (absL < absR){
        if (innerProd < 0) {
          frac = 0;
          panAmp[freqBin] = (absLR - absL)/abs;
        } else if (innerProd <= absR*absR) {
          frac = innerProd/(absR*absR); 
          panAmp[freqBin] = Math.max(absL,absLR) - Math.abs(crossProd)/absR; 
        } else {
          frac = 1;
          panAmp[freqBin] = absL - absLR;
        }
        pan[freqBin] = (1-frac)/(1+frac);
        // console.log('bin, fracA', freqBin, frac);

      } else { // absL >= absR
        if (innerProd < 0) {
          frac = 0;
          panAmp[freqBin] = (absLR - absR)/abs;
        } else if (innerProd <= absL*absL) {
          frac = innerProd/(absL*absL); 
          panAmp[freqBin] = Math.max(absR,absLR) - Math.abs(crossProd)/absL; 
        } else {
          frac = 1;
          panAmp[freqBin] = absR - absLR;
        }

        pan[freqBin] = (frac-1)/(1+frac);
      } // console.log('bin, fracB', freqBin, frac);

      if (isNaN(pan[freqBin])) pan[freqBin] = 0;
      if (isNaN(panAmp[freqBin])) panAmp[freqBin] = 0;
    } // end for freqBin

    fftObj.pan = pan;
    fftObj.panAmp = panAmp;

    return;

  } // end calcPan()

  calcPerc(fftObjBuffer){

    const median = arr => {
      const mid = Math.floor(arr.length / 2),
      nums = [...arr].sort((a, b) => a - b);
      return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
    }

    const buflen = fftObjBuffer.length; // console.log ('buflen', buflen);

    if (buflen < 17) return null; // not enough data

    const percL = new Float32Array(this.fftShift+1).fill(0.5); // +1 for DC
    const percR = new Float32Array(this.fftShift+1).fill(0.5); 
         // also used as power

    const index = 8;
    const fftObj = fftObjBuffer[index];

    for (let freqBin = 0; freqBin <= this.fftShift; freqBin++){
      const from = Math.max(0, freqBin - 9);
      const to =  Math.min(freqBin + 9, this.fftShift + 1); // to (not incl.) 
      const pMedianL = median(fftObj.power[0].slice(from,to));
      const pMedianR = median(fftObj.power[1].slice(from,to));

      const powerArrayL = [];
      const powerArrayR = [];

      for (let time = 0; time < buflen; time++){ // buflen (max 17)
        powerArrayL.push(fftObjBuffer[time].power[0][freqBin]);
        powerArrayR.push(fftObjBuffer[time].power[1][freqBin]);
      }

      const hMedianL = median(powerArrayL);
      const hMedianR = median(powerArrayR);

      percL[freqBin] = (pMedianL*pMedianL)/
         (pMedianL*pMedianL + hMedianL*hMedianL);
      if (isNaN(percL[freqBin])) percL[freqBin] = 0.5;
      percR[freqBin] = (pMedianR*pMedianR)/
         (pMedianR*pMedianR + hMedianR*hMedianR);
      if (isNaN(percR[freqBin])) percR[freqBin] = 0.5;

    }

    fftObjBuffer[index].percL = percL;
    fftObjBuffer[index].percR = percR;

    const retval = { 
      fftCoef: [fftObj.fftCoef[0].slice(), fftObj.fftCoef[1].slice()],
      pan:  fftObj.pan.slice(),
      panAmp: fftObj.panAmp.slice(),
      power: [fftObj.power[0].slice(), fftObj.power[1].slice()],
      perc: [percL.slice(), percR.slice()]
    }; // fftObj

    if (buflen >= 17) fftObjBuffer.splice(0,1);

    return retval;
   } // end calcPerc()

  fftFilter (fftObj){

    const fftL = fftObj.fftCoef[0];
    const fftR = fftObj.fftCoef[1];
    const percL = fftObj.perc[0];
    const percR = fftObj.perc[1];

    // return [fftL, fftR]; // for test

    let outL = fftL.slice();
    let outR = fftR.slice();

    for (let i = 0; i < this.filterChain.length; i++){
      let filter = this.filterChain[i];
      let action = filter.action;
      for (let f = filter.fromFreqIndex; f <= filter.toFreqIndex; f++){

        if (fftObj.pan[f] < filter.fromPan 
          || fftObj.pan[f] > filter.toPan) continue;

        switch (action) {
          case 'T': // original signal
            outL[2*f] = fftL[2*f]; outL[2*f+1] = fftL[2*f + 1];
            outR[2*f] = fftR[2*f]; outR[2*f+1] = fftR[2*f + 1];
          break;

          case 'M': // mute
            outL[2*f] = outL[2*f+1] = 0; // real, image
            outR[2*f] = outR[2*f+1] = 0; // real, image
          break;

          case 'P':
            outL[2*f] = fftL[2*f]*percL[f];
            outL[2*f+1] = fftL[2*f+1]*percL[f];
            outR[2*f] = fftR[2*f]*percR[f]; 
            outR[2*f+1] = fftR[2*f+1]*percR[f];
          break;
          case 'H':
            outL[2*f] = fftL[2*f]*(1-percL[f]);
            outL[2*f+1] = fftL[2*f+1]*(1-percL[f]);
            outR[2*f] = fftR[2*f]*(1-percR[f]); 
            outR[2*f+1] = fftR[2*f+1]*(1-percR[f]);
          break;

          default:
            console.log('Filter undef action', action);
        }

      }

    }
    return [outL, outR];

  } // end fftFilter()

  justFFT(inputSamples){

   return [ 
     this.fftr.forward(this.applyHannWindow(inputSamples[0])).slice(),
     this.fftr.forward(this.applyHannWindow(inputSamples[1])).slice()
   ]; 
  }

} // end of the class
  
registerProcessor('filter-processor', FilterProcessor);
