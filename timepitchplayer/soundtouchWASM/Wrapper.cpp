#include "Wrapper.h"
#include <emscripten/bind.h>

using namespace emscripten;

TimeStretch::TimeStretch(int channels, float samplingRate){
}

int TimeStretch::putSamples(const float& data, int len){
  return 0;
}

std::vector<float> TimeStretch::getSamples(){
   std::vector<float> ret;
   return ret;
}

void TimeStretch::flush(){
   return;
}

void TimeStretch::setTempo(float newTempo){
   return;
}

void TimeStretch::setParameters(float samplingRate, int sequenceMs, 
     int seekwindowMS, int overlapMS){

   return;
}

EMSCRIPTEN_BINDINGS (sound_module) {
  class_<TimeStretch>("TimeStretch")
    .constructor<int,float>()
    .function("putSamples", &TimeStretch::putSamples)
    .function("getSamples", &TimeStretch::getSamples)
    .function("flush", &TimeStretch::flush)
    .function("setTempo", &TimeStretch::setTempo)
    ;
}
