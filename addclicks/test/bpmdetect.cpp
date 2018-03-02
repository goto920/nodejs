#include <stdio.h>
#include <math.h>

#define WINDOW_SIZE 512

int main(){
  double window[WINDOW_SIZE];
  char sampleLR[4];

 for(int seq=0;;seq++){
   int i;
   while(i < WINDOW_SIZE) {
     if (fread(sampleLR,2,2,stdin) <= 0) break;
     printf("%d, %d\n", sampleLR[0],sampleLR[1]);

     window[i++] = ((sampleLR[0] + (sampleLR[1] << 8))/63356.0
                   + (sampleLR[2] + (sampleLR[3] << 8))/65536.0)/2.0;
   }

   double rms = 0;
   for (int i=0; i < WINDOW_SIZE; i++){rms += window[i];}
   rms = sqrt(rms);
   printf("%04d %f\n", seq, rms);
  }

  return 0;
}
