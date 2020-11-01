import React, { Component } from 'react'
import './Metronome.css'
import BufferLoader from './buffer-loader'
import WAAClock from 'waaclock'
import messages from './language.json'
import packageJSON from '../package.json'
import loadedSetListSample from './setListSample.json'
import loadedDrumPatterns from './drumPatterns.json'
import loadedClickPatterns from './clickPatterns.json'
import soundList from './soundList.js'

// global variable
window.AudioContext = window.AudioContext || window.webkitAudioContext
var context
var clock
var timerClock
var gainNode = []

const version = (packageJSON.homepage + packageJSON.subversion).slice(-10)
 // define in package.json
// const early = 0.1
const early = 0.1
const late = 0.1
const jaText = messages.ja
const usText = messages.us
var m = usText

class App extends Component {
  constructor (props) {
    super(props)

    this.params = {
      minBpm: 30.0,
      maxBpm: 360.0,
      numerator: null,
      denominator: null,
      default_clickPatternNo: null,
      default_drumPatternNo: null,
      timer: 0,
      barTimer: 0,

      muteCount: 0,
      muteStat: false,
      muteBars: 0,
      muteProb: 0.0,

      cowbell: [],
      maleVoice: [],
      femaleVoice: [],
      currentPattern: {},
      swing: false,
      triplet: false,
      count: 0,
      barCount: 0,
      startTime: 0,
      setLists: [],
      newListName: '',
      newSongName: ''
    }

    for (let i = 0; i < loadedClickPatterns.length; i++) {
      if (loadedClickPatterns[i].default === true) {
        this.params.default_clickPatternNo = i
        break
      }
    }

    this.params.currentPattern =
      loadedClickPatterns[this.params.default_clickPatternNo]

    for (let i = 0; i < loadedDrumPatterns.length; i++) {
      if (loadedDrumPatterns[i].default === true) {
        this.params.default_drumPatternNo = i
        break
      }
    }

    this.timerEvent = 0
    this.timeOutEvent = 0

    this.state = {
      ja: false,
      rest: 0,
      restBars: 0,
      playing: false,

      bpm: 100,
      bpmFrac: 0.0,
      metroOn: true,
      clickPatternNo: this.params.default_clickPatternNo, // default 4/4
      metroSound: '3cb2',
      drumsOn: false,
      drumPatternNo: this.params.default_drumPatternNo,
      voiceOn: false,
      voice: 'female',
      swingVal: 1.5,
      evenVol: 1.0,
      increment: 0,
      perBars: 0,
      masterVol: 75,

      showMore: false,
      showAdvanced: false,
      showSetLists: false,
      showCustomLoop: false,
      showSongList: false,
      // for custom loop
      loopTable: [],
      loopTableNewRow: {
        bar: loadedClickPatterns[this.params.default_clickPatternNo],
        swingVal: 1.5,
        repeat: 4},
      loopStat: {playing: false, seq: 0, repeat: 0, bar: 0},

      selectedSetList: {},
      selectedSong: {name: 'none'} // default
    } // end state

    this.setState = this.setState.bind(this)
    this.startStopDrums = this.startStopDrums.bind(this)
    this.customPlay = this.customPlay.bind(this)
    this.handleMenu = this.handleMenu.bind(this)
    this.handlePattern = this.handlePattern.bind(this)
    this.handleBpm = this.handleBpm.bind(this)
    this.handleTimer = this.handleTimer.bind(this)
    this.handleAdvanced = this.handleAdvanced.bind(this)
    this.handleSetLists = this.handleSetLists.bind(this)
    this.handleTable = this.handleTable.bind(this)
    this.playPattern = this.playPattern.bind(this)
    this.nextTick = this.nextTick.bind(this)
    this.handleWindowClose = this.handleWindowClose.bind(this)
    this.saveSetLists = this.saveSetLists.bind(this)
    this.findNumByName = this.findNumByName.bind(this)
    this.handleVolume = this.handleVolume.bind(this)

    this.tickEvents = []
    this.sound = {}

/* Example is in sampleTable.json */

    this.tap = {
      count: 0,
      msecsFirst: 0,
      msecsPrevious: 0
    }
  } // end constructor

  componentWillMount () { // before render()
    const savedSetLists = JSON.parse(localStorage.getItem('savedSetLists'))

    if (savedSetLists === null) {
      this.params.setLists.push({name: 'default', items: []}, loadedSetListSample)
    } else {
      for (let i = 0; i < savedSetLists.length; i++) {
        this.params.setLists.push(savedSetLists[i])
      }
      this.params.setLists.push(loadedSetListSample)
    }
    this.setState({selectedSetList: this.params.setLists[0]})
  }

  componentDidMount () {
    window.addEventListener('beforeunload', this.handleWindowClose)
    context = new window.AudioContext()

    for (let i = 0; i < 10; i++) { gainNode[i] = context.createGain() }

    let inputFiles = []
    for (let i = 0; i < soundList.length; i++) {
      // inputFiles[i] = soundList[i] + '.mp3'
      inputFiles[i] = soundList[i]
      soundList[i] = soundList[i].replace(/\/.*\/(.*)\..*\.mp3/, '$1')
      // console.log(soundList[i])
    }

    let bufferLoader = new BufferLoader(
      context, inputFiles,
      function (bufferList) {
        for (let i = 0; i < soundList.length; i++) { this.sound[soundList[i]] = bufferList[i] }
      }.bind(this)
    )

    bufferLoader.load()

    // clock = new WAAClock(context)
    // timerClock = clock
    // clock.start()
  }

  componentWillUnmount () {
    window.removeEventListener('beforeunload', this.handleWindowClose)
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
    const {ja, loopTable, loopTableNewRow, loopStat,
      metroOn, clickPatternNo, metroSound, drumsOn, drumPatternNo,
      voiceOn, voice, playing, bpm, bpmFrac,
      increment, perBars, muteBars, muteProb,
      rest, restBars, swingVal, evenVol, showMore,
      showAdvanced, showSetLists, showSongList,
      showCustomLoop, selectedSetList, selectedSong} = this.state

    const {minBpm, maxBpm, setLists} = this.params

    const {startStopDrums, customPlay,
           handleMenu, handlePattern, handleBpm, handleTimer,
           handleAdvanced, handleTable, handleSetLists} = this

    const clickPatternOptions = loadedClickPatterns.map((e, index) => {
      return (<option value={index} key={index}>
        {('0' + index).slice(-2)}: {e.name}</option>)
    })

    const drumPatternOptions = loadedDrumPatterns.map((e, index) => {
      return (<option value={index} key={index}>
        {('00' + index).slice(-3)}: {e.name}</option>)
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
        <td align='right'>{e.table ? 'loop' : 'bar' }</td>
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
         bar<input name='addSong'
           type='radio' checked={false} value='bar'
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
            onChange={handleAdvanced}>{SwingValOptions}</select>
        </span>
        {m.swingStr}
        <br />
        <span className='selector'>
          {m.increment}: &nbsp;
       <select name='increment' value={increment}
         onChange={handleAdvanced}>{IncrementOptions}
       </select> bpm
       </span>
         /
        <span className='selector'>
          <select name='perBars' value={perBars} onChange={handleAdvanced}>
            <option value='0'>off</option> <option value='1'>1</option>
            <option value='2'>2</option> <option value='4'>4</option>
            <option value='8'>8</option> <option value='12'>12</option>
            <option value='16'>16</option>
          </select>
          {m.perBars}</span><br />
        <span className='selector'>
          {m.muteBars}: &nbsp;
         <select name='muteBars' value={muteBars} onChange={handleAdvanced}>
           <option value='0'>off</option> <option value='1'>1</option>
           <option value='2'>2</option> <option value='4'>4</option>
           <option value='8'>8</option> <option value='12'>12</option>
           <option value='16'>16</option>
         </select>
        </span>
        {m.muteProb1}, {m.muteProb2}
        <span className='selector'>
          <select name='muteProb' value={parseFloat(muteProb, 10).toFixed(1)} onChange={handleAdvanced}>
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
            onChange={handleAdvanced} />
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
        <td align='right'>{e.bar.name}</td>
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
                <th>pattern</th><th>repeat</th></tr>
              {loopTableRows}
              <tr><td align='right' className='radioButton'>
      metro
      <input type='radio' name='loopAdd' value='click' checked={false}
        onChange={handleTable} />
                <br />
      drum
      <input type='radio' name='loopAdd' value='drum' checked={false}
        onChange={handleTable} />
              </td>
                <td align='right'>add</td>
                <td align='right' className='selector'>
                  <select name='loopAddClickPattern' value={clickPatternNo}
                    onChange={handleTable}>
                    {clickPatternOptions}</select><br />
                  <select name='loopAddDrumPattern' value={drumPatternNo}
                    onChange={handleTable}>
                    {drumPatternOptions}</select><br />
                </td>
                <td align='right' className='selector'><span>
                  <select name='loopRepeat'
                    defaultValue={loopTableNewRow.repeat}
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
      KG's Metronome2 &nbsp; <font color='blue'>Lang: </font>
        <span className='small-button'>
          <button name='language' onClick={handleMenu}>
            {ja ? 'US' : 'JP'}</button>&nbsp;
        </span>
        Play: <button name='startStop' onClick={startStopDrums}>
          {playing ? 'Stop' : 'Start'}</button>
        <hr />
        <span className='selector'>
          <input name='metroOn' type='checkbox'
            checked={metroOn} onChange={handlePattern} />
          {m.metronome}: <select name='clickPattern' value={clickPatternNo}
            onChange={handlePattern}>
            {clickPatternOptions}
          </select>
        </span> &nbsp;
        {m.sound}:&nbsp;
        <span className='selector'>
          <select name='metroSound' value={metroSound} onChange={handlePattern}>
            <option value='cb1'>cowbell1</option>
            <option value='cb2'>cowbell2</option>
            <option value='cb3'>cowbell3</option>
            <option value='cb4'>cowbell4</option>
            <option value='cb5'>cowbell5</option>
            <option value='2cb1'>2cowbell1</option>
            <option value='2cb2'>2cowbell2</option>
            <option value='2cb3'>2cowbell3</option>
            <option value='2cb4'>2cowbell4</option>
            <option value='3cb1'>3cowbell1</option>
            <option value='3cb2'>3cowbell2</option>
            <option value='3cb3'>3cowbell3</option>
            <option value='1cg1'>1conga1</option>
            <option value='1cg2'>1conga2</option>
            <option value='1cg3'>1conga3</option>
            <option value='2cg1'>2conga1</option>
            <option value='2cg2'>2conga2</option>
            <option value='3cg'>3conga</option>
            <option value='cv'>clave</option>
            <option value='hc'>handClap</option>
          </select>
        </span>
        <br />
        <span className='selector'>
          <input type='checkbox' name='drumsOn' checked={drumsOn}
            onChange={handlePattern} />
          {m.drums}: <select name='drumPattern' value={drumPatternNo}
            onChange={handlePattern}>
            {drumPatternOptions}
          </select>
        </span>&nbsp;
        <input type='checkbox' name='voiceOn'
          checked={voiceOn} onChange={handlePattern} />
        {m.voice}: <select name='voice' value={voice} onChange={handlePattern}>
          <option value='male' >male</option>
          <option value='female'>female</option>
        </select>
        <hr />
        <span className='number'>
        BPM({minBpm}-{maxBpm}): &nbsp; {('0' + Math.floor(bpm)).slice(-3)}.
        <span className='selector'>
          <select name='bpmFrac' value={bpmFrac}
            onChange={handleBpm}>
            <option value='0'>0</option> <option value='1'>1</option>
            <option value='2'>2</option> <option value='3'>3</option>
            <option value='4'>4</option> <option value='5'>5</option>
            <option value='6'>6</option> <option value='7'>7</option>
            <option value='8'>8</option> <option value='9'>9</option>
          </select></span>
        &nbsp; &nbsp; &nbsp; &nbsp;
        </span>
        <span className='small-button'>
          <button name='tempo_tap' onClick={handleBpm}>
            {m.tap}</button></span>&nbsp;
        <br />
        <span className='tinyButton'>
          <button name='bpmStep'
            value='-1' onClick={handleBpm}>-</button></span>
        <span className='bpm-slider'>
          <input type='range' name='bpm_slider'
            min={minBpm} max={maxBpm} value={bpm} step='1.0'
            onChange={handleBpm} />
        </span>
        <span className='tinyButton'>
          <button name='bpmStep'
            value='1' onClick={handleBpm}>+</button></span>
        <hr />
        {m.timer}: &nbsp;
     <span className='selector'>
       {('00' + rest).slice(-3)}/
     <select name='timer' defaultValue='0' onChange={handleTimer}>
       <option value='0'>off</option> <option value='30'>30</option>
       <option value='60'>60</option> <option value='90'>90</option>
       <option value='120'>120</option> <option value='180'>180</option>
       <option value='240'>240</option> <option value='300'>300</option>
       <option value='600'>600</option> </select>({m.secs}),&nbsp;
     </span>
        <span className='selector'>
          {('00' + restBars).slice(-3)}/
  <select name='barTimer' defaultValue='0' onChange={handleTimer}>
    <option value='0'>off</option> <option value='12'>12</option>
    <option value='16'>16</option> <option value='24'>24</option>
    <option value='32'>32</option> <option value='64'>64</option>
    <option value='128'>128</option> <option value='256'>256</option>
  </select> ({m.bars})</span><hr />
        <span className='bpm-slider'>
          Vol: {this.state.masterVol}<br />
            0 <input type='range' name='volumeSlider'
            min='0' max='150' value={this.state.masterVol} step='1'
            onChange={this.handleVolume} /> 150
        </span>
        <hr />

        {m.moreFeatures}: <span className='loopButton'>
          <button name='showMore' onClick={handleMenu}>
            {showMore ? m.hide : m.show} {/* no {} for m.hide,show */}
          </button></span>

        {showMore ? (<span><hr />
          {m.advanced}: <span className='loopButton'>
            <button name='advancedUI' onClick={handleMenu}>
              {showAdvanced ? m.hide : m.show} {/* no {} for m.hide,show */}
            </button></span><br />
          {showAdvanced ? (<span><AdvancedUI /></span>) : ''}
          <hr /><span className='loopButton'>
            {m.SetLists}: <button name='setListsUI' onClick={handleMenu}>
              {showSetLists ? m.hide : m.show} {/* no {} for m.hide,show */}
            </button></span>&nbsp;
          <span className='loopButton'>
            {m.SongList}: <button name='songListUI' onClick={handleMenu}>
              {showSongList ? m.hide : m.show} {/* no {} for m.hide,show */}
            </button>
          </span><br />
          {m.Current}: <b>(List) {selectedSetList.name} :
        (Song) {selectedSong.song} :
        (ptn) {selectedSong.bar
               ? selectedSong.bar.name : 'loop'} :
        (bpm) {selectedSong.bpm}</b><br />
          {showSetLists ? <SetListUI /> : ''}
          {showSongList ? <SongListUI /> : ''}
          <hr />
          <span className='loopButton'>
            {m.custom}: <button name='customLoopUI' onClick={handleMenu}>
              {showCustomLoop ? m.hide : m.show} {/* no {} for m.hide,show */}
            </button></span>
          <br />{showCustomLoop ? <CustomLoopUI /> : ''}

        </span>) : ''}

        <hr />
      (Version: {version}) <a href={m.url} target='_blank' rel='noopener noreferrer'>{m.guide}</a><br />
        <hr />
      </div>
    )
  } // end render()

  customPlay (event) {
    const {loopTable} = this.state
    let {loopStat} = this.state
    if (loopTable.length <= 0) return

    if (event.target.name === 'startLoop') {
      this.startStopDrums({target: {name: 'stop'}}) // stop the metronome
      if (loopStat.playing) {
        this.customPlay({target: {name: 'stop'}})
      } else {
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
      this.customPlay({target: {name: 'stop'}})
      loopStat.seq = 0
      loopStat.repeat = 0
      loopStat.bar = 0
      this.setState({loopStat: loopStat})
      return
    }

    if (event.target.name === 'stop') {
      for (let beat = 0; beat < this.tickEvents.length; beat++) { this.tickEvents[beat].clear() }
      this.tickEvents.splice(0, this.tickEvents.length)
      loopStat.playing = false
      this.setState({loopStat: loopStat})
      return
    }

    if (event.target.name === 'start') {
     if (clock === undefined) {
       clock = new WAAClock(context)
       timerClock = clock
       clock.start()
     }
      this.customPlay({target: {name: 'nextBar'}})
      return
    }

    if (event.target.name === 'nextBar') {
      if (loopStat.bar === 0 ||
         loopStat.repeat === loopTable[loopStat.seq].repeat) { // next seq
        if (loopStat.bar > 0) loopStat.seq++
        if (loopStat.seq === loopTable.length) loopStat.seq = 0

        loopStat.repeat = 1
        let {bar} = loopTable[loopStat.seq]
        this.params.currentPattern = bar
        this.params.numerator = bar.numerator
        this.params.denominator = bar.denominator
        this.params.triplet = bar.triplet
        if (bar.swingVal !== undefined) {
          this.setState({swingVal: bar.swingVal})
          this.params.swing = true
        } else {
          this.setState({swingVal: 1.5})
          this.params.swing = false
        }
      } else loopStat.repeat++

      if (loopStat.bar === 0) { this.params.startTime = context.currentTime } else { this.params.startTime = this.params.nextTick }

      this.params.count = 0
      for (let beat = 0; beat < this.params.numerator; beat++) {
        event = clock.callbackAtTime(
          function (event) {
            this.playPattern(event.deadline)
          }.bind(this),
          this.nextTick(beat)
        ).tolerance({early: early, late: late})
        this.tickEvents[beat] = event
      } // end for

      loopStat.bar++
      this.setState({loopStat: loopStat})
      this.params.nextTick = this.nextTick(this.params.numerator) // next
    } // end nextBar

  } // end customPlay

  handleTable (event) {
    const {loopTable, loopTableNewRow} = this.state
//    let {loopTableNewRow} = this.state

    if (event.target.name === 'setLoopTable') {
      this.setState({loopTable: event.target.value})
      return
    }

    if (event.target.name === 'loopDel') {
      loopTable.splice(event.target.value, 1)
      this.setState({loopTable: loopTable})
      return
    }

    if (event.target.name === 'loopAdd') {
      if (event.target.value === 'drum') {
        loopTableNewRow.bar =
          loadedDrumPatterns[this.state.drumPatternNo]
      } else if (event.target.value === 'click') {
        loopTableNewRow.bar =
          loadedClickPatterns[this.state.clickPatternNo]
      }

      loopTable.push({bar: loopTableNewRow.bar,
        repeat: loopTableNewRow.repeat})
      this.setState({loopTable: loopTable})
      return
    }

    if (event.target.name === 'loopAddClickPattern') {
      let clickPatternNo = parseInt(event.target.value, 10)
      this.setState({clickPatternNo: clickPatternNo})
      return
    }

    if (event.target.name === 'loopAddDrumPattern') {
      let drumPatternNo = parseInt(event.target.value, 10)
      this.setState({drumPatternNo: drumPatternNo})
      return
    }

    if (event.target.name === 'loopRepeat') {
      loopTableNewRow.repeat = parseInt(event.target.value, 10)
      this.setState({loopTableNewRow: loopTableNewRow})
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
        // this.setState({selectedSong: song})

        if (song.bar !== undefined) { // HERE
          this.handlePattern({target: {name: 'setBar', value: song.bar}})
          this.handleBpm({target: {name: 'bpm_set',
            value: parseFloat(song.bpm, 10)}})
          return
        }  // end bar pattern

        if (song.table !== undefined) {
          this.state.loopTable.splice(0, this.state.loopTable.length) // clear
          this.handleBpm(
            {target: {name: 'bpm_set',
              value: parseFloat(song.bpm, 10)}}
          )
          this.handleTable({target: {name: 'setLoopTable', value: song.table}})
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
      } // end top

      if (event.target.value.match(/^move/)) {
        let values = event.target.value.split(':')
        let current = songItems[parseInt(names[1], 10)]
        songItems.splice(parseInt(values[1], 10) + 1, 0, current)
        if (parseInt(values[1], 10) < parseInt(names[1], 10)) { songItems.splice(parseInt(names[1], 10) + 1, 1) } else if (parseInt(values[1], 10) > parseInt(names[1], 10)) { songItems.splice(parseInt(names[1], 10), 1) } else {} // console.log('no effect')
        this.setState({showSongList: true})
        return
      } // end move

      if (event.target.value === 'delete') {
        // console.log(names[1] + ' delete')
        songItems.splice(parseInt(names[1], 10), 1)
        this.saveSetLists()
        this.setState({showSongList: true})
        return
      }
    }

    if (event.target.name === 'addSong') {
      if (event.target.value === 'bar') {
        // console.log('addSong preset')
        this.state.selectedSetList.items.push({
          song: this.params.newSongName,
          bar: this.params.currentPattern,
          bpm: parseFloat(this.state.bpm, 10).toFixed(1)})
      }

      if (event.target.value === 'loop') {
        // console.log('addSong loop')
        if (this.state.loopTable.length > 0) {
          this.state.selectedSetList.items.push({
            song: this.params.newSongName,
            table: this.state.loopTable,
            bpm: parseFloat(this.state.bpm, 10).toFixed(1)})
        } else {} // console.log('addSong loop is empty')
      } // end addSong

      this.saveSetLists()
      this.setState({showSongList: true})
      return
    }

    if (event.target.name === 'newSong') {
      this.params.newSongName = event.target.value
    }
  } // end handleSetLists

  startStopDrums (event) {
// Unlock iOS 
     let buffer = context.createBuffer(1,1,22050); 
     let source = context.createBufferSource();
     source.buffer = buffer;
     source.connect (context.destination);
     source.start();
// End unlock
    if (event.target.name === 'startStop') {
      if (this.state.loopStat.playing) {
        this.customPlay({target: {name: 'stop'}})
      }

      if (this.state.playing) {
        this.startStopDrums({target: {name: 'stop'}})
      } else {
        this.startStopDrums({target: {name: 'start'}})
      }
      this.setState({playing: !this.state.playing})
    }

/* actual process */
    if (event.target.name === 'stop') {
      for (let beat = 0; beat < this.tickEvents.length; beat++) { this.tickEvents[beat].clear() }
      this.tickEvents.splice(0, this.tickEvents.length)
      this.handleTimer({target: {name: 'clearTimer'}})
      return
    }

    if (event.target.name === 'start') {
      if (clock === undefined){
       clock = new WAAClock(context)
       timerClock = clock
       clock.start()
      }
      const selected = this.params.currentPattern
      // console.log('start with: ' + selected.name)
      this.params.numerator = selected.numerator
      this.params.denominator = selected.denominator

      let clickPmin = this.state.bpm * (this.params.denominator / 4)

      this.params.count = 0
      this.params.startTime = context.currentTime
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

      this.handleTimer({target: {name: 'startTimer'}})
      return
    } // end start

    if (event.target.name === 'restart' && this.state.playing) {
      console.log('restart')
      this.startStopDrums({target: {name: 'stop'}})
      clock.setTimeout(function (event) {
        this.startStopDrums({target: {name: 'start'}})
      }.bind(this), 0.02)
       .tolerance({early: early, late: late}) // tight early tolerance
    } // end restart
  } // end startStopDrums()

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

  playPattern (deadline) {
    const sound = this.sound
    const {bpm, restBars, metroSound, voiceOn, voice, increment,
           perBars, muteBars, muteProb, evenVol} = this.state
    const {maxBpm, minBpm, barTimer, currentPattern, numerator,
           triplet} = this.params
    let {muteCount, muteStat, count, barCount} = this.params

    // bar timer
    if (barTimer > 0 && restBars <= 0) {
      this.startStopDrums({target: {name: 'stop'}})
      this.setState({playing: false, restBars: barTimer})
      return
    }

    // automatic bpm increment
    if ((perBars > 0) && (count === 0) && (barCount > 0) &&
        (barCount % perBars) === 0) {
      let newBpm = parseFloat(bpm) + parseFloat(increment)
      if (newBpm > maxBpm) newBpm = maxBpm
      if (newBpm < minBpm) newBpm = minBpm
      this.handleBpm({target: {name: 'bpm_set', value: newBpm.toFixed(1)}})
    } // end automatic bpm increment

// random mute
    if (muteBars > 0 && muteProb > 0 && count === 0) {
      if (muteCount === muteBars) {
        muteStat = false
        muteCount = 0
      } else {
        if (muteStat) {
          muteCount++
        } else if (Math.random() < parseFloat(muteProb)) {
          muteStat = true
          muteCount++
        }
      }
    } // end random mute

    let source = []
    let master = this.state.masterVol/100;

    if (triplet) {
      if (count % 3 !== 2) master = this.state.masterVol/100 * evenVol
    } else {
      if (count % 2 === 0) master = this.state.masterVol/100 * evenVol
    }

    if (currentPattern.type === 'drumkit') { // last note is always voice
      for (let i = 0; i < currentPattern.pattern.length - 1; i++) {
        const current = currentPattern.pattern[i]
        if (current.values[count] === 0) continue

        source[i] = context.createBufferSource()
        source[i].buffer = sound[current.note]
        source[i].connect(gainNode[i])
        gainNode[i].connect(context.destination)
        gainNode[i].gain.value =
          master * parseInt(current.values[count], 10) / 9.0
        source[i].start(deadline)
      }
    } // end drumkit

    const lastIndex = currentPattern.pattern.length - 1

    /* voice */
    const current = currentPattern.pattern[lastIndex]
    if (voiceOn && (current.note === 'voice') && (current.values[count] > 0)) {
      source[lastIndex] = context.createBufferSource()
      source[lastIndex].buffer = sound[voice + '_' + current.values[count]]
      source[lastIndex].connect(gainNode[lastIndex])
      gainNode[lastIndex].connect(context.destination)
      if (!muteStat){
        gainNode[lastIndex].gain.value = 0.5 * this.state.masterVol/100
        source[lastIndex].start(deadline)
      }
    }

    /* mute */
    if (currentPattern.type === 'clicks') {
      // console.log('clicks ' + metroSound)
      for (let i = 0; i < lastIndex; i++) { source[i] = context.createBufferSource() }

      if (metroSound === 'cb1') {
        source[0].buffer = sound['cowbell_higher']
        source[1].buffer = sound['cowbell_higher']
        if (lastIndex - 1 > 1) { source[lastIndex - 1].buffer = sound['cowbell_higher'] }
      }
      if (metroSound === 'cb2') {
        source[0].buffer = sound['cowbell_high']
        source[1].buffer = sound['cowbell_high']
        if (lastIndex - 1 > 1) { source[lastIndex - 1].buffer = sound['cowbell_high'] }
      }

      if (metroSound === 'cb3') {
        source[0].buffer = sound['cowbell_mid']
        source[1].buffer = sound['cowbell_mid']
        if (lastIndex - 1 > 1) { source[lastIndex - 1].buffer = sound['cowbell_mid'] }
      }

      if (metroSound === 'cb4') {
        source[0].buffer = sound['cowbell_low']
        source[1].buffer = sound['cowbell_low']
        if (lastIndex - 1 > 1) { source[lastIndex - 1].buffer = sound['cowbell_low'] }
      }
      if (metroSound === 'cb5') {
        source[0].buffer = sound['cowbell_lower']
        source[1].buffer = sound['cowbell_lower']
        if (lastIndex - 1 > 1) { source[lastIndex - 1].buffer = sound['cowbell_lower'] }
      }
      if (metroSound === '2cb1') {
        source[0].buffer = sound['cowbell_higher']
        source[1].buffer = sound['cowbell_high']
        if (lastIndex - 1 > 1) { source[lastIndex - 1].buffer = sound['cowbell_high'] }
      }
      if (metroSound === '2cb2') {
        source[0].buffer = sound['cowbell_high']
        source[1].buffer = sound['cowbell_mid']
        if (lastIndex - 1 > 1) { source[lastIndex - 1].buffer = sound['cowbell_mid'] }
      }
      if (metroSound === '2cb3') {
        source[0].buffer = sound['cowbell_mid']
        source[1].buffer = sound['cowbell_low']
        if (lastIndex - 1 > 1) { source[lastIndex - 1].buffer = sound['cowbell_low'] }
      }
      if (metroSound === '2cb4') {
        source[0].buffer = sound['cowbell_low']
        source[1].buffer = sound['cowbell_lower']
        if (lastIndex - 1 > 1) { source[lastIndex - 1].buffer = sound['cowbell_lower'] }
      }
      if (metroSound === '3cb1') {
        source[0].buffer = sound['cowbell_higher']
        source[1].buffer = sound['cowbell_high']
        if (lastIndex - 1 > 1) { source[lastIndex - 1].buffer = sound['cowbell_mid'] }
      }
      if (metroSound === '3cb2') {
        source[0].buffer = sound['cowbell_high']
        source[1].buffer = sound['cowbell_mid']
        if (lastIndex - 1 > 1) { source[lastIndex - 1].buffer = sound['cowbell_low'] }
      }
      if (metroSound === '3cb3') {
        source[0].buffer = sound['cowbell_mid']
        source[1].buffer = sound['cowbell_low']
        if (lastIndex - 1 > 1) { source[lastIndex - 1].buffer = sound['cowbell_lower'] }
      }
      if (metroSound === '1cg1') {
        source[0].buffer = sound['highConga']
        source[1].buffer = sound['highConga']
        if (lastIndex - 1 > 1) { source[lastIndex - 1].buffer = sound['highConga'] }
      }
      if (metroSound === '1cg2') {
        source[0].buffer = sound['midConga']
        source[1].buffer = sound['midConga']
        if (lastIndex - 1 > 1) { source[lastIndex - 1].buffer = sound['midConga'] }
      }
      if (metroSound === '1cg3') {
        source[0].buffer = sound['lowConga']
        source[1].buffer = sound['lowConga']
        if (lastIndex - 1 > 1) { source[lastIndex - 1].buffer = sound['lowConga'] }
      }
      if (metroSound === '2cg1') {
        source[0].buffer = sound['highConga']
        source[1].buffer = sound['midConga']
        if (lastIndex - 1 > 1) { source[lastIndex - 1].buffer = sound['midConga'] }
      }
      if (metroSound === '2cg2') {
        source[0].buffer = sound['midConga']
        source[1].buffer = sound['lowConga']
        if (lastIndex - 1 > 1) { source[lastIndex - 1].buffer = sound['lowConga'] }
      }
      if (metroSound === '3cg') {
        source[0].buffer = sound['highConga']
        source[1].buffer = sound['midConga']
        if (lastIndex - 1 > 1) { source[lastIndex - 1].buffer = sound['lowConga'] }
      }
      if (metroSound === 'cv') {
        source[0].buffer = sound['clave']
        source[1].buffer = sound['clave']
        if (lastIndex - 1 > 1) { source[lastIndex - 1].buffer = sound['clave'] }
      }
      if (metroSound === 'hc') {
        source[0].buffer = sound['handClap']
        source[1].buffer = sound['handClap']
        if (lastIndex - 1 > 1) { source[lastIndex - 1].buffer = sound['handClap'] }
      }

      if (!muteStat) {
        for (let i = 0; i < lastIndex; i++) {
          let vol = parseInt(currentPattern.pattern[i].values[count], 10)
          if (vol === 0) continue
          source[i].connect(gainNode[i])
          gainNode[i].connect(context.destination)
          gainNode[i].gain.value = master * vol / 9.0
          source[i].start(deadline)
        }
      } // end !muteStat
    } // end clicks or drums

    // next count
    count = (count + 1) % numerator
    if (count === 0) {
      barCount++
      if (this.state.restBars > 0) { this.setState({restBars: this.state.restBars - 1}) }
    }
    this.params.count = count
    this.params.barCount = barCount
    this.params.muteCount = muteCount
    this.params.muteStat = muteStat

    if (this.state.loopStat.playing && count === 0) { this.customPlay({target: {name: 'nextBar'}}) }
  } // end playPattern

  handleTimer (event) {
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

    if (event.target.name === 'startTimer' && this.params.timer > 0) {
      this.timerEvent = timerClock.callbackAtTime(function (event) {
        this.setState({rest: this.state.rest - 1})
      }.bind(this), 1).repeat(1)

      this.timeoutEvent = timerClock.setTimeout(function (event) {
        this.startStopDrums({target: {name: 'stop'}})
        this.setState({rest: this.params.timer})
      }.bind(this), this.state.rest)

      return
    } // end startTimer

    if (event.target.name === 'clearTimer' && this.params.timer > 0) {
      if (this.timerEvent) this.timerEvent.clear()
      if (this.timeoutEvent) this.timeoutEvent.clear()
      return
    } // end clearTimer

    if (event.target.name === 'startBarTimer') {
      return
    }

    if (event.target.name === 'clearBarTimer') {

    }
  } // end handleTimer()

  handleMenu (event) {
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
  } // end handleMenu()

  handlePattern (event) {
    if (event.target.name === 'metroOn') {
      this.params.currentPattern =
        loadedClickPatterns[this.state.clickPatternNo]
      this.setState({metroOn: true, drumsOn: false})
      this.startStopDrums({target: {name: 'restart'}})
      return
    }

    if (event.target.name === 'metroSound') {
      console.log(event.target.name)
      this.setState({metroSound: event.target.value})
      return
    }

    if (event.target.name === 'drumsOn') {
      this.params.currentPattern = loadedDrumPatterns[this.state.drumPatternNo]
      this.setState({metroOn: false, drumsOn: true})
      this.startStopDrums({target: {name: 'restart'}})
      return
    }

    if (event.target.name === 'voiceOn') {
      this.setState({voiceOn: !this.state.voiceOn})
      return
    }

    if (event.target.name === 'voice') {
      this.setState({voice: event.target.value})
      return
    }

 // SongList operation
    if (event.target.name === 'setBar') {
      const current = event.target.value
      this.params.currentPattern = current

      if (current.triplet === undefined) {
        this.params.triplet = false
      } else this.params.triplet = current.triplet

      if (current.swingVal === undefined) {
        this.params.swing = false
        current.swingVal = 1.5
      } else this.params.swing = true
      this.setState({swingVal: current.swingVal})

      let num = this.findNumByName(current.name)
      // console.log('NUM: ' + num)
      if (num < 0) return
      if (current.type === 'clicks') this.setState({clickPatternNo: num})
      else if (current.type === 'drumkit') this.setState({drumPatternNo: num})

      return
    }

    if ((event.target.name === 'drumPattern') ||
       (event.target.name === 'clickPattern')) {
      if (event.target.name === 'drumPattern') {
        // console.log('drumPattern')
        this.params.currentPattern =
          loadedDrumPatterns[parseInt(event.target.value, 10)]
        this.setState({drumsOn: true,
          metroOn: false,
          drumPatternNo: parseInt(event.target.value, 10)})
      }

      if (event.target.name === 'clickPattern') {
        console.log('clickPattern: ' + event.target.value)
        this.params.currentPattern =
          loadedClickPatterns[parseInt(event.target.value, 10)]
        this.setState({metroOn: true,
          drumsOn: false,
          clickPatternNo: parseInt(event.target.value, 10)})
      }

      if (this.params.currentPattern.triplet === undefined) {
        this.params.triplet = false
      } else this.params.triplet = this.params.currentPattern.triplet

      if (this.params.currentPattern.swingVal === undefined) {
        this.params.swing = false
        this.params.currentPattern.swingVal = 1.5
      } else this.params.swing = true

      this.setState({swingVal: this.params.currentPattern.swingVal})
      this.startStopDrums({target: {name: 'restart'}})
    }
  } // end handlePattern()

  handleBpm (event) {
    if (event.target.name === 'bpmFrac') {
      let bpmFrac = parseInt(event.target.value, 10)
      let newBpm = Math.floor(this.state.bpm) + 0.1 * bpmFrac
      this.handleBpm({target: {name: 'bpm_set', value: newBpm.toFixed(1)}})
      return
    }

    if (event.target.name === 'bpmStep') { // +-1
      let newBpm = parseFloat(this.state.bpm, 10) +
        parseInt(event.target.value, 10)
      this.handleBpm({target: {name: 'bpm_set', value: newBpm.toFixed(1)}})
      return
    }

    if (event.target.name === 'bpm_slider') { // slider
      let newBpm = parseInt(event.target.value, 10) +
        0.1 * parseInt(this.state.bpmFrac, 10)
      this.handleBpm({target: {name: 'bpm_set', value: newBpm.toFixed(1)}})
      return
    }

    if (event.target.name === 'bpm_set') { // actual process
      // console.log('bpm_set: ' + event.target.value)
      let newBpm = parseFloat(event.target.value, 10).toFixed(1)
      if (this.state.playing) {
        clock.timeStretch(context.currentTime, this.tickEvents,
        this.state.bpm / newBpm)
      }
      this.setState(
        {bpm: newBpm,
          bpmFrac: Math.round(10 * (newBpm - Math.floor(newBpm)))}
      )
      return
    } // end bpm_set

//  Tempo tap: https://www.all8.com/tools/bpm.htm
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
        this.handleBpm({target: {name: 'bpm_set', value: newBpm.toFixed(1)}})
        this.tap.count++
      }
      this.tap.msecsPrevious = msecs
    }
  } // end handleBpm()

  handleAdvanced (event) {
    if (event.target.name === 'increment') {
      this.setState({increment: parseInt(event.target.value, 10)})
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

      this.startStopDrums({target: {name: 'restart'}})
      return
    } // end swing

    if (event.target.name === 'muteProb') {
      this.setState({muteProb: parseFloat(event.target.value, 10).toFixed(1)})
      return
    }

    if (event.target.name === 'perBars') {
      this.setState({perBars: parseInt(event.target.value, 10)})
      return
    }

    if (event.target.name === 'muteBars') {
      this.setState({muteBars: parseInt(event.target.value, 10)})
      return
    }
    if (event.target.name === 'evenVol') {
      if (this.state.evenVol) { this.setState({evenVol: parseFloat(event.target.value)}) } else this.setState({evenVol: 1.0})
    }
  } // end handleAdvanced()

  handleWindowClose (event) { // finishing clean up
    this.startStopDrums({target: {name: 'stop'}})
    this.saveSetLists()
    clock.stop()
    context.close()
  }

  findNumByName (name) {
    for (let i = 0; i < loadedClickPatterns.length; i++) { if (loadedClickPatterns[i].name === name) return i }

    for (let i = 0; i < loadedDrumPatterns.length; i++) { if (loadedDrumPatterns[i].name === name) return i }

    return -1
  }

  handleVolume (e){
    if (e.target.name !== 'volumeSlider') return;
    this.setState({masterVol: parseInt(e.target.value)});
  }

} // end App

export default App
