// import {RFFT} from 'fftw-js'; // fftw-js
import {FFTR} from 'kissfft-js';
import Windowing from 'fft-windowing';

class Effector {

  constructor(shiftSize,sampleRate){
    this.shiftSize = shiftSize;
    this.sampleRate = sampleRate;

//    this.rfft = new RFFT(2*this.shiftSize); // fftw-js
    this.rfft = new FFTR(2*this.shiftSize); // kissfft-js

    this.fftObjBuffer = []; // up to 17

    this.lastInput = [];
    this.lastInput[0] = new Float32Array(shiftSize).fill(0);
    this.lastInput[1] = new Float32Array(shiftSize).fill(0);

    this.lastOut = [];
    this.lastOut[0] = new Float32Array(shiftSize).fill(0);
    this.lastOut[1] = new Float32Array(shiftSize).fill(0);

    this.filterChain = []; 
       // fromPan, fromFreq, toPan, toFreq, action 
       // ('T': through, 'M': mute, 'P': percussive, 'H': harmonic)

    this.calcFFT = this.calcFFT.bind(this); // forward FFT 
    this.justFFT = this.justFFT.bind(this); // forward FFT 
    this.calcPan = this.calcPan.bind(this); // Pan calculation
    this.calcPerc = this.calcPerc.bind(this);
    this.fftFilter = this.fftFilter.bind(this);

    this.addFilter = this.addFilter.bind(this);
    this.clearAllFilter = this.clearAllFilter.bind(this);

    this.presetFilter = this.presetFilter.bind(this);

  }

  addFilter(fromPan, fromFreq, toPan, toFreq, action){ 

    let fromFreqIndex = Math.min(this.shiftSize, 
            Math.round(this.shiftSize*(2*fromFreq/this.sampleRate)));
    let toFreqIndex = Math.min(this.shiftSize, 
            Math.round(this.shiftSize*(2*toFreq/this.sampleRate)));

    this.filterChain.push({
      fromPan: fromPan, fromFreqIndex: fromFreqIndex,
      toPan: toPan, toFreqIndex: toFreqIndex,
      action: action
    });

  }

  clearAllFilter(){ this.filterChain.length = 0; }

  copy(inputBuffer, outputBuffer){ // for test

    for (let channel = 0; channel < inputBuffer.numberOfChannels;
           channel++){
      let inputData = inputBuffer.getChannelData(channel);
      let outputData = outputBuffer.getChannelData(channel);

      if (AudioBuffer.prototype.copyToChannel)
          outputBuffer.copyToChannel(inputData, channel,0);
      else 
         for (let sample = 0; sample < inputBuffer.length; sample++)
              outputData[sample] = inputData[sample];

    } // end for channel
    return;
  }

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
  }

  process(inputBuffer, outputBuffer){

    if (inputBuffer.numberOfChannels !== 2) return;

// prepare input
// FFT window = 2*this.shiftSize window = 2*this.shiftSize
// channel: 0(left), 1(right)
    let fftWindowInput = [];
       fftWindowInput[0] = new Float32Array(this.shiftSize*2);
       fftWindowInput[1] = new Float32Array(this.shiftSize*2);

    for (let channel = 0; channel <= 1 ; channel++){

      let inputData = inputBuffer.getChannelData(channel);

      for (let sample = 0; sample < 2*this.shiftSize; sample++){ 
        if (sample < this.shiftSize) 
          fftWindowInput[channel][sample] = this.lastInput[channel][sample];
        else if (sample < this.shiftSize + inputData.length) 
          fftWindowInput[channel][sample] = inputData[sample - this.shiftSize];
        else fftWindowInput[channel][sample] = 0;
      }

      for (let sample = 0; sample < this.shiftSize; sample++) 
        this.lastInput[channel][sample] 
          = fftWindowInput[channel][this.shiftSize + sample];

    } // end for channel

    let fftObj = this.calcFFT(fftWindowInput);
    // fftObj is null until the buffer has 17 fftObj's

// decode FFT
    let pcmData = []; // this.shiftSize*2  

//    let fftCoef = this.justFFT(fftWindowInput); // test

    if (fftObj !== null) {
      let fftCoef = this.fftFilter(fftObj);

       pcmData[0] = this.rfft.inverse(fftCoef[0]).slice(); 
       pcmData[1] = this.rfft.inverse(fftCoef[1]).slice();

       // console.log(pcmData[0]);

    } else {
       // console.log ('fftObj is null');
       pcmData[0] = new Float32Array(this.shiftSize*2 + 2).fill(0);
       pcmData[1] = new Float32Array(this.shiftSize*2 + 2).fill(0);
    }

// Add two outputs in overlapped hann window 
    for(let channel = 0; channel <= 1; channel++){
      let outputData = outputBuffer.getChannelData(channel);

      for (let sample = 0; sample < this.shiftSize; sample++)
         outputData[sample] = this.lastOut[channel][sample] 
           + pcmData[channel][sample]/(2*this.shiftSize);

      for (let sample = 0; sample < this.shiftSize; sample++)
         this.lastOut[channel][sample] 
           = pcmData[channel][this.shiftSize + sample]/(2*this.shiftSize);
      // store latter half of fft inverse output

    }

    return;
  }

  justFFT (fftWindowInput){

     // console.log(fftWindowInput[0]);

    let fftCoef = [];
    fftCoef[0] = this.rfft.forward(Windowing.hann(fftWindowInput[0])).slice();
    fftCoef[1] = this.rfft.forward(Windowing.hann(fftWindowInput[1])).slice();

    return fftCoef;
  }

  calcFFT (fftWindowInput){

    let fftCoef = [];
    fftCoef[0] = this.rfft.forward(Windowing.hann(fftWindowInput[0])).slice();
    fftCoef[1] = this.rfft.forward(Windowing.hann(fftWindowInput[1])).slice();
    // 0: Left, 1: Right

    let power = [];
      power[0] = new Float32Array(this.shiftSize+1)
      power[1] = new Float32Array(this.shiftSize+1)
    // 0: Left, 1: Right
    
    for (let freqBin = 0; freqBin <= this.shiftSize; freqBin++){
      power[0][freqBin] = fftCoef[0][2*freqBin]* fftCoef[0][2*freqBin]
               + fftCoef[0][2*freqBin+1]* fftCoef[0][2*freqBin+1]
      power[1][freqBin] = fftCoef[1][2*freqBin]* fftCoef[1][2*freqBin]
               + fftCoef[1][2*freqBin+1]* fftCoef[1][2*freqBin+1]
    }

    let fftObj = { 
      fftCoef: fftCoef,
      pan:  [],
      panAmp: [],
      power: power,
      percL: [],
      percR: []
    };   

    this.calcPan(fftObj);

    this.fftObjBuffer.push(fftObj);

    return this.calcPerc(this.fftObjBuffer); 

  } // end calcFFT

  calcPan (fftObj) {

    const fft = fftObj.fftCoef;
    let numCoef = fft[0].length/2;
    let pan = new Float32Array(numCoef);
    let panAmp = new Float32Array(numCoef);

/*
  Note: frequency-domain data is stored from dc up to 2pi. 
  so cx_out[0] is the dc bin of the FFT and cx_out[nfft/2] is 
  the Nyquist bin (if exists)
*/

//    console.log('numCoef', numCoef);

    for(let freqBin = 0; freqBin < numCoef; freqBin++){

      let base = 2*freqBin; 

      let innerProd = fft[0][base]*fft[1][base]
                      + fft[0][base+1]*fft[1][base+1]

      let crossProd = fft[0][base]*fft[1][base+1] // Don't forget minus
                      - fft[0][base+1]*fft[1][base]

      let abs = Math.sqrt(
         Math.pow(fft[0][base] + fft[1][base],2)
       + Math.pow(fft[0][base+1] + fft[1][base+1],2)
      );

      let absL = Math.sqrt( 
          Math.pow(fft[0][base],2) + Math.pow(fft[0][base+1],2));
      let absR = Math.sqrt(
          Math.pow(fft[1][base],2) + Math.pow(fft[1][base+1],2));

      let absLR = Math.sqrt(
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
      }
    // console.log('bin, fracB', freqBin, frac);

       if (isNaN(pan[freqBin])) pan[freqBin] = 0;
       if (isNaN(panAmp[freqBin])) panAmp[freqBin] = 0;

    } // end for freqBin

    fftObj.pan = pan;
    fftObj.panAmp = panAmp;

    return;
  }


  calcPerc(fftObjBuffer){

    const median = arr => {
      const mid = Math.floor(arr.length / 2),
      nums = [...arr].sort((a, b) => a - b);
      return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
    };

    let buflen = fftObjBuffer.length;
    // console.log ('buflen', buflen);

    if (buflen < 17) return null; // not enough dat

    let percL = new Float32Array(this.shiftSize+1).fill(0.5); // +1 for DC
    let percR = new Float32Array(this.shiftSize+1).fill(0.5); 
      // also used as power

    const index = 8;
    const fftObj = fftObjBuffer[index];

    for (let freqBin = 0; freqBin <= this.shiftSize; freqBin++){
      let from = Math.max(0, freqBin - 9);
      let to =  Math.min(freqBin + 9, this.shiftSize + 1); // to (not incl.) 
      let pMedianL = median(fftObj.power[0].slice(from,to));
      let pMedianR = median(fftObj.power[1].slice(from,to));

      let powerArrayL = [];
      let powerArrayR = [];

      for (let time = 0; time < buflen; time++){ // buflen (max 17)
        powerArrayL.push(fftObjBuffer[time].power[0][freqBin]);
        powerArrayR.length = 0;
        powerArrayR.push(fftObjBuffer[time].power[1][freqBin]);
      }

      let hMedianL = median(powerArrayL);
      let hMedianR = median(powerArrayR);

      percL[freqBin] = (pMedianL*pMedianL)/
         (pMedianL*pMedianL + hMedianL*hMedianL);
      if (isNaN(percL[freqBin])) percL[freqBin] = 0.5;
      percR[freqBin] = (pMedianR*pMedianR)/
         (pMedianR*pMedianR + hMedianR*hMedianR);
      if (isNaN(percR[freqBin])) percR[freqBin] = 0.5;

    }

    fftObjBuffer[index].percL = percL;
    fftObjBuffer[index].percR = percR;

    let retval = { 
      fftCoef: [fftObj.fftCoef[0].slice(), fftObj.fftCoef[1].slice()],
      pan:  fftObj.pan.slice(),
      panAmp: fftObj.panAmp.slice(),
      power: [fftObj.power[0].slice(), fftObj.power[1].slice()],
      perc: [percL.slice(), percR.slice()]
    };   

    if (buflen >= 17) fftObjBuffer.splice(0,1);

    return retval;
  }

  fftFilter (fftObj){

    const fftL = fftObj.fftCoef[0];
    const fftR = fftObj.fftCoef[1];
    const percL = fftObj.perc[0];
    const percR = fftObj.perc[1];

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
  }

}

export default Effector;
