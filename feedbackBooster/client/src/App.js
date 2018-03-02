import React from 'react'
import { BrowserRouter as Router, Route, Link, Redirect, Switch }
  from 'react-router-dom'

class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      hasToken: false
    }
  }

  render () {
    return (
      <div>
        <Router>
          <Switch>
            <Route exact path='/' component={Home} />
            <Route path='/LoginJWT' component={LoginJWT} />
            <Route path='/clearToken' component={clearToken} />
            <Route path='/ApplicationUI' component={ApplicationUI} />
            <Route path='/LoginForm' component={LoginForm} />
          </Switch>
        </Router>
      </div>
    )
  } // end render()
} // end App()

class Home extends React.Component {
  render () {
//    console.log('Home Component')

    const token = localStorage.getItem('token')
    if (typeof token !== 'undefined') {
      return (<div>
        <ul>
          <li><Link to='/LoginJWT'>Link to LoginJWT</Link></li>
          <li><Link to='/clearToken'>Link to clearToken</Link>(for test)</li>
        </ul>
      </div>)
      // return(<div><Redirect to='/LoginJWT' /></div>)
    } else {
      return (<div>
        <ul>
          <li><Link to='/LoginForm'>Link to LoginForm</Link></li>
        </ul></div>)
    }
  }
} // end Home

class LoginJWT extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      authenticated: false,
      message: ''
    }
    this.setState = this.setState.bind(this)
    this.apiLogin = this.apiLogin.bind(this)
  }

  componentWillMount () {
    const token = localStorage.getItem('token')
    if (typeof token === 'undefined')
      this.setState({
        authenticated: false, 
        message: 'Local: No JWT in localStorage'
      })
    this.apiLogin()
  }

  apiLogin () {
    const token = localStorage.getItem('token')
    const xhr = new XMLHttpRequest()
    xhr.open('get', '/api/loginJWT', true)
      // async(true), synchronous(false)
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
    xhr.setRequestHeader('Authorization', 'Bearer ' + token)
    xhr.responseType = 'json'
    xhr.addEventListener('load', function () {
      if (xhr.status === 200) {
        this.setState({authenticated: xhr.response.authentication,
          message: 'Server: ' + xhr.response.message})
      } else {
        this.setState({authenticated: false,
          message: 'Local: HTTP status != 200'})
      }
    }.bind(this))

    xhr.send()
  } // end apiLogin()

  render () {

    if (this.state.authenticated) {
      return (<div>{this.state.message}<br />
        <Link to='/ApplicationUI'>Start Application</Link></div>)
    } else {
      return (<div>{this.state.message}<br />
        Try <Link to='/LoginForm'>Login Form</Link></div>)
    }
  }
} // end loginJWT

class clearToken extends React.Component {
  constructor (props) {
    super(props)
    localStorage.removeItem('token')
  }

  render () {
    const token = localStorage.getItem('token')
    if (typeof token === 'undefined') {
      return (<div>Token Cleared.<br />
        <Redirect to='/LoginForm' /></div>)
    }
  }
}

class LoginForm extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      id: '',
      pw: '',
      hasToken: false,
      message: 'Local: Not authenticated'
    }
    this.changeValue = this.changeValue.bind(this)
    this.sendForm = this.sendForm.bind(this)
    this.setState = this.setState.bind(this)
  }

  render () {
//    console.log('LoginForm render()')

    if (this.state.hasToken) {
//      const token = localStorage.getItem('token')
      return (
        <div>{this.state.message}<br />
          <Link to='/ApplicationUI'>Start Application</Link>
        </div>)
    }

    return (
      <div>
        <h3>Login</h3>
        {this.state.message}
        <hr />
        <form onSubmit={this.sendForm}>
     User: <input type='text' name='id' value={this.state.id}
       onChange={this.changeValue} /><br />
     Pass: <input type='password' name='pw' value={this.state.pw}
       onChange={this.changeValue} /><br />
          <input type='submit' value='Submit' />
        </form>
      </div>
    )
  }

  changeValue (e) {
    e.preventDefault()
    this.setState({[e.target.name]: e.target.value})
  }

  sendForm (e) {
    e.preventDefault() // required
    // console.log('sendForm called')

    const id = encodeURIComponent(this.state.id)
    const pw = encodeURIComponent(this.state.pw)
    const formData = `id=${id}&pw=${pw}`

    const xhr = new XMLHttpRequest()
    xhr.open('get', `/api/login?${formData}`, true)
      // async(true), synchronous(false)
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
    xhr.responseType = 'json'

    xhr.addEventListener('load', function () {
      if (xhr.status === 200) {
        if (xhr.response.authentication) {
          localStorage.setItem('token', xhr.response.token)
          this.setState({hasToken: true, 
           message: 'Server: ' + xhr.response.message})
        } else { this.setState({
            hasToken: false, 
            message: 'Server: ' + xhr.response.message}) }
        return
      }

     this.setState({
        hasToken: false,
        message: 
        'Authentication failed, HTTP status code = ' + xhr.status
        })

    }.bind(this)) // magic

    xhr.send(formData)
  }
} // end LoginForm

class ApplicationUI extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      authenticated: false,
      message: null,
      params: {
        iPorts: null,
        oPorts: null,
        iPort: null,
        oPort: null,
        playing: null,
        bypass: null,
        autoEQ: null,
        peakHz: null,
        eqGain: null,
        octMix: null,
        Q: null,
        compGain: null,
        compRatio: null,
        compThresh: null,
        volume: null
      } // set by the server
    }
    this.setState = this.setState.bind(this)
    this.apiGet = this.apiGet.bind(this)
    this.selectPort = this.selectPort.bind(this)
    this.playerControl = this.playerControl.bind(this)
    this.sliderControl = this.sliderControl.bind(this)
    this.handleWindowClose = this.handleWindowClose.bind(this)
  }

  componentWillMount () {
    const token = localStorage.getItem('token')

    if (!token) {
      console.log('Missming JWT')
      return
    }

    this.apiGet('getDefaults', null) // Command, value
  } // end componentWillMount()

  componentDidMount() {
    window.addEventListener('beforeunload', this.handleWindowClose)
  }

  componentWillUnMount() {
    window.removeEventListener('beforeunload', this.handleWindowClose)
  }

  handleWindowClose(event) {
    const token = localStorage.getItem('token')
    const xhr = new XMLHttpRequest()
    xhr.open('get', '/api/setParams?op=finish')
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
    xhr.setRequestHeader('Authorization', 'Bearer ' + token)
    xhr.send()
    // no need to get the response
  }

  apiGet (op, value) { // get or set parameters using GET request 
    const token = localStorage.getItem('token')
    const xhr = new XMLHttpRequest()

    if (op.startsWith('get'))
      xhr.open('get', '/api/getParams/?op=' + op) 
    else if (op.startsWith('set'))
      xhr.open('get', '/api/setParams/?op=' + op + '&value=' + value) 
    // xhr.open(method, URL, true/false) -- default asynchronous(false)

    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
    xhr.setRequestHeader('Authorization', 'Bearer ' + token)
    xhr.responseType = 'json'

    xhr.addEventListener('load', function () { // async
      if (xhr.status === 200) {
        let params = this.state.params
        Object.assign(params, xhr.response.params)
        this.setState({
          authenticated: xhr.response.authentication,
          message: 'Server: ' + xhr.response.message,
          params: params
        })
      }
    }.bind(this)) // end addEventListener

    xhr.send()
  } // end apiGet()

  render () {
    // console.log('ApplicationUI')

    if (!this.state.authenticated) 
       return (<div>Server: {this.state.message}</div>)

    if (!this.state.params) return (<div>loading..</div>)

    const ioptions = this.state.params.iPorts.map(e => {
      return (<option value={e.id} key={e.key}>{e.id}: {e.key}</option>)
    })

    const ooptions = this.state.params.oPorts.map(e => {
      return (<option value={e.id} key={e.key}>{e.id}: {e.key}</option>)
    })

    let params = this.state.params
    let peakHz = 41.2 * Math.pow(2.0,params.peakHz.value/12.0)
    peakHz = peakHz.toFixed(2)

    return (
      <div>
        <h1>Feedback Booster UI</h1>
        {this.state.message}<br />

        <table border='3'>
          <tbody>
            <tr>
              <td><select name='iPort' onChange={this.selectPort}>
                <option defaultValue='-1' key='key' >Select Input Port</option>
                {ioptions}</select>
              </td>
              <td>
                <select name='oPort' onChange={this.selectPort}>
                  <option defaultValue='-1' key='key' >Select Output Port</option>
                  {ooptions}</select>
              </td>
            </tr>

            <tr><td>Player control: </td>
              <td colSpan='2'>
              <div onChange={this.playerControl}>
              <input type='radio' name='player' 
                value='stop' defaultChecked />stop
              <input type='radio' name='player' value='bypass'  />bypass
              <input type='radio' name='player' value='process' />process
              </div>
              </td>
            </tr>

            <tr><td>Equalizer: </td>
              <td colSpan='2'>
                <div onChange={this.playerControl}>
                  <input type='radio' name='AutoEQ' value='false' />manual
       <input type='radio' name='AutoEQ' value='true' defaultChecked />auto
       </div>
              </td>
            </tr>

            <tr><td>peakHz: ({peakHz}) </td>
              <td>
                <input type='range' name='peakHz' 
                 min={params.peakHz.min} max={params.peakHz.max} 
                 value={params.peakHz.value} step='0.1'
                 onChange={this.sliderControl} />
              </td>
            <td> 
            <button name='setPeakHz' onClick={this.sliderControl}>Set</button>
            </td> 
            </tr>

            <tr><td>eqGain(dB): ({params.eqGain.value})</td>
              <td>
                <input type='range' name='eqGain' 
                 min={params.eqGain.min} max={params.eqGain.max} 
                 value={params.eqGain.value} onChange={this.sliderControl} />
              </td>
            <td> 
            <button name='setEQGain' onClick={this.sliderControl}>Set</button>
            </td> 
            </tr>

            <tr><td>octMix: ({params.octMix.value})</td>
              <td>
                <input type='range' name='octMix' 
                min={params.octMix.min} max={params.octMix.max}
                value={params.octMix.value} step='0.1'
                onChange={this.sliderControl} />
              </td>
            <td> 
            <button name='setOctMix' onClick={this.sliderControl}>Set</button>
            </td> 
            </tr>

            <tr><td>Q: ({params.Q.value})</td>
              <td>
                <input type='range' name='Q' 
                  min={params.Q.min}  max={params.Q.max} 
                  value={params.Q.value} step='0.1'
                  onChange={this.sliderControl} />
              </td>
            <td> 
            <button name='setQ' onClick={this.sliderControl}>Set</button>
            </td> 
            </tr>
            <tr><td colSpan='3'>Comp</td></tr>

            <tr><td>--Gain(dB): ({params.compGain.value})</td>
              <td>
                <input type='range' name='compGain' 
                 min={params.compGain.min} max={params.compGain.max} 
                 value={params.compGain.value} onChange={this.sliderControl} />
              </td>
            <td> 
            <button name='setCompGain' onClick={this.sliderControl}>Set</button>
            </td> 
            </tr>

            <tr><td>--Ratio: ({params.compRatio.value})</td>
              <td>
                <input type='range' name='compRatio'  
                 min={params.compRatio.min} max={params.compRatio.max} 
                 value={params.compRatio.value} step='0.1'
                 onChange={this.sliderControl} />
              </td>
            <td> 
            <button name='setCompRatio' onClick={this.sliderControl}>Set</button>
            </td> 
            </tr>

            <tr><td>--Thresh(dB): ({params.compThresh.value})</td>
              <td>
                <input type='range' name='compThresh' 
                 min={params.compThresh.min} max={params.compThresh.max} 
                 value={params.compThresh.value} onChange={this.sliderControl} />
              </td>
            <td> 
            <button name='setCompThresh' onClick={this.sliderControl}>Set</button>
            </td> 
            </tr>

            <tr><td>Volume: ({params.volume.value})</td>
              <td>
                <input type='range' name='volume' 
                 min={params.volume.min} max={params.volume.max} 
                 value={params.volume.value} onChange={this.sliderControl} />
              </td>
            <td> 
            <button name='setVolume' onClick={this.sliderControl}>Set</button>
            </td> 
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  selectPort (event) {
    if (event.target.name === 'iPort'){ 
      this.apiGet('setIPort', event.target.value)
      this.setState({iPort: event.target.value})
    }
    
    if (event.target.name === 'oPort'){ 
      this.apiGet('setOPort', event.target.value)
      this.setState({oPort: event.target.value})
    }

  }

  playerControl (event) {
    if (event.target.name === 'player') 
      this.apiGet('setPlayer', event.target.value)
    if (event.target.name === 'AutoEQ')
      this.apiGet('setAutoEQ', event.target.value)
  }

  sliderControl (event) {

    if (event.target.name.startsWith('set')){
      if (event.target.name === 'setPeakHz')
         this.apiGet(event.target.name, this.state.params.peakHz.value)
      if (event.target.name === 'setEQGain')
         this.apiGet(event.target.name, this.state.params.eqGain.value)
      if (event.target.name === 'setOctMix')
         this.apiGet(event.target.name, this.state.params.octMix.value)
      if (event.target.name === 'setQ')
         this.apiGet(event.target.name, this.state.params.Q.value)
      if (event.target.name === 'setCompGain')
         this.apiGet(event.target.name, this.state.params.compGain.value)
      if (event.target.name === 'setCompRatio')
         this.apiGet(event.target.name, this.state.params.compRatio.value)
      if (event.target.name === 'setCompThresh')
         this.apiGet(event.target.name, this.state.params.compThresh.value)
      if (event.target.name === 'setVolume')
         this.apiGet(event.target.name, this.state.params.volume.value)
      return
    }

    let params = this.state.params

    if (event.target.name === 'peakHz')
       params.peakHz.value = event.target.value
    else if (event.target.name === 'eqGain')
       params.eqGain.value = event.target.value
    else if (event.target.name === 'octMix')
       params.octMix.value = event.target.value
    else if (event.target.name === 'Q')
       params.Q.value = event.target.value
    else if (event.target.name === 'compGain')
       params.compGain.value = event.target.value
    else if (event.target.name === 'compRatio')
       params.compRatio.value = event.target.value
    else if (event.target.name === 'compThresh')
       params.compThresh.value = event.target.value
    else if (event.target.name === 'volume')
       params.volume.value = event.target.value
    else {
     console.log('undefined target.name: ' + event.target.name) 
     return
    }
    this.setState({'params': params})
  }

}

export default App
