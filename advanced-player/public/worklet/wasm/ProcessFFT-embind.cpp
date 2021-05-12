#include <emscripten/bind.h>
#include <vector>
#include <iostream>
#include <cmath>
#include <algorithm>

using namespace emscripten;

class ProcessFFT {

public:
  ProcessFFT(int windowSize, float sampleRate) 
     : windowSize(windowSize), sampleRate(sampleRate) {
  }

  std::vector<float> process(std::vector<float> &inVector){

    std::vector<float> left, right;
    left.assign(inVector.begin(), 
      inVector.begin() + inVector.size()/2);
    right.assign(inVector.begin() + inVector.size()/2, 
      inVector.end());

/*
      FFTObj *fftObj = new FFTObj(left,right);
      calcPan(fftObj);
      FFTObj* ret = calcPerc(fftObj);
      ret = applyFilter(ret);
      delete ret;
*/

    std::vector<float> outVector(2*(windowSize+1));
    int range = outVector.size();
    for (int i = 0; i < range/2; i++) outVector[i] = left[i];
    for (int i = range/2; i < range; i++) outVector[i] = right[i-range/2];

    return outVector;
  }

  std::vector<float> getVector(){ 
    const std::vector<float> v (2*(windowSize+1));
    return v;
  }

  void presetFilter(const std::string type, const float option){}

private:
  int windowSize;
  float sampleRate;
  std::vector<float> inVector, outVector;

  class FFTObj {
    friend class ProcessFFT;

    public:
      FFTObj(std::vector<float> &left, std::vector<float> &right)
      : left(left), right(right){}

      std::vector<float> left;
      std::vector<float> right;
      std::vector<float> pan;
      std::vector<float> panAmp;
      std::vector<float> powerL;
      std::vector<float> powerR;
      std::vector<float> percL;
      std::vector<float> percR;
  }; // end class FFTObj

  std::vector<FFTObj *> fftObjList;

  class Filter {
    friend class ProcessFFT;
    public:
      Filter(
          float fromPan, int fromFreqIndex, 
          float toPan, int toFreqIndex, std::string action)
         : fromPan(fromPan), fromFreqIndex(fromFreqIndex), 
           toPan(toPan), toFreqIndex(toFreqIndex), action(action){};

    private:
      float fromPan;
      int   fromFreqIndex;
      float toPan;
      int toFreqIndex;
      std::string action; 

  };

  std::vector<Filter *> filterChain;

  void calcPan(FFTObj* &fftObj){
    const int numCoef = fftObj->left.size()/2;
    fftObj->pan.reserve(numCoef);
    fftObj->panAmp.reserve(numCoef);
    std::vector<float> *left = &fftObj->left;
    std::vector<float> *right = &fftObj->right;
    std::vector<float> *pan = &fftObj->pan;
    std::vector<float> *powerL = &fftObj->powerL;
    std::vector<float> *powerR = &fftObj->powerR;
    std::vector<float> *panAmp = &fftObj->panAmp;

/*
  Note: frequency-domain data is stored from dc up to 2pi.
  so cx_out[0] is the dc bin of the FFT and cx_out[nfft/2] is
  the Nyquist bin (if exists)
*/
   powerL->reserve(windowSize/2 + 1);
   powerR->reserve(windowSize/2 + 1);

   for (int freqBin = 0; freqBin <= windowSize/2; freqBin++){
      (*powerL)[freqBin] = 
               (*left)[2*freqBin]* (*left)[2*freqBin]
            +  (*left)[2*freqBin+1]* (*left)[2*freqBin+1];
      (*powerR)[freqBin] = (*right)[2*freqBin]* (*right)[2*freqBin]
               + (*right)[2*freqBin+1]* (*right)[2*freqBin+1];
   }

   for (int freqBin = 0; freqBin < numCoef; freqBin++){
     const int base = 2*freqBin;
     const double innerProd 
      = (*left)[base] * (*right)[base] + (*left)[base+1] * (*right)[base+1];
     const double crossProd
          = (*left)[base]*(*right)[base+1] - (*left)[base+1]*(*right)[base];
     const double abs = sqrt(
         pow((*left)[base] + (*right)[base],2.0)
       + pow((*left)[base+1] + (*right)[base+1],2.0)
      );
     const double absL = sqrt(
          pow((*left)[base],2.0) + pow((*left)[base+1],2.0));
     const double absR = sqrt(
          pow((*right)[base],2.0) + pow((*right)[base+1],2.0));
     const double absLR = sqrt(
        pow((*left)[base] - (*right)[base],2.0)
        + pow((*left)[base+1] - (*right)[base+1],2.0)
     );

     double frac = 0.0;
     if (absL < absR){
        if (innerProd < 0.0) {
          frac = 0.0;
          (*panAmp)[freqBin] = (absLR - absL)/abs;
        } else if (innerProd <= absR*absR) {
          frac = innerProd/(absR*absR);
          (*panAmp)[freqBin] = std::max(absL,absLR) - std::abs(crossProd)/absR;
        } else {
          frac = 1.0;
          (*panAmp)[freqBin] = absL - absLR;
        }
        (*pan)[freqBin] = (1-frac)/(1+frac);
        
      } else { // if absL >= absR
        if (innerProd < 0.0) {
          frac = 0.0;
          (*panAmp)[freqBin] = (absLR - absR)/abs;
        } else if (innerProd <= absL*absL) {
          frac = innerProd/(absL*absL);
          (*panAmp)[freqBin] = std::max(absR,absLR) - std::abs(crossProd)/absL;
        } else {
          frac = 1.0;
          (*panAmp)[freqBin] = absR - absLR;
        }
        (*pan)[freqBin] = (frac-1)/(1+frac);
      } 

      if( std::isnan((*pan)[freqBin])) (*pan)[freqBin] = 0.0;
      if(std::isnan((*panAmp)[freqBin])) (*panAmp)[freqBin] = 0.0;
     
    } // end for(int freqBin)

    return; 
  }

  FFTObj* calcPerc(FFTObj* &next){

    fftObjList.push_back(next);
    const int buflen = fftObjList.size();
    if (buflen < 17) return (FFTObj *) NULL;

    const int index = 8;
    FFTObj *fftObj = fftObjList[index];

    fftObj->percL.reserve(windowSize/2 + 1);
    fftObj->percR.reserve(windowSize/2 + 1);

    std::vector<float> *L = &fftObj->percL;
    std::vector<float> *R = &fftObj->percR;
    std::vector<float> *pL = &fftObj->powerL;
    std::vector<float> *pR = &fftObj->powerR;

    for (int freqBin = 0; freqBin <= windowSize/2; freqBin++) {
      const int from = std::max(0, freqBin - 9);
      const int to = std::min(freqBin + 9, windowSize/2 + 1);

      const double pMedianL = ProcessFFT::median(
         {(*pL).begin() + from,(*pL).begin() + to});
      const double pMedianR = ProcessFFT::median(
         {(*pR).begin() + from,(*pL).begin() + to});

      std::vector<double> powerArrayL(windowSize/2); 
      std::vector<double> powerArrayR(windowSize/2);

      for (int time=0; time < buflen; time++){
        powerArrayL.push_back((fftObjList[time]->powerL)[freqBin]);
        powerArrayR.push_back((fftObjList[time]->powerR)[freqBin]);
      }

      const double hMedianL = ProcessFFT::median(powerArrayL);
      const double hMedianR = ProcessFFT::median(powerArrayR);

      (*pL)[freqBin] 
         = (pMedianL*pMedianL)/ (pMedianL*pMedianL + hMedianL*hMedianL);
      if (std::isnan((*pL)[freqBin])) (*pL)[freqBin] = 0.5;

      (*pR)[freqBin] 
        = (pMedianR*pMedianR)/ (pMedianR*pMedianR + hMedianR*hMedianR);
       if (std::isnan((*pR)[freqBin])) (*pR)[freqBin] = 0.5;

    } // end for freqBin
 
    FFTObj *head = fftObjList.front(); 
    fftObjList.erase(fftObjList.begin());
    return head;
  }

  void clearAllFilter(){
    while(!filterChain.empty()) {
        delete filterChain.back();
        filterChain.pop_back();
    }
    return;
  }

  FFTObj* applyFilter(FFTObj* &fftObj){
    return fftObj;
  }

  void addFilter(
    const float fromPan, const float fromFreq, 
    const float toPan, const float toFreq,
    const std::string action){
    const int fromFreqIndex 
          = std::min(windowSize/2, (int) (0.5 + 2.0*fromFreq/sampleRate));
    const int toFreqIndex 
          = std::min(windowSize/2, (int) (0.5 + 2.0*toFreq/sampleRate));
    
    filterChain.push_back(
      new Filter(fromPan, fromFreqIndex, toPan, toFreqIndex, action)
    );

    return;
  }



  static double median(std::vector<double> input){
    const int size = input.size();
    sort(input.begin(),input.end());
    if (size % 2 == 0)
      return (input[size/2 - 1] + input[size/2])/2.0;
    else
      return  input[size/2];
  }

};

EMSCRIPTEN_BINDINGS(process_fft_class) {
  class_<ProcessFFT>("ProcessFFT")
    .constructor<int,float>()
    .function("process", &ProcessFFT::process)
    .function("getVector", &ProcessFFT::getVector)
    .function("presetFilter", &ProcessFFT::presetFilter)
    ;
  register_vector<float>("vectorFloat");
}
