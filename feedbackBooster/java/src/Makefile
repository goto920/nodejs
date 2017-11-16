JTRANSFORM= pl org/apache \
	org/jtransforms/utils \
	org/jtransforms/fft/FloatFFT_1D*.class

noGUI: FeedbackBoosterNoGUI
	jar cvf ../FeedbackBoosterNoGUI.jar \
	FeedbackBoosterNoGUI.class FeedbackBoosterPlayer.class \
	jp/kmgoto/music/*.class

FeedbackBoosterNoGUI: clean FeedbackBoosterNoGUI.java
	javac FeedbackBoosterNoGUI.java

clean:
	rm -f *.class jp/kmgoto/music/*.class

