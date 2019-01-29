#include "BufferedEffector.h"


// constructor
BufferedEffector::BufferedEffector(int channels, float samplingRate){ 
  this->channels = channels;
  this->samplingRate = samplingRate;
  inputBuffer = new std::vector<float>();
  outputBuffer = new std::vector<float>();
}

// public methods
int BufferedEffector::putSamples(const float* data, int len){
   for (int i = 0; i < len; i++) inputBuffer->push_back(data[i]);
   process();
   return len;
}
