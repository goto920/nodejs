#!/bin/sh

COMMAND=./plotdata-timefix-swing.pl
process="all"

if [ $process = "all" ]; then

for DIR in RolandRMP5 TempoAndroid Windows10-Edge \
	Android-SO-02H Linux-Firefox-oldThinkpad
do
  for bpm in 60 120 180 240
  do
#   aubioonset -i $DIR/${bpm}bpm.wav > $DIR/${bpm}bpm.onset
   $COMMAND ${bpm} < $DIR/${bpm}bpm.onset > $DIR/${bpm}bpm.plot
  done
done

for bpm in 60 120 180 240
do
cat << EOS | gnuplot
set yrange[:0.05]
set terminal png
set output 'figures/${bpm}bpm.png'
plot 'RolandRMP5/${bpm}bpm.plot' using 1:3, \
	'TempoAndroid/${bpm}bpm.plot' using 1:3, \
	'Windows10-Edge/${bpm}bpm.plot' using 1:3, \
	'Android-SO-02H/${bpm}bpm.plot' using 1:3, \
	'Linux-Firefox-oldThinkpad/${bpm}bpm.plot' using 1:3
exit
EOS
done

fi
# end of first part

for DIR in Windows10-Edge Android-SO-02H Linux-Firefox-oldThinkpad
do
  for bpm in 60 120 180 240
  do
   aubioonset -i $DIR/${bpm}bpm-swing.wav > $DIR/${bpm}bpm-swing.onset
   $COMMAND ${bpm} swing < $DIR/${bpm}bpm-swing.onset > $DIR/${bpm}bpm-swing.plot
  done
done

for bpm in 60 120 180 240
do
cat << EOS | gnuplot
set yrange[:0.1]
set terminal png
set output 'figures/${bpm}bpm-swing.png'
plot 'Windows10-Edge/${bpm}bpm-swing.plot' using 1:3, \
	'Android-SO-02H/${bpm}bpm-swing.plot' using 1:3, \
	'Linux-Firefox-oldThinkpad/${bpm}bpm-swing.plot' using 1:3
exit
EOS
done

exit
