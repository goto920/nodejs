
export default function ClickAll(audioCtx,music, click) {
    let inL = music.getChannelData(0)
    let inR = music.getChannelData(1)
    let clickL = click.getChannelData(0)
    let clickR = click.getChannelData(1)
    let length = inL.length
    let clickLength = clickL.length
    let maxLevel = 0.1
    let threshold = 0.3
    let twoBeforeLevel = 0.0
    let lastLevel = 0.0

    console.log("music: ", length)
    console.log("click: ", clickLength)

    for (let i=0, meanPower=0.0; i < length; i++){

      if (i > 0 && i % 256 === 0){

        let currentLevel = meanPower/256.0

        if (currentLevel >= maxLevel*threshold) {
 //   console.log("current: " + currentLevel + " ,at: " + i/music.sampleRate) 

       // let delta = maxLevel*0.1
         let delta = 0
         if ((lastLevel - twoBeforeLevel) > delta 
           && (lastLevel - currentLevel) > delta) {
           console.log("click at: " + (i - 128)/music.sampleRate)
/*
           for (let j = 0; j < clickLength; j++){
             inL[i - 128 + j] += clickL[j]
             inR[i - 128 + j] += clickR[j]
           } // end for
*/
         } // end delta

        } // end threshold

     // update for next round         
      if (currentLevel > maxLevel) {
        maxLevel = currentLevel
   //   console.log("max: " +  maxLevel + "at: " + i)
      }
      twoBeforeLevel = lastLevel 
      lastLevel = currentLevel
      meanPower = (inL[i]+inR[i])*(inL[i]+inR[i])/4.0
      // console.log("i =  " +  i)

    } else { // end if 256
      meanPower += (inL[i]+inR[i])*(inL[i]+inR[i])/4.0
    }

  } // end for

} // end ClickAll()
