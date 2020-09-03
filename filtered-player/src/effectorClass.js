// import {RFFT} from 'fftw-js'; // fftw-js
import {FFTR} from 'kissfft-js';
import Windowing from 'fft-windowing';

class Effector {

  constructor(audioCtx,shiftSize){
    this.audioCtx = audioCtx;
    this.shiftSize = shiftSize;

//    this.rfft = new RFFT(2*this.shiftSize); // fftw-js
    this.rfft = new FFTR(2*this.shiftSize); // kissfft-js

    this.fftCoefBuffer = []; // up to 17

    this.lastInput = [];
    this.lastInput[0] = new Float32Array(shiftSize).fill(0);
    this.lastInput[1] = new Float32Array(shiftSize).fill(0);

    this.lastOut = [];
    this.lastOut[0] = new Float32Array(shiftSize).fill(0);
    this.lastOut[1] = new Float32Array(shiftSize).fill(0);

    this.calcFFT = this.calcFFT.bind(this); // forward FFT 
    this.justFFT = this.justFFT.bind(this); // forward FFT 
    this.calcPan = this.calcPan.bind(this); // Pan calculation
    this.calcPerc = this.calcPerc.bind(this);
    this.fftFilter = this.fftFilter.bind(this);
  }

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
    let fftCoef = this.fftFilter(fftObj);
//    let fftCoef = this.justFFT(fftWindowInput); // test

    let pcmData = []; // this.shiftSize*2  
       pcmData[0] = this.rfft.inverse(fftCoef[0]).slice(); 
       pcmData[1] = this.rfft.inverse(fftCoef[1]).slice();

    for (let channel = 0; channel <= 1; channel++){
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

    this.fftCoefBuffer.push ({fftCoef: fftCoef, power: power});

    let retval = this.calcPan(fftCoef, power);
    let retval2 = this.calcPerc(this.fftCoefBuffer); 

    return {
      fftL: fftCoef[0],
      fftR: fftCoef[1],
      pan:  retval.pan,
      panAmp: retval.panAmp,
      percL: retval2.percL,
      percR: retval2.percR
    };   
  }

  calcPan (fftCoef, power){

    const fft = fftCoef;
    let numCoef = fft.length/2; // length = N + 2 for kiss fft
    let pan = new Float32Array(numCoef);
    let panAmp = new Float32Array(numCoef);
/*
  Note: frequency-domain data is stored from dc up to 2pi. 
  so cx_out[0] is the dc bin of the FFT and cx_out[nfft/2] is 
  the Nyquist bin (if exists)
*/

    for(let freqBin = 0; freqBin < numCoef; freqBin++){
      let base = 2*freqBin; 

      let innerProd = fft[0][base]*fft[1][base]
                      + fft[0][base+1]*fft[1][base+1]

      let crossProd = fft[0][base]*fft[1][base+1]
                      + fft[0][base+1]*fft[1][base]

      let abs = Math.sqrt(
       Math.pow(fft[0][base] + fft[1][base],2)
       + Math.pow(fft[0][base+1] + fft[1][base+1],2)
      );

      let absL = Math.sqrt(power[0][freqBin]);
      let absR = Math.sqrt(power[1][freqBin]);

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
          panAmp[freqBin] = Math.max (absL, absLR) - Math.abs(crossProd)/absR; 
        } else {
          frac = 1;
          panAmp[freqBin] = absL - absLR;
        }
        pan[freqBin] = (1-frac)/(1+frac);
      } else { // absL >= absR
        if (innerProd < 0) {
          frac = 0;
          panAmp[freqBin] = (absLR - absR)/abs;
        } else if (innerProd <= absL*absL) {
          frac = innerProd/(absL*absL); 
          panAmp[freqBin] = Math.max (absR, absLR) - Math.abs(crossProd)/absL; 
        } else {
          frac = 1;
          panAmp[freqBin] = absR - absLR;
        }
        pan[freqBin] = (frac-1)/(1+frac);
      }

    } // end for freqBin

    return { pan: pan, panAmp: panAmp }
  }


  calcPerc(fftCoefBuffer){

    const median = arr => {
      const mid = Math.floor(arr.length / 2),
      nums = [...arr].sort((a, b) => a - b);
      return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
    };

    let percL = new Float32Array(this.shiftSize+1).fill(0); // +1 for DC
    let percR = new Float32Array(this.shiftSize+1).fill(0); 
      // also used as power

    let index=0;
    let buflen = fftCoefBuffer.length;

    if (buflen < 9) index = buflen - 1;
    else if (buflen < 17) index = buflen - 9;
    else index = 8;

    for (let freqBin = 0; freqBin <= this.shiftSize; freqBin++){
      let from = Math.max(0, freqBin - 9);
      let to =  Math.min(freqBin + 9, this.shiftSize + 1); // to (not incl.) 
      let power = fftCoefBuffer[index].power;
      let pMedianL = median(power[0].slice(from,to));
      let pMedianR = median(power[1].slice(from,to));

      let powerArrayL = [];
      let powerArrayR = [];

      for (let time = 0; time < buflen; time++){ // buflen (max 17)
        powerArrayL.push(fftCoefBuffer[time].power[0][freqBin]);
        powerArrayR.length = 0;
        powerArrayR.push(fftCoefBuffer[time].power[1][freqBin]);
      }

      let hMedianL = median(powerArrayL);
      let hMedianR = median(powerArrayR);

      percL[freqBin] = (pMedianL*pMedianL)/
         (pMedianL*pMedianL + hMedianL*hMedianL);
      percR[freqBin] = (pMedianR*pMedianR)/
         (pMedianR*pMedianR + hMedianR*hMedianR);

    }

    if (buflen >= 17) fftCoefBuffer.splice(0,1);

    return {percL: percL, percR: percR};
  }

  fftFilter (fftObj){
  //   let zero = new Float32Array(fftObj.fftL.length).fill(0);

    let retval = [];
      retval[0] = fftObj.fftL;
      retval[1] = fftObj.fftR;

    return retval;
  }

}

export default Effector;
