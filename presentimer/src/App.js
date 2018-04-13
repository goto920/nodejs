import React, { Component } from 'react';
// import logo from './logo.svg';
import './App.css';
import packageJSON from '../package.json'
import WAAClock from 'waaclock'
import BufferLoader from './buffer-loader'
import bell from './bell.mp3'
import oneMore from './oneMore.mp3'
import endTalk from './endTalk.mp3'
import endSession from './endSession.mp3'

// global variable
window.AudioContext = window.AudioContext || window.webkitAudioContext
var context
var clock

const version = (packageJSON.homepage + packageJSON.subversion).slice(-10)
const homepage = 'https://goto920.github.io/presentationTimer.html'

class App extends Component {
  constructor (props) {
    super(props)

    this.state = {
      timerState: 'initial', // 'initial', 'running', 'paused'
      timerString: '00:00',
      timerStyle: {color: 'black'}
    }

    this.params = {
      presentationTime: 5, // default min
      qAndATime: 3, // default min
      beginTime: 0, // in sec
      pausedAt: 0, // in sec
      sound: 'voice' // 'bell', 'voice', 'mute'
    }
 
    this.handleUI = this.handleUI.bind(this) 
    this.handleWindowClose = this.handleWindowClose.bind(this)
    this.processTimer = this.processTimer.bind(this)
    this.playSound = this.playSound.bind(this)

    this.state.timerString = ('00' + this.params.presentationTime).slice(-2)
       + ':00' 
    this.timerEvent = null
    this.soundList = []
  }

 // componentWillMount () { // before render()
 // }

  componentDidMount () {
    window.addEventListener('beforeunload', this.handleWindowClose)
    context = new window.AudioContext()
    let inputFiles = []
    inputFiles[0] = bell 
    inputFiles[1] = oneMore 
    inputFiles[2] = endTalk
    inputFiles[3] = endSession

    let bufferLoader = new BufferLoader(
      context, inputFiles, function(bufferList) {
        this.soundList[0] = bufferList[0] 
        this.soundList[1] = bufferList[1] 
        this.soundList[2] = bufferList[2] 
        this.soundList[3] = bufferList[3] 
     }.bind(this)
    )
    bufferLoader.load()

    clock = new WAAClock(context)
    clock.start()
  }

  componentWillUnMount () {
    window.removeEventListener('beforeunload', this.handleWindowClose)
  }
 
  render() {

    const color = {color: this.state.timerStyle.color}
    const timerString = this.state.timerString
    let startButtonStr

    if (this.state.timerState === 'initial') 
      startButtonStr = 'Start'
    else if (this.state.timerState === 'paused') 
      startButtonStr = 'Cont.'
    else if (this.state.timerState === 'running') 
      startButtonStr = 'Pause'
    else console.log('timerState error')

    return (
      <div className='presentimer'>
      <h3>Presentation Timer</h3>
      <hr/>
      {/* <SetTimerColor /> */}
      <div className='timebox' style={color}>{timerString}</div>
      <hr/>
      <span className='redbutton'>
      <button name='startStop' onClick={this.handleUI}>{startButtonStr}</button>
      </span>
      &nbsp; &nbsp;
      <span className='redbutton'>
      <button name='reset' onClick={this.handleUI}>Reset</button></span>
      <hr/>
      <span className='selector'>
      Presentation (min): &nbsp; 
      <select name='presenTime' 
         defaultValue={this.params.presentationTime} onChange={this.handleUI}>
      <option value='1'>1</option>
      <option value='2'>2</option>
      <option value='3'>3</option>
      <option value='4'>4</option>
      <option value='5'>5</option>
      <option value='6'>6</option>
      <option value='7'>7</option>
      <option value='8'>8</option>
      <option value='9'>9</option>
      <option value='10'>10</option>
      <option value='15'>15</option>
      <option value='20'>20</option>
      <option value='25'>35</option>
      <option value='30'>30</option>
      <option value='40'>40</option>
      <option value='45'>45</option>
      <option value='50'>50</option>
      <option value='55'>55</option>
      <option value='60'>60</option>
      <option value='70'>70</option>
      <option value='80'>80</option>
      <option value='90'>90</option>
      </select>
      <br/>
      Q and A (min): &nbsp;
      <select name='qAndATime' defaultValue={this.params.qAndATime} 
        onChange={this.handleUI}>
      <option value='1'>1</option>
      <option value='2'>2</option>
      <option value='3'>3</option>
      <option value='4'>4</option>
      <option value='5'>5</option>
      <option value='6'>6</option>
      <option value='7'>7</option>
      <option value='8'>8</option>
      <option value='9'>9</option>
      <option value='10'>10</option>
      <option value='15'>15</option>
      <option value='20'>20</option>
      </select>
      </span>
      <br/>
      Sound: 
       <span className='radioButton'>
       <input type='radio' name='alarmSound' value='bell' 
           onChange={this.handleUI}/>Bell, 
       <input type='radio' name='alarmSound' value='voice' 
           defaultChecked='true' onChange={this.handleUI}/>Voice,
       <input type='radio' name='alarmSound' value='mute' 
           onChange={this.handleUI}/>Mute
       </span>
      <br/>
      <hr/>
      Version: {version}, <a href={homepage} target='_blank'>Manual/Update</a>
      </div>
    );
  }

  handleUI (event) {
    if (event.target.name === 'startStop'){

      if (this.state.timerState === 'running'){ // stop
        this.params.pausedAt = context.currentTime - this.params.beginTime
        this.timerEvent.clear()
        this.setState({timerState: 'paused'})
      } else if (this.state.timerState === 'initial') { // start
        this.params.beginTime = context.currentTime
        this.timerEvent = clock.callbackAtTime(function (event) {
        this.processTimer()
         }.bind(this), context.currentTime)
        .repeat(1.0)
        .tolerance({early: 0.1, late: 0.1})
        this.setState({timerState: 'running'})
      } else if (this.state.timerState === 'paused') { // continue
        this.params.beginTime = context.currentTime 
             - this.params.pausedAt 
        this.timerEvent = clock.callbackAtTime(function (event) {
        this.processTimer()
         }.bind(this), context.currentTime + (this.params.pausedAt % 1))
        .repeat(1.0)
        .tolerance({early: 0.1, late: 0.1})
        this.setState({timerState: 'running'})
      }

      return
    }

    if (event.target.name === 'reset'){
      if (this.timerEvent !== 'undefined') this.timerEvent.clear()
      let timerStr = this.params.presentationTime + ':00' 
      this.setState({timerState: 'initial', timerString: timerStr})
      return
    }

    if (event.target.name === 'presenTime'){
      this.params.presentationTime = parseInt(event.target.value,10)
      let timerStr = this.params.presentationTime + ':00' 
      this.setState({timerString: timerStr})
      return
    }

    if (event.target.name === 'qAndATime'){
      this.params.qAndATime = parseInt(event.target.value,10)
      return
    }

    if (event.target.name === 'alarmSound'){
      this.params.sound = event.target.value
      // console.log(this.params.sound)
      return
    }

  }

  handleWindowClose (event) { // finishing clean up
    clock.stop()
    context.close()
  }

  processTimer(){
    let currentSec = context.currentTime - this.params.beginTime
    let timerStr
    let over
    let color

    if (currentSec < (this.params.presentationTime - 1)*60){
      let left = this.params.presentationTime*60 - currentSec
      timerStr = ('00' + parseInt(left/60,10)).slice(-2) 
           + ':' + ('00' + parseInt(left % 60,10)).slice(-2) 
      color = 'blue'
    } else if (currentSec < this.params.presentationTime*60){
      let left = this.params.presentationTime*60 - currentSec
      timerStr = ('00' + parseInt(left/60,10)).slice(-2) 
          + ':' + ('00' + parseInt(left % 60,10)).slice(-2) 
      color = 'orange'
    } else if (currentSec 
        <= (this.params.presentationTime
          + this.params.qAndATime)*60 ){
      over = currentSec - this.params.presentationTime*60 
      timerStr = ('+' + parseInt(over/60,10))
           + ':' + ('00' + parseInt(over % 60,10)).slice(-2) 
      color = 'green'
    } else {
      // console.log('End Q and A Time')
      over = currentSec - parseInt(this.params.presentationTime,10)*60 
      timerStr = ('++' + parseInt(over/60,10))
           + ':' + ('00' + parseInt(over % 60,10)).slice(-2) 
      color = 'red'
    }

    if (color === this.state.timerStyle.color){
      this.setState({timerString: timerStr})
    } else {
      this.setState({timerString: timerStr, timerStyle: {color: color}})

      if (this.params.sound !== 'mute'){
        if (color === 'orange') this.playSound(1)
        else if (color === 'green')  this.playSound(2)
        else if (color === 'red')  this.playSound(3)
      }
    }
  } // end of processTimer()

  playSound(phase){
    let source
    // console.log(phase)

    if (phase === 1){
      source = context.createBufferSource()
      // console.log(this.params.sound)
      if (this.params.sound === 'bell') 
        source.buffer = this.soundList[0] // bell
      else if (this.params.sound === 'voice') 
        source.buffer = this.soundList[1] // oneMore

      source.connect(context.destination)
      source.start(context.currentTime)

    } else if (phase === 2){
      // console.log(this.params.sound)
      if (this.params.sound === 'bell'){ 
        for (let i = 0; i < phase; i++){
          source = context.createBufferSource()
          source.buffer = this.soundList[0] // bell
          source.connect(context.destination)
          source.start(context.currentTime + i*0.75)
        }
      } else if (this.params.sound === 'voice'){
        source = context.createBufferSource()
        source.buffer = this.soundList[2] // End of Talk
        source.connect(context.destination)
        source.start(context.currentTime)
      }

    } else if (phase === 3){
      // console.log(this.params.sound)
      if (this.params.sound === 'bell'){
        for (let i = 0; i < phase; i++){
          source = context.createBufferSource()
          source.buffer = this.soundList[0] // bell
          source.connect(context.destination)
          source.start(context.currentTime + i*1.0)
        }
     } else if (this.params.sound === 'voice') {
       source = context.createBufferSource()
       source.buffer = this.soundList[3] // End of Session
       source.connect(context.destination)
       source.start(context.currentTime)

     }

    } else console.log('undefined phase')


  } // end of playSound()

}


export default App;
