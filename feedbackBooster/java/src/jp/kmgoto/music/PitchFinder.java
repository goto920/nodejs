package jp.kmgoto.music;

public class PitchFinder {

  public PitchFinder(float samplingRate){
    this.samplingRate = samplingRate;
  }

  public float findPitch(float[] samples){
    float[] diff = calcNormSqDiff(samples);
    int index = getMaximaIndex(diff); 

    if (index <= 0) return -1f; // error 

    float result = getParabolaMax(
        index, diff[index-1],diff[index], diff[index+1]
        );

    return samplingRate/result;
  }

  private float samplingRate; 
  private int windowSize;

  private float[] calcNormSqDiff(float[] input){
    windowSize = input.length;
    float[] output = new float[windowSize];

   for (int tau = 1; tau < windowSize ; tau++){
     double m = 0.0;
     double r = 0.0; 
     int from = windowSize/2 - (windowSize -tau)/2;
     int to   = from + windowSize - tau;
     
      for (int j = from; j < to; j++){      
        if (j+tau < windowSize){
           r += input[j]*input[j+tau]; 
           m += input[j]*input[j] + input[j+tau]*input[j+tau];
        } else m += input[j]*input[j];
      } // for j

    output[tau] = (float) (2*r/m);
   } // for tau

    return output;
  }

  private enum state {PLUS, MINUS, UNDEF};

  private int getMaximaIndex(float[] input){ // normSqDiff
    double max = 0.0; // undef
    int    index = -1; // undef
    int[]  maxima_index = new int[1024];
    for (int i=0; i < 100; i++) maxima_index[i] = -1; // undef

    int n = 0;
    int size = windowSize - 1;

    state s = state.UNDEF;
    for (int i = 1; i < size ; i++){
     switch(s){
       case PLUS:
         if (input[i] < 0) s = state.MINUS;
         else if (input[i] > max) { max = input[i]; index = i;}
       break;
     case MINUS:
        if (input[i] > 0) {
         s = state.PLUS;
         if (index > 0) maxima_index[n++] = index;
         max = 0.0;
           }
       break;
     case UNDEF:
       if (input[i] < 0) s = state.MINUS;
       break;
       default:
       break;
    } // end switch

   } // end for

   // find maximum among maxima
   max = 0.0;

   for (int i=0; i < n; i++){
      index = maxima_index[i];
      if (index >= 0 && input[index] > max) {
         max = input[index];
      }
   }

   for (int i=0; i < n; i++){
      index = maxima_index[i];
      if (index >= 0 && input[index] > max*0.8){ 
       // find the first one greater than threshold
       return index;
      }
   }

   return -1; // if not found
  }

  private float getParabolaMax(int index, float y1, float y2, float y3){
     // y = a(x-b)^2 + c
     double x1 = (double) (index-1); 
     double x2 = (double) index;
     double x3 = (double) (index+1);

     double b = ((y1-y2)*(x2-x3)*(x2+x3) - (y2-y3)*(x1-x2)*(x1+x2))
              /(2*((y1-y2)*(x2-x3) - (y2-y3)*(x1-x2)));

//  double a = (y1-y2)/((x1-x2)*(x1+x2-2*b));
//  double c = y2 - a*(x2-b)*(x2-b); // not used

//  printf ("# %f  %f # max freq %f\n",b,c,44100/b);
    return (float) b;

  }

  public static void main(String[] args) throws Exception {
    float samplingRate = 44100f;
    PitchFinder pf = new PitchFinder(samplingRate);
    // testTone generator

    int windowSize = Integer.parseInt(args[0]);
    float[] samples = new float[windowSize]; 
    int time = 0;
    for (int note = -48; note <= 48; note++){ 
      double freq = 440*Math.pow(2.0,note/12.0); // from middle A
       System.out.println(freq + " Hz" + " time " + time++);

       float amp=1f;

     for(int i=0; i < samplingRate ; i++){ // for 1 sec
       int j = i % windowSize;
       double t = i/samplingRate;
       samples[j] = (float) (amp*Math.sin(2*Math.PI*freq*t)); 

       if (j >= windowSize - 1){
         float ret = pf.findPitch(samples);
         if (ret > 0)
           System.out.println(" detected(Hz) " + ret);
       } // if j

     } // for i

     Thread.sleep(1000);
    } // note

    
    return;
  }
}
