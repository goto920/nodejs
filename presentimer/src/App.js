import React, { Component } from 'react';
// import logo from './logo.svg';
import './App.css';
import packageJSON from '../package.json'
import WAAClock from 'waaclock'
import BufferLoader from './buffer-loader'
import soundList from './soundList.js';

// global variable
window.AudioContext = window.AudioContext || window.webkitAudioContext
var context 
// = new window.AudioContext()
var clock 
// = undefined

const version = (packageJSON.homepage + packageJSON.subversion).slice(-10)
const homepage = 'https://goto920.github.io/demos/presentimer/'

class App extends Component {
  constructor (props) {
    super(props)

    this.state = {
      startButtonStr: 'Start',
      timerString: '00:00',
      timerStyle: {color: 'black'}
    }

    this.params = {
      presentationTime: 5, // default min
      warningTime: 1, // default 1 min before end of talk
      warningSound: null, // default 1 min before end of talk
      qAndATime: 3, // default min
      beginTime: 0, // in sec
      pausedAt: 0, // in sec
      sound: 'voice' // 'bell', 'voice', 'mute'
    }
 
    this.handleUI = this.handleUI.bind(this) 
    this.handleWindowClose = this.handleWindowClose.bind(this)
    this.processTimer = this.processTimer.bind(this)
    this.playSound = this.playSound.bind(this)

    this.state.timerString 
      = ('00' + this.params.presentationTime).slice(-2) + ':00' 
    this.timerEvent = undefined
    this.soundList = []
  }

 // componentWillMount () { // before render()
 // }

  componentDidMount () {
    window.addEventListener('beforeunload', this.handleWindowClose)
    context = new window.AudioContext()
    clock = new WAAClock(context)
    clock.start()

    let inputFiles = []
    inputFiles = soundList;

    let bufferLoader = new BufferLoader(
      context, inputFiles, function(bufferList) {
       for (let i=0; i < inputFiles.length; i++)
       this.soundList[i] = bufferList[i] 
     }.bind(this)
    )
    bufferLoader.load()
  }

  componentWillUnmount () {
    window.removeEventListener('beforeunload', this.handleWindowClose)
    context.close()
  }
 
  render() {

    const color = {color: this.state.timerStyle.color}
    const {timerString, startButtonStr} = this.state

    return (
      <div className='presentimer'>
      <h3>Presentation Timer</h3>
      <hr/>
      {/* <SetTimerColor /> */}
      <div className='timebox' style={color}>{timerString}</div>
      <hr/>
      <span className='redbutton'>
      <button name='startStop' value={startButtonStr}
                onClick={this.handleUI}>{startButtonStr}</button>
      </span>
      &nbsp; &nbsp;
      <span className='redbutton'>
      <button name='reset' onClick={this.handleUI}>Reset</button></span>
      <hr/>
      <span className='selector'>
      Presentation talk(min): &nbsp; 
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
      Warning: &nbsp;
      <select name='warningTime' 
         defaultValue={this.params.warningTime} onChange={this.handleUI}>
      <option value='0'>none</option>
      <option value='1'>1</option>
      <option value='2'>2</option>
      <option value='3'>3</option>
      <option value='4'>4</option>
      <option value='5'>5</option>
      <option value='10'>10</option>
      <option value='15'>15</option>
      <option value='20'>20</option>
      </select> 
      &nbsp; minute(s) more
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
      Sound alarm: <br/> 
       <span className='radioButton'>
       <input type='radio' name='alarmSound' value='cowbell_mid' 
           onChange={this.handleUI}/>Cowbell_mid, 
       <input type='radio' name='alarmSound' value='cowbell_high' 
           onChange={this.handleUI}/>Cowbell_high, 
       <input type='radio' name='alarmSound' value='rideCup' 
           onChange={this.handleUI}/>RideCup, <br/>
       <input type='radio' name='alarmSound' value='church' 
           onChange={this.handleUI}/>Church, 
       <input type='radio' name='alarmSound' value='hotel' 
           onChange={this.handleUI}/>Hotel, 
       <input type='radio' name='alarmSound' value='voice' 
           defaultChecked onChange={this.handleUI}/>Voice,
       <input type='radio' name='alarmSound' value='mute' 
           onChange={this.handleUI}/>Mute
       </span>
      <br/>
      <hr/>
      Version: {version}, 
       <a href={homepage} target="_blank" 
       rel="noopener noreferrer">Manual/Update</a>
      </div>
    );
  }

  handleUI (event) {

    if (event.target.name === 'startStop'){

      switch (this.state.startButtonStr){

        case 'Start':
          if (context.state === 'suspended') context.resume()
          this.setState({timerStyle: {color: 'blue'}})
          this.params.beginTime = context.currentTime

          this.timerEvent = clock.callbackAtTime(function (event) {
            this.processTimer() 
          }.bind(this), context.currentTime)
          .repeat(1.0)
          .tolerance({early: 0.1, late: 0.1})
          this.setState({startButtonStr: 'Pause'})
        break;

        case 'Pause':
          if (context.state === 'running') context.suspend()
          this.setState({startButtonStr: 'Cont.'})
        break;

        case 'Cont.':
          if (context.state !== 'running') context.resume()
          this.setState({startButtonStr: 'Pause'})
        break;
        default:
      }

      return
    }

    if (event.target.name === 'reset'){
      if (this.timerEvent !== undefined) this.timerEvent.clear()
      let timerStr = this.params.presentationTime + ':00' 
      timerStr = ('00' + this.params.presentationTime).slice(-2) + ':00'
      this.setState({startButtonStr: 'Start', timerString: timerStr,
         timerStyle: {color: 'black'}})
      if (context.state === 'running') context.suspend()
      return
    }

    if (event.target.name === 'presenTime'){
      this.params.presentationTime = parseInt(event.target.value,10)
      let timerStr = ('00' + this.params.presentationTime).slice(-2) + ':00'
      this.setState({timerString: timerStr})
      return
    }

    if (event.target.name === 'warningTime'){
      this.params.warningTime = parseInt(event.target.value,10)
      if (this.params.warningTime >= this.params.presentationTime)
         this.params.warningTime = 0 // none
      return
    }

    if (event.target.name === 'qAndATime'){
      this.params.qAndATime = parseInt(event.target.value,10)
      return
    }

    if (event.target.name === 'alarmSound'){
      this.params.sound = event.target.value
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

    if (currentSec 
       <= (this.params.presentationTime - this.params.warningTime)*60){
      let left = this.params.presentationTime*60 - currentSec
      timerStr = ('00' + parseInt(left/60,10)).slice(-2) 
           + ':' + ('00' + parseInt(left % 60,10)).slice(-2) 
      if (parseInt(left - this.params.warningTime*60) === 0){
         this.playSound(1)
         this.setState({timerStyle: {color: 'orange'}})
      }
    } else if (currentSec <= this.params.presentationTime*60){
      let left = this.params.presentationTime*60 - currentSec
      timerStr = ('00' + parseInt(left/60,10)).slice(-2) 
          + ':' + ('00' + parseInt(left % 60,10)).slice(-2) 
      if (parseInt(left) === 0) {
        this.playSound(2)
        this.setState({timerStyle: {color: 'green'}})
      }
    } else if (currentSec 
        <= (this.params.presentationTime + this.params.qAndATime)*60 ){
      over = currentSec - this.params.presentationTime*60 
      timerStr = ('+' + parseInt(over/60,10))
           + ':' + ('00' + parseInt(over % 60)).slice(-2) 
      if (parseInt(over - this.params.qAndATime*60) === 0){
        this.playSound(3)
        this.setState({timerStyle: {color: 'red'}})
      }
    } else {
      // console.log('End Q and A Time')
      over = currentSec - parseInt(this.params.presentationTime,10)*60 
      timerStr = ('++' + parseInt(over/60,10))
           + ':' + ('00' + parseInt(over % 60,10)).slice(-2) 
    }

    this.setState({timerString: timerStr })

  } // end of processTimer()

  playSound(phase){

    if (this.params.sound === 'Mute') return;

    let sound
    switch (this.params.sound){
      case 'cowbell_mid': sound = this.soundList[0]; break;
      case 'cowbell_high': sound = this.soundList[1]; break;
      case 'rideCup': sound = this.soundList[2]; break;
      case 'church': sound = this.soundList[3]; break;
      case 'hotel': sound = this.soundList[4]; break;
      default:
        sound = null;
    }

    switch (this.params.warningTime){ // x more minutes
      case 0: this.params.warningSound = null; break;
      case 1: this.params.warningSound = this.soundList[5]; break;
      case 2: this.params.warningSound = this.soundList[6]; break;
      case 3: this.params.warningSound = this.soundList[7]; break;
      case 4: this.params.warningSound = this.soundList[8]; break;
      case 5: this.params.warningSound = this.soundList[9]; break;
      case 10: this.params.warningSound = this.soundList[10]; break;
      case 15: this.params.warningSound = this.soundList[11]; break;
      case 20: this.params.warningSound = this.soundList[12]; break;
      default: this.params.warningSound = null;
    }
  
    let source
    if (phase === 1){
      source = context.createBufferSource()
      if (this.params.sound === 'voice')
        source.buffer = this.params.warningSound // X more minutes
      else source.buffer = sound

      source.connect(context.destination)
      source.start();
      return
    } 

    if (phase === 2){

      if (this.params.sound === 'voice'){
        source = context.createBufferSource()
        source.buffer = this.soundList[13] // End of Talk
        source.connect(context.destination)
        source.start();
      } else {
        for (let i = 0; i < 2; i++){
          source = context.createBufferSource()
          source.buffer = sound // bell
          source.connect(context.destination)
          source.start(context.currentTime + i*1.5)
        }
      }
      return
    }

    if (phase === 3){
      if (this.params.sound === 'voice') {
        source = context.createBufferSource()
        source.buffer = this.soundList[14] // End of Session
        source.connect(context.destination)
        source.start();
      } else {
        for (let i = 0; i < 3; i++){
          source = context.createBufferSource()
          source.buffer = sound
          source.connect(context.destination)
          source.start(context.currentTime + i*1.5)
        }
     }
    return
   } // end phase 2

   return
  } // end of playSound()

}

export default App;
