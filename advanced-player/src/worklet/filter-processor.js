/**
 * A simple bypass node demo.
 *
 * @class FilterProcessor
 * @extends AudioWorkletProcessor
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

// import { FFTR } from 'kissfft-js'; // kissfft-js

class FilterProcessor extends AudioWorkletProcessor {

    constructor(options) {
      super();

      this.sampleRate = options.processorOptions.sampleRate;
      console.log('sampleRate', this.sampleRate);
      this.fftShift   = options.processorOptions.fftShift;
      console.log('fftShift', this.fftShift);

//      this.rfft = new FFTR(2*this.shiftSize); // kissfft-js
/*
      this.fftObjBuffer = []; // up to 17
      this.lastInput = 
         [new Float32Array(this.shiftSize), new Float32Array(this.shiftSize)];
      this.lastOutput = 
         [new Float32Array(this.shiftSize), new Float32Array(this.shiftSize)];
*/

     // this.calcFFT = this.calcFFT.bind(this); // forward FFT
    }

    onmessage(event) {
    }

    process(inputs, outputs) {

      const input = inputs[0];
      const output = outputs[0];

      if (output.length !== 2) return;

      for (let channel = 0; channel < output.length; ++channel) {
        output[channel].set(input[channel]);
      }
  
      return true;
    }
  }
  
  registerProcessor('filter-processor', FilterProcessor);
