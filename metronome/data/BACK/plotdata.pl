#!/usr/bin/perl

$line_no = 0;
$lastClick = 0;
while(<STDIN>){
  if (/^#/) {next;}

  if ($line_no == 0){ $begin = $_; }
  $click_time = $_ - $begin;

  $diff = $click_time - $lastClick;
  print "$line_no ";
  if ($line_no > 0){
    print "$click_time $diff\n"; 
  } else { 
    print "$click_time\n"; 
  }
  $lastClick = $click_time;
  $line_no++;
}
