import React, { Component } from 'react';
import './addClicks.css'
import WAAClock from 'waaclock'
import BufferLoader from './buffer-loader'
import clickSound from './cowbell-mid.mp3'

window.AudioContext = window.AudioContext || window.webkitAudioContext
window.OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext

var context
var clock
var cowbell_mid_sound

var offlineContext = new window.OfflineAudioContext(2, 4*44100*10, 44100) 
 // 40 sec
var lowpass = offlineContext.createBiquadFilter()
    lowpass.tyvar  = "lowpass"
    lowpass.frequency.value = 150
    lowpass.Q.value = 1

var highpass = offlineContext.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 100;
    highpass.Q.value = 1;


class App extends Component {
  constructor (props) {
    super(props)
    this.params = {
       inputAudio: undefined,
       bpm: undefined,
       offset: undefined,
       currentSource: undefined,
       beginAt: undefined,
       pausedAt: undefined,
       scheEvent: undefined
    }

    this.state = {
      playing: 'stopped', // 'not playing', 'paused', 'playing'
      startButtonStr: 'Wait',
      songLength: 0,
      currentPos: 0,
      click: 'pre',
      clickVolume: 0.7,
      bpm: 0 
    }

    this.tap = {
      firstTapMsecs: 0,
      count: 0,
      msecsFirst: 0,
      msecsPrevious: 0
    }

    this.setState = this.setState.bind(this)
    this.loadFile = this.loadFile.bind(this)
    this.handleStartStop = this.handleStartStop.bind(this)
    this.handleTap = this.handleTap.bind(this)
    this.handleClick = this.handleClick.bind(this)
    this.handleTimeSlider = this.handleTimeSlider.bind(this)
    this.handleWindowClose = this.handleWindowClose.bind(this)
    this.makeClickTrack = this.makeClickTrack.bind(this)
    this.getPeaks = this.getPeaks.bind(this)
    this.getIntervals = this.getIntervals.bind(this)
  }

  componentWillMount () { // before render()
    window.addEventListener('beforeunload', this.handleWindowClose)
  }

  componentDidMount () {  // after render()
    context = new window.AudioContext()

    let inputFiles = []
    inputFiles.push(clickSound)

    let bufferLoader = new BufferLoader(
      context, inputFiles, function (bufferList) {
        cowbell_mid_sound = bufferList[0]
        // console.log(cowbell_mid_sound)
      }
    )
    bufferLoader.load()

    clock = new WAAClock(context)
    clock.start()
  }

  componentWillUnMount() { // before closing app
    window.removeEventListener('beforeunload', this.handleWindowClose)
  }

  handleWindowClose (event) { // clean up before exit
    if(this.params.scheEvent !== undefined) this.params.scheEvent.clear()
    clock.stop()
    context.close()
  }
  
  render() {
    const {handleStartStop,handleTap,loadFile,handleClick,
      handleTimeSlider} = this
    const {bpm,startButtonStr,songLength,currentPos,clickVolume} 
      = this.state

    return (
     <div className='addClicks'>
     Music file player with clicks
     <hr />
     File: &nbsp; 
     <span className='selectFile'>
     <input type='file' name='loadFile' 
     accept='audio/*' onChange={loadFile} />
     </span>
     <hr />
     &nbsp; <button name='startPause' onClick={handleStartStop}>
     {startButtonStr}
     </button>&nbsp;&nbsp;
     <span className='small-button'>
     <button name='stop' onClick={handleStartStop}>Stop</button>
     </span> 
     &nbsp; Time: &nbsp; 
     { ('   ' + parseFloat(currentPos).toFixed(1)).slice(-5)}/
      {('000' + parseFloat(songLength).toFixed(1)).slice(-5)}
     <br />
     <span className='tinyButton'>
     <button name='timeStep' value='-1' onClick={handleTimeSlider}>-</button>
     </span>
     <span className='timeSlider'>
     <input type='range' name='timeSlider' min='-10' 
       max={songLength} step='0.01' value={currentPos} 
       onChange={handleTimeSlider} />
     </span>
     <span className='tinyButton'>
     <button name='timeStep' value='1' onClick={handleTimeSlider}>+</button>
     </span>
     <hr />
     BPM: {('000' + parseFloat(bpm).toFixed(1)).slice(-5)}
     <hr />
     <span className='small-button'>
     <button name='tempo_tap' onClick={handleTap}>Tap</button></span>
     &nbsp; (3 sec timeout)
     <hr />
     Click: off
     <input type='radio' name='clickOn' value='off' onClick={handleClick}/>, 
     1Bar preCount
     <input type='radio' name='clickOn' value='pre1' 
        defaultChecked={true} onClick={handleClick}/>,
     2Bar preCount
     <input type='radio' name='clickOn' value='pre2' 
        defaultChecked={true} onClick={handleClick}/>,
     all
     <input type='radio' name='clickOn' value='all' onClick={handleClick}/>
     <hr />
     Click Vol.:&nbsp; {parseFloat(clickVolume,10).toFixed(2)} &nbsp;
     <span className='shortSlider'>
     <input type='range' name='clickVolume' min='0.0'
       max='1.0' step='0.01' value={clickVolume} 
       onChange={handleClick} />
     </span>

     <hr />
     <a href="url">Save to a file (To be implemented)</a>
     <hr />
     link to user guide and updates
     </div>
    )
  }

  loadFile(event){

    if (event.target.name !== 'loadFile') return

    if (event.target.files.length === 0) return

    let file = event.target.files[0]

    let reader = new FileReader()
    reader.onload = function(e) {
      context.decodeAudioData(reader.result,
        function(buffer) {
          this.params.inputAudio = buffer
          this.makeClickTrack(this.params.inputAudio)
          this.setState({startButtonStr: 'Play',
                         songLength: this.params.inputAudio.duration})
        }.bind(this),
        function(error){ 
          console.log('ERROR decodeAudioData:') 
        })
    }.bind(this)

    reader.readAsArrayBuffer(file)
    return
  }

/* https://github.com/JMPerez/beats-audio-api/blob/gh-pages/script.js */
  makeClickTrack(inputAudioBuffer){
    let {bpm,offset} = this.params

    let source = offlineContext.createBufferSource()
    source.buffer = inputAudioBuffer
       // console.log('inputLen: ' + inputAudioBuffer.getChannelData(0).length)
    source.connect(lowpass)
    // lowpass and then highpass
    lowpass.connect(highpass)
    highpass.connect(offlineContext.destination)
    source.start()
    
    offlineContext.oncomplete = function (e){
      console.log('Rendering complete')
      let peaks = this.getPeaks(
       [e.renderedBuffer.getChannelData(0), 
        e.renderedBuffer.getChannelData(1)])
      console.log(peaks)
    }.bind(this)

    offlineContext.startRendering()

  } // END makeClickTrack

  getPeaks(data){
     let partSize = 22050 // 0.5 sec
     let parts = data[0].length / partSize
     let peaks = []

  for (var i = 0; i < parts; i++) {
    console.log('part: ' + i)
    var max = 0;
    for (var j = i * partSize; j < (i + 1) * partSize; j++) {
      var volume = Math.max(Math.abs(data[0][j]), Math.abs(data[1][j]));
      if (!max || (volume > max.volume)) {
        max = {
          position: j,
          volume: volume
        }
      }
    }
    peaks.push(max);
  }

  // We then sort the peaks according to volume...

  peaks.sort(function(a, b) {
    return b.volume - a.volume;
  });

  // ...take the loundest half of those...

  peaks = peaks.splice(0, peaks.length * 0.5);

  // ...and re-sort it back based on position.

  peaks.sort(function(a, b) {
    return a.position - b.position;
  });

  return peaks;
} // END getPeaks

  getIntervals(peaks){
   var groups = [];

  peaks.forEach(function(peak, index) {
    for (var i = 1; (index + i) < peaks.length && i < 10; i++) {
      var group = {
        tempo: (60 * 44100) / (peaks[index + i].position - peak.position),
        count: 1
      };

      while (group.tempo < 90) {
        group.tempo *= 2;
      }

      while (group.tempo > 180) {
        group.tempo /= 2;
      }

      group.tempo = Math.round(group.tempo);

/*
      if (!(groups.some(function(interval) {
        return (interval.tempo === group.tempo ? interval.count++ : 0);
      }))) { groups.push(group); }
*/

    }
  });

    return groups;
  }

  handleStartStop(event){
    const {inputAudio,currentSource} = this.params
    const {startButtonStr,currentPos} = this.state

    if (event.target.name === 'stop'){
      currentSource.stop()
      if (this.params.scheEvent !== undefined) {
         this.params.scheEvent.clear()
         this.params.scheEvent = undefined
      }
      this.setState({startButtonStr: 'Play', currentPos: 0.0})
      return
    }

    if (event.target.name === 'startPause'){
      if (startButtonStr === 'Play') {
        let count  = context.createBufferSource()
        console.log(cowbell_mid_sound)
        count.buffer = cowbell_mid_sound
        count.connect(context.destination)
        count.start()

        let source = context.createBufferSource()
        source.buffer = inputAudio
        // source.playbackRate.value = 0.5
        // source.detune.value = 1200 // one octave
        source.connect(context.destination)
        this.params.beginAt = context.currentTime
        source.start(context.currentTime,parseFloat(currentPos,10))
        this.params.currentSource = source
        this.setState({startButtonStr: 'Pause'})
        this.params.scheEvent = clock.callbackAtTime(
          function(event) {
            if (this.state.currentPos > inputAudio.duration){
              this.handleStartStop({target: {name: 'stop'}})
            }
            this.setState({currentPos: this.state.currentPos + 0.1})
          }.bind(this), context.currentTime + 0.1)
          .repeat(0.1)
          .tolerance({early: 0.0, late: 0.1})
      } else if (startButtonStr === 'Pause'){
        currentSource.stop()
        if (this.params.scheEvent !== undefined) {
          this.params.scheEvent.clear()
          this.params.scheEvent = undefined
        }
        this.setState({startButtonStr: 'Resume'})
      } else if (startButtonStr === 'Resume'){
        let source = context.createBufferSource()
        source.buffer = inputAudio
        source.connect(context.destination)
        this.params.currentSource = source
        source.start(context.currentTime, currentPos)

        this.params.scheEvent = clock.callbackAtTime(
          function(event) {
            if (this.state.currentPos > inputAudio.duration){
              this.handleStartStop({target: {name: 'stop'}})
            }
            this.setState({currentPos: this.state.currentPos + 0.1})
          }.bind(this), context.currentTime + 0.1)
          .repeat(0.1)
          .tolerance({early: 0.0, late: 0.1})
        this.setState({startButtonStr: 'Pause'})
      } 
      return
    }
   
    if (event.target.name === 'stop') {
      currentSource.stop()
      this.params.startButtonStr = 'play'
      if (this.params.scheEvent) this.params.scheEvent.cancel()
      return
    }

  }

  handleClick (event){
    if (event.target.name === 'click') {
      if (event.target.value === 'off') this.setState({click: 'off'})
      else if (event.target.value === 'pre1') this.setState({click: 'pre1'})
      else if (event.target.value === 'pre2') this.setState({click: 'pre1'})
      else if (event.target.value === 'all') this.setState({click: 'all'})
      else console.log('click undefined value: ' + event.target.value)
      return
    }

    if (event.target.name === 'clickVolume') {
      this.setState({clickVolume: parseFloat(event.target.value,10)}) 
      return
    }
  }

  handleTap (event){

    if (event.target.name !== 'tempo_tap') return

      let timeSeconds = new Date()
      let msecs = timeSeconds.getTime()

      if ((msecs - this.tap.msecsPrevious) > 3000) { // timeout 3 sec
        this.tap.count = 0
      }

      if (this.tap.count === 0) {
        this.tap.msecsFirst = msecs
        this.tap.count = 1
      } else {
        let newBpm = 60000 * this.tap.count / (msecs - this.tap.msecsFirst)
        this.setState({bpm: newBpm})
        this.tap.count++
      }
      this.tap.msecsPrevious = msecs

  }

  handleTimeSlider(event){
    if (event.target.name === 'timeSlider'){
      this.setState({currentPos: parseFloat(event.target.value)})
      return
    }

    if (event.target.name === 'timeStep'){
      this.setState({currentPos: this.state.currentPos 
            + parseFloat(event.target.value)})
      return
    }
  } // end handleTimeSlider

}

export default App;
