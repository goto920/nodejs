import {RFFT} from 'fftw-js';
import Windowing from 'fft-windowing';

class Effector {
  constructor(audioCtx,shiftSize){
    this.audioCtx = audioCtx;
    this.shiftSize = shiftSize;
    this.rfft = new RFFT(2*shiftSize);

    this.lastShift = [];
      this.lastShift[0] = new Float32Array(shiftSize).fill(0);
      this.lastShift[1] = new Float32Array(shiftSize).fill(0);

    this.fftBuffer = []; 
    for (let i=0; i <= 17; i++){
      this.fftBuffer[i] = {
        fftCoefL: new Float32Array(shiftSize*2),
        fftCoefR: new Float32Array(shiftSize*2)
      }
    } 

    this.fftCalc = this.fftCalc.bind(this);
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
    // console.log('process');

    let fftWindowInput = [];
       fftWindowInput[0] = new Float32Array(this.shiftSize*2);
       fftWindowInput[1] = new Float32Array(this.shiftSize*2);

    for (let channel = 0; channel < inputBuffer.numberOfChannels; channel++){
      let inputData = inputBuffer.getChannelData(channel);

      if (inputBuffer.length < this.shiftSize){
         let zeros = new Float32Array(this.shiftSize - inputBuffer.length).fill(0);
         for (let sample = 0; sample < this.shiftSize; sample++) 
            fftWindowInput[channel][sample] = inputData[sample];
         for (let sample = this.shiftSize; sample < this.shiftSize*2; sample++)
            fftWindowInput[channel][sample] = zeros[sample];
      } else { 
         for (let sample = 0; sample < this.shiftSize; sample++) 
           fftWindowInput[channel][sample] = this.lastShift[channel];
         for (let sample = this.shiftSize; sample < this.shiftSize*2; sample++)
           fftWindowInput[channel][sample] = inputData[sample];
      }

    }

    let fftObj = this.fftCalc(fftWindowInput);
    let fftCoef = this.fftFilter(fftObj);
    let pcmData = []; 
       pcmData[0] = this.rfft.inverse(fftCoef[0]);
       pcmData[1] = this.rfft.inverse(fftCoef[1]);

    for (let channel = 0; channel < inputBuffer.numberOfChannels; channel++){
      let outputData = outputBuffer.getChannelData(channel);

      for (let sample = 0; sample < this.shiftSize; sample++)
         outputData[sample] 
         = this.lastShift[channel][sample] + pcmData[channel][sample]; 

      this.lastShift[channel] = fftWindowInput[channel];
    }

    // console.log('end');

  }

  fftCalc (fftWindowInput){
    // console.log('fftCalc');

    let fft = [];
      fft[0] = this.rfft.forward(Windowing.hann(fftWindowInput[0]));
      fft[1] = this.rfft.forward(Windowing.hann(fftWindowInput[1]));

    let fftObj = {
      fftL: fft[0],
      fftR: fft[1],
      pan: 0,
      panAmp: 0,
      percCoefL: 0,
      percCoefR: 0,
    }   

    // console.log('fftCalc end');
    return fftObj;
  }

  fftFilter (fftObj){
    let retval = [];
      retval[0] = fftObj.fftL;
      retval[1] = fftObj.fftR;
    return retval;
  }

}

export default Effector;
