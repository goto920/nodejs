#!/usr/bin/perl

#$fix = 60.0/(74.947960 - 14.929614);
$fix = 60.0/60.0219166885;

if (!defined($ARGV[0])){
  print "command bpm [swing]\n";
  exit;
}

$bpm=$ARGV[0];

$swing = 0;
if (defined($ARGV[1]) && $ARGV[1] eq 'swing'){
  $swing = 1;
  $bpm *= 2;
  print "doubled $bpm\n";
}

print "# seq time diff interval timefix = $fix\n";

$sumDiff = 0.0;
$sqSumDiff = 0.0;

$sumInt = 0.0;
$sqSumInt = 0.0;

$sumIntOdd = 0.0;
$sqSumIntOdd = 0.0;

$line_no = 0;
$lastClick = 0;

while(<STDIN>){
  if (/^#/) {next;}

  if ($line_no == 0){ $begin = $_; }

  $click_time = ($_ - $begin)*$fix;

  if($swing && $line_no % 2 == 1){
    $diff = $click_time - ($line_no+1/3.0)*60/$bpm;
  } else {
    $diff = $click_time - $line_no*60/$bpm;
  }
  $sumDiff += $diff;
  $sqSumDiff += $diff * $diff;


  $interval = $click_time - $lastClick;

  if ($swing && $line_no % 2 == 1){
    $sumIntOdd += $interval;
    $sqSumIntOdd += $interval * $interval;
  } else {
    $sumInt += $interval;
    $sqSumInt += $interval * $interval;
  }

  if ($swing && $line_no % 2 == 1) {
    $line_swing = $line_no + 1/3.0;
    print "$line_swing ";
  } else {
    print "$line_no ";
  }

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
  if ($sqSumDiff - ($meanDiff*$meanDiff)) {
    $cvDiff = sqrt($sqSumDiff - ($meanDiff*$meanDiff))/$meanDiff;
  } else {$cvdiff = 0;}
  print "# Diff mean = $meanDiff, cv = $cvDiff\n";
} else {
  print "# Diff mean = $meanDiff, cv = N/A\n";
}


if ($swing){
  $meanIntOdd = $sumIntOdd/(($line_no - 1)/2);
  $sqSumIntOdd /= ($line_no - 1)/2;

  if ($meanIntOdd*$meanIntOdd > 1.0e-10) {
    if ($sqSumIntOdd - ($meanIntOdd*$meanIntOdd) > 0) {
      $cvIntOdd = sqrt($sqSumIntOdd - ($meanIntOdd*$meanIntOdd))/$meanIntOdd;
    } else {$cvIntOdd = 0;}
    print "# Interval(Even->Odd) mean = $meanIntOdd, cv = $cvIntOdd\n";
  } else {
    print "# Interval(Even->Odd) mean = $meanIntOdd, cv = N/A\n";
  }

  $meanInt = $sumInt/(($line_no - 1)/2);
  $sqSumInt /= ($line_no - 1)/2;

  if ($sqSumInt - ($meanInt*$meanInt) > 0) {
    $cvInt = sqrt($sqSumInt - ($meanInt*$meanInt))/$meanInt;
  } else {$cvInt = 0;}
  print "# Interval(Odd->Even) mean = $meanInt, cv = $cvInt\n";

} else { 
  $meanInt = $sumInt/($line_no - 1);
  $sqSumInt /= $line_no - 1;

  if ($meanInt*$meanInt > 1.0e-10) {
    if ($sqSumInt - ($meanInt*$meanInt) < 0){
      $cvInt = sqrt($sqSumInt - ($meanInt*$meanInt))/$meanInt;
    } else {$cvInt = 0;}
    print "# Interval mean = $meanInt, cv = $cvInt\n";
  } else {
    print "# Interval mean = $meanInt, cv = N/A\n";
  }
}
