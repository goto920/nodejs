import {RFFT} from 'fftw-js';
import Windowing from 'fft-windowing';

class Effector {
  constructor(audioCtx, shiftSize){
    this.audioCtx = audioCtx;
    this.fftr = new RFFT(2*shiftSize);

    this.fftBuffer = []; 
    for (let channel = 0; channel < 2; channel++){
      this.fftBuffer[channel] = [];
      for (let i=0; i < 17; i++){
        this.fftBuffer[channel][i] = {
          fftCoef: new Float32Array(),
          percCoef: new Float32Array(),
          pan: new Float32Array(),
          panAmp: new Float32Array()
        }
      } 
    }

    this.inputBuffer = [];
      for (let channel = 0; channel < 2; channel++)
         this.inputBuffer[channel] = new Float32Array();

    this.outputBuffer = [];
      for (let channel = 0; channel < 2; channel++)
        this.outputBuffer[channel] = new Float32Array();

    this.process = this.process.bind(this);
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

    for (let channel = 0; channel < inputBuffer.numberOfChannels;
        channel++){
      let inputData = inputBuffer.getChannelData(channel);
      let outputData = outputBuffer.getChannelData(channel);
      this.pushData(inputData,channel);
      outputData = this.popData(channel); 
    }

  }

  pushData(input, channel){
    this.inputBuffer[channel].push(input);
  }

  popData(input, channel){

  }

}

export default Effector;
