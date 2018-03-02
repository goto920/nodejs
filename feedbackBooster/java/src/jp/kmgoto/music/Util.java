package jp.kmgoto.music;

// import javazoom.jl.converter.*;

public class Util {

  public static float[] getLeft(float[] input){
     float[] retval = new float[input.length/2];
     for (int i=0; i < input.length/2; i++) retval[i] = input[2*i];
     return retval;
  }

  public static float[] getRight(float[] input){
     float[] retval = new float[input.length/2];
     for (int i=0; i < input.length/2; i++) retval[i] = input[2*i+1];
     return retval;
  }

  public static float[] merge(float[] input0, float[] input1){
     float[] retval = new float[input0.length*2];
     for (int i=0; i < input0.length; i++){
       retval[2*i] = input0[i]; retval[2*i+1] =  input1[i];
     }
     return retval;
  }

  public static float[] StereoToMono(float[] input){
     float[] retval = new float[input.length/2];
     for (int i=0; i < input.length/2; i++)
       retval[i] = (input[2*i] + input[2*i+1])/2f;
     return retval;
  }

  public static float[] MonoToStereo(float[] input){
     float[] retval = new float[input.length*2];
     for (int i=0; i < input.length; i++){
       retval[2*i] = input[i]; // *2 ?
       retval[2*i + 1] = input[i];
     }
     return retval;
  }

  public static float[] LE16ToFloat(byte[] input) {
     return LE16ToFloat(input, input.length); 
  }

  public static float[] LE16ToFloat(byte[] input, int len) {
     float[] retval = new float[len/2];
     for (int i=0; i < len/2; i++){
       retval[i] = (float) (input[2*i+1] << 8 | (input[2*i] & 0xff));
     }
     return retval;
  }

  public static byte[] FloatToLE16(float[] input) {
     byte[] retval = new byte[input.length*2];
     for (int i=0; i < input.length; i++){
       if (Math.abs(input[i]) > 32767){ 
//          System.out.println("abs(sample) > 32767: "+ input[i]);
          input[i] = Math.signum(input[i])*32767f;
       }
       short tmp = (short) input[i];
       retval[2*i]     = (byte) (tmp & 0xff);
       retval[2*i + 1] = (byte) (tmp >> 8 & 0xff);
     }
     return retval;
   }

/*
   public static void mp3ToWaveFile(String inputFile, String outputFile)
     throws Exception {
     Converter converter = new Converter();
     converter.convert(inputFile,outputFile);
    }
*/

   public static void adjustFloatGain(float[] input, float gain){
       for (int i=0; i < input.length; i++) input[i] *= gain;
   } 
  
}
