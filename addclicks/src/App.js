import React, { Component } from 'react'
// import logo from './logo.svg';
import './App.css'
import BufferLoader from './buffer-loader'
import packageJSON from '../package.json'
import clickSound from './cowbell-mid.mp3'
// import Effector from './effector'
import ClickAll from './clickall'

const version = (packageJSON.homepage + packageJSON.subversion).slice(-10)
const homepage = 'https://goto920.github.io' + packageJSON.homepage.slice(0,-8)

window.AudioContext = window.AudioContext || window.webkitAudioContext

const audioCtx = new window.AudioContext()
const gainNode =  audioCtx.createGain()
var clickSamples = undefined

class App extends Component {
  constructor (props) {
     super(props)

     this.params = {
       inputAudio: undefined,
       currentSource: undefined
     }

     this.state = {
       startButtonStr: 'Wait'
     }

     this.loadFile = this.loadFile.bind(this)
     this.handlePlay = this.handlePlay.bind(this)

  } // end constructor

  handleWindowClose(event) { 
    audioCtx.close()
  }

  componentWillMount () { // before render()
    window.addEventListener('beforeClosing', this.handleWindowClose)
// clickSound
   let inputFiles = []
   inputFiles.push(clickSound)
   let bufferLoader = new BufferLoader(
    audioCtx, inputFiles, function (bufferList) {
      clickSamples = bufferList[0]
    }.bind(this) 
   )
   bufferLoader.load()
  }
  
  componentDidMount () { // after render()
  }

  componentWillUnmount () { // before closing app
    window.removeEventListener('beforeClosing', this.handleWindowClose)
  }


  render() {
    const {loadFile, handlePlay} = this 
    const {startButtonStr} = this.state

    return (
      <div className="App">
      Adding Click to music track by goto@kmgoto.jp
      <hr />
      Input File: <br />
        <span className='selectFile'>
        <input type='file' name='loadFile' 
        accept='audio/*' onChange={loadFile} /><br />
        </span>
            <span>
        <button name='startPause' onClick={handlePlay}> 
        {startButtonStr}
        </button> &nbsp;&nbsp;
        <button name='rewind' onClick={handlePlay}> 
        Rewind
        </button> &nbsp;&nbsp;
      </span>
      <hr />
        Version: {version}, &nbsp;
        <a href={homepage} 
         target="_blank" rel="noopener noreferrer">Manual/Update</a>

      </div>
    );
  }

  loadFile (event) {
    if (event.target.name !== 'loadFile') return
    if (event.target.files.length === 0) return

    this.setState({totalTime: 0})
    this.setState({startButtonStr: 'Wait'})
    let file = event.target.files[0]

    let reader = new FileReader()

    reader.onload = function (e) {
       audioCtx.decodeAudioData(reader.result, 
        function(audioBuffer) {
        //  console.log ("read")
          ClickAll(audioCtx,audioBuffer, clickSamples)
          this.params.inputAudio = audioBuffer
          this.setState({startButtonStr: 'Start', currentTime: 0})
        }.bind(this),
        function (error) { console.log ("Filereader error: " + error.err) })
   }.bind(this)

   reader.readAsArrayBuffer(file)


  } // end loadFile()

  handlePlay(event){
    if (event.target.name !== 'startPause') return

    if (this.state.startButtonStr === 'Start'){
      this.setState({startButtonStr: 'Pause'})
      let source = audioCtx.createBufferSource()
      source.buffer = this.params.inputAudio
/*
      let bufferSize = 1024
      let channels = 2
      let scrproc 
         = audioCtx.createScriptProcessor(bufferSize, channels, channels) 
      scrproc.onaudioprocess = Effector
      Effector.audioSample = clickSamples
      Effector.audioCtx = audioCtx
      source.connect(scrproc)
      scrproc.connect(audioCtx.destination)
      source.start()
      this.params.currentSource = source
*/
      source.connect(audioCtx.destination)
      source.start()
    }

    if (this.state.startButtonStr === 'Pause'){
      this.setState({startButtonStr: 'Resum'})
      audioCtx.suspend()
    }

    if (this.state.startButtonStr === 'Resum'){
      this.setState({startButtonStr: 'Pause'})
      audioCtx.resume()
    }

  } // end handlePlay()

}

export default App;
