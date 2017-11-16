package jp.kmgoto.music;

public class BiquadEQ {

 public enum Type {
       LOWPASS, HIGHPASS,BANDPASS, 
       NOTCH, ALLPASS, PEAK, 
       LOWSHELF, HIGHSHELF
 }

 public BiquadEQ(Type type){
   this.type = type;
   in1 = in2 = out1 = out2 = 0f;
   A = w0 = 0.0;
   a0 =a1=a2=b0=b1=b2 = 0.0;
 }

 public void setParams(float freq, float dBGain, float q_bw_slope){

   double alpha = 0.0;
   A = Math.pow(10.0,dBGain/40); 
   w0 = 2*Math.PI*freq;

   switch(type){
     case LOWPASS: // H(s) = 1 / (s^2 + s/Q + 1)
      alpha = Math.sin(w0)/(2*q_bw_slope);
      b0 =  (1 - Math.cos(w0))/2;
      b1 =   1 - Math.cos(w0);
      b2 =  (1 - Math.cos(w0))/2;
      a0 =   1 + alpha;
      a1 =  -2*Math.cos(w0);
      a2 =   1 - alpha;
      break;
     case HIGHPASS: // H(s) = s^2 / (s^2 + s/Q + 1)
      alpha = Math.sin(w0)/(2*q_bw_slope);
      b0 =  (1 + Math.cos(w0))/2;
      b1 =  -(1 + Math.cos(w0));
      b2 =  (1 + Math.cos(w0))/2;
      a0 =   1 + alpha;
      a1 =  -2*Math.cos(w0);
      a2 =   1 - alpha;
      break;
     case BANDPASS:
      // H(s) = (s/Q)/ (s^2 + s/Q + 1) constant 0dB peak gain
      alpha = Math.sin(w0)
         *Math.sinh(Math.log(2.0)/2 * q_bw_slope * w0/Math.sin(w0) );
      b0 =  alpha;
      b1 =  0.0;
      b2 =  -alpha;
      a0 =   1 + alpha;
      a1 =  -2*Math.cos(w0);
      a2 =   1 - alpha;
      break;
     case NOTCH: // H(s) = (s^2 + 1) / (s^2 + s/Q + 1)
      alpha = Math.sin(w0)
         *Math.sinh(Math.log(2.0)/2 * q_bw_slope * w0/Math.sin(w0));
      b0= 1.0;
      b1 = -2*Math.cos(w0);
      b2 = 1.0;
      a0 = 1 + alpha;
      a1 = -2*Math.cos(w0);
      a2 = 1 - alpha;
      break;
     case ALLPASS: // H(s) = (s^2 - s/Q + 1) / (s^2 + s/Q + 1)
       alpha = Math.sin(w0)/(2*q_bw_slope);
       b0 = 1 - alpha;
       b1 = -2*Math.cos(w0);
       b2 = 1 + alpha;
       a0 = 1 + alpha;
       a1 = -2*Math.cos(w0);
       a2 = 1 - alpha;
      break;
     case PEAK: 
      // H(s) = (s^2 + s*(A/Q) + 1) / (s^2 + s/(A*Q) + 1)
      //  alpha = sin(w0)*sinh( log(2)/2 * q_bw_slope * w0/sin(w0));
        alpha = Math.sin(w0)/(2*q_bw_slope);
        b0 =   1 + alpha*A;
        b1 =  -2*Math.cos(w0);
        b2 =   1 - alpha*A;
        a0 =   1 + alpha/A;
        a1 =  -2*Math.cos(w0);
        a2 =   1 - alpha/A;
      break;
     case LOWSHELF:
           // H(s) = A * (s^2 + (sqrt(A)/Q)*s + A)/(A*s^2 + (sqrt(A)/Q)*s + 1)
      alpha = Math.sin(w0)/2*Math.sqrt((A+1/A)*(1/q_bw_slope - 1) +2 );

      b0 =    A*( (A+1) - (A-1)*Math.cos(w0) + 2*Math.sqrt(A)*alpha );
      b1 =  2*A*( (A-1) - (A+1)*Math.cos(w0)                   );
      b2 =    A*( (A+1) - (A-1)*Math.cos(w0) - 2*Math.sqrt(A)*alpha );
      a0 =        (A+1) + (A-1)*Math.cos(w0) + 2*Math.sqrt(A)*alpha;
      a1 =   -2*( (A-1) + (A+1)*Math.cos(w0)                   );
      a2 =        (A+1) + (A-1)*Math.cos(w0) - 2*Math.sqrt(A)*alpha;

      break;
     case HIGHSHELF:
    // H(s) = A * (A*s^2 + (sqrt(A)/Q)*s + 1)/(s^2 + (sqrt(A)/Q)*s + A)
      alpha = Math.sin(w0)/2*Math.sqrt((A+1/A)*(1/q_bw_slope - 1) +2 );

      b0 =    A*( (A+1) + (A-1)*Math.cos(w0) + 2*Math.sqrt(A)*alpha );
      b1 =  -2*A*( (A-1) + (A+1)*Math.cos(w0)                   );
      b2 =    A*( (A+1) + (A-1)*Math.cos(w0) - 2*Math.sqrt(A)*alpha );
      a0 =        (A+1) - (A-1)*Math.cos(w0) + 2*Math.sqrt(A)*alpha;
      a1 =    2*( (A-1) - (A+1)*Math.cos(w0)                   );
      a2 =        (A+1) - (A-1)*Math.cos(w0) - 2*Math.sqrt(A)*alpha;

      break;
     default:
      System.out.println(type + ": Not supported");
     break;
   }
 }

 public float[] processArray(float[] input){
     float[] output = new float[input.length];
     for (int i=0; i < input.length; i++) 
             output[i] = process(input[i]);
     return output;
 }

 public float process(float in){
   double out = 0.0; 
   // calculation
   out = b0*in + b1*in1 + b2*in2 - a1*out1 - a2*out2;
   out /= a0;
   in2 = in1; in1 = in;  out2 = out1; out1 = out; 

   return (float) out;
 }

  private Type type;
  private double A, w0;
  private double a0,a1,a2,b0,b1,b2; 
  private double in1, in2, out1, out2;

  public static void main(String[] args) throws Exception {


// Type.PEAK
 BiquadEQ eq = new BiquadEQ(Type.PEAK);
 eq.setParams(800/44100f, 20f, 10f);
    // 800Hz, Gain +6dB, Q

// Type.LOWPASS
/*
  BiquadEQ eq = new BiquadEQ(Type.LOWPASS);
  eq.setParams(1500/44100f, 0f, 0.5f);
    // 1500Hz, Gain (使わない), S=1(最大傾斜?)
*/

    double freq = 0; 
    for (int i = 0; freq < 22000.0; i++){
      freq = 13.75*Math.pow(2.0,i/12.0);
      double sample; 
      double rms = 0; 

      for (int j = 0; j < 44100; j++){
        sample = Math.sin(2*Math.PI*freq*j/44100f);
        float ret = eq.process((float) sample);
        rms += ret*ret;
      }
      rms = Math.sqrt(rms/44100);
      System.out.println(freq + " " + rms);

    }

  } 

}

