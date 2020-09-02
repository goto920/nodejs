// import {RFFT} from 'fftw-js'; // fftw-js
import {FFTR} from 'kissfft-js';
import Windowing from 'fft-windowing';

class Effector {
  constructor(audioCtx,shiftSize){
    this.audioCtx = audioCtx;
    this.shiftSize = shiftSize;
//    this.rfft = new RFFT(2*shiftSize); // fftw-js
    this.rfft = new FFTR(2*shiftSize); // kissfft-js

    this.lastInput = [];
      this.lastInput[0] = new Float32Array(shiftSize).fill(0);
      this.lastInput[1] = new Float32Array(shiftSize).fill(0);

    this.lastOut = [];
      this.lastOut[0] = new Float32Array(shiftSize).fill(0);
      this.lastOut[1] = new Float32Array(shiftSize).fill(0);

    this.fftBuffer = []; 
    for (let i=0; i <= 17; i++){
      this.fftBuffer[i] = {
        fftCoefL: new Float32Array(shiftSize*2),
        fftCoefR: new Float32Array(shiftSize*2)
      }
    } 

    this.fftCalc = this.fftCalc.bind(this); // forward FFT 
    this.calcPan = this.calcPan.bind(this); // Pan calculation
    this.fftFilter = this.fftFilter.bind(this);
  }

  copy(inputBuffer, outputBuffer){

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
    let channels = inputBuffer.numberOfChannels;
    if (channels !== 2) return;

    let fftWindowInput = [];
       fftWindowInput[0] = new Float32Array(this.shiftSize*2);
       fftWindowInput[1] = new Float32Array(this.shiftSize*2);

    for (let channel = 0; channel < inputBuffer.numberOfChannels; channel++){
      let inputData = inputBuffer.getChannelData(channel);

      if (inputBuffer.length < this.shiftSize){
         let zeros = new Float32Array(this.shiftSize - inputBuffer.length).fill(0);
         for (let sample = 0; sample < inputBuffer.length; sample++) 
           fftWindowInput[channel][sample] = inputData[sample];
         for (let sample = inputBuffer.length; sample < this.shiftSize*2; sample++)
           fftWindowInput[channel][sample] = zeros[sample];
      } else { 
         for (let sample = 0; sample < this.shiftSize; sample++) 
           fftWindowInput[channel][sample] = this.lastInput[channel][sample];
         for (let sample = 0; sample < this.shiftSize; sample++) 
           fftWindowInput[channel][sample + this.shiftSize] = inputData[sample];
      }

      for (let sample = 0; sample < this.shiftSize; sample++) 
        this.lastInput[channel][sample] = inputData[sample]; 
    }

    let fftObj = this.fftCalc(fftWindowInput);
    let fftCoef = this.fftFilter(fftObj);
    let pcmData = []; 
       pcmData[0] = this.rfft.inverse(fftCoef[0]); // this.shiftSize*2  
       pcmData[1] = this.rfft.inverse(fftCoef[1]); // this.shiftSize*2  

    for (let channel = 0; channel < inputBuffer.numberOfChannels; channel++){
      let outputData = outputBuffer.getChannelData(channel);

      for (let sample = 0; sample < this.shiftSize; sample++)
         outputData[sample] = this.lastOut[channel][sample] 
           + pcmData[channel][sample]/this.shiftSize;

      for (let sample = 0; sample < this.shiftSize; sample++)
         this.lastOut[channel][sample] 
           = pcmData[channel][sample + this.shiftSize]/this.shiftSize;
      // store latter half of fft inverse output

    }

  }

  fftCalc (fftWindowInput){

    let fftCoef = [];
      fftCoef[0] = this.rfft.forward(Windowing.hann(fftWindowInput[0]));
      fftCoef[1] = this.rfft.forward(Windowing.hann(fftWindowInput[1]));

    let retval = this.calcPan(fftCoef);

    let fftObj = {
      fftL: fftCoef[0],
      fftR: fftCoef[1],
      pan: retval.pan,
      panAmp: retval.panAmp,
      percCoefL: 0,
      percCoefR: 0,
    }   

    return fftObj;
  }

  calcPan (fftCoef){
    let numCoef = fftCoef.length/2; // length = N + 2 for kiss fft
    let pan = new Float32Array(numCoef);
    let panAmp = new Float32Array(numCoef);
/*
 Note: frequency-domain data is stored from dc up to 2pi. 
 so cx_out[0] is the dc bin of the FFT and cx_out[nfft/2] is 
 the Nyquist bin (if exists)
*/

    for(let bin = 0; bin < numCoef; bin++){
      let base = 2*bin; 
      let innerProd = fftCoef[0][base]*fftCoef[1][base]
                      + fftCoef[0][base+1]*fftCoef[1][base+1]
      let crossProd = fftCoef[0][base]*fftCoef[1][base+1]
                      + fftCoef[0][base+1]*fftCoef[1][base]
      let abs = Math.sqrt(
       Math.pow(fftCoef[0][base] + fftCoef[1][base],2)
       + Math.pow(fftCoef[0][base+1] + fftCoef[1][base+1],2)
      );

      let absL = Math.sqrt(
       fftCoef[0][base]*fftCoef[0][base] 
       + fftCoef[0][base+1]*fftCoef[0][base+1]
      );

      let absR = Math.sqrt(
        fftCoef[1][base]*fftCoef[1][base] 
       + fftCoef[1][base+1]*fftCoef[1][base+1]
      );

      let absLR = Math.sqrt(
        Math.pow(fftCoef[0][base] - fftCoef[1][base],2)
        + Math.pow(fftCoef[0][base+1] - fftCoef[1][base+1],2)
      );

      let frac = 0; 
      if (absL < absR){
        if (innerProd < 0) {
          frac = 0;
          panAmp[bin] = (absLR - absL)/abs;
        } else if (innerProd <= absR*absR) {
          frac = innerProd/(absR*absR); 
          panAmp[bin] = Math.max (absL, absLR) - Math.abs(crossProd)/absR; 
        } else {
          frac = 1;
          panAmp[bin] = absL - absLR;
        }
        pan[bin] = (1-frac)/(1+frac);
      } else { // absL >= absR
        if (innerProd < 0) {
          frac = 0;
          panAmp[bin] = (absLR - absR)/abs;
        } else if (innerProd <= absL*absL) {
          frac = innerProd/(absL*absL); 
          panAmp[bin] = Math.max (absR, absLR) - Math.abs(crossProd)/absL; 
        } else {
          frac = 1;
          panAmp[bin] = absR - absLR;
        }
        pan[bin] = (frac-1)/(1+frac);
      }

    } // end for bin

    let retval = {
      pan: pan,
      panAmp: panAmp
    }

    return retval;
  }

  fftFilter (fftObj){
    let retval = [];
      retval[0] = fftObj.fftL;
      retval[1] = fftObj.fftR;
    return retval;
  }

}

export default Effector;
