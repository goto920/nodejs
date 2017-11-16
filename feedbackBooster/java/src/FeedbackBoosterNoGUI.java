import java.io.*;
import java.util.*;
import javax.sound.sampled.*;
// import java.awt.*;
// import java.awt.event.*;
// import javax.swing.*;
// import javax.swing.event.*;
import jp.kmgoto.music.*;

public class FeedbackBoosterNoGUI {
  private int fontSize;
  private float totalSec;
  private float lastSec;
  private Mixer.Info outputPort, inputPort;
  private Mixer.Info[] inputMixers, outputMixers; 
  private FeedbackBoosterPlayer player = null;
  private boolean windows; 
  private boolean autoEQ = true;
  private float peakHz = (float) (12 * Math.log(220/41.2)/Math.log(2));
  private float eqGain = 20;
  private float octMix = 0.0f;
  private float Q = 2.9f; 
  private float compGain = 20.0f;
  private float compRatio = 2.0f;
  private float compThresh = -20.0f;
  private float volume = 70.0f;
  private String iPorts, oPorts;
  private int iPort=-1, oPort=-1;
  private boolean playing = false;
  private boolean bypass  = false;

  public FeedbackBoosterNoGUI() throws Exception {
    if (System.getProperty("os.name").indexOf("Windows")>=0)
      windows = true; else windows = false;

   inputPort = outputPort = null; player = null;

// get audio port info
    GetPortsInfo info = new GetPortsInfo();
    inputMixers = info.getInputPorts();

// generate JSON Object string (Use JSON.parser() at JavaScript Side)
    iPorts = "[";
    for (int i=0; i < inputMixers.length; i++) {
      iPorts += "{ \"key\": \"" + inputMixers[i].getName() + "\", \"id\": "; 
      if (i < inputMixers.length-1) iPorts += i + "},\n";
        else iPorts += i + "}"; // no camma on the last line
      }
    iPorts += "]";

    outputMixers = info.getOutputPorts();
    oPorts = "[";
    for (int i=0; i < outputMixers.length; i++) {
      oPorts += "{ \"key\": \"" + outputMixers[i].getName() + "\", \"id\": "; 
      if (i < outputMixers.length-1) oPorts += i + "},\n";
        else oPorts += i + "}"; // no camma on the last line
      }
    oPorts += "]";

  } // end constructor

  private boolean setDefaults(){
    if (setPeakHz(peakHz) 
      && setBypass(bypass)
      && setAutoEQ(autoEQ)
      && setEQGain(eqGain)
      && setOctMix(octMix)
      && setQ(Q)
      && setCompGain(compGain)
      && setRatio(compRatio)
      && setThresh(compThresh)
      && setVolume(volume)) return true; 
    else return false;
  }

// UI methods
 public String getParams(String key) { 
  // return JSON string and JSON.parse() in JavaScript Code

   String ret = "";

   if (key.equals("getDefaults")){
      ret = "{\"message\": \"+OK " + key + "\","
      + "\"params\": {"
      + "\"iPorts\": " + iPorts + ",\n"
      + "\"oPorts\": " + oPorts + ",\n"
      + "\"playing\": " + playing + ",\n"
      + "\"bypass\": " + bypass + ",\n"
      + "\"autoEQ\": " + autoEQ + ",\n"
      + "\"peakHz\": {" + "\"min\": 0," + "\"max\": " 
        + 12 * Math.log(11025/41.2)/Math.log(2)
        + ", \"value\": " + peakHz + "},\n"
      + "\"eqGain\": {\"min\": 0.0, \"max\": 60.0, \"value\": " 
        + eqGain + "},\n"
      + "\"octMix\": {\"min\": -1.0, \"max\": 1.0, \"value\": " 
        + octMix + "},\n"
      + "\"Q\": {\"min\": 0.1, \"max\": 8.0, \"value\": " + Q + "},\n"
      + "\"compGain\": {\"min\": -20.0, \"max\": 60.0, \"value\": " 
        + compGain + "},\n"
      + "\"compRatio\": {\"min\": 1.0, \"max\": 20.0, \"value\": " 
        + compRatio +"},\n"
      + "\"compThresh\": {\"min\": -60.0, \"max\": 0.0, \"value\": " 
        + compThresh + "},\n"
      + "\"volume\": {\"min\": 0.0, \"max\": 150.0, \"value\": " 
        + volume + "}\n"
      + "}\n\n}";
    } // end if

    return ret;
  }

  public String setParams(String key, String value) { 

    if (key.equals("setIPort")){ 
       if (playing) {
         return "{\"message\": \"-ERR stop player and retry\"}";
       } else {
         iPort = Integer.parseInt(value);
         String message = setInputPort(iPort);
         return "{\"message\": \"+OK iPort= " + message + "\"}";
       }
    }
    if (key.equals("setOPort")){ 
      if (playing) {
         return "{\"message\": \"-ERR stop player and retry\"}";
      } else {
         oPort = Integer.parseInt(value);
         String message = setOutputPort(oPort);
         return  "{\"message\": \"+OK oPort= " + message + "\"}";
      }
    }

    if (key.equals("setAutoEQ")){
      if (playing){
        if (value.equals("true")) {
          setAutoEQ(true);
          return "{\"message\": \"+OK AutoEQ on \"}";
        } else if (value.equals("false")) {
          setAutoEQ(false);
          return "{\"message\": \"+OK AutoEQ off \"}";
        }
      } else 
        return "{\"message\": \"-ERR start player first \"}";
    }

    if (key.equals("setPlayer")){

      if(value.equals("stop")){
        if(playing){
          play(false);
          return "{\"message\": \"+OK player stopped\"}";
        } else {
          return "{\"message\": \"-ERR player is not running(don't warry)\"}";
        }
      }

      if(value.equals("process")){
        if (playing){
          setBypass(false);
          return "{\"message\": \"+OK player turned to process mode \"}";
        } else {
          if (iPort < 0 || oPort < 0)
           return "{\"message\": \"-ERR set iPort and oPort first\"}";
          else {
           play(true); setBypass(false); 
           return "{\"message\": \"+OK player start in process mode\"}";
          }
        }
      }

      if(value.equals("bypass")){
        if (playing){
          setBypass(true);
          return "{\"message\": \"+OK player turned to bypass mode\"}";
        } else {
          if (iPort < 0 || oPort < 0)
           return "{\"message\": \"-ERR set iPort and oPort first\"}";
          else {
           play(true); setBypass(true); 
           return "{\"message\": \"+OK player start in bypass mode\"}";
          }
        }
      } 
    } // end setPlayer 

    if (key.equals("finish")) {
      play(false); 
      return "{\"message\": \"+OK finish\"}";
    }

// peakHz, eqGain, octMix, Q, compGain, compRatio, compThresh, volume

   if (!playing) return "{\"message\": \"-ERR start player first \"}";
   
   if (key.equals("setPeakHz")){
       float pitch = Float.parseFloat(value);
       setPeakHz(pitch);
       float Hz = (float) (41.2 * Math.pow(2.0,pitch/12.0));
       return "{\"message\": \"+OK " + key + " = " + Hz + "\"}";
   } 
   if (key.equals("setEQGain")){
       setEQGain(Float.parseFloat(value));
       return "{\"message\": \"+OK " + key + " = " + value + "\"}";
   } 
   if (key.equals("setOctMix")){
       setOctMix(Float.parseFloat(value));
       return "{\"message\": \"+OK " + key + " = " + value + "\"}";
   } 
   if (key.equals("setQ")){
       setQ(Float.parseFloat(value));
       return "{\"message\": \"+OK " + key + " = " + value + "\"}";
   } 
   if (key.equals("setCompGain")){
       setCompGain(Float.parseFloat(value));
       return "{\"message\": \"+OK " + key + " = " + value + "\"}";
   } 
   if (key.equals("setCompRatio")){
       setRatio(Float.parseFloat(value));
       return "{\"message\": \"+OK " + key + " = " + value + "\"}";
   } 
   if (key.equals("setCompThresh")){
       setThresh(Float.parseFloat(value));
       return "{\"message\": \"+OK " + key + " = " + value + "\"}";
   } 
   if (key.equals("setVolume")){
       setVolume(Float.parseFloat(value));
       return "{\"message\": \"+OK " + key + " = " + value + "\"}";
   }

 // undefined command
     return "{\"message\": \"-ERR command not found: \"" 
        + key + " = " + value + "\"}";

  } // end setParams

  private String[] getInputPorts() throws Exception { 
    String[] items  = new String[inputMixers.length];
    for (int i=0; i < inputMixers.length; i++){ 
      items[i] = inputMixers[i].getName();
      if (windows)
       items[i] = new String(items[i].getBytes(),"UTF-8");
    }
    return items;
  }

  private String setInputPort(int i){
    inputPort = inputMixers[i];
    return inputPort.getName();
  }

  private String[] getOutputPorts() throws Exception{
    String[] items = new String[outputMixers.length];
    for (int i=0; i < outputMixers.length; i++){ 
       items[i] = outputMixers[i].getName();
     if (windows)
       items[i] = new String(items[i].getBytes("Windows-932"),"UTF-8");
    }
    return items;
  }

  private String setOutputPort(int i){
    outputPort = outputMixers[i];
    return outputPort.getName();
  }

  public boolean play(boolean parm){

    if (parm == true) {
      player = new FeedbackBoosterPlayer(inputPort,outputPort);
      setDefaults();
      Thread pt = new Thread(player); 
      pt.start(); 
      playing = true;
      return true;
    } else {
      if (player != null) player.stopPlay(); 
      player = null; 
      playing = false;
      return true; // success 
    }

  }

  private boolean setBypass(boolean parm){
      if (player == null) return false;

      if (parm == true) { 
        player.setBypass(true); 
        bypass = true; 
        return true; 
      } else { 
        player.setBypass(false); 
        bypass = false;
        return false; 
      }
  }

  private boolean setAutoEQ(boolean parm){
    if (player == null) return false;
    if (parm == true) {
       player.setAutoEQ(true);
       this.autoEQ = true;
       return true;
    } else {
       player.setAutoEQ(false);
       this.autoEQ = false;
       return false; 
    }
  }

  private boolean setCompGain(float gain){
    if (player == null) return false;
    player.setCompGain(gain);
    this.compGain = gain;
    return true;
  }

  private float getCompGain(){
    if (player == null) return 0f;
    this.compGain = player.getCompGain();
    return compGain;
  }

  private boolean setPeakHz(float peakHz){
    if (player == null) return false;
    player.setPeakHz((float) (41.2 * Math.pow(2.0,peakHz/12.0)));
    this.peakHz = peakHz;
    return true;
  }

  private boolean setEQGain(float gain){ // dB
    if (player == null) return false;
    player.setEQGain(gain);
    this.eqGain = gain;
    return true;
  } 

  private boolean setOctMix(float mix) { // -1 .. 1
    if (player == null) return false;
    player.setOctMix(mix);
    this.octMix = mix;
    return true;
  } 

  private boolean setQ(float q) {
    if (player == null) return false;
    player.setQ(q);
    return true;
  } 

  private boolean setRatio(float ratio){
    if (player == null) return false;
    player.setRatio(ratio);
    return true;
  }

  private boolean setThresh(float thresh){
    if (player == null) return false;
    player.setThresh(thresh);
    return true;
  }

  private boolean setVolume(float volume){
    if (player == null) return false;
    player.setVolume(volume);
    return true;
  }

} 

//////////// END OF class FeedbackBoosterNoGUI

class FeedbackBoosterPlayer implements Runnable {

  private TargetDataLine iline;
  private SourceDataLine sline;
  private boolean running;
  private int channels;
  private int frameSize;
  private float frameRate,sampleRate;
  private float eQdBGain,Q, octMix, volume, peakHz, compGain;
//  private JSlider timeSlider;
  private boolean bigEndian;
  private boolean bypass = false, autoEQ = true;
  private PitchFinder pitch; 
  private BiquadEQ eqBase, eqOct;
  private Compressor comp;
//  private FeedbackBoosterApp parent;
  private int processSize;

  FeedbackBoosterPlayer(Mixer.Info input, Mixer.Info output){

    AudioFormat format = new AudioFormat(
         AudioFormat.Encoding.PCM_SIGNED,
         44100f, 16, 1, 2, 44100f,false);
    System.out.println("AudioFormat: " + format.toString());
/* AudioFormat.Encoding encoding, 
 * float sampleRate, 
 * int sampleSizeInBits, 
 * int channels, 
 * int frameSize, 
 * float frameRate, 
 * boolean bigEndian
 */

    processSize = 512; // 512 or 1024

    try {
      iline = AudioSystem.getTargetDataLine(format, input);
      sline = AudioSystem.getSourceDataLine(format,output);
//      System.out.println("Input buffer: " + iline.getBufferSize());
//      System.out.println("Output buffer: " + sline.getBufferSize());
//      iline.open(format, processSize*8);
      iline.open(format);
      // sline.open(format, processSize*4);
      sline.open(format);
      System.out.println("Input buffer: " + iline.getBufferSize());
      System.out.println("Output buffer: " + sline.getBufferSize());
    } catch (Exception e){ e.printStackTrace(); } 

    setBypass(true); setAutoEQ(false);
    setVolume(0.7f);
    running = false;
    pitch = new PitchFinder(44100f);
    comp = new Compressor(32767); // 16bit
    eQdBGain = 20f; 
    compGain = (float) Math.pow(10, (double) -eQdBGain/20.0);
    eqBase = new BiquadEQ(BiquadEQ.Type.PEAK); 
    eqOct  = new BiquadEQ(BiquadEQ.Type.PEAK); 
    setPeakHz(440f); 
    setQ(1f);
    setOctMix(0f);
    setCompGain(0f);
    setRatio(1f); setThresh(0f); 
   //    parent = null;
  }


  public void stopPlay(){ running = false;}

  public void setCompGain(float gain){ 
    compGain = (float) Math.pow(10,(double) gain/20.0); 
  }

  public float getCompGain(){ // dB 
    return (float) (20*Math.log10((double)compGain));
  }

  public void setBypass(boolean flag){ bypass = flag;}
  public void setAutoEQ(boolean flag){ autoEQ = flag;}

  public void setPeakHz(float peakHz){ 
    this.peakHz = peakHz;
    eqBase.setParams(peakHz/44100f, eQdBGain, Q);
    eqOct.setParams((2*peakHz)/44100f, eQdBGain, Q);  
/*
    if (parent != null){
       parent.peakHz.setText("peakHz: " + String.format("%10.1f",peakHz));
    }
*/
  }
  public void setEQGain(float gain){
    eQdBGain = (float) Math.pow(10, gain/20.0); 
    eqBase.setParams(peakHz/44100f, eQdBGain, Q);
    eqOct.setParams((2*peakHz)/44100f, eQdBGain, Q);  
  }

  public void setOctMix(float mix){octMix = mix;}
      // -1 (root 100%) .. 1(oct up 100%)
  public void setQ(float Q){
    this.Q = Q;
    eqBase.setParams(peakHz/44100f, eQdBGain, Q);
    eqOct.setParams((2*peakHz)/44100f, eQdBGain, Q);  
  }
//  public void setParent(FeedbackBoosterApp obj){parent = obj;}
  public void setRatio(float ratio){comp.setRatio(ratio); }
  public void setThresh(float thresh){comp.setThresh(thresh);}
  public void setVolume(float vol){volume = vol;}

  public void run() {
    // byte[] buf = new byte[processSize*4]; 
        // 256, 512, 1024, etc. x 4 (16bit*2ch)
    byte[] buf = new byte[1024*4];
    running = true;

    try {
       iline.start();
       sline.start();

       float[] floatSamples;
       byte[] byteSamples;
       int nread, nwritten;
       float alpha = 0.2f;

       while(running) {
          nread = iline.read(buf,0,iline.available());
          floatSamples = Util.StereoToMono(Util.LE16ToFloat(buf, nread)); 

          if (!bypass){
          // process effect here
            if (autoEQ){
              float tmp = pitch.findPitch(floatSamples);
              if (tmp > 0){
                peakHz = (1-alpha)*peakHz + alpha*tmp; // slow adjustment
                setPeakHz(peakHz);
              }
            }

            float[] base = eqBase.processArray(floatSamples);
            float[] oct  = eqOct.processArray(floatSamples);

            // add base and oct
            for (int i = 0; i < base.length; i++){
               floatSamples[i] = ((1-octMix)*base[i] + (1+octMix)*oct[i])/2f;
            }

            Util.adjustFloatGain(floatSamples,compGain);

            double peakdB = -100;
            for (int i = 0; i < floatSamples.length; i++){
               double current = 20*Math.log10(Math.abs(floatSamples[i])/32767);
               if (current > peakdB) peakdB = current;
            }


/*
            if (parent != null){
               if (peakdB > -3){
                 parent.clip.setForeground(Color.RED);
                 parent.comp.setForeground(Color.GREEN);
               } else if (peakdB > (double) parent.threshSlider.getValue()){
                 parent.clip.setForeground(Color.BLACK);
                 parent.comp.setForeground(Color.GREEN);
               } else {
                 parent.clip.setForeground(Color.BLACK);
                 parent.comp.setForeground(Color.BLACK);
               }
            }
*/

            comp.processArray(floatSamples);

          }

          Util.adjustFloatGain(floatSamples,volume); // output volume
          floatSamples = Util.MonoToStereo(floatSamples);
          byteSamples = Util.FloatToLE16(floatSamples);
          nwritten = sline.write(byteSamples,0,byteSamples.length);
       } // end while

   } catch (Exception e){
     e.printStackTrace();
   } 
   iline.stop(); iline.flush(); iline.close();
   sline.stop(); sline.flush(); sline.close();

   System.out.println("Player thread end");
  }

  public static void main(String[] args) throws Exception {
    if (args.length == 0) return;
    File inputFile = new File(args[0]);
  }
  
}
