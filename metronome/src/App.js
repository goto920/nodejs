import React, { Component } from 'react'
import './Metronome.css'
import BufferLoader from './buffer-loader'
import WAAClock from 'waaclock'
import messages from './language.json'
import packageJSON from '../package.json'
import loadedSetListSample from './setListSample.json'
import drumPatterns from './drumPatterns.json'
import loadedPresets from './presets.json'

// global variable
window.AudioContext = window.AudioContext || window.webkitAudioContext
var context
// const context = new window.AudioContext()
// const clock = new WAAClock(context)
var clock
// const timerClock = new WAAClock(context)
var timerClock
// const gainNode = context.createGain()
var gainNode = []

const version = (packageJSON.homepage + packageJSON.subversion).slice(-10)
 // define in package.json
// const early = 0.1
const early = 0.1
const late = 1.0
const jaText = messages.ja
const usText = messages.us
var m = usText

// clock.start()
// timerClock.start()

class App extends Component {
  constructor (props) {
    super(props)

    this.params = {
      minBpm: 30.0,
      maxBpm: 360.0,
      default_presetNo: 7,
      default_drumPatternNo: 0,
      timer: 0,
      barTimer: 0,
      muteBars: 0,
      muteProb: 0.0,
      muteCount: 0,
      muteStat: false,
      metro: {numerator: 4, denominator: 4, 
              triplet: false, pattern: [], notes: [], count: 0,voice: false},
      drums: {numerator: 4, denominator: 4, 
              triplet: false, pattern: {}, notes: [], count: 0,voice: false},
      drumPattern: {},
      notesInPattern: [],
      maleVoice: [],
      femaleVoice: [],
      swing: false,
      count: 0,
      barCount: 0,
      startTime: 0,
      newListName: '',
      newSongName: ''
    }

    this.timerEvent = 0
    this.timeOutEvent = 0

    this.state = {
      ja: false,
      rest: 0,
      restBars: 0,
      playing: false,
      cowbell: [],
      maleVoice: [],
      femaleVoice: [],

      bpm: 100,
      bpmFrac: 0.0,
      metroOn: true,
      presetNo: this.params.default_presetNo, // default 4/4
      metroSound: 'cb3',
      drumsOn: false,
      drumPatternNo: this.params.default_drumPatternNo,
      voiceOn: false,
      voice: 'male',
      swingVal: 1.5,
      evenVol: 1.0,
      increment: 0,
      perBars: 0,


      showMore: false,
      showAdvanced: false,
      showSetLists: false,
      showCustomLoop: false,
      showSongList: false,

      loopTable: [],
      newRow: {presetNo: this.params.default_presetNo,
        swingVal: 1.5, repeat: 4},
      loopStat: {playing: false, seq: 0, repeat: 0, bar: 0},
      setLists: [],
      selectedSetList: {},
      selectedSong: {name: 'none'} // default
    } // end params

    this.setState = this.setState.bind(this)
    this.startStop = this.startStop.bind(this)
    this.startStopDrums = this.startStopDrums.bind(this)
    this.customPlay = this.customPlay.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handleSetLists = this.handleSetLists.bind(this)
    this.handleTable = this.handleTable.bind(this)
    this.playClick = this.playClick.bind(this)
    this.playPattern = this.playPattern.bind(this)
    this.findSamplesByName = this.findSamplesByName.bind(this)
    this.findCountSamples = this.findCountSamples.bind(this)
    this.nextTick = this.nextTick.bind(this)
    this.handleWindowClose = this.handleWindowClose.bind(this)
    this.saveSetLists = this.saveSetLists.bind(this)

    this.tickEvents = []

/* Example is in sampleTable.json */

    this.tap = {
      count: 0,
      msecsFirst: 0,
      msecsPrevious: 0
    }

    this.notes = [
/* drumkit samples */
/*00*/  {name: 'hihatClose', sample: null}, // filename is hihat.mp3
        {name: 'hihatHalfOpen', sample: null},
        {name: 'hihatFullOpen', sample: null},
        {name: 'snare', sample: null},
        {name: 'snareRim', sample: null},
        {name: 'bass', sample: null},
        {name: 'highTom', sample: null},
        {name: 'midTom', sample: null},
        {name: 'lowTom', sample: null},
        {name: 'crash', sample: null},
/*10 */ {name: 'ride', sample: null},
        {name: 'highConga', sample: null},
        {name: 'midConga', sample: null},
        {name: 'lowConga', sample: null},
        {name: 'cowbell-tr808', sample: null},
        {name: 'clave', sample: null},
        {name: 'handClap', sample: null},
        {name: 'maracas', sample: null},
/* metronome samples */
        {name: 'cowbell-higher', sample: null},
        {name: 'cowbell-high', sample: null},
        {name: 'cowbell-mid', sample: null},
/*20*/  {name: 'cowbell-low', sample: null},
        {name: 'cowbell-lower', sample: null},
        {name: 'male-one', sample: null},
        {name: 'male-two', sample: null},
        {name: 'male-three', sample: null},
        {name: 'male-four', sample: null},
        {name: 'male-five', sample: null},
        {name: 'male-six', sample: null},
        {name: 'male-seven', sample: null},
        {name: 'male-eight', sample: null},
        {name: 'female-one', sample: null},
        {name: 'female-two', sample: null},
        {name: 'female-three', sample: null},
        {name: 'female-four', sample: null},
        {name: 'female-five', sample: null},
        {name: 'female-six', sample: null},
        {name: 'female-seven', sample: null},
        {name: 'female-eight', sample: null}
    ]

  } // end constructor

  componentWillMount () { // before render()
    // console.log('componentWillMount()')
    // localStorage.removeItem('savedSetLists') // for test
    const savedSetLists = JSON.parse(localStorage.getItem('savedSetLists'))

    if (savedSetLists === null) {
      // console.log('savedSetLists null')
      this.params.setLists.push({name: 'default', items: []}, loadedSetListSample)
    } else {
      console.log('savedSetLists loaded items = ' + savedSetLists.length)
      for (let i = 0; i < savedSetLists.length; i++) { 
         this.params.setLists.push(savedSetLists[i]) }
      this.params.setLists.push(loadedSetListSample)
//    console.log(JSON.stringify(this.params.setLists))
    }
//    console.log(JSON.stringify(this.params.setLists[0]))
    this.setState({selectedSetList: this.params.setLists[0]})
  }

  componentDidMount () {
    window.addEventListener('beforeunload', this.handleWindowClose)
    context = new window.AudioContext()

    for (let i=0; i < 8; i++)
      gainNode[i] = context.createGain()

    let inputFiles = []
    for (let i=0; i < this.notes.length; i++){
      inputFiles[i] = this.notes[i].name + '.mp3'
      // console.log(inputFiles[i])
    }

    let bufferLoader = new BufferLoader(
      context, inputFiles,
      function (bufferList) {
        for (let i=0; i < this.notes.length; i++)
          this.notes[i].sample = bufferList[i]
        this.findCountSamples()
      }.bind(this)
    )

    bufferLoader.load()

    clock = new WAAClock(context)
    timerClock = clock
    clock.start()
  }

  componentWillUnMount () {
    window.removeEventListener('beforeunload')
  }

  saveSetLists () {
    if (this.params.setLists.length > 0) {
      let saveLists = []
      for (let i = 0; i < this.params.setLists.length; i++) {
        if (this.params.setLists[i].name !== 'sample') { saveLists.push(this.params.setLists[i]) }
      }
      // console.log('save ' + saveLists.length + ' items')
      if (saveLists.length > 0) {
        localStorage.setItem('savedSetLists', JSON.stringify(saveLists))
      }
    }
  }

  render () {
    const {ja, loopTable, newRow, loopStat,
      metroOn,presetNo,metroSound,drumsOn,drumPatternNo,
      voiceOn, voice,
      playing, bpm, bpmFrac,
      rest, restBars, swingVal, evenVol, showMore,
      showAdvanced, showSetLists, showSongList,
      showCustomLoop, selectedSetList, selectedSong} = this.state

    const {minBpm, maxBpm, setLists} = this.params

    const {startStop,startStopDrums,customPlay, handleChange,
           handleTable, handleSetLists} = this

    const presetOptions = loadedPresets.map((e, index) => {
      return (<option value={index} key={index}>
        {('0' + index).slice(-2)}: {e.name}</option>)
    })

    const drumPatternOptions = drumPatterns.map((e, index) => {
      return (<option value={index} key={index}>
        {('0' + index).slice(-2)}: {e.name}</option>)
    })

/* Set swing value select options */
    const swingValOptions = [
      {val: 5}, {val: 6}, {val: 7}, {val: 8}, {val: 9}, {val: 10},
      {val: 15, comm: '(Str)'},
      {val: 16}, {val: 17}, {val: 18, comm: '(Lt)'},
      {val: 19}, {val: 20, comm: '(Swg)'},
      {val: 21}, {val: 22, comm: '(Hvy)'},
      {val: 23}, {val: 24}, {val: 25}
    ]
    const SwingValOptions = swingValOptions.map(function (e, index) {
      return (<option key={index} value={e.val}>{e.val / 10}{e.comm}</option>)
    })
    /* increment options */
    const incrementOptions = [
      -10, -9, -8, -7, -6, -5, -4, -3, -2, -1,
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
    ]
    const IncrementOptions = incrementOptions.map(function (e, index) {
      return (<option key={index} value={e}>{e}</option>)
    })

    /* SetList UI (conditionally shown) */
    let setListsOptions = []
    for (let i = 0; i < setLists.length; i++) { setListsOptions.push(i) }

    const SetListsOptions = setListsOptions.map(function (e, index) {
      return (
        <option key={index} value={'move:' + e}>
         move after {('00' + e).slice(-2)}</option>)
    })

    const setListsRows = setLists.map(function (e, index) {
      return (<tr key={'tr:' + index}>
        <td align='right'>
          <select name={'selectList:' + index} onChange={handleSetLists}>
            <option key='none' value='none'>({m.selectOp})</option>
            <option key='select' value='select'>select this</option>
            <option key='top' value='top'>move to top</option>
            {SetListsOptions}
            <option key='delete' value='delete'>delete this</option>
          </select></td>
        <td align='right'>{('00' + index).slice(-2)}</td>
        <td align='left'>{e.name}</td>
      </tr>)
    })

    function SetListUI (props) {
      return (<div className='table'>
        <table border='3'>
          <tbody>
            <tr><th>sel/mov/del</th><th>seq</th><th>list name</th></tr>
            {setListsRows}
            <tr>
              <td align='right' className='radioButton'>add
          <input name='addList' type='radio'
            checked={false} onChange={handleSetLists} /></td>
              <td align='right'>new</td>
              <td align='left'>
                <span className='text'>
                  <input type='text' name='newList'
                    autoFocus={false} onChange={handleSetLists} />
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>)
    }

    /* songList */
    let songListOptions = []

    for (let i = 0; i < selectedSetList.items.length; i++) { songListOptions.push(i) }

    const SongListOptions = songListOptions.map(function (e, index) {
      return (
        <option key={index} value={'move:' + e}>
          move after {('00' + e).slice(-2)}</option>)
    })

    const SongListRows = selectedSetList.items.map(function (e, index) {
      return (<tr key={'tr:' + index}>
        <td align='right'>
          <select name={'selectSong:' + index} onChange={handleSetLists}>
            <option key='none' value='none'>({m.selectOp})</option>
            <option key='select' value='select'>select this</option>
            <option key='top' value='top'>move to top</option>
            {SongListOptions}
            <option key='delete' value='delete'>delete this</option>
          </select></td>
        <td align='right'>{('00' + index).slice(-2)}</td>
        <td align='left' width='150'>{e.song}</td>
        <td align='right'>{e.bpm}</td>
        <td align='right'>{e.type}</td>
      </tr>)
    })

    function SongListUI (props) {
      return (<div className='table'>
        <table border='3'>
          <tbody>
            <tr><th>sel/mov/del</th><th>seq</th>
              <th>song name</th><th>bpm</th>
              <th>type</th></tr>
            {SongListRows}
            <tr>
              <td align='center' className='radioButton'>add current<br />
         preset<input name='addSong'
           type='radio' checked={false} value='preset'
           onChange={handleSetLists} /><br />
         or loop<input name='addSong' type='radio' value='loop'
           checked={false} onChange={handleSetLists} />
              </td>
              <td align='right'>new</td>
              <td align='left' className='text'><input name='newSong'
                type='text' onChange={handleSetLists} /></td>
              <td align='right'>{Math.floor(bpm) + parseFloat(0.1 * bpmFrac, 10)}</td>
              <td>(choose)</td>
            </tr>
          </tbody>
        </table>
      </div>)
    }

    function AdvancedUI (prop) {
      return (<span>
        {m.swing}: &nbsp;
        <span className='selector'>
          <select name='swing' value={parseInt(swingVal * 10, 10)}
            onChange={handleChange}>{SwingValOptions}</select>
        </span>
        {m.swingStr}
        <br />
        <span className='selector'>
          {m.increment}: &nbsp;
       <select name='increment' defaultValue='0'
         onChange={handleChange}>{IncrementOptions}
       </select> bpm
       </span>
         /
        <span className='selector'>
          <select name='perBars' defaultValue='0' onChange={handleChange}>
            <option value='0'>off</option> <option value='1'>1</option>
            <option value='2'>2</option> <option value='4'>4</option>
            <option value='8'>8</option> <option value='12'>12</option>
            <option value='16'>16</option>
          </select>
          {m.perBars}</span><br />
        <span className='selector'>
          {m.muteBars}: &nbsp;
         <select name='muteBars' defaultValue='0' onChange={handleChange}>
           <option value='0'>off</option> <option value='1'>1</option>
           <option value='2'>2</option> <option value='4'>4</option>
           <option value='8'>8</option> <option value='12'>12</option>
           <option value='16'>16</option>
         </select>
        </span>
        {m.muteProb1}
        {m.muteProb2}
        <span className='selector'>
          <select name='muteProb' defaultValue='0' onChange={handleChange}>
            <option value='0.0'>0.0</option> <option value='0.1'>0.1</option>
            <option value='0.2'>0.2</option> <option value='0.3'>0.3</option>
            <option value='0.4'>0.4</option> <option value='0.5'>0.5</option>
            <option value='0.6'>0.6</option> <option value='0.7'>0.7</option>
            <option value='0.8'>0.8</option> <option value='0.9'>0.9</option>
            <option value='1.0'>1.0</option>
          </select>
        </span>
        <br />
        <span className='slider'>
          {m.evenNotes}: {evenVol.toFixed(2)} <input type='range' name='evenVol'
            min='0.0' max='1.0' value={evenVol} step='0.01'
            onChange={handleChange} />
        </span>
      </span>)
    } // end AdvancedUI

/*
    function DrumsUI(props){
      return(<span>Not implemented yet</span>)
    }
*/

 /* Custom Loop UI (conditinally shown) */
    const loopTableRows = loopTable.map(function (e, index) {
      return (<tr key={index}>
        <td align='right' className='radioButton'>
          d<input type='radio' name='loopDel' value={index}
            checked={false} onChange={handleTable} /></td>
        <td align='right'>{index}</td>
        <td align='right'>{e.preset.value}</td>
        <td align='right'>{e.swingVal.toFixed(1)}</td>
        <td align='right'>{e.repeat}</td>
      </tr>)
    })

    const repeatOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
    const RepeatOptions = repeatOptions.map(function (e, index) {
      return (<option key={index} value={e}>{e}</option>)
    })

    function CustomLoopUI (props) {
      return (<div>
      --- seq/rep/bar: {('00' + loopStat.seq).slice(-2)}
               /{('00' + loopStat.repeat).slice(-2)}
               /{('00' + loopStat.bar).slice(-3)}
        <br />
        <b>{m.d_a}</b>&nbsp;
        <span>
          <button name='startLoop' onClick={customPlay}>
            {loopStat.playing ? 'Stop' : 'Start'}</button></span>
        / <span className='loopButton'>
          <button name='rewindLoop' onClick={customPlay}>
            {m.rewind}</button>
        </span>
        <br />
        <div className='table'>
          <table border='3'>
            <tbody>
              <tr><th>d/a</th><th>seq</th>
                <th>preset beat</th><th>swing</th><th>repeat</th></tr>
              {loopTableRows}
              <tr><td align='right' className='radioButton'>
     a<input type='radio' name='loopAdd' checked={false}
       onChange={handleTable} /></td>
                <td align='right'>add</td>
                <td align='right' className='selector'>
                  <select name='loopAddPreset' value={newRow.presetNo}
                    onChange={handleTable}>
                    {presetOptions}</select></td>
                <td align='right' className='selector'>
                  <span><select name='loopSwingVal'
                    value={parseInt(newRow.swingVal * 10, 10)}
                    onChange={handleTable}>
                    {SwingValOptions}</select>
                  </span></td>
                <td align='right' className='selector'><span>
                  <select name='loopRepeat'
                    defaultValue={newRow.repeat}
                    onChange={handleTable}>{RepeatOptions}</select>
                </span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>)
    }

/// //////////// UI menus
    return (
      <div className='metronome'>
      KG's JS_Metronome &nbsp; <font color='blue'>Lang: </font>
        <span className='small-button'>
          <button name='language' onClick={handleChange}>
            {ja ? 'US' : 'JP'} </button>&nbsp;
        </span>
        Play: <button name='startStop' onClick={startStopDrums}>
        {playing ? 'Stop' : 'Start'}</button>
        <hr />
        <span className='selector'>
          <input name='metroOn' type='checkbox'
          checked={metroOn} onChange={handleChange} />
          {m.metronome}: <select name='preset' value={presetNo}
            onChange={handleChange}>
            {presetOptions}
          </select>
        </span> &nbsp;
        {m.sound}:&nbsp;
        <span className='selector'>
          <select name='metroSound' value={metroSound} onChange={handleChange}>
            <option value='cb1'>cowbell1</option>
            <option value='cb2'>cowbell2</option>
            <option value='cb3'>cowbell3</option>
            <option value='cb4'>cowbell4</option>
            <option value='cg'>conga</option>
            <option value='cv'>clave</option>
            <option value='hc'>handClap</option>
          </select>
        </span>
        <br />
        <span className='selector'>
          <input type='checkbox' name='drumsOn' 
          checked={drumsOn} onChange={handleChange} />
          {m.drums}: <select name='drumPattern' value={drumPatternNo}
            onChange={handleChange}>
            {drumPatternOptions}
          </select>
        </span>&nbsp;
        <input type='checkbox' name='voiceOn' 
           checked={voiceOn} onChange={handleChange} />
        {m.voice}: <select name='voice' value={voice} onChange={handleChange}>
            <option value='male' >male</option>
            <option value='female'>female</option>
          </select>
        <hr />
        <span className='number'>
        BPM({minBpm}-{maxBpm}): &nbsp; {('0' + Math.floor(bpm)).slice(-3)}.
        <span className='selector'>
          <select name='bpmFrac' value={bpmFrac}
            onChange={handleChange}>
            <option value='0'>0</option> <option value='1'>1</option>
            <option value='2'>2</option> <option value='3'>3</option>
            <option value='4'>4</option> <option value='5'>5</option>
            <option value='6'>6</option> <option value='7'>7</option>
            <option value='8'>8</option> <option value='9'>9</option>
          </select></span>
        &nbsp; &nbsp; &nbsp; &nbsp;
        </span>
        <span className='small-button'>
          <button name='tempo_tap' onClick={handleChange}>
            {m.tap}</button></span>&nbsp;
        <br />
        <span className='bpm-slider'>
          <input type='range' name='bpm_slider'
            min={minBpm} max={maxBpm} value={bpm} step='1.0'
            onChange={handleChange} />
        </span> <hr />
        {m.timer}: &nbsp;
     <span className='selector'>
       {('00' + rest).slice(-3)}/
     <select name='timer' defaultValue='0' onChange={handleChange}>
       <option value='0'>off</option> <option value='30'>30</option>
       <option value='60'>60</option> <option value='90'>90</option>
       <option value='120'>120</option> <option value='180'>180</option>
       <option value='240'>240</option> <option value='300'>300</option>
       <option value='600'>600</option> </select>({m.secs}),
     </span>
        <span className='selector'>
          {('00' + restBars).slice(-3)}/
  <select name='barTimer' defaultValue='0' onChange={handleChange}>
    <option value='0'>off</option> <option value='12'>12</option>
    <option value='16'>16</option> <option value='24'>24</option>
    <option value='32'>32</option> <option value='64'>64</option>
    <option value='128'>128</option> <option value='256'>256</option>
  </select> ({m.bars})</span><hr />
    {m.moreFeatures}: <span className='loopButton'>
       <button name='showMore' onClick={handleChange}>
       {showMore ? m.hide : m.show} {/* no {} for m.hide,show */}
       </button></span>

        {showMore ? (<span><hr />
        {m.advanced}: <span className='loopButton'>
         <button name='advancedUI' onClick={handleChange}>
         {showAdvanced ? m.hide : m.show} {/* no {} for m.hide,show */}
         </button></span>
         {showAdvanced ? (<span><AdvancedUI /></span>) : ''}
        <hr /><span className='loopButton'>
        {m.SetLists}: <button name='setListsUI' onClick={handleChange}>
            {showSetLists ? m.hide : m.show} {/* no {} for m.hide,show */}
          </button></span>
        &nbsp; <span className='loopButton'>
        {m.SongList}: <button name='songListUI' onClick={handleChange}>
            {showSongList ? m.hide : m.show} {/* no {} for m.hide,show */}
          </button>
        </span><br />
        {m.Current}: <b>(List) {selectedSetList.name} :
        (Song) {selectedSong.song} :
        (type) {selectedSong.type} :
        (bpm) {selectedSong.bpm}</b><br />
        {showSetLists ? <SetListUI /> : ''}
        {showSongList ? <SongListUI /> : ''}
        <hr />
        <span className='loopButton'>
          {m.custom}: <button name='customLoopUI' onClick={handleChange}>
            {showCustomLoop ? m.hide : m.show} {/* no {} for m.hide,show */}
          </button></span>
        <br />{showCustomLoop ? <CustomLoopUI /> : ''}

      </span>) : ''}
     
      <hr />
      (Version: {version}) <a href={m.url} target='_blank'>{m.guide}</a><br />
      Additional feature coming: Sound variation
      <hr />
      </div>
    )
  } // end render()

  customPlay (event) {
    const {loopTable} = this.state
    let {loopStat} = this.state
    if (loopTable.length <= 0) return

    if (event.target.name === 'startLoop') {
      this.startStop({target: {name: 'stop'}}) // stop the metronome

      if (loopStat.playing) {
//        console.log('stopLoop')
        this.customPlay({target: {name: 'stop'}})
      } else {
//        console.log('startLoop')
        loopStat.seq = 0
        loopStat.bar = 0
        loopStat.repeat = 1
        this.setState({loopStat: loopStat})
        this.customPlay({target: {name: 'start'}})
        loopStat.playing = true
      }
      this.setState({loopStat: loopStat})

      return
    }

    if (event.target.name === 'rewindLoop') {
//      console.log('rewindLoop')
      this.customPlay({target: {name: 'stop'}})
      loopStat.seq = 0
      loopStat.repeat = 0
      loopStat.bar = 0
      this.setState({loopStat: loopStat})
      return
    }

    if (event.target.name === 'stop') {
      for (let beat = 0; beat < this.tickEvents.length; beat++) { this.tickEvents[beat].clear() }
      loopStat.playing = false
      this.setState({loopStat: loopStat})
      return
    }

    if (event.target.name === 'start') {
      this.customPlay({target: {name: 'nextBar'}})
      return
    }

    if (event.target.name === 'nextBar') {
//      console.log('nextBar: ' + loopStat.bar)

      if (loopStat.bar === 0 ||
         loopStat.repeat === loopTable[loopStat.seq].repeat) { // next seq
        if (loopStat.bar > 0) loopStat.seq++
        if (loopStat.seq === loopTable.length) loopStat.seq = 0

        loopStat.repeat = 1
        let {preset, swingVal} = loopTable[loopStat.seq]
        this.params.numerator = preset.numerator
        this.params.denominator = preset.denominator
        this.params.triplet = preset.triplet
        if (parseInt(swingVal * 10, 10) !== 15) {
          this.setState({swingVal: swingVal})
          this.params.swing = true
        } else {
          this.setState({swingVal: 1.5})
          this.params.swing = false
        }
      } else loopStat.repeat++

      if (loopStat.bar === 0) { this.params.startTime = context.currentTime } else { this.params.startTime = this.params.nextTick }

      this.params.count = 0
      let event
      for (let beat = 0; beat < this.params.numerator; beat++) {
        event = clock.callbackAtTime(
          function (event) {
            this.playClick(event.deadline)
            // this.playPattern(event.deadline)
          }.bind(this),
          this.nextTick(beat)
        ).tolerance({early: early, late: late}) // tight early tolerance
        this.tickEvents[beat] = event
      } // end for

      this.params.nextTick = this.nextTick(this.params.numerator) // next
      loopStat.bar++
      this.setState({loopStat: loopStat})
    } // end nextBar
  }

  handleTable (event) {
    let {newRow, loopTable} = this.state

    if (event.target.name === 'loopDel') {
      loopTable.splice(event.target.value, 1)
      this.setState({loopTable: loopTable})
      return
    }

    if (event.target.name === 'loopAdd') {
      loopTable.push(
        {preset: loadedPresets[newRow.presetNo],
          presetNo: newRow.presetNo,
          presetVal: loadedPresets[newRow.presetNo].value,
          swingVal: newRow.swingVal,
          repeat: newRow.repeat
        })
      this.setState({loopTable: loopTable})
      return
    }

    if (event.target.name === 'loopAddPreset') {
      newRow.presetNo = parseInt(event.target.value, 10)
      if (loadedPresets[newRow.presetNo].swingVal !== undefined) { newRow.swingVal = loadedPresets[newRow.presetNo].swingVal } else { newRow.swingVal = 1.5 }
      this.setState({newRow: newRow})
      return
    }

    if (event.target.name === 'loopSwingVal') {
      newRow.swingVal = parseFloat(event.target.value / 10, 10)
      this.setState({newRow: newRow})
      return
    }

    if (event.target.name === 'loopRepeat') {
      newRow.repeat = parseInt(event.target.value, 10)
      this.setState({newRow: newRow})
    }
  } // end handleTable

  handleSetLists (event) {
/*
   (ref) https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
*/
    /* handle setLists */
    if (event.target.name.match(/^selectList:/)) {
      let names = event.target.name.split(':')
      if (event.target.value === 'select') {
//        console.log('setLists.length:' + this.params.setLists.length)
//        console.log(parseInt(names[1],10) + ' selected')
        this.params.selectedSetList =
         this.params.setLists[parseInt(names[1], 10)]
        this.setState({
          selectedSetList: this.params.setLists[parseInt(names[1], 10)],
          selectedSong: {song: 'none'},
          showSetLists: false,
          showSongList: true})
        return
      }

      if (event.target.value === 'top') {
        // console.log(names[1] + ' move to top')
        let current = this.params.setLists[parseInt(names[1], 10)]
        this.params.setLists.splice(parseInt(names[1], 10), 1)
        this.params.setLists.unshift(current)
        this.setState({showSetLists: true})
        return
      }

      if (event.target.value.match(/^move/)) {
        let values = event.target.value.split(':')
        let current = this.params.setLists[parseInt(names[1], 10)]
        // console.log(names[1] + ' move after ' + values[1])
        this.params.setLists.splice(parseInt(values[1], 10) + 1, 0, current)
        if (parseInt(values[1], 10) < parseInt(names[1], 10)) { this.params.setLists.splice(parseInt(names[1], 10) + 1, 1) } else if (parseInt(values[1], 10) > parseInt(names[1], 10)) { this.params.setLists.splice(parseInt(names[1], 10), 1) } else {}// console.log('no effect')

        this.saveSetLists()
        this.setState({showSetLists: true})
        return
      }

      if (event.target.value === 'delete') {
        // console.log(names[1] + ' delete')
        this.params.setLists.splice(names[1], 1)
        this.saveSetLists()
        this.setState({showSetLists: true})
        return
      }
    }

    if (event.target.name === 'addList') {
      this.params.setLists.push({name: this.params.newListName, items: []})
      this.saveSetLists()
      this.setState({showSetLists: true})
      return
    }

    if (event.target.name === 'newList') {
      this.params.newListName = event.target.value
      return
    }

    /* handle songs */
    const songItems = this.state.selectedSetList.items

    if (event.target.name.match(/^selectSong:/)) {
      let names = event.target.name.split(':')

      if (event.target.value === 'select') {
        // console.log(names[1] + ' selected')
        let song = songItems[parseInt(names[1], 10)]
        this.setState({selectedSong: song, showSongList: false})

        if (song.type === 'preset') {
          let presetNo = 0
          for (presetNo = 0; presetNo < loadedPresets.length; presetNo++) { if (loadedPresets[presetNo].value === song.presetVal) break }
          if (presetNo >= loadedPresets.length) { presetNo = this.params.default_presetNo } // not found

          this.handleChange({target: {name: 'preset', value: presetNo}})
          this.handleChange({target: {name: 'bpm_set', value: song.bpm}})
          // console.log('bpm ' + parseFloat(song.bpm))
          return
        }  // end preset

        if (song.type === 'loop') {
          this.state.loopTable.splice(0,this.state.loopTable.length) // clear

          this.handleChange(
           {target: {name: 'bpm_set', value: parseFloat(song.bpm, 10)}})

          for (let i = 0; i < song.table.length; i++) { // search presetNo
            let presetNo = 0
            for (presetNo = 0; presetNo < loadedPresets.length; presetNo++) {
              if (loadedPresets[presetNo].value === song.table[i].presetVal) { break }
            }
            if (presetNo >= loadedPresets.length) { presetNo = this.params.default_presetNo }
             // if not found


            this.handleTable({target: {name: 'loopAddPreset', value: presetNo}})
            this.handleTable({target:
             {name: 'loopSwingVal', value: 10 * song.table[i].swingVal}})
            this.handleTable({target:
             {name: 'loopRepeat', value: song.table[i].repeat}})
            this.handleTable({target: {name: 'loopAdd'}})
          } // end for song.table.length
          this.setState({showCustomLoop: true})
          return
        } // end if song.type === 'loop'
      } // end if 'select'

      if (event.target.value === 'top') {
        let current = songItems[parseInt(names[1], 10)]
        songItems.splice(parseInt(names[1], 10), 1)
        songItems.unshift(current)
        // console.log(names[1] + ' move to top')
        this.setState({showSongList: true})
        return
      }

      if (event.target.value.match(/^move/)) {
        let values = event.target.value.split(':')
        let current = songItems[parseInt(names[1], 10)]
        songItems.splice(parseInt(values[1], 10) + 1, 0, current)
        if (parseInt(values[1], 10) < parseInt(names[1], 10)) { songItems.splice(parseInt(names[1], 10) + 1, 1) } else if (parseInt(values[1], 10) > parseInt(names[1], 10)) { songItems.splice(parseInt(names[1], 10), 1) } else {} // console.log('no effect')
        this.setState({showSongList: true})
        return
      }

      if (event.target.value === 'delete') {
        // console.log(names[1] + ' delete')
        songItems.splice(parseInt(names[1], 10), 1)
        this.saveSetLists()
        this.setState({showSongList: true})
        return
      }
    }

    if (event.target.name === 'addSong') {
      if (event.target.value === 'preset') {
        // console.log('addSong preset')
        this.state.selectedSetList.items.push({
          song: this.params.newSongName,
          type: 'preset',
          presetVal: loadedPresets[this.state.presetNo].value,
          bpm: parseFloat(this.state.bpm, 10).toFixed(1)})
      }

      if (event.target.value === 'loop') {
        // console.log('addSong loop')
        if (this.state.loopTable.length > 0) {
          this.state.selectedSetList.items.push({
            song: this.params.newSongName,
            type: 'loop',
            table: this.state.loopTable,
            bpm: parseFloat(this.state.bpm, 10).toFixed(1)})
        } else {} // console.log('addSong loop is empty')
      }

      this.saveSetLists()
      this.setState({showSongList: true})
      return
    }

    if (event.target.name === 'newSong') {
      this.params.newSongName = event.target.value
    }
  } // end handleSetLists

  startStopDrums (event) {

    if (event.target.name === 'stop') {
      for (let beat = 0; beat < this.tickEvents.length; beat++) 
         this.tickEvents[beat].clear()
      if (this.state.playing) this.setState({playing: false})
      return
    }

    if (event.target.name === 'start') {
      let drumPattern = drumPatterns[0]
      this.params.drumPattern = drumPattern
      this.params.numerator   = drumPattern.numerator
      this.params.denominator   = drumPattern.denominator
      let clickPmin = this.state.bpm * (this.params.denominator / 4)
      this.findSamplesByName()

      for (let beat = 0; beat < this.params.numerator; beat++) {
        event = clock.callbackAtTime(
           function (event) {
             this.playPattern(event.deadline)
           }.bind(this),
          this.nextTick(beat)
        ).repeat((this.params.numerator * 60.0) / clickPmin)
         .tolerance({early: early, late: late}) // tight early tolerance
        this.tickEvents[beat] = event
      } // end for

      this.setState({playing: true})
      return
    }

    if (event.target.name === 'startStop'){
      if (this.state.playing) {
         this.startStopDrums({target: {name: 'stop'}})
      } else {
         this.startStopDrums({target: {name: 'start'}})
      }
      return
    }

  }

  startStop (event) {
    if (this.state.loopStat.playing) return

    if (event.target.name === 'stop') {
      if (this.state.playing) {
        this.setState({playing: false})
        for (let beat = 0; beat < this.tickEvents.length; beat++) { this.tickEvents[beat].clear() }
      }
      this.params.count = 0
      if (this.timerEvent) {
        this.timerEvent.clear()
        this.timeoutEvent.clear()
      }
      return
    } // stop

    if (event.target.name === 'restart' && this.state.playing) {
      for (let beat = 0; beat < this.tickEvents.length; beat++) {
        this.tickEvents[beat].clear()
      }

      this.params.count = 0
      this.params.startTime = context.currentTime
      let clickPmin = this.state.bpm * (this.params.denominator / 4)

      for (let beat = 0; beat < this.params.numerator; beat++) {
        let event = clock.callbackAtTime(
            function (event) { 
            this.playClick(event.deadline) }.bind(this),
            // this.playPattern(event.deadline) }.bind(this),
            this.nextTick(beat)
          ).repeat((this.params.numerator * 60.0) / clickPmin) // parBar
           .tolerance({early: early, late: late})
        this.tickEvents[beat] = event
      } // end for
//      console.log('restart')
      return
    } // end restart

    if (event.target.name === 'startStop') {
      if (this.state.playing) {
//        console.log('stopping')
        this.setState({playing: false})
        for (let beat = 0; beat < this.tickEvents.length; beat++) { this.tickEvents[beat].clear() }
        this.params.count = 0
        if (this.timerEvent) {
          this.timerEvent.clear()
          this.timeoutEvent.clear()
        }
//        console.log('stop by startStop')
        return
      } // stop

      // start
//      console.log('starting')
      let clickPmin = this.state.bpm * (this.params.denominator / 4)
      this.setState({playing: true})

      this.params.count = 0
      this.params.startTime = context.currentTime
      for (let beat = 0; beat < this.params.numerator; beat++) {
        let event = clock.callbackAtTime(
            function (event) { 
            this.playClick(event.deadline) }.bind(this),
            // this.playPattern(event.deadline) }.bind(this),
            this.nextTick(beat)
        ).repeat((this.params.numerator * 60.0) / clickPmin) // parBar
         .tolerance({early: early, late: late})
        this.tickEvents[beat] = event
        console.log('Schedule beat ' + beat)
      } // end for

      if (this.params.timer > 0) {
        this.timerEvent = timerClock.callbackAtTime(function (event) {
          let rest = this.state.rest - 1
          this.setState({rest: rest})
        }.bind(this), 1).repeat(1)

        this.timeoutEvent = timerClock.setTimeout(function (event) {
          if (this.timerEvent) this.timerEvent.clear()
          this.startStop({target: {name: 'stop'}})
          this.setState({rest: this.params.timer})
        }.bind(this), this.state.rest)
      } // end if timer

//        console.log('start by startStop')
    } // button event
  } // end startStop()

// https://github.com/sebpiq/WAAClock/blob/master/demos/beatSequence.js
  nextTick (beatInd) {
    const beatDur = 60.0 / (this.state.bpm * this.params.denominator / 4)
    const barDur = beatDur * this.params.numerator

    const currentTime = context.currentTime
    const relativeTime = Math.max(0, currentTime - this.params.startTime)
    var currentBar = Math.floor(relativeTime / barDur)

    let offset = 0
    if (this.params.swing && (beatInd % 2) === 1) {
      offset = (this.state.swingVal - 1.5) / 1.5 * beatDur
    }

    return this.params.startTime + offset +
           currentBar * barDur + beatInd * beatDur
  }

  findCountSamples(){
    let cowbell = 0
    let male = 1
    let female = 1
    for (let i = 0; i < this.notes.length; i++){
      if (this.notes[i].name.match(/^cowbell/)) 
        this.params.cowbell[cowbell++] = this.notes[i].sample 
      if (this.notes[i].name.match(/^female/)) 
        this.params.femaleVoice[female++] = this.notes[i].sample 
      if (this.notes[i].name.match(/^male/)) 
        this.params.maleVoice[male++] = this.notes[i].sample 
    }
  }

  findSamplesByName (){
    const {drumPattern} = this.params
     console.log(JSON.stringify(drumPattern))

    for (let i = 0; i < drumPattern.pattern.length; i++){
      // console.log(drumPattern.pattern[i].note)
      let j = 0
      for (j = 0; j < this.notes.length; j++){
        // console.log(this.notes[j].name)
        if (this.notes[j].name === drumPattern.pattern[i].note) break
      }

      if (j < this.notes.length) 
        this.params.notesInPattern[i] = this.notes[j]
      else 
        this.params.notesInPattern[i] = null
      console.log('note ' + i + ': ' + this.params.notesInPattern[i].name)
    }


  }

  playPattern(deadline){
    const {numerator, notesInPattern, drumPattern} = this.params
    let {count} = this.params

    let source = []
    for(let i=0; i < notesInPattern.length; i++){
      if (drumPattern.pattern[i].values[count] === 0) continue
      source[i] = context.createBufferSource() 
      source[i].buffer = notesInPattern[i].sample
      source[i].connect(gainNode[i])
      gainNode[i].connect(context.destination)
      gainNode[i].gain.value 
          = drumPattern.pattern[i].values[count]/9.0
      source[i].start(deadline)
    }  

    this.params.count = (count + 1) % numerator
  }

  playClick (deadline) {
    const {bpm, restBars} = this.state
    const {maxBpm, minBpm, numerator, denominator, triplet,
          increment, barTimer, perBars, muteBars, muteProb,
          cowbell, maleVoice} = this.params
    let {muteCount, muteStat, count, barCount} = this.params

    console.log('count: ' + count)

    // Timer in bars
    if (barTimer > 0 && restBars <= 0) {
//      console.log('barTimer ' + barTimer)
      this.startStop({target: {name: 'stop'}})
      this.setState({restBars: barTimer}) // back to initial value
      return
    }

    // automatic bpm increment
    if (perBars > 0 && count === 0 && barCount > 0 &&
       (barCount % perBars) === 0) {
      let newBpm = parseFloat(bpm) + parseFloat(increment)
      if (newBpm > maxBpm) newBpm = maxBpm
      if (newBpm < minBpm) newBpm = minBpm
      this.setState({bpm: newBpm})
      clock.timeStretch(context.currentTime, this.tickEvents, bpm / newBpm)
    } // end automatic bpm increment

    // random mute
    if (muteBars > 0 && muteProb > 0 && count === 0) {
      if (muteCount === muteBars) {
         // console.log('mute off')
        muteStat = false
        muteCount = 0
        // this.setState({mute: false, muteCount: 0})
      } else {
        if (muteStat) {
          // this.setState({muteCount: this.state.muteCount + 1})
          muteCount++
//          console.log('mute cont' + muteCount)
        } else if (Math.random() < parseFloat(muteProb)) {
           // console.log('mute on')
          muteStat = true
          muteCount++
          // this.setState({mute: true, muteCount: 1})
        }
      }
    } // end random mute

    let volume = 1.0
    let mute
    if (muteStat) mute = 0.0
    else mute = 1.0

    let source = context.createBufferSource()
    let voiceSource = context.createBufferSource()

    let voiceCount
    if (triplet) voiceCount = (count * 4 * 2) / (denominator * 3)
    else voiceCount = (count * 4) / denominator
//    console.log('voiceCount: ' + voiceCount)

    if (Number.isInteger(voiceCount)) { voiceSource.buffer = maleVoice[voiceCount] }

    if (count === 0) {
      source.buffer = cowbell[2]
      volume = 1.0 * mute
    } else {
      source.buffer = cowbell[3]
      volume = 0.7 * mute
      if ((count + 1) % numerator === 0) {
        barCount++
        if (this.state.restBars > 0) { this.setState({restBars: this.state.restBars - 1}) }
      }
    }

    if (triplet) {
      if (count % 3 !== 2) volume *= this.state.evenVol
    } else {
      if (count % 2 === 0) volume *= this.state.evenVol
    }

    if (this.state.voice === 'c') source.connect(gainNode)
    else if (this.state.voice === 'v') voiceSource.connect(gainNode)
    else if (this.state.voice === 'c+v') {
      source.connect(gainNode)
      voiceSource.connect(gainNode)
    }

    gainNode.connect(context.destination)
    gainNode.gain.value = volume
    source.start(deadline)

    if (voiceSource !== null) voiceSource.start(deadline)

    count = (count + 1) % numerator
    this.params.muteCount = muteCount
    this.params.muteStat = muteStat
    this.params.count = count
    this.params.barCount = barCount

    if (this.state.loopStat.playing && count === 0) { this.customPlay({target: {name: 'nextBar'}}) }
  } // end playClick

  handleChange (event) {


    if (event.target.name === 'metroOn') {
      this.setState({metroOn: !this.state.metroOn})
      return
    }

    if (event.target.name === 'metroSound') {
      console.log(event.target.name)
      this.setState({metroSound: event.target.value})
      return
    }


    if (event.target.name === 'drumsOn') {
      this.setState({drumsOn: !this.state.drumsOn})
      return
    }

    if (event.target.name === 'voiceOn') {
      this.setState({voiceOn: !this.state.voiceOn})
      return
    }
   

    if (event.target.name === 'language') {
      if (this.state.ja === true) {
        m = usText
        this.setState({ja: false})
      } else {
        m = jaText
        this.setState({ja: true})
      }
      return
    }

    if (event.target.name === 'evenVol') {
      if (this.state.evenVol) { this.setState({evenVol: parseFloat(event.target.value)}) } else this.setState({evenVol: 1.0})
      return
    }

    if (event.target.name === 'voice') {
      this.setState({voice: event.target.value})
      return
    }

//  Temp tap: https://www.all8.com/tools/bpm.htm
    if (event.target.name === 'tempo_tap') {
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
        this.setState({bpm: newBpm.toFixed(1)})
        if (this.state.playing) {
          clock.timeStretch(context.currentTime, this.tickEvents,
          this.state.bpm / newBpm)
        }

        this.tap.count++
      }
      this.tap.msecsPrevious = msecs
      return
    }

    if (event.target.name === 'bpmFrac') {
      // console.log('bpm change')
      let bpmFrac = parseInt(event.target.value, 10)
      let newBpm = Math.floor(this.state.bpm) + 0.1 * bpmFrac
      console.log('newBpm(bpmFrac)' + newBpm)
      this.setState({bpm: newBpm.toFixed(1)})
      if (this.state.playing) {
        clock.timeStretch(context.currentTime, this.tickEvents,
            this.state.bpm / newBpm)
      }

      return
    }

    if (event.target.name === 'bpm_slider') {
      let newBpm = parseInt(event.target.value, 10) +
            0.1 * parseInt(this.state.bpmFrac, 10)
      console.log('newBpm(bpm_slider)' + newBpm)
      this.setState({bpm: newBpm.toFixed(1)})
      if (this.state.playing) {
        clock.timeStretch(context.currentTime, this.tickEvents,
        this.state.bpm / newBpm)
      }
      return
    }

    if (event.target.name === 'bpm_set') { // for handleSetList, song, lop
      let newBpm = parseFloat(event.target.value, 10).toFixed(1)
      this.setState(
        {bpm: newBpm,
          bpmFrac: Math.round(10 * (newBpm - Math.floor(newBpm)))}
      )
      if (this.state.playing) {
        clock.timeStretch(context.currentTime, this.tickEvents,
        this.state.bpm / newBpm)
      }
      return
    }

    if (event.target.name === 'swing') {
      if (event.target.value !== 15) {
        let swingVal = parseFloat(event.target.value / 10, 10)
        this.params.swing = true
        this.setState({swingVal: swingVal})
      } else {
        this.params.swing = false
        this.setState({swingVal: 1.5})
      }

      clock.setTimeout(function (event) {
        this.startStop({target: {name: 'restart'}})
      }.bind(this), 0.02)
      return
    }

    if (event.target.name === 'increment') {
      this.params.increment = parseInt(event.target.value, 10)
      return
    }

    if (event.target.name === 'muteProb') {
      this.params.muteProb = parseFloat(event.target.value, 10)
      return
    }

    if (event.target.name === 'timer') {
      this.params.timer = parseInt(event.target.value, 10)
      this.setState({rest: this.params.timer})
      return
    }

    if (event.target.name === 'barTimer') {
      this.params.barTimer = parseInt(event.target.value, 10)
      this.setState({restBars: this.params.barTimer})
      return
    }

    if (event.target.name === 'perBars') {
      this.params.perBars = parseInt(event.target.value, 10)
      return
    }

    if (event.target.name === 'muteBars') {
      this.params.muteBars = parseInt(event.target.value, 10)
      return
    }

    if (event.target.name === 'drumPattern') {
      this.setState({drumPatternNo: parseInt(event.target.value,10)})
      return
    }

    if (event.target.name === 'preset') {
      const preset = loadedPresets[event.target.value]

      let swingVal
      if (preset.swingVal !== undefined) {
        swingVal = preset.swingVal
        this.params.swing = true
      } else {
        swingVal = 1.5
        this.params.swing = false
      }

      this.setState({presetNo: event.target.value, swingVal: swingVal})
      this.params.numerator = preset.numerator
      this.params.denominator = preset.denominator
      this.params.triplet = preset.triplet

      if (this.state.playing) {
        clock.setTimeout(function (event) {
          this.startStop({target: {name: 'restart'}})
        }.bind(this), 0.02)
      }
      return
    } // end preset

    if (event.target.name === 'showMore') {
      this.setState({showMore: !this.state.showMore})
      return
    }

    if (event.target.name === 'advancedUI') {
      this.setState({showAdvanced: !this.state.showAdvanced})
      return
    }

    if (event.target.name === 'drumsUI') {
      this.setState({showDrums: !this.state.showDrums})
      return
    }

    if (event.target.name === 'customLoopUI') {
      this.setState({showCustomLoop: !this.state.showCustomLoop})
      return
    }

    if (event.target.name === 'setListsUI') {
      this.setState({showSetLists: !this.state.showSetLists})
      return
    }

    if (event.target.name === 'songListUI') {
      this.setState({showSongList: !this.state.showSongList})
    }
  } // end handleChange()

  handleWindowClose (event) { // finishing clean up
    this.startStop({target: {name: 'stop'}})
    this.saveSetLists()
    clock.stop()
    context.close()
  }
} // end App

export default App
