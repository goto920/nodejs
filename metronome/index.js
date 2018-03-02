const load = require('audio-loader')
const play = require('audio-play')

load('resources/sample.wav').then(play)
