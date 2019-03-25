// Global function
Effector.count = 0
Effector.audioSample = undefined
Effector.audioCtx = undefined
Effector.threshold = 0.2
Effector.maxLevel = 0.1
Effector.twoBeforeLevel = 0.0
Effector.lastLevel = 0.0

export default function Effector(e) {
    let inL = e.inputBuffer.getChannelData(0)
    let inR = e.inputBuffer.getChannelData(1)
    let outL = e.outputBuffer.getChannelData(0)
    let outR = e.outputBuffer.getChannelData(1)
    let sampleRate = e.outputBuffer.sampleRate 
    let length = inL.length

    for (let i=0, meanPower=0.0; i <= length; i++){

      if (i > 0 && i % 256 === 0){
        // let currentLevel =  Math.pow(meanPower/256.0,2.0)
        let currentLevel =  meanPower/256.0

        if (currentLevel > Effector.maxLevel*Effector.threshold){
          if (Effector.twoBeforeLevel < Effector.lastLevel
              && Effector.lastLevel >= currentLevel) {
             console.log('i: ' + i)
             console.log('peak at ' + (Effector.count - 128)/sampleRate)
            // Effector.playClick()
          }
        }
// update for next round
        if (currentLevel > Effector.maxLevel) Effector.maxLevel = currentLevel

        Effector.twoBeforeLevel = Effector.lastLevel 
        Effector.lastLevel = currentLevel
       if (i < length)
         meanPower = (inL[i]+inR[i])*(inL[i]+inR[i])/4.0
       else
         meanPower = 0.0 

      } else if (i < length) meanPower += (inL[i]+inR[i])*(inL[i]+inR[i])/4.0

      if (i < length) {
        outL[i] = inL[i]
        outR[i] = inR[i]
        Effector.count++
      }
    } // end for


} // end Effector()

Effector.playClick = function() {
  let source = Effector.audioCtx.createBufferSource()
  source.buffer = Effector.audioSample
  source.connect(Effector.audioCtx.destination)
  source.start()
}
