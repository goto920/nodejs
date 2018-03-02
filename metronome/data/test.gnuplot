set yrange[:0.05]
set terminal png
set output 'figures/240bpm.png'
plot 'RolandRMP5/240bpm.plot' using 1:3, 	'TempoAndroid/240bpm.plot' using 1:3, 	'Windows10-Edge/240bpm.plot' using 1:3, 	'Android-SO-02H/240bpm.plot' using 1:3, 	'Linux-Firefox-oldThinkpad/240bpm.plot' using 1:3
exit
