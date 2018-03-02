#!/usr/bin/perl

#$fix = 60.0/(74.947960 - 14.929614);
$fix = 60.0/60.0219166885;
$bpm =$ARGV[0];

print "# seq time diff interval timefix = $fix\n";

$sumDiff = 0.0;
$sqSumDiff = 0.0;

$sumInt = 0.0;
$sqSumInt = 0.0;

$line_no = 0;
$lastClick = 0;

while(<STDIN>){
  if (/^#/) {next;}

  if ($line_no == 0){ $begin = $_; }

  $click_time = ($_ - $begin)*$fix;

  $diff = $click_time - $line_no*60/$bpm;
  $sumDiff += $diff;
  $sqSumDiff += $diff * $diff;

  $interval = $click_time - $lastClick;
  $sumInt += $interval;
  $sqSumInt += $interval * $interval;

  print "$line_no ";
  if ($line_no > 0){
    print "$click_time $diff $interval\n"; 
  } else { 
    print "$click_time 0 \n"; 
  }
  $lastClick = $click_time;
  $line_no++;
}

$meanDiff = $sumDiff/($line_no - 1);
if ($meanDiff*$meanDiff > 1.0e-10) {
  $sqSumDiff /= $line_no - 1;
  $cvDiff = sqrt($sqSumDiff - ($meanDiff*$meanDiff))/$meanDiff;
  print "# Diff mean = $meanDiff, cv = $cvDiff\n";
} else {
  print "# Diff mean = $meanDiff, cv = N/A\n";
}

$meanInt = $sumInt/($line_no - 1);
$sqSumInt /= $line_no - 1;
$cvInt = sqrt($sqSumInt - ($meanInt*$meanInt))/$meanInt;
print "# Interval mean = $meanInt, cv = $cvInt\n";
