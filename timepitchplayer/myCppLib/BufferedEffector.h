#ifndef __BUFFERED_EFFECTOR_H
#define __BUFFERED_EFFECTOR_H 1

#include <vector> 

class BufferedEffector {
  
  public:
     float *outSamples; // to be deleted at the beginning of getSamples() 
     BufferedEffector(int channels, float samplingRate); // constructor
     int putSamples(const float* data, int len);
     virtual float* getSamples() = 0;
     virtual void flush() = 0;

  protected:
     std::vector<float> *inputBuffer, *outputBuffer;
     int channels, outLimit, added;
     float samplingRate; 
     virtual void process() = 0;

};
#endif
