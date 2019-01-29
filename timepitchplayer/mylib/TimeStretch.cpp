#include "TimeStretch.h"
#include <cmath>
#include <string.h>
// static variables
const float TimeStretch::AUTOSEQ_K 
   = (AUTOSEQ_AT_MAX - AUTOSEQ_AT_MIN)
      / (AUTOSEQ_TEMPO_TOP - AUTOSEQ_TEMPO_LOW);

const float TimeStretch::AUTOSEQ_C
      = (AUTOSEQ_AT_MIN - AUTOSEQ_K * AUTOSEQ_TEMPO_LOW);

const float TimeStretch::AUTOSEEK_K = (AUTOSEEK_AT_MAX - AUTOSEEK_AT_MIN)
      / (AUTOSEQ_TEMPO_TOP - AUTOSEQ_TEMPO_LOW);
const float TimeStretch::AUTOSEEK_C =
         AUTOSEEK_AT_MIN - AUTOSEEK_K * AUTOSEQ_TEMPO_LOW;

TimeStretch::TimeStretch(int channels, float samplingRate) 
  : BufferedEffector(channels, samplingRate) {

  pMidBuffer = pRefMidBuffer = outSamples = 0; // null pointers
  overlapLength = 0;
  maxnormf = 1e8f;
  skipFract = 0;
  tempo = 1.0f;
  setParameters(samplingRate, 
     DEFAULT_SEQUENCE_MS, DEFAULT_SEEKWINDOW_MS, DEFAULT_OVERLAP_MS);
  setTempo(tempo);
  flushing = false;

}

// public methods
float* TimeStretch::getSamples(){
  int size = (*outputBuffer).size();
  if (outSamples != 0) delete outSamples;
  outSamples = new float[size];
  for (int i=0; i < size; i++) outSamples[i] = (*outputBuffer)[i];

  (*outputBuffer).clear();  
  return outSamples;
}

void TimeStretch::flush(){ flushing = true;}

void TimeStretch::setTempo(float newTempo){
  tempo = newTempo;
  calcSeqParameters();
  nominalSkip = tempo * (seekWindowLength - overlapLength);
  int intskip = (int)(nominalSkip + 0.5);
  sampleReq = std::max(intskip + overlapLength, seekWindowLength) 
       + seekLength;

}
 

void TimeStretch::setParameters(float samplingRate, int sequenceMS, 
                   int SeekwindowMS, int overlapMS){
  calcSeqParameters();
  calculateOverlapLength(overlapMs);
  setTempo(tempo);
}

// private methods

void TimeStretch::acceptNewOverlapLength(int newOverlapLength){
  int prevOvl = overlapLength;
  overlapLength = newOverlapLength;
  if (overlapLength > prevOvl){
      if (pMidBuffer != 0) delete pMidBuffer; 
      pMidBuffer = new float[overlapLength*channels *8];
      if (pRefMidBuffer != 0) delete pRefMidBuffer;
      pRefMidBuffer = new float[overlapLength*channels *8];
  } 

  clearMidBuffer(); 

}

void TimeStretch::calculateOverlapLength(int overlapMs){
  int newOverlapLength = (int) (samplingRate * overlapMs/1000);
  acceptNewOverlapLength(newOverlapLength);
}

float TimeStretch::calcCrossCorr(const float *data, int refPos, 
   const float* compare){
   float corr= 0.0, norm = 0.0;

   for (int i=0; i < channels * overlapLength; i += 2){
      int index = refPos + i;
      corr += data[index] * compare[i] 
              + data[index + 1] * compare[i + 1];
      norm += data[index] * data[i]  
              + data[index + 1] * data[i + 1];
    }
    return (float) (corr / std::sqrt(norm));
}

int TimeStretch::seekBestOverlapPositionFull(const float *data){
  // mixed version (no pointer in Java)
    int bestOffset = 0;
    float bestCorrelation = -10.0;
    float norm;

    bestCorrelation = calcCrossCorr(data, 0, pMidBuffer);

    for (int tempOffset = 1; tempOffset < seekLength; tempOffset++){
       float corr 
          = calcCrossCorr(data, channels * tempOffset, pMidBuffer);
       if (corr > bestCorrelation) {
         bestCorrelation = corr;
         bestOffset = tempOffset; 
       }
    }

    return bestOffset;
}

void TimeStretch::overlapMulti(float* output, const float* input, int ovlPos){
  float m1 = 0.0, m2;

  int i = 0;
  int base = channels*ovlPos;

  for (m2 = (float) overlapLength; m2>0; m1++,m2--){
    for (int c = 0; c < channels; i++,c++){
      output[i] = (input[base+i]*m1 + pMidBuffer[i]*m2) / overlapLength;
      // i++;
    }
    // m1++;
  }

}

void TimeStretch::clearMidBuffer(){
   memset(pMidBuffer, 0, channels * sizeof(float) * overlapLength);
}

void TimeStretch::calcSeqParameters(){
  float seq = AUTOSEQ_C + AUTOSEQ_K * tempo;
  if (seq > AUTOSEQ_AT_MAX) seq = AUTOSEQ_AT_MAX; 
  if (seq < AUTOSEQ_AT_MIN) seq = AUTOSEQ_AT_MIN; 
  sequenceMs = (int)(seq + 0.5);

  float seek = AUTOSEEK_C + AUTOSEEK_K * tempo;
  if (seek > AUTOSEEK_AT_MAX) seq = AUTOSEEK_AT_MAX; 
  if (seq < AUTOSEEK_AT_MIN) seq = AUTOSEEK_AT_MIN; 
  seekWindowMs = (int)(seek + 0.5);
  seekWindowLength = (int) ((samplingRate * sequenceMs) / 1000);

  if (seekWindowLength < 2 * overlapLength) 
                seekWindowLength = 2 * overlapLength;

  seekLength = (int) ((samplingRate * seekWindowMs) / 1000);
}

void TimeStretch::adaptNormalizer(){}
void TimeStretch::processSamples(){}

//////////// END //////////////
