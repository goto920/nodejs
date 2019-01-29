#ifndef WRAPPER_H
#define WRAPPER_H

#include <SoundTouch.h>
// #include <RunParameters.h>
// #include <BPMDetect.h>

class TimeStretch {
   private:
     soundtouch::SoundTouch soundTouch;
//     const RunParameters *params;

   public:
     TimeStretch(int channels, float samplingRate);
     int putSamples(const float& data, int len);
     std::vector<float> getSamples();
     void flush();

     void setTempo(float newTempo);
     void setParameters(float samplingRate, int sequenceMs, 
        int seekwindowMS, int overlapMS);
};

#endif
