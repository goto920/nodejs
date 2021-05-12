var process = Module.cwrap('process', 'number', ['number']);

var presetFilter = Module.cwrap('presetFilter', 'void', ['string', 'number']);

var ProcessFFT = function (size, sampleRate){ // constructor
  this.size = size; 
  this.sampleRate = sampleRate;

  this.inptr  = Module._malloc(2*size*4); // Float32 (4 bytes) + 2
  this.outptr = this.inptr + 2*size*4; 

  // buffer, byteOffset, length
  this.input  = new Float32Array(Module.HEAPF32.buffer, this.inptr, size*2);

  this.process = function(input) {
    this.input.set(input);
    this.outptr = process(this.inptr);
    return new Float32Array(Module.HEAPF32.buffer, this.outptr, this.size*2)
  }

  this.presetFilter = function(type, option) {
    presetFilter(type,option);
  }

}

module.exports = { 
  ProcessFFT: ProcessFFT 
};
