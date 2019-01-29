#ifndef __TIME_STRETCH_H
#define __TIME_STRETCH_H

#include "BufferedEffector.h"

// constants


class TimeStretch : public BufferedEffector {

  public:
    TimeStretch(int channels, float samplingRate);
    float* getSamples();
    void  flush();
    void setTempo(float newTempo);
    void setParameters(float samplingRate, int sequenceMS, 
                   int SeekwindowMS, int overlapMS);
  // constants
    static const int DEFAULT_SEQUENCE_MS = 0;
    static const int DEFAULT_SEEKWINDOW_MS = 0;
    static const int DEFAULT_OVERLAP_MS = 8;
    static const float AUTOSEQ_TEMPO_LOW = 0.5f;
    static const float AUTOSEQ_TEMPO_TOP = 2.0f;
    static const float AUTOSEQ_AT_MIN = 125.0f;
    static const float AUTOSEQ_AT_MAX = 50.0f;
    static const float AUTOSEEK_AT_MIN = 25.0f;
    static const float AUTOSEEK_AT_MAX = 15.0f;
    static const int overlapMs = 8;
    static const float AUTOSEQ_K, AUTOSEQ_C, AUTOSEEK_K, AUTOSEEK_C;

  private:

    int sampleReq;
    bool flushing;
    int overlapLength, seekLength, seekWindowLength, sequenceMs, seekWindowMs;
    float maxnormf, tempo, nominalSkip, skipFract;
    bool bQuickSeek, bAutoSeqSetting, bAutoSeekSetting;
    float *pMidBuffer, *pRefMidBuffer;

    void acceptNewOverlapLength(int newOverlapLength);
//    void clearCrossCorrState(); // not used
    void calculateOverlapLength(int overlapMs);
    float calcCrossCorr(const float *data, int fefPos, const float* compare);

    int seekBestOverlapPositionFull(const float *data);
    void overlapMulti(float* output, const float* input, int ovlPos);
    void clearMidBuffer();
    void calcSeqParameters();
    void adaptNormalizer();
    void processSamples();
    void process() {processSamples();}
    
};
#endif
