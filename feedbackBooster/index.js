const express = require('express')
const fs = require('fs')
const app = express()
const https = require('https')
// const path = require('path')
const jwt = require('jsonwebtoken')
const config = require('./config')
const bcrypt = require('bcrypt')

// load java program
const java = require('java')
// java.classpath.push('commons-lang3-3.1.jar')
// java.classpath.push('commons-io.jar')
java.classpath.push('./java/FeedbackBoosterNoGUI.jar')
java.options.push('-Xmx1024m')

var fb = null

// secret key(key.pem) and self signed public key(cert.pem)
const options = {
  key: fs.readFileSync('./config/key.pem'),
  cert: fs.readFileSync('./config/cert.pem')
}

const server = https.createServer(options, app)

app.use(express.static('./server')) // dir for index.html
app.use(express.static('./client/dist'))

// order is important
app.get('/api/getParams', function (req, res, next) {
  console.log('/api/getParams')

  //  check Javascript Web Token
  if (!req.headers.authorization) {
    res.json({authentication: false,
      message: '-ERR Missing JWT in Authentication header'})
    return
  }

  const token = req.headers.authorization.split(' ')[1] // After 'Bearer'

  // verify the token with public key
  try {
    jwt.verify(token, options.cert)
  } catch (err) {
    res.json({
      authentication: false,
      message: '-ERR JSON Web Token authentication failed: ' + err
    })
    return
  }

  if (fb === null) 
    fb = java.newInstanceSync('FeedbackBoosterNoGUI')

  let response = JSON.parse(fb.getParamsSync(req.query.op))
  if(typeof response !== 'undefined'){
    res.json({
      authentication: true,
      message: response.message,
      params:  response.params
    })
  } else {
    res.json({
      authentication: true,
      message: response.message
    })
  }

}) // end func

app.get('/api/setParams', function (req, res, next) {
  console.log('/api/setParams')

  //  check Javascript Web Token
  if (!req.headers.authorization) {
    res.json({authentication: false,
      message: '-ERR Missing JWT in Authorization: header'})
    console.log('/api/setParams missing JWT in Authorization header')
    return
  }
  const token = req.headers.authorization.split(' ')[1] // After 'Bearer'

  // verify the token with public key
  try {
    jwt.verify(token, options.cert)
  } catch (err) {
    res.json({
      authentication: false,
      message: '-ERR JSON Web Token authentication failed: ' + err
    })
    return
  }

  var ret
  if (typeof req.query.value !== 'undefined') {
    console.log('(op, value) = ' + req.query.op + ', ' + req.query.value)
    ret = fb.setParamsSync(req.query.op,req.query.value)
  } else {
    console.log('(op, value) = ' + req.query.op + ', null')
    ret = fb.setParamsSync(req.query.op, null)
  }
  var response = JSON.parse(ret)

  res.json({ 
    authentication: true,
    message: response.message,
    params: response.params
  })

   // delete the fb instance (hopefully player thread will stop)
  if(req.query.op === 'finish') {
    fb = null 
    console.log('fb instance nulled')
  }
})

app.get('/api/loginJWT', function (req, res, next) {
  console.log('/api/loginJWT')

  //  check Javascript Web Token
  if (!req.headers.authorization) {
    res.json({authentication: false,
      message: 'Missing JWT in Authorization: header'})
    return
  }

  const token = req.headers.authorization.split(' ')[1] // After 'Bearer'

  // verify the token with public key
  try {
    jwt.verify(token, options.cert)
    res.json({authentication: true,
      message: 'JSON Web Token authentication OK'})
  } catch (err) {
    res.json({authentication: false,
      message: 'JSON Web Token authentication failed: ' + err})
  }
})

app.get('/api/login', function (req, res, next) {
  console.log('/login')

   // check id and password (use bcrypt() later)
  if (req.query.id !== config.id) {
    res.json({authentication: false,
      message: 'Password authentication failed (invalid id)',
      'token': ''})
    return
  }

  if (!bcrypt.compareSync(req.query.pw, config.pw)) {
    res.json({authentication: false,
      message: 'Password authentication failed (invalid pw)',
      'token': ''})
    return
  }

   // generate JSON web token
  const token = jwt.sign({ id: req.query.id },
                   options.key, { algorithm: 'RS256' })
  res.json({authentication: true,
    message: 'Password authentication OK',
    token: token})
})

// start https server at the end
server.listen(3000, () => {
  console.log('Server is running on https://localhost:3000')
})
