/*
https://www.html5rocks.com/ja/tutorials/webaudio/intro/js/buffer-loader.js
*/

export default function BufferLoader (context, urlList, callback) {
  this.context = context
  this.urlList = urlList
  this.onload = callback
  //  this.bufferList = new Array();
  this.bufferList = []
  this.loadCount = 0
}

BufferLoader.prototype.loadBuffer = function (url, index) {
  // Load buffer asynchronously
  var request = new XMLHttpRequest()
  request.open('GET', url, true)
  request.responseType = 'arraybuffer'

  var loader = this

  request.onload = function () {
    // Asynchronously decode the audio file data in request.response
    /*
    let arr = Array.prototype.slice.call(new Uint8Array(request.response))
    let arr1 = arr.map(function(item){
       return String.fromCharCode(item)
    })
    console.log(window.btoa(arr1.join('')))
*/

    loader.context.decodeAudioData(
      request.response,
      function (buffer) {
        if (!buffer) {
          alert('error decoding file data: ' + url)
          return
        }
        loader.bufferList[index] = buffer
        if (++loader.loadCount === loader.urlList.length) { loader.onload(loader.bufferList) }
      },
      function (error) {
        console.error('decodeAudioData error', error)
      }
    )
  }

  request.onerror = function () {
    alert('BufferLoader: XHR error')
  }

  request.send()
}

BufferLoader.prototype.load = function () {
  for (var i = 0; i < this.urlList.length; ++i) { this.loadBuffer(this.urlList[i], i) }
}
