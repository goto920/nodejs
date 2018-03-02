package jp.kmgoto.music;

public class Compressor {

   private float ratio, thresh;
   private int max;

   public Compressor(int max) {
     this.max = max;
     ratio = 1.0f;
     thresh = 0f;
   }

   public void setRatio(float ratio){ this.ratio = ratio;}
   public void setThresh(float thresh){ this.thresh = thresh; } // in dB

   public void processArray(float[] input){ // overwrite input data
     for (int i=0; i < input.length; i++) input[i] = process(input[i]);
   }

   public float process(float in){ // expect -max .. max

       double x = (double) in;
       double absy = 0.0;  
       double dBx = 20*Math.log10(Math.abs(x)/max);

       if (dBx >= thresh){
         absy = max * Math.min(1, 
           Math.pow(10.0, (thresh + (dBx - thresh)/ratio)/20.0));
          // limiter
         if (x >= 0) x = absy; else x = -absy;
       }
       return (float) x;
   }

}
