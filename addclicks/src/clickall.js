export default function ClickAll(audioCtx,music, click) {
    let inL = music.getChannelData(0)
    let inR = music.getChannelData(1)
    let length = music.length
    let maxPower = 0

    let powerArray = new Float32Array(parseInt(music.length/256)+1)

    for (let i=0, meanPower=0.0; i < length; i++){

      if (i > 0 && i % 256 === 0){
        let currentLevel = meanPower/256.0
        powerArray[parseInt(i/256)] = currentLevel
        meanPower = (inL[i]+inR[i])*(inL[i]+inR[i])/4.0
        if (meanPower > maxPower) maxPower = meanPower
      } else { // end if 256
        meanPower += (inL[i]+inR[i])*(inL[i]+inR[i])/4.0
      }

    } // end for

// analysis  

  return ClickAll.analyze(audioCtx, powerArray, maxPower, music, click)

} // end ClickAll()

ClickAll.analyze = function (audioCtx, powerArray, maxPower,music, click) {
  let result 
   = audioCtx.createBuffer(click.numberOfChannels, music.length,
        audioCtx.sampleRate)
  let interval = 0
  let lastPeak = 0
  let count = 0
  let maxBpm = 240
  let minInterval = (60/maxBpm)/(256/music.sampleRate)
  console.log ("minInterval: " + minInterval)

  for (let i = 2; i < powerArray.length; i++){

     let delta = maxPower*0.05
     let alpha = 0.2

     if (powerArray[i-1] > maxPower*0.1 
          && powerArray[i-1] - powerArray[i-2] > delta
          && powerArray[i-1] - powerArray[i] > 0){

       if ((i - 1) - lastPeak >= minInterval ){
         count++
         if (interval === 0){
           if (lastPeak > 0) interval = (i - 1) - lastPeak
         } else
           interval = (1-alpha)*interval + alpha*((i - 1) - lastPeak)

         let intervalSec = interval*256/music.sampleRate
         let bpm = 60/intervalSec

         console.log ("peak at: " + (i-1) 
                    + ", time: " + i*256/music.sampleRate
                    + ", level: " + powerArray[i-1] 
                    + ", bpm: " + bpm)

         lastPeak = i - 1
       }
     }
  } // end for

  if (count > 0) {
//    interval /= count
    let intervalSec = interval*256/music.sampleRate
    let bpm = 60/intervalSec
    console.log ("mean interval: " + intervalSec + ", bpm: " + bpm)  
  } 
  
  return result
}
