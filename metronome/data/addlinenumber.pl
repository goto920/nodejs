#!/usr/bin/perl

$line_no = 0;
while(<STDIN>){
  if ($line_no == 0){ $begin = $_; }
  $num = $_ - $begin;

  print "$line_no ";
  print "$num\n"; 
  $line_no++;
}
