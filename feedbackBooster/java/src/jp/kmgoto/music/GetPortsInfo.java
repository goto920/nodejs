package jp.kmgoto.music;

import javax.sound.sampled.*;
import java.util.ArrayList;

public class GetPortsInfo {

  private AudioFormat format;
  private DataLine.Info target, source;
  private Mixer.Info[] mixers;

 public GetPortsInfo() throws Exception {
   format = new AudioFormat(
           AudioFormat.Encoding.PCM_SIGNED,
           44100f, 16, 2, 4, 44100f,false);

   System.out.println("AudioFormat: " + format.toString());
   target = new DataLine.Info(TargetDataLine.class,format);
   source = new DataLine.Info(SourceDataLine.class,format);
   mixers = AudioSystem.getMixerInfo();

 }

 public Mixer.Info[] getInputPorts() throws Exception {

   ArrayList<Mixer.Info> inputPorts = new ArrayList<Mixer.Info>();
   for (Mixer.Info mixerInfo: mixers) {
      Mixer mixer = AudioSystem.getMixer(mixerInfo);
      Line.Info[] targets   = mixer.getTargetLineInfo(target);
      for (Line.Info info : targets)  inputPorts.add(mixerInfo);
   }

   int num = inputPorts.size(); 
   Mixer.Info[] retval = new Mixer.Info[num];
   for (int i = 0; i < num; i++) retval[i] = inputPorts.get(i);
   return retval;
 }

 public Mixer.Info[] getOutputPorts() throws Exception {
   ArrayList<Mixer.Info> outputPorts = new ArrayList<Mixer.Info>();

   for (Mixer.Info mixerInfo: mixers) {
      Mixer mixer = AudioSystem.getMixer(mixerInfo);
      Line.Info[] sources   = mixer.getSourceLineInfo(source);
      for (Line.Info info : sources) outputPorts.add(mixerInfo);
   }

   int num = outputPorts.size(); 
   Mixer.Info[] retval = new Mixer.Info[num];
   for (int i = 0; i < num; i++) retval[i] = outputPorts.get(i);
   return retval;
 }

 public static void main(String[] args) throws Exception {
   GetPortsInfo gp = new GetPortsInfo(); 
   Mixer.Info[] ip = gp.getInputPorts();
   Mixer.Info[] op = gp.getOutputPorts();

   System.out.println("Input: ");
   for (int i = 0; i < ip.length; i++)
     System.out.println(ip[i].getName());

   System.out.println("Output: ");
   for (int i = 0; i < op.length; i++)
     System.out.println(op[i].getName());

 }

}
