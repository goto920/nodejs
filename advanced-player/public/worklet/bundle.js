(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],3:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":2,"buffer":3,"ieee754":4}],4:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],5:[function(require,module,exports){
(function (process){(function (){
// 'path' module extracted from Node.js v8.11.1 (only the posix part)
// transplited with Babel

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

function assertPath(path) {
  if (typeof path !== 'string') {
    throw new TypeError('Path must be a string. Received ' + JSON.stringify(path));
  }
}

// Resolves . and .. elements in a path with directory names
function normalizeStringPosix(path, allowAboveRoot) {
  var res = '';
  var lastSegmentLength = 0;
  var lastSlash = -1;
  var dots = 0;
  var code;
  for (var i = 0; i <= path.length; ++i) {
    if (i < path.length)
      code = path.charCodeAt(i);
    else if (code === 47 /*/*/)
      break;
    else
      code = 47 /*/*/;
    if (code === 47 /*/*/) {
      if (lastSlash === i - 1 || dots === 1) {
        // NOOP
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 /*.*/ || res.charCodeAt(res.length - 2) !== 46 /*.*/) {
          if (res.length > 2) {
            var lastSlashIndex = res.lastIndexOf('/');
            if (lastSlashIndex !== res.length - 1) {
              if (lastSlashIndex === -1) {
                res = '';
                lastSegmentLength = 0;
              } else {
                res = res.slice(0, lastSlashIndex);
                lastSegmentLength = res.length - 1 - res.lastIndexOf('/');
              }
              lastSlash = i;
              dots = 0;
              continue;
            }
          } else if (res.length === 2 || res.length === 1) {
            res = '';
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0)
            res += '/..';
          else
            res = '..';
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0)
          res += '/' + path.slice(lastSlash + 1, i);
        else
          res = path.slice(lastSlash + 1, i);
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (code === 46 /*.*/ && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}

function _format(sep, pathObject) {
  var dir = pathObject.dir || pathObject.root;
  var base = pathObject.base || (pathObject.name || '') + (pathObject.ext || '');
  if (!dir) {
    return base;
  }
  if (dir === pathObject.root) {
    return dir + base;
  }
  return dir + sep + base;
}

var posix = {
  // path.resolve([from ...], to)
  resolve: function resolve() {
    var resolvedPath = '';
    var resolvedAbsolute = false;
    var cwd;

    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path;
      if (i >= 0)
        path = arguments[i];
      else {
        if (cwd === undefined)
          cwd = process.cwd();
        path = cwd;
      }

      assertPath(path);

      // Skip empty entries
      if (path.length === 0) {
        continue;
      }

      resolvedPath = path + '/' + resolvedPath;
      resolvedAbsolute = path.charCodeAt(0) === 47 /*/*/;
    }

    // At this point the path should be resolved to a full absolute path, but
    // handle relative paths to be safe (might happen when process.cwd() fails)

    // Normalize the path
    resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);

    if (resolvedAbsolute) {
      if (resolvedPath.length > 0)
        return '/' + resolvedPath;
      else
        return '/';
    } else if (resolvedPath.length > 0) {
      return resolvedPath;
    } else {
      return '.';
    }
  },

  normalize: function normalize(path) {
    assertPath(path);

    if (path.length === 0) return '.';

    var isAbsolute = path.charCodeAt(0) === 47 /*/*/;
    var trailingSeparator = path.charCodeAt(path.length - 1) === 47 /*/*/;

    // Normalize the path
    path = normalizeStringPosix(path, !isAbsolute);

    if (path.length === 0 && !isAbsolute) path = '.';
    if (path.length > 0 && trailingSeparator) path += '/';

    if (isAbsolute) return '/' + path;
    return path;
  },

  isAbsolute: function isAbsolute(path) {
    assertPath(path);
    return path.length > 0 && path.charCodeAt(0) === 47 /*/*/;
  },

  join: function join() {
    if (arguments.length === 0)
      return '.';
    var joined;
    for (var i = 0; i < arguments.length; ++i) {
      var arg = arguments[i];
      assertPath(arg);
      if (arg.length > 0) {
        if (joined === undefined)
          joined = arg;
        else
          joined += '/' + arg;
      }
    }
    if (joined === undefined)
      return '.';
    return posix.normalize(joined);
  },

  relative: function relative(from, to) {
    assertPath(from);
    assertPath(to);

    if (from === to) return '';

    from = posix.resolve(from);
    to = posix.resolve(to);

    if (from === to) return '';

    // Trim any leading backslashes
    var fromStart = 1;
    for (; fromStart < from.length; ++fromStart) {
      if (from.charCodeAt(fromStart) !== 47 /*/*/)
        break;
    }
    var fromEnd = from.length;
    var fromLen = fromEnd - fromStart;

    // Trim any leading backslashes
    var toStart = 1;
    for (; toStart < to.length; ++toStart) {
      if (to.charCodeAt(toStart) !== 47 /*/*/)
        break;
    }
    var toEnd = to.length;
    var toLen = toEnd - toStart;

    // Compare paths to find the longest common path from root
    var length = fromLen < toLen ? fromLen : toLen;
    var lastCommonSep = -1;
    var i = 0;
    for (; i <= length; ++i) {
      if (i === length) {
        if (toLen > length) {
          if (to.charCodeAt(toStart + i) === 47 /*/*/) {
            // We get here if `from` is the exact base path for `to`.
            // For example: from='/foo/bar'; to='/foo/bar/baz'
            return to.slice(toStart + i + 1);
          } else if (i === 0) {
            // We get here if `from` is the root
            // For example: from='/'; to='/foo'
            return to.slice(toStart + i);
          }
        } else if (fromLen > length) {
          if (from.charCodeAt(fromStart + i) === 47 /*/*/) {
            // We get here if `to` is the exact base path for `from`.
            // For example: from='/foo/bar/baz'; to='/foo/bar'
            lastCommonSep = i;
          } else if (i === 0) {
            // We get here if `to` is the root.
            // For example: from='/foo'; to='/'
            lastCommonSep = 0;
          }
        }
        break;
      }
      var fromCode = from.charCodeAt(fromStart + i);
      var toCode = to.charCodeAt(toStart + i);
      if (fromCode !== toCode)
        break;
      else if (fromCode === 47 /*/*/)
        lastCommonSep = i;
    }

    var out = '';
    // Generate the relative path based on the path difference between `to`
    // and `from`
    for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
      if (i === fromEnd || from.charCodeAt(i) === 47 /*/*/) {
        if (out.length === 0)
          out += '..';
        else
          out += '/..';
      }
    }

    // Lastly, append the rest of the destination (`to`) path that comes after
    // the common path parts
    if (out.length > 0)
      return out + to.slice(toStart + lastCommonSep);
    else {
      toStart += lastCommonSep;
      if (to.charCodeAt(toStart) === 47 /*/*/)
        ++toStart;
      return to.slice(toStart);
    }
  },

  _makeLong: function _makeLong(path) {
    return path;
  },

  dirname: function dirname(path) {
    assertPath(path);
    if (path.length === 0) return '.';
    var code = path.charCodeAt(0);
    var hasRoot = code === 47 /*/*/;
    var end = -1;
    var matchedSlash = true;
    for (var i = path.length - 1; i >= 1; --i) {
      code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          if (!matchedSlash) {
            end = i;
            break;
          }
        } else {
        // We saw the first non-path separator
        matchedSlash = false;
      }
    }

    if (end === -1) return hasRoot ? '/' : '.';
    if (hasRoot && end === 1) return '//';
    return path.slice(0, end);
  },

  basename: function basename(path, ext) {
    if (ext !== undefined && typeof ext !== 'string') throw new TypeError('"ext" argument must be a string');
    assertPath(path);

    var start = 0;
    var end = -1;
    var matchedSlash = true;
    var i;

    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
      if (ext.length === path.length && ext === path) return '';
      var extIdx = ext.length - 1;
      var firstNonSlashEnd = -1;
      for (i = path.length - 1; i >= 0; --i) {
        var code = path.charCodeAt(i);
        if (code === 47 /*/*/) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else {
          if (firstNonSlashEnd === -1) {
            // We saw the first non-path separator, remember this index in case
            // we need it if the extension ends up not matching
            matchedSlash = false;
            firstNonSlashEnd = i + 1;
          }
          if (extIdx >= 0) {
            // Try to match the explicit extension
            if (code === ext.charCodeAt(extIdx)) {
              if (--extIdx === -1) {
                // We matched the extension, so mark this as the end of our path
                // component
                end = i;
              }
            } else {
              // Extension does not match, so our result is the entire path
              // component
              extIdx = -1;
              end = firstNonSlashEnd;
            }
          }
        }
      }

      if (start === end) end = firstNonSlashEnd;else if (end === -1) end = path.length;
      return path.slice(start, end);
    } else {
      for (i = path.length - 1; i >= 0; --i) {
        if (path.charCodeAt(i) === 47 /*/*/) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else if (end === -1) {
          // We saw the first non-path separator, mark this as the end of our
          // path component
          matchedSlash = false;
          end = i + 1;
        }
      }

      if (end === -1) return '';
      return path.slice(start, end);
    }
  },

  extname: function extname(path) {
    assertPath(path);
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0;
    for (var i = path.length - 1; i >= 0; --i) {
      var code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46 /*.*/) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1)
            startDot = i;
          else if (preDotState !== 1)
            preDotState = 1;
      } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 ||
        // We saw a non-dot character immediately before the dot
        preDotState === 0 ||
        // The (right-most) trimmed path component is exactly '..'
        preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      return '';
    }
    return path.slice(startDot, end);
  },

  format: function format(pathObject) {
    if (pathObject === null || typeof pathObject !== 'object') {
      throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
    }
    return _format('/', pathObject);
  },

  parse: function parse(path) {
    assertPath(path);

    var ret = { root: '', dir: '', base: '', ext: '', name: '' };
    if (path.length === 0) return ret;
    var code = path.charCodeAt(0);
    var isAbsolute = code === 47 /*/*/;
    var start;
    if (isAbsolute) {
      ret.root = '/';
      start = 1;
    } else {
      start = 0;
    }
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    var i = path.length - 1;

    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0;

    // Get non-dir info
    for (; i >= start; --i) {
      code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46 /*.*/) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1) startDot = i;else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 ||
    // We saw a non-dot character immediately before the dot
    preDotState === 0 ||
    // The (right-most) trimmed path component is exactly '..'
    preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      if (end !== -1) {
        if (startPart === 0 && isAbsolute) ret.base = ret.name = path.slice(1, end);else ret.base = ret.name = path.slice(startPart, end);
      }
    } else {
      if (startPart === 0 && isAbsolute) {
        ret.name = path.slice(1, startDot);
        ret.base = path.slice(1, end);
      } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
      }
      ret.ext = path.slice(startDot, end);
    }

    if (startPart > 0) ret.dir = path.slice(0, startPart - 1);else if (isAbsolute) ret.dir = '/';

    return ret;
  },

  sep: '/',
  delimiter: ':',
  win32: null,
  posix: null
};

posix.posix = posix;

module.exports = posix;

}).call(this)}).call(this,require('_process'))
},{"_process":6}],6:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],7:[function(require,module,exports){
(function (process){(function (){
var KissFFTModule = function(KissFFTModule) {
  KissFFTModule = KissFFTModule || {};
  var Module = KissFFTModule;

var Module;if(!Module)Module=(typeof KissFFTModule!=="undefined"?KissFFTModule:null)||{};var moduleOverrides={};for(var key in Module){if(Module.hasOwnProperty(key)){moduleOverrides[key]=Module[key]}}var ENVIRONMENT_IS_WEB=false;var ENVIRONMENT_IS_WORKER=false;var ENVIRONMENT_IS_NODE=false;var ENVIRONMENT_IS_SHELL=false;if(Module["ENVIRONMENT"]){if(Module["ENVIRONMENT"]==="WEB"){ENVIRONMENT_IS_WEB=true}else if(Module["ENVIRONMENT"]==="WORKER"){ENVIRONMENT_IS_WORKER=true}else if(Module["ENVIRONMENT"]==="NODE"){ENVIRONMENT_IS_NODE=true}else if(Module["ENVIRONMENT"]==="SHELL"){ENVIRONMENT_IS_SHELL=true}else{throw new Error("The provided Module['ENVIRONMENT'] value is not valid. It must be one of: WEB|WORKER|NODE|SHELL.")}}else{ENVIRONMENT_IS_WEB=typeof window==="object";ENVIRONMENT_IS_WORKER=typeof importScripts==="function";ENVIRONMENT_IS_NODE=typeof process==="object"&&typeof require==="function"&&!ENVIRONMENT_IS_WEB&&!ENVIRONMENT_IS_WORKER;ENVIRONMENT_IS_SHELL=!ENVIRONMENT_IS_WEB&&!ENVIRONMENT_IS_NODE&&!ENVIRONMENT_IS_WORKER}if(ENVIRONMENT_IS_NODE){if(!Module["print"])Module["print"]=console.log;if(!Module["printErr"])Module["printErr"]=console.warn;var nodeFS;var nodePath;Module["read"]=function shell_read(filename,binary){if(!nodeFS)nodeFS=require("fs");if(!nodePath)nodePath=require("path");filename=nodePath["normalize"](filename);var ret=nodeFS["readFileSync"](filename);return binary?ret:ret.toString()};Module["readBinary"]=function readBinary(filename){var ret=Module["read"](filename,true);if(!ret.buffer){ret=new Uint8Array(ret)}assert(ret.buffer);return ret};Module["load"]=function load(f){globalEval(read(f))};if(!Module["thisProgram"]){if(process["argv"].length>1){Module["thisProgram"]=process["argv"][1].replace(/\\/g,"/")}else{Module["thisProgram"]="unknown-program"}}Module["arguments"]=process["argv"].slice(2);process["on"]("uncaughtException",(function(ex){if(!(ex instanceof ExitStatus)){throw ex}}));Module["inspect"]=(function(){return"[Emscripten Module object]"})}else if(ENVIRONMENT_IS_SHELL){if(!Module["print"])Module["print"]=print;if(typeof printErr!="undefined")Module["printErr"]=printErr;if(typeof read!="undefined"){Module["read"]=read}else{Module["read"]=function shell_read(){throw"no read() available"}}Module["readBinary"]=function readBinary(f){if(typeof readbuffer==="function"){return new Uint8Array(readbuffer(f))}var data=read(f,"binary");assert(typeof data==="object");return data};if(typeof scriptArgs!="undefined"){Module["arguments"]=scriptArgs}else if(typeof arguments!="undefined"){Module["arguments"]=arguments}if(typeof quit==="function"){Module["quit"]=(function(status,toThrow){quit(status)})}}else if(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER){Module["read"]=function shell_read(url){var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.send(null);return xhr.responseText};if(ENVIRONMENT_IS_WORKER){Module["readBinary"]=function readBinary(url){var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.responseType="arraybuffer";xhr.send(null);return new Uint8Array(xhr.response)}}Module["readAsync"]=function readAsync(url,onload,onerror){var xhr=new XMLHttpRequest;xhr.open("GET",url,true);xhr.responseType="arraybuffer";xhr.onload=function xhr_onload(){if(xhr.status==200||xhr.status==0&&xhr.response){onload(xhr.response)}else{onerror()}};xhr.onerror=onerror;xhr.send(null)};if(typeof arguments!="undefined"){Module["arguments"]=arguments}if(typeof console!=="undefined"){if(!Module["print"])Module["print"]=function shell_print(x){console.log(x)};if(!Module["printErr"])Module["printErr"]=function shell_printErr(x){console.warn(x)}}else{var TRY_USE_DUMP=false;if(!Module["print"])Module["print"]=TRY_USE_DUMP&&typeof dump!=="undefined"?(function(x){dump(x)}):(function(x){})}if(ENVIRONMENT_IS_WORKER){Module["load"]=importScripts}if(typeof Module["setWindowTitle"]==="undefined"){Module["setWindowTitle"]=(function(title){document.title=title})}}else{throw"Unknown runtime environment. Where are we?"}function globalEval(x){eval.call(null,x)}if(!Module["load"]&&Module["read"]){Module["load"]=function load(f){globalEval(Module["read"](f))}}if(!Module["print"]){Module["print"]=(function(){})}if(!Module["printErr"]){Module["printErr"]=Module["print"]}if(!Module["arguments"]){Module["arguments"]=[]}if(!Module["thisProgram"]){Module["thisProgram"]="./this.program"}if(!Module["quit"]){Module["quit"]=(function(status,toThrow){throw toThrow})}Module.print=Module["print"];Module.printErr=Module["printErr"];Module["preRun"]=[];Module["postRun"]=[];for(var key in moduleOverrides){if(moduleOverrides.hasOwnProperty(key)){Module[key]=moduleOverrides[key]}}moduleOverrides=undefined;var Runtime={setTempRet0:(function(value){tempRet0=value;return value}),getTempRet0:(function(){return tempRet0}),stackSave:(function(){return STACKTOP}),stackRestore:(function(stackTop){STACKTOP=stackTop}),getNativeTypeSize:(function(type){switch(type){case"i1":case"i8":return 1;case"i16":return 2;case"i32":return 4;case"i64":return 8;case"float":return 4;case"double":return 8;default:{if(type[type.length-1]==="*"){return Runtime.QUANTUM_SIZE}else if(type[0]==="i"){var bits=parseInt(type.substr(1));assert(bits%8===0);return bits/8}else{return 0}}}}),getNativeFieldSize:(function(type){return Math.max(Runtime.getNativeTypeSize(type),Runtime.QUANTUM_SIZE)}),STACK_ALIGN:16,prepVararg:(function(ptr,type){if(type==="double"||type==="i64"){if(ptr&7){assert((ptr&7)===4);ptr+=4}}else{assert((ptr&3)===0)}return ptr}),getAlignSize:(function(type,size,vararg){if(!vararg&&(type=="i64"||type=="double"))return 8;if(!type)return Math.min(size,8);return Math.min(size||(type?Runtime.getNativeFieldSize(type):0),Runtime.QUANTUM_SIZE)}),dynCall:(function(sig,ptr,args){if(args&&args.length){return Module["dynCall_"+sig].apply(null,[ptr].concat(args))}else{return Module["dynCall_"+sig].call(null,ptr)}}),functionPointers:[],addFunction:(function(func){for(var i=0;i<Runtime.functionPointers.length;i++){if(!Runtime.functionPointers[i]){Runtime.functionPointers[i]=func;return 2*(1+i)}}throw"Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS."}),removeFunction:(function(index){Runtime.functionPointers[(index-2)/2]=null}),warnOnce:(function(text){if(!Runtime.warnOnce.shown)Runtime.warnOnce.shown={};if(!Runtime.warnOnce.shown[text]){Runtime.warnOnce.shown[text]=1;Module.printErr(text)}}),funcWrappers:{},getFuncWrapper:(function(func,sig){if(!func)return;assert(sig);if(!Runtime.funcWrappers[sig]){Runtime.funcWrappers[sig]={}}var sigCache=Runtime.funcWrappers[sig];if(!sigCache[func]){if(sig.length===1){sigCache[func]=function dynCall_wrapper(){return Runtime.dynCall(sig,func)}}else if(sig.length===2){sigCache[func]=function dynCall_wrapper(arg){return Runtime.dynCall(sig,func,[arg])}}else{sigCache[func]=function dynCall_wrapper(){return Runtime.dynCall(sig,func,Array.prototype.slice.call(arguments))}}}return sigCache[func]}),getCompilerSetting:(function(name){throw"You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work"}),stackAlloc:(function(size){var ret=STACKTOP;STACKTOP=STACKTOP+size|0;STACKTOP=STACKTOP+15&-16;return ret}),staticAlloc:(function(size){var ret=STATICTOP;STATICTOP=STATICTOP+size|0;STATICTOP=STATICTOP+15&-16;return ret}),dynamicAlloc:(function(size){var ret=HEAP32[DYNAMICTOP_PTR>>2];var end=(ret+size+15|0)&-16;HEAP32[DYNAMICTOP_PTR>>2]=end;if(end>=TOTAL_MEMORY){var success=enlargeMemory();if(!success){HEAP32[DYNAMICTOP_PTR>>2]=ret;return 0}}return ret}),alignMemory:(function(size,quantum){var ret=size=Math.ceil(size/(quantum?quantum:16))*(quantum?quantum:16);return ret}),makeBigInt:(function(low,high,unsigned){var ret=unsigned?+(low>>>0)+ +(high>>>0)*+4294967296:+(low>>>0)+ +(high|0)*+4294967296;return ret}),GLOBAL_BASE:8,QUANTUM_SIZE:4,__dummy__:0};Module["Runtime"]=Runtime;var ABORT=0;var EXITSTATUS=0;function assert(condition,text){if(!condition){abort("Assertion failed: "+text)}}function getCFunc(ident){var func=Module["_"+ident];if(!func){try{func=eval("_"+ident)}catch(e){}}assert(func,"Cannot call unknown function "+ident+" (perhaps LLVM optimizations or closure removed it?)");return func}var cwrap,ccall;((function(){var JSfuncs={"stackSave":(function(){Runtime.stackSave()}),"stackRestore":(function(){Runtime.stackRestore()}),"arrayToC":(function(arr){var ret=Runtime.stackAlloc(arr.length);writeArrayToMemory(arr,ret);return ret}),"stringToC":(function(str){var ret=0;if(str!==null&&str!==undefined&&str!==0){var len=(str.length<<2)+1;ret=Runtime.stackAlloc(len);stringToUTF8(str,ret,len)}return ret})};var toC={"string":JSfuncs["stringToC"],"array":JSfuncs["arrayToC"]};ccall=function ccallFunc(ident,returnType,argTypes,args,opts){var func=getCFunc(ident);var cArgs=[];var stack=0;if(args){for(var i=0;i<args.length;i++){var converter=toC[argTypes[i]];if(converter){if(stack===0)stack=Runtime.stackSave();cArgs[i]=converter(args[i])}else{cArgs[i]=args[i]}}}var ret=func.apply(null,cArgs);if(returnType==="string")ret=Pointer_stringify(ret);if(stack!==0){if(opts&&opts.async){EmterpreterAsync.asyncFinalizers.push((function(){Runtime.stackRestore(stack)}));return}Runtime.stackRestore(stack)}return ret};var sourceRegex=/^function\s*[a-zA-Z$_0-9]*\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;function parseJSFunc(jsfunc){var parsed=jsfunc.toString().match(sourceRegex).slice(1);return{arguments:parsed[0],body:parsed[1],returnValue:parsed[2]}}var JSsource=null;function ensureJSsource(){if(!JSsource){JSsource={};for(var fun in JSfuncs){if(JSfuncs.hasOwnProperty(fun)){JSsource[fun]=parseJSFunc(JSfuncs[fun])}}}}cwrap=function cwrap(ident,returnType,argTypes){argTypes=argTypes||[];var cfunc=getCFunc(ident);var numericArgs=argTypes.every((function(type){return type==="number"}));var numericRet=returnType!=="string";if(numericRet&&numericArgs){return cfunc}var argNames=argTypes.map((function(x,i){return"$"+i}));var funcstr="(function("+argNames.join(",")+") {";var nargs=argTypes.length;if(!numericArgs){ensureJSsource();funcstr+="var stack = "+JSsource["stackSave"].body+";";for(var i=0;i<nargs;i++){var arg=argNames[i],type=argTypes[i];if(type==="number")continue;var convertCode=JSsource[type+"ToC"];funcstr+="var "+convertCode.arguments+" = "+arg+";";funcstr+=convertCode.body+";";funcstr+=arg+"=("+convertCode.returnValue+");"}}var cfuncname=parseJSFunc((function(){return cfunc})).returnValue;funcstr+="var ret = "+cfuncname+"("+argNames.join(",")+");";if(!numericRet){var strgfy=parseJSFunc((function(){return Pointer_stringify})).returnValue;funcstr+="ret = "+strgfy+"(ret);"}if(!numericArgs){ensureJSsource();funcstr+=JSsource["stackRestore"].body.replace("()","(stack)")+";"}funcstr+="return ret})";return eval(funcstr)}}))();Module["ccall"]=ccall;Module["cwrap"]=cwrap;function setValue(ptr,value,type,noSafe){type=type||"i8";if(type.charAt(type.length-1)==="*")type="i32";switch(type){case"i1":HEAP8[ptr>>0]=value;break;case"i8":HEAP8[ptr>>0]=value;break;case"i16":HEAP16[ptr>>1]=value;break;case"i32":HEAP32[ptr>>2]=value;break;case"i64":tempI64=[value>>>0,(tempDouble=value,+Math_abs(tempDouble)>=+1?tempDouble>+0?(Math_min(+Math_floor(tempDouble/+4294967296),+4294967295)|0)>>>0:~~+Math_ceil((tempDouble- +(~~tempDouble>>>0))/+4294967296)>>>0:0)],HEAP32[ptr>>2]=tempI64[0],HEAP32[ptr+4>>2]=tempI64[1];break;case"float":HEAPF32[ptr>>2]=value;break;case"double":HEAPF64[ptr>>3]=value;break;default:abort("invalid type for setValue: "+type)}}Module["setValue"]=setValue;function getValue(ptr,type,noSafe){type=type||"i8";if(type.charAt(type.length-1)==="*")type="i32";switch(type){case"i1":return HEAP8[ptr>>0];case"i8":return HEAP8[ptr>>0];case"i16":return HEAP16[ptr>>1];case"i32":return HEAP32[ptr>>2];case"i64":return HEAP32[ptr>>2];case"float":return HEAPF32[ptr>>2];case"double":return HEAPF64[ptr>>3];default:abort("invalid type for setValue: "+type)}return null}Module["getValue"]=getValue;var ALLOC_NORMAL=0;var ALLOC_STACK=1;var ALLOC_STATIC=2;var ALLOC_DYNAMIC=3;var ALLOC_NONE=4;Module["ALLOC_NORMAL"]=ALLOC_NORMAL;Module["ALLOC_STACK"]=ALLOC_STACK;Module["ALLOC_STATIC"]=ALLOC_STATIC;Module["ALLOC_DYNAMIC"]=ALLOC_DYNAMIC;Module["ALLOC_NONE"]=ALLOC_NONE;function allocate(slab,types,allocator,ptr){var zeroinit,size;if(typeof slab==="number"){zeroinit=true;size=slab}else{zeroinit=false;size=slab.length}var singleType=typeof types==="string"?types:null;var ret;if(allocator==ALLOC_NONE){ret=ptr}else{ret=[typeof _malloc==="function"?_malloc:Runtime.staticAlloc,Runtime.stackAlloc,Runtime.staticAlloc,Runtime.dynamicAlloc][allocator===undefined?ALLOC_STATIC:allocator](Math.max(size,singleType?1:types.length))}if(zeroinit){var ptr=ret,stop;assert((ret&3)==0);stop=ret+(size&~3);for(;ptr<stop;ptr+=4){HEAP32[ptr>>2]=0}stop=ret+size;while(ptr<stop){HEAP8[ptr++>>0]=0}return ret}if(singleType==="i8"){if(slab.subarray||slab.slice){HEAPU8.set(slab,ret)}else{HEAPU8.set(new Uint8Array(slab),ret)}return ret}var i=0,type,typeSize,previousType;while(i<size){var curr=slab[i];if(typeof curr==="function"){curr=Runtime.getFunctionIndex(curr)}type=singleType||types[i];if(type===0){i++;continue}if(type=="i64")type="i32";setValue(ret+i,curr,type);if(previousType!==type){typeSize=Runtime.getNativeTypeSize(type);previousType=type}i+=typeSize}return ret}Module["allocate"]=allocate;function getMemory(size){if(!staticSealed)return Runtime.staticAlloc(size);if(!runtimeInitialized)return Runtime.dynamicAlloc(size);return _malloc(size)}Module["getMemory"]=getMemory;function Pointer_stringify(ptr,length){if(length===0||!ptr)return"";var hasUtf=0;var t;var i=0;while(1){t=HEAPU8[ptr+i>>0];hasUtf|=t;if(t==0&&!length)break;i++;if(length&&i==length)break}if(!length)length=i;var ret="";if(hasUtf<128){var MAX_CHUNK=1024;var curr;while(length>0){curr=String.fromCharCode.apply(String,HEAPU8.subarray(ptr,ptr+Math.min(length,MAX_CHUNK)));ret=ret?ret+curr:curr;ptr+=MAX_CHUNK;length-=MAX_CHUNK}return ret}return Module["UTF8ToString"](ptr)}Module["Pointer_stringify"]=Pointer_stringify;function AsciiToString(ptr){var str="";while(1){var ch=HEAP8[ptr++>>0];if(!ch)return str;str+=String.fromCharCode(ch)}}Module["AsciiToString"]=AsciiToString;function stringToAscii(str,outPtr){return writeAsciiToMemory(str,outPtr,false)}Module["stringToAscii"]=stringToAscii;var UTF8Decoder=typeof TextDecoder!=="undefined"?new TextDecoder("utf8"):undefined;function UTF8ArrayToString(u8Array,idx){var endPtr=idx;while(u8Array[endPtr])++endPtr;if(endPtr-idx>16&&u8Array.subarray&&UTF8Decoder){return UTF8Decoder.decode(u8Array.subarray(idx,endPtr))}else{var u0,u1,u2,u3,u4,u5;var str="";while(1){u0=u8Array[idx++];if(!u0)return str;if(!(u0&128)){str+=String.fromCharCode(u0);continue}u1=u8Array[idx++]&63;if((u0&224)==192){str+=String.fromCharCode((u0&31)<<6|u1);continue}u2=u8Array[idx++]&63;if((u0&240)==224){u0=(u0&15)<<12|u1<<6|u2}else{u3=u8Array[idx++]&63;if((u0&248)==240){u0=(u0&7)<<18|u1<<12|u2<<6|u3}else{u4=u8Array[idx++]&63;if((u0&252)==248){u0=(u0&3)<<24|u1<<18|u2<<12|u3<<6|u4}else{u5=u8Array[idx++]&63;u0=(u0&1)<<30|u1<<24|u2<<18|u3<<12|u4<<6|u5}}}if(u0<65536){str+=String.fromCharCode(u0)}else{var ch=u0-65536;str+=String.fromCharCode(55296|ch>>10,56320|ch&1023)}}}}Module["UTF8ArrayToString"]=UTF8ArrayToString;function UTF8ToString(ptr){return UTF8ArrayToString(HEAPU8,ptr)}Module["UTF8ToString"]=UTF8ToString;function stringToUTF8Array(str,outU8Array,outIdx,maxBytesToWrite){if(!(maxBytesToWrite>0))return 0;var startIdx=outIdx;var endIdx=outIdx+maxBytesToWrite-1;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296&&u<=57343)u=65536+((u&1023)<<10)|str.charCodeAt(++i)&1023;if(u<=127){if(outIdx>=endIdx)break;outU8Array[outIdx++]=u}else if(u<=2047){if(outIdx+1>=endIdx)break;outU8Array[outIdx++]=192|u>>6;outU8Array[outIdx++]=128|u&63}else if(u<=65535){if(outIdx+2>=endIdx)break;outU8Array[outIdx++]=224|u>>12;outU8Array[outIdx++]=128|u>>6&63;outU8Array[outIdx++]=128|u&63}else if(u<=2097151){if(outIdx+3>=endIdx)break;outU8Array[outIdx++]=240|u>>18;outU8Array[outIdx++]=128|u>>12&63;outU8Array[outIdx++]=128|u>>6&63;outU8Array[outIdx++]=128|u&63}else if(u<=67108863){if(outIdx+4>=endIdx)break;outU8Array[outIdx++]=248|u>>24;outU8Array[outIdx++]=128|u>>18&63;outU8Array[outIdx++]=128|u>>12&63;outU8Array[outIdx++]=128|u>>6&63;outU8Array[outIdx++]=128|u&63}else{if(outIdx+5>=endIdx)break;outU8Array[outIdx++]=252|u>>30;outU8Array[outIdx++]=128|u>>24&63;outU8Array[outIdx++]=128|u>>18&63;outU8Array[outIdx++]=128|u>>12&63;outU8Array[outIdx++]=128|u>>6&63;outU8Array[outIdx++]=128|u&63}}outU8Array[outIdx]=0;return outIdx-startIdx}Module["stringToUTF8Array"]=stringToUTF8Array;function stringToUTF8(str,outPtr,maxBytesToWrite){return stringToUTF8Array(str,HEAPU8,outPtr,maxBytesToWrite)}Module["stringToUTF8"]=stringToUTF8;function lengthBytesUTF8(str){var len=0;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296&&u<=57343)u=65536+((u&1023)<<10)|str.charCodeAt(++i)&1023;if(u<=127){++len}else if(u<=2047){len+=2}else if(u<=65535){len+=3}else if(u<=2097151){len+=4}else if(u<=67108863){len+=5}else{len+=6}}return len}Module["lengthBytesUTF8"]=lengthBytesUTF8;var UTF16Decoder=typeof TextDecoder!=="undefined"?new TextDecoder("utf-16le"):undefined;function demangle(func){var __cxa_demangle_func=Module["___cxa_demangle"]||Module["__cxa_demangle"];if(__cxa_demangle_func){try{var s=func.substr(1);var len=lengthBytesUTF8(s)+1;var buf=_malloc(len);stringToUTF8(s,buf,len);var status=_malloc(4);var ret=__cxa_demangle_func(buf,0,0,status);if(getValue(status,"i32")===0&&ret){return Pointer_stringify(ret)}}catch(e){}finally{if(buf)_free(buf);if(status)_free(status);if(ret)_free(ret)}return func}Runtime.warnOnce("warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling");return func}function demangleAll(text){var regex=/__Z[\w\d_]+/g;return text.replace(regex,(function(x){var y=demangle(x);return x===y?x:x+" ["+y+"]"}))}function jsStackTrace(){var err=new Error;if(!err.stack){try{throw new Error(0)}catch(e){err=e}if(!err.stack){return"(no stack trace available)"}}return err.stack.toString()}function stackTrace(){var js=jsStackTrace();if(Module["extraStackTrace"])js+="\n"+Module["extraStackTrace"]();return demangleAll(js)}Module["stackTrace"]=stackTrace;var HEAP,buffer,HEAP8,HEAPU8,HEAP16,HEAPU16,HEAP32,HEAPU32,HEAPF32,HEAPF64;function updateGlobalBufferViews(){Module["HEAP8"]=HEAP8=new Int8Array(buffer);Module["HEAP16"]=HEAP16=new Int16Array(buffer);Module["HEAP32"]=HEAP32=new Int32Array(buffer);Module["HEAPU8"]=HEAPU8=new Uint8Array(buffer);Module["HEAPU16"]=HEAPU16=new Uint16Array(buffer);Module["HEAPU32"]=HEAPU32=new Uint32Array(buffer);Module["HEAPF32"]=HEAPF32=new Float32Array(buffer);Module["HEAPF64"]=HEAPF64=new Float64Array(buffer)}var STATIC_BASE,STATICTOP,staticSealed;var STACK_BASE,STACKTOP,STACK_MAX;var DYNAMIC_BASE,DYNAMICTOP_PTR;STATIC_BASE=STATICTOP=STACK_BASE=STACKTOP=STACK_MAX=DYNAMIC_BASE=DYNAMICTOP_PTR=0;staticSealed=false;function abortOnCannotGrowMemory(){abort("Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value "+TOTAL_MEMORY+", (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or (4) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ")}function enlargeMemory(){abortOnCannotGrowMemory()}var TOTAL_STACK=Module["TOTAL_STACK"]||5242880;var TOTAL_MEMORY=Module["TOTAL_MEMORY"]||16777216;if(TOTAL_MEMORY<TOTAL_STACK)Module.printErr("TOTAL_MEMORY should be larger than TOTAL_STACK, was "+TOTAL_MEMORY+"! (TOTAL_STACK="+TOTAL_STACK+")");if(Module["buffer"]){buffer=Module["buffer"]}else{{buffer=new ArrayBuffer(TOTAL_MEMORY)}}updateGlobalBufferViews();function getTotalMemory(){return TOTAL_MEMORY}HEAP32[0]=1668509029;HEAP16[1]=25459;if(HEAPU8[2]!==115||HEAPU8[3]!==99)throw"Runtime error: expected the system to be little-endian!";Module["HEAP"]=HEAP;Module["buffer"]=buffer;Module["HEAP8"]=HEAP8;Module["HEAP16"]=HEAP16;Module["HEAP32"]=HEAP32;Module["HEAPU8"]=HEAPU8;Module["HEAPU16"]=HEAPU16;Module["HEAPU32"]=HEAPU32;Module["HEAPF32"]=HEAPF32;Module["HEAPF64"]=HEAPF64;function callRuntimeCallbacks(callbacks){while(callbacks.length>0){var callback=callbacks.shift();if(typeof callback=="function"){callback();continue}var func=callback.func;if(typeof func==="number"){if(callback.arg===undefined){Module["dynCall_v"](func)}else{Module["dynCall_vi"](func,callback.arg)}}else{func(callback.arg===undefined?null:callback.arg)}}}var __ATPRERUN__=[];var __ATINIT__=[];var __ATMAIN__=[];var __ATEXIT__=[];var __ATPOSTRUN__=[];var runtimeInitialized=false;var runtimeExited=false;function preRun(){if(Module["preRun"]){if(typeof Module["preRun"]=="function")Module["preRun"]=[Module["preRun"]];while(Module["preRun"].length){addOnPreRun(Module["preRun"].shift())}}callRuntimeCallbacks(__ATPRERUN__)}function ensureInitRuntime(){if(runtimeInitialized)return;runtimeInitialized=true;callRuntimeCallbacks(__ATINIT__)}function preMain(){callRuntimeCallbacks(__ATMAIN__)}function exitRuntime(){callRuntimeCallbacks(__ATEXIT__);runtimeExited=true}function postRun(){if(Module["postRun"]){if(typeof Module["postRun"]=="function")Module["postRun"]=[Module["postRun"]];while(Module["postRun"].length){addOnPostRun(Module["postRun"].shift())}}callRuntimeCallbacks(__ATPOSTRUN__)}function addOnPreRun(cb){__ATPRERUN__.unshift(cb)}Module["addOnPreRun"]=addOnPreRun;function addOnInit(cb){__ATINIT__.unshift(cb)}Module["addOnInit"]=addOnInit;function addOnPreMain(cb){__ATMAIN__.unshift(cb)}Module["addOnPreMain"]=addOnPreMain;function addOnExit(cb){__ATEXIT__.unshift(cb)}Module["addOnExit"]=addOnExit;function addOnPostRun(cb){__ATPOSTRUN__.unshift(cb)}Module["addOnPostRun"]=addOnPostRun;function intArrayFromString(stringy,dontAddNull,length){var len=length>0?length:lengthBytesUTF8(stringy)+1;var u8array=new Array(len);var numBytesWritten=stringToUTF8Array(stringy,u8array,0,u8array.length);if(dontAddNull)u8array.length=numBytesWritten;return u8array}Module["intArrayFromString"]=intArrayFromString;function intArrayToString(array){var ret=[];for(var i=0;i<array.length;i++){var chr=array[i];if(chr>255){chr&=255}ret.push(String.fromCharCode(chr))}return ret.join("")}Module["intArrayToString"]=intArrayToString;function writeStringToMemory(string,buffer,dontAddNull){Runtime.warnOnce("writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!");var lastChar,end;if(dontAddNull){end=buffer+lengthBytesUTF8(string);lastChar=HEAP8[end]}stringToUTF8(string,buffer,Infinity);if(dontAddNull)HEAP8[end]=lastChar}Module["writeStringToMemory"]=writeStringToMemory;function writeArrayToMemory(array,buffer){HEAP8.set(array,buffer)}Module["writeArrayToMemory"]=writeArrayToMemory;function writeAsciiToMemory(str,buffer,dontAddNull){for(var i=0;i<str.length;++i){HEAP8[buffer++>>0]=str.charCodeAt(i)}if(!dontAddNull)HEAP8[buffer>>0]=0}Module["writeAsciiToMemory"]=writeAsciiToMemory;if(!Math["imul"]||Math["imul"](4294967295,5)!==-5)Math["imul"]=function imul(a,b){var ah=a>>>16;var al=a&65535;var bh=b>>>16;var bl=b&65535;return al*bl+(ah*bl+al*bh<<16)|0};Math.imul=Math["imul"];if(!Math["fround"]){var froundBuffer=new Float32Array(1);Math["fround"]=(function(x){froundBuffer[0]=x;return froundBuffer[0]})}Math.fround=Math["fround"];if(!Math["clz32"])Math["clz32"]=(function(x){x=x>>>0;for(var i=0;i<32;i++){if(x&1<<31-i)return i}return 32});Math.clz32=Math["clz32"];if(!Math["trunc"])Math["trunc"]=(function(x){return x<0?Math.ceil(x):Math.floor(x)});Math.trunc=Math["trunc"];var Math_abs=Math.abs;var Math_cos=Math.cos;var Math_sin=Math.sin;var Math_tan=Math.tan;var Math_acos=Math.acos;var Math_asin=Math.asin;var Math_atan=Math.atan;var Math_atan2=Math.atan2;var Math_exp=Math.exp;var Math_log=Math.log;var Math_sqrt=Math.sqrt;var Math_ceil=Math.ceil;var Math_floor=Math.floor;var Math_pow=Math.pow;var Math_imul=Math.imul;var Math_fround=Math.fround;var Math_round=Math.round;var Math_min=Math.min;var Math_clz32=Math.clz32;var Math_trunc=Math.trunc;var runDependencies=0;var runDependencyWatcher=null;var dependenciesFulfilled=null;function addRunDependency(id){runDependencies++;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies)}}Module["addRunDependency"]=addRunDependency;function removeRunDependency(id){runDependencies--;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies)}if(runDependencies==0){if(runDependencyWatcher!==null){clearInterval(runDependencyWatcher);runDependencyWatcher=null}if(dependenciesFulfilled){var callback=dependenciesFulfilled;dependenciesFulfilled=null;callback()}}}Module["removeRunDependency"]=removeRunDependency;Module["preloadedImages"]={};Module["preloadedAudios"]={};var ASM_CONSTS=[];STATIC_BASE=Runtime.GLOBAL_BASE;STATICTOP=STATIC_BASE+1024;__ATINIT__.push();allocate([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,5,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,82,101,97,108,32,70,70,84,32,111,112,116,105,109,105,122,97,116,105,111,110,32,109,117,115,116,32,98,101,32,101,118,101,110,46,10,0,107,105,115,115,32,102,102,116,32,117,115,97,103,101,32,101,114,114,111,114,58,32,105,109,112,114,111,112,101,114,32,97,108,108,111,99,10,0],"i8",ALLOC_NONE,Runtime.GLOBAL_BASE);var tempDoublePtr=STATICTOP;STATICTOP+=16;function ___setErrNo(value){if(Module["___errno_location"])HEAP32[Module["___errno_location"]()>>2]=value;return value}function __exit(status){Module["exit"](status)}function _exit(status){__exit(status)}var SYSCALLS={varargs:0,get:(function(varargs){SYSCALLS.varargs+=4;var ret=HEAP32[SYSCALLS.varargs-4>>2];return ret}),getStr:(function(){var ret=Pointer_stringify(SYSCALLS.get());return ret}),get64:(function(){var low=SYSCALLS.get(),high=SYSCALLS.get();if(low>=0)assert(high===0);else assert(high===-1);return low}),getZero:(function(){assert(SYSCALLS.get()===0)})};function ___syscall140(which,varargs){SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.getStreamFromFD(),offset_high=SYSCALLS.get(),offset_low=SYSCALLS.get(),result=SYSCALLS.get(),whence=SYSCALLS.get();var offset=offset_low;FS.llseek(stream,offset,whence);HEAP32[result>>2]=stream.position;if(stream.getdents&&offset===0&&whence===0)stream.getdents=null;return 0}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return-e.errno}}function ___syscall146(which,varargs){SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.get(),iov=SYSCALLS.get(),iovcnt=SYSCALLS.get();var ret=0;if(!___syscall146.buffer){___syscall146.buffers=[null,[],[]];___syscall146.printChar=(function(stream,curr){var buffer=___syscall146.buffers[stream];assert(buffer);if(curr===0||curr===10){(stream===1?Module["print"]:Module["printErr"])(UTF8ArrayToString(buffer,0));buffer.length=0}else{buffer.push(curr)}})}for(var i=0;i<iovcnt;i++){var ptr=HEAP32[iov+i*8>>2];var len=HEAP32[iov+(i*8+4)>>2];for(var j=0;j<len;j++){___syscall146.printChar(stream,HEAPU8[ptr+j])}ret+=len}return ret}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return-e.errno}}function _emscripten_memcpy_big(dest,src,num){HEAPU8.set(HEAPU8.subarray(src,src+num),dest);return dest}function ___syscall6(which,varargs){SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.getStreamFromFD();FS.close(stream);return 0}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return-e.errno}}__ATEXIT__.push((function(){var fflush=Module["_fflush"];if(fflush)fflush(0);var printChar=___syscall146.printChar;if(!printChar)return;var buffers=___syscall146.buffers;if(buffers[1].length)printChar(1,10);if(buffers[2].length)printChar(2,10)}));DYNAMICTOP_PTR=allocate(1,"i32",ALLOC_STATIC);STACK_BASE=STACKTOP=Runtime.alignMemory(STATICTOP);STACK_MAX=STACK_BASE+TOTAL_STACK;DYNAMIC_BASE=Runtime.alignMemory(STACK_MAX);HEAP32[DYNAMICTOP_PTR>>2]=DYNAMIC_BASE;staticSealed=true;function invoke_ii(index,a1){try{return Module["dynCall_ii"](index,a1)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0)}}function invoke_iiii(index,a1,a2,a3){try{return Module["dynCall_iiii"](index,a1,a2,a3)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;Module["setThrew"](1,0)}}Module.asmGlobalArg={"Math":Math,"Int8Array":Int8Array,"Int16Array":Int16Array,"Int32Array":Int32Array,"Uint8Array":Uint8Array,"Uint16Array":Uint16Array,"Uint32Array":Uint32Array,"Float32Array":Float32Array,"Float64Array":Float64Array,"NaN":NaN,"Infinity":Infinity};Module.asmLibraryArg={"abort":abort,"assert":assert,"enlargeMemory":enlargeMemory,"getTotalMemory":getTotalMemory,"abortOnCannotGrowMemory":abortOnCannotGrowMemory,"invoke_ii":invoke_ii,"invoke_iiii":invoke_iiii,"___syscall6":___syscall6,"___setErrNo":___setErrNo,"_emscripten_memcpy_big":_emscripten_memcpy_big,"___syscall140":___syscall140,"_exit":_exit,"__exit":__exit,"___syscall146":___syscall146,"DYNAMICTOP_PTR":DYNAMICTOP_PTR,"tempDoublePtr":tempDoublePtr,"ABORT":ABORT,"STACKTOP":STACKTOP,"STACK_MAX":STACK_MAX};// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer) {
"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.DYNAMICTOP_PTR|0;var j=env.tempDoublePtr|0;var k=env.ABORT|0;var l=env.STACKTOP|0;var m=env.STACK_MAX|0;var n=0;var o=0;var p=0;var q=0;var r=global.NaN,s=global.Infinity;var t=0,u=0,v=0,w=0,x=0.0;var y=0;var z=global.Math.floor;var A=global.Math.abs;var B=global.Math.sqrt;var C=global.Math.pow;var D=global.Math.cos;var E=global.Math.sin;var F=global.Math.tan;var G=global.Math.acos;var H=global.Math.asin;var I=global.Math.atan;var J=global.Math.atan2;var K=global.Math.exp;var L=global.Math.log;var M=global.Math.ceil;var N=global.Math.imul;var O=global.Math.min;var P=global.Math.max;var Q=global.Math.clz32;var R=global.Math.fround;var S=env.abort;var T=env.assert;var U=env.enlargeMemory;var V=env.getTotalMemory;var W=env.abortOnCannotGrowMemory;var X=env.invoke_ii;var Y=env.invoke_iiii;var Z=env.___syscall6;var _=env.___setErrNo;var $=env._emscripten_memcpy_big;var aa=env.___syscall140;var ba=env._exit;var ca=env.__exit;var da=env.___syscall146;var ea=R(0);const fa=R(0);
// EMSCRIPTEN_START_FUNCS
function ia(a){a=a|0;var b=0;b=l;l=l+a|0;l=l+15&-16;return b|0}function ja(){return l|0}function ka(a){a=a|0;l=a}function la(a,b){a=a|0;b=b|0;l=a;m=b}function ma(a,b){a=a|0;b=b|0;if(!n){n=a;o=b}}function na(a){a=a|0;y=a}function oa(){return y|0}function pa(a){a=a|0;ya(a);return}function qa(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,h=0.0,i=0.0;f=(a<<3)+264|0;if(!e)f=xa(f)|0;else{if(!d)d=0;else d=(c[e>>2]|0)>>>0<f>>>0?0:d;c[e>>2]=f;f=d}if(!f)return f|0;c[f>>2]=a;e=f+4|0;c[e>>2]=b;h=+(a|0);a:do if((a|0)>0){d=0;while(1){i=+(d|0)*-6.283185307179586/h;i=(b|0)==0?i:-i;g[f+264+(d<<3)>>2]=R(+D(+i));g[f+264+(d<<3)+4>>2]=R(+E(+i));d=d+1|0;if((d|0)==(a|0))break a;b=c[e>>2]|0}}while(0);h=+z(+(+B(+h)));b=a;d=4;e=f+8|0;while(1){b:do if((b|0)%(d|0)|0)while(1){switch(d|0){case 4:{d=2;break}case 2:{d=3;break}default:d=d+2|0}d=+(d|0)>h?b:d;if(!((b|0)%(d|0)|0))break b}while(0);b=(b|0)/(d|0)|0;c[e>>2]=d;c[e+4>>2]=b;if((b|0)<=1)break;else e=e+8|0}return f|0}function ra(a,b,d,e,f,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;h=h|0;var i=0,k=0,l=0,m=fa,n=0,o=fa,p=fa,q=fa,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=fa,z=fa,A=fa,B=fa,C=0,D=fa,E=fa,F=fa,G=fa,H=fa,I=fa,J=fa,K=fa,L=fa,M=fa;w=c[f>>2]|0;n=f+8|0;x=c[f+4>>2]|0;r=a+((N(x,w)|0)<<3)|0;if((x|0)==1){k=N(e,d)|0;i=a;f=b;while(1){t=f;u=c[t+4>>2]|0;v=i;c[v>>2]=c[t>>2];c[v+4>>2]=u;i=i+8|0;if((i|0)==(r|0))break;else f=f+(k<<3)|0}}else{k=N(w,d)|0;l=N(e,d)|0;i=a;f=b;while(1){ra(i,f,k,e,n,h);i=i+(x<<3)|0;if((i|0)==(r|0))break;else f=f+(l<<3)|0}}switch(w|0){case 2:{k=a;l=x;i=h+264|0;f=a+(x<<3)|0;while(1){o=R(g[f>>2]);y=R(g[i>>2]);p=R(o*y);a=f+4|0;m=R(g[a>>2]);q=R(g[i+4>>2]);p=R(p-R(m*q));q=R(R(y*m)+R(o*q));g[f>>2]=R(R(g[k>>2])-p);x=k+4|0;g[a>>2]=R(R(g[x>>2])-q);g[k>>2]=R(p+R(g[k>>2]));g[x>>2]=R(q+R(g[x>>2]));l=l+-1|0;if(!l)break;else{k=k+8|0;i=i+(d<<3)|0;f=f+8|0}}return}case 3:{n=x<<1;m=R(g[h+264+((N(x,d)|0)<<3)+4>>2]);l=h+264|0;e=d<<1;f=a;i=x;k=l;while(1){h=f+(x<<3)|0;o=R(g[h>>2]);y=R(g[k>>2]);A=R(o*y);a=f+(x<<3)+4|0;B=R(g[a>>2]);z=R(g[k+4>>2]);A=R(A-R(B*z));z=R(R(y*B)+R(o*z));v=f+(n<<3)|0;o=R(g[v>>2]);B=R(g[l>>2]);y=R(o*B);w=f+(n<<3)+4|0;p=R(g[w>>2]);q=R(g[l+4>>2]);y=R(y-R(p*q));q=R(R(B*p)+R(o*q));o=R(A+y);p=R(z+q);y=R(A-y);q=R(z-q);g[h>>2]=R(+R(g[f>>2])-+o*.5);u=f+4|0;g[a>>2]=R(+R(g[u>>2])-+p*.5);y=R(m*y);q=R(m*q);g[f>>2]=R(o+R(g[f>>2]));g[u>>2]=R(p+R(g[u>>2]));g[v>>2]=R(q+R(g[h>>2]));g[w>>2]=R(R(g[a>>2])-y);g[h>>2]=R(R(g[h>>2])-q);g[a>>2]=R(y+R(g[a>>2]));i=i+-1|0;if(!i)break;else{f=f+8|0;k=k+(d<<3)|0;l=l+(e<<3)|0}}return}case 4:{n=x<<1;b=x*3|0;f=h+264|0;r=d<<1;s=d*3|0;if(!(c[h+4>>2]|0)){i=a;k=f;l=x;e=f;while(1){v=i+(x<<3)|0;m=R(g[v>>2]);B=R(g[k>>2]);E=R(m*B);w=i+(x<<3)+4|0;z=R(g[w>>2]);D=R(g[k+4>>2]);E=R(E-R(z*D));D=R(R(B*z)+R(m*D));C=i+(n<<3)|0;m=R(g[C>>2]);z=R(g[e>>2]);B=R(m*z);t=i+(n<<3)+4|0;o=R(g[t>>2]);p=R(g[e+4>>2]);B=R(B-R(o*p));p=R(R(z*o)+R(m*p));h=i+(b<<3)|0;m=R(g[h>>2]);o=R(g[f>>2]);z=R(m*o);a=i+(b<<3)+4|0;q=R(g[a>>2]);y=R(g[f+4>>2]);z=R(z-R(q*y));y=R(R(o*q)+R(m*y));m=R(g[i>>2]);q=R(m-B);u=i+4|0;o=R(g[u>>2]);A=R(o-p);m=R(B+m);g[i>>2]=m;o=R(p+o);g[u>>2]=o;p=R(E+z);B=R(D+y);z=R(E-z);y=R(D-y);g[C>>2]=R(m-p);g[t>>2]=R(o-B);g[i>>2]=R(p+R(g[i>>2]));g[u>>2]=R(B+R(g[u>>2]));B=R(A+z);z=R(A-z);A=R(q-y);g[v>>2]=R(q+y);g[w>>2]=z;g[h>>2]=A;g[a>>2]=B;l=l+-1|0;if(!l)break;else{i=i+8|0;k=k+(d<<3)|0;e=e+(r<<3)|0;f=f+(s<<3)|0}}return}else{i=a;k=f;l=x;e=f;while(1){w=i+(x<<3)|0;p=R(g[w>>2]);B=R(g[k>>2]);m=R(p*B);h=i+(x<<3)+4|0;E=R(g[h>>2]);o=R(g[k+4>>2]);m=R(m-R(E*o));o=R(R(B*E)+R(p*o));t=i+(n<<3)|0;p=R(g[t>>2]);E=R(g[e>>2]);B=R(p*E);u=i+(n<<3)+4|0;q=R(g[u>>2]);y=R(g[e+4>>2]);B=R(B-R(q*y));y=R(R(E*q)+R(p*y));a=i+(b<<3)|0;p=R(g[a>>2]);q=R(g[f>>2]);E=R(p*q);C=i+(b<<3)+4|0;z=R(g[C>>2]);A=R(g[f+4>>2]);E=R(E-R(z*A));A=R(R(q*z)+R(p*A));p=R(g[i>>2]);z=R(p-B);v=i+4|0;q=R(g[v>>2]);D=R(q-y);p=R(B+p);g[i>>2]=p;q=R(y+q);g[v>>2]=q;y=R(m+E);B=R(o+A);E=R(m-E);A=R(o-A);g[t>>2]=R(p-y);g[u>>2]=R(q-B);g[i>>2]=R(y+R(g[i>>2]));g[v>>2]=R(B+R(g[v>>2]));B=R(D+E);E=R(D-E);D=R(z+A);g[w>>2]=R(z-A);g[h>>2]=B;g[a>>2]=D;g[C>>2]=E;l=l+-1|0;if(!l)break;else{i=i+8|0;k=k+(d<<3)|0;e=e+(r<<3)|0;f=f+(s<<3)|0}}return}}case 5:{C=N(x,d)|0;o=R(g[h+264+(C<<3)>>2]);q=R(g[h+264+(C<<3)+4>>2]);C=N(x,d<<1)|0;m=R(g[h+264+(C<<3)>>2]);p=R(g[h+264+(C<<3)+4>>2]);if((x|0)<=0)return;b=d*3|0;i=a+(x<<3)|0;k=a+(x<<1<<3)|0;l=a+(x*3<<3)|0;e=a+(x<<2<<3)|0;n=0;f=a;while(1){H=R(g[f>>2]);u=f+4|0;F=R(g[u>>2]);A=R(g[i>>2]);t=N(n,d)|0;J=R(g[h+264+(t<<3)>>2]);G=R(A*J);v=i+4|0;E=R(g[v>>2]);I=R(g[h+264+(t<<3)+4>>2]);G=R(G-R(E*I));I=R(R(J*E)+R(A*I));A=R(g[k>>2]);t=N(n<<1,d)|0;E=R(g[h+264+(t<<3)>>2]);J=R(A*E);a=k+4|0;z=R(g[a>>2]);L=R(g[h+264+(t<<3)+4>>2]);J=R(J-R(z*L));L=R(R(E*z)+R(A*L));A=R(g[l>>2]);t=N(b,n)|0;z=R(g[h+264+(t<<3)>>2]);E=R(A*z);C=l+4|0;M=R(g[C>>2]);y=R(g[h+264+(t<<3)+4>>2]);E=R(E-R(M*y));y=R(R(z*M)+R(A*y));A=R(g[e>>2]);t=N(n<<2,d)|0;M=R(g[h+264+(t<<3)>>2]);z=R(A*M);w=e+4|0;D=R(g[w>>2]);B=R(g[h+264+(t<<3)+4>>2]);z=R(z-R(D*B));B=R(R(M*D)+R(A*B));A=R(G+z);D=R(I+B);z=R(G-z);B=R(I-B);I=R(J+E);G=R(L+y);E=R(J-E);y=R(L-y);g[f>>2]=R(H+R(I+A));g[u>>2]=R(F+R(G+D));L=R(R(m*I)+R(H+R(o*A)));J=R(R(m*G)+R(F+R(o*D)));M=R(R(p*y)+R(q*B));K=R(R(-R(q*z))-R(p*E));g[i>>2]=R(L-M);g[v>>2]=R(J-K);g[e>>2]=R(M+L);g[w>>2]=R(K+J);A=R(R(o*I)+R(H+R(m*A)));D=R(R(o*G)+R(F+R(m*D)));B=R(R(q*y)-R(p*B));E=R(R(p*z)-R(q*E));g[k>>2]=R(B+A);g[a>>2]=R(E+D);g[l>>2]=R(A-B);g[C>>2]=R(D-E);n=n+1|0;if((n|0)==(x|0))break;else{i=i+8|0;k=k+8|0;l=l+8|0;e=e+8|0;f=f+8|0}}return}default:{u=c[h>>2]|0;v=xa(w<<3)|0;do if((x|0)>0?(w|0)>0:0){if((w|0)==1){f=0;do{k=a+(f<<3)|0;i=c[k>>2]|0;k=c[k+4>>2]|0;C=a+(f<<3)|0;c[C>>2]=i;c[C+4>>2]=k;f=f+1|0}while((f|0)!=(x|0));C=v;c[C>>2]=i;c[C+4>>2]=k;break}else t=0;do{f=t;i=0;while(1){r=a+(f<<3)|0;s=c[r+4>>2]|0;C=v+(i<<3)|0;c[C>>2]=c[r>>2];c[C+4>>2]=s;i=i+1|0;if((i|0)==(w|0))break;else f=f+x|0}n=v;e=c[n>>2]|0;n=c[n+4>>2]|0;m=(c[j>>2]=e,R(g[j>>2]));k=t;l=0;while(1){b=a+(k<<3)|0;r=b;c[r>>2]=e;c[r+4>>2]=n;r=N(k,d)|0;s=a+(k<<3)+4|0;f=1;i=0;o=m;p=R(g[s>>2]);do{C=i+r|0;i=C-((C|0)<(u|0)?0:u)|0;M=R(g[v+(f<<3)>>2]);I=R(g[h+264+(i<<3)>>2]);J=R(M*I);K=R(g[v+(f<<3)+4>>2]);L=R(g[h+264+(i<<3)+4>>2]);M=R(R(I*K)+R(M*L));o=R(o+R(J-R(K*L)));g[b>>2]=o;p=R(p+M);g[s>>2]=p;f=f+1|0}while((f|0)!=(w|0));l=l+1|0;if((l|0)==(w|0))break;else k=k+x|0}t=t+1|0}while((t|0)!=(x|0))}while(0);ya(v);return}}}function sa(a,b,d){a=a|0;b=b|0;d=d|0;if((b|0)==(d|0)){d=xa(c[a>>2]<<3)|0;ra(d,b,1,1,a+8|0,a);Qa(b|0,d|0,c[a>>2]<<3|0)|0;ya(d);return}else{ra(d,b,1,1,a+8|0,a);return}}function ta(a){a=a|0;ya(a);return}function ua(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0.0,h=0,i=0,j=0,k=0,m=0,n=0.0;k=l;l=l+16|0;i=k;if(a&1|0){Ma(380,36,1,c[63]|0)|0;b=0;l=k;return b|0}j=a>>1;qa(j,b,0,i)|0;h=c[i>>2]|0;a=(((j*3|0)/2|0)<<3)+12+h|0;if(e){m=(c[e>>2]|0)>>>0<a>>>0;c[e>>2]=a;if(m){m=0;l=k;return m|0}}else d=xa(a)|0;if(!d){m=0;l=k;return m|0}m=d+12|0;c[d>>2]=m;h=m+h|0;c[d+4>>2]=h;a=d+8|0;c[a>>2]=h+(j<<3);qa(j,b,m,i)|0;h=(j|0)/2|0;if((j|0)<=1){m=d;l=k;return m|0}f=+(j|0);e=c[a>>2]|0;if(!b){a=0;do{m=a;a=a+1|0;n=(+(a|0)/f+.5)*-3.141592653589793;g[e+(m<<3)>>2]=R(+D(+n));g[e+(m<<3)+4>>2]=R(+E(+n))}while((a|0)<(h|0));l=k;return d|0}else{a=0;do{m=a;a=a+1|0;n=(+(a|0)/f+.5)*-3.141592653589793;g[e+(m<<3)>>2]=R(+D(+n));g[e+(m<<3)+4>>2]=R(+E(+-n))}while((a|0)<(h|0));l=k;return d|0}return 0}function va(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,h=0,i=0,j=fa,k=fa,l=fa,m=fa,n=fa,o=fa,p=fa,q=0;e=c[a>>2]|0;if(c[e+4>>2]|0){Ma(417,37,1,c[63]|0)|0;ba(1)}i=c[e>>2]|0;f=a+4|0;sa(e,b,c[f>>2]|0);f=c[f>>2]|0;k=R(g[f>>2]);j=R(g[f+4>>2]);g[d>>2]=R(k+j);g[d+(i<<3)>>2]=R(k-j);g[d+4>>2]=R(0.0);g[d+(i<<3)+4>>2]=R(0.0);h=(i|0)/2|0;if((i|0)<2)return;e=c[a+8>>2]|0;b=1;while(1){l=R(g[f+(b<<3)>>2]);o=R(g[f+(b<<3)+4>>2]);a=i-b|0;n=R(g[f+(a<<3)>>2]);p=R(g[f+(a<<3)+4>>2]);m=R(l+n);k=R(o-p);n=R(l-n);p=R(o+p);q=b+-1|0;o=R(g[e+(q<<3)>>2]);l=R(n*o);j=R(g[e+(q<<3)+4>>2]);l=R(l-R(p*j));j=R(R(p*o)+R(n*j));g[d+(b<<3)>>2]=R(R(m+l)*R(.5));g[d+(b<<3)+4>>2]=R(R(k+j)*R(.5));g[d+(a<<3)>>2]=R(R(m-l)*R(.5));g[d+(a<<3)+4>>2]=R(R(j-k)*R(.5));if((b|0)<(h|0))b=b+1|0;else break}return}function wa(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,h=0,i=0,j=0,k=fa,l=0,m=fa,n=fa,o=fa,p=fa,q=fa,r=fa,s=0;i=c[a>>2]|0;if(!(c[i+4>>2]|0)){Ma(417,37,1,c[63]|0)|0;ba(1)}j=c[i>>2]|0;k=R(g[b>>2]);h=b+(j<<3)|0;k=R(k+R(g[h>>2]));f=c[a+4>>2]|0;g[f>>2]=k;k=R(g[b>>2]);g[f+4>>2]=R(k-R(g[h>>2]));h=(j|0)/2|0;if((j|0)<2){sa(i,f,d);return}e=c[a+8>>2]|0;a=1;while(1){n=R(g[b+(a<<3)>>2]);q=R(g[b+(a<<3)+4>>2]);l=j-a|0;p=R(g[b+(l<<3)>>2]);r=R(g[b+(l<<3)+4>>2]);o=R(n+p);m=R(q-r);p=R(n-p);r=R(q+r);s=a+-1|0;q=R(g[e+(s<<3)>>2]);n=R(p*q);k=R(g[e+(s<<3)+4>>2]);n=R(n-R(r*k));k=R(R(r*q)+R(p*k));g[f+(a<<3)>>2]=R(o+n);g[f+(a<<3)+4>>2]=R(m+k);g[f+(l<<3)>>2]=R(o-n);g[f+(l<<3)+4>>2]=R(-R(m-k));if((a|0)<(h|0))a=a+1|0;else break}sa(i,f,d);return}function xa(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;x=l;l=l+16|0;o=x;do if(a>>>0<245){k=a>>>0<11?16:a+11&-8;a=k>>>3;n=c[114]|0;d=n>>>a;if(d&3|0){b=(d&1^1)+a|0;a=496+(b<<1<<2)|0;d=a+8|0;e=c[d>>2]|0;f=e+8|0;g=c[f>>2]|0;if((a|0)==(g|0))c[114]=n&~(1<<b);else{c[g+12>>2]=a;c[d>>2]=g}w=b<<3;c[e+4>>2]=w|3;w=e+w+4|0;c[w>>2]=c[w>>2]|1;w=f;l=x;return w|0}m=c[116]|0;if(k>>>0>m>>>0){if(d|0){b=2<<a;b=d<<a&(b|0-b);b=(b&0-b)+-1|0;h=b>>>12&16;b=b>>>h;d=b>>>5&8;b=b>>>d;f=b>>>2&4;b=b>>>f;a=b>>>1&2;b=b>>>a;e=b>>>1&1;e=(d|h|f|a|e)+(b>>>e)|0;b=496+(e<<1<<2)|0;a=b+8|0;f=c[a>>2]|0;h=f+8|0;d=c[h>>2]|0;if((b|0)==(d|0)){a=n&~(1<<e);c[114]=a}else{c[d+12>>2]=b;c[a>>2]=d;a=n}g=(e<<3)-k|0;c[f+4>>2]=k|3;e=f+k|0;c[e+4>>2]=g|1;c[e+g>>2]=g;if(m|0){f=c[119]|0;b=m>>>3;d=496+(b<<1<<2)|0;b=1<<b;if(!(a&b)){c[114]=a|b;b=d;a=d+8|0}else{a=d+8|0;b=c[a>>2]|0}c[a>>2]=f;c[b+12>>2]=f;c[f+8>>2]=b;c[f+12>>2]=d}c[116]=g;c[119]=e;w=h;l=x;return w|0}i=c[115]|0;if(i){d=(i&0-i)+-1|0;h=d>>>12&16;d=d>>>h;g=d>>>5&8;d=d>>>g;j=d>>>2&4;d=d>>>j;e=d>>>1&2;d=d>>>e;a=d>>>1&1;a=c[760+((g|h|j|e|a)+(d>>>a)<<2)>>2]|0;d=(c[a+4>>2]&-8)-k|0;e=c[a+16+(((c[a+16>>2]|0)==0&1)<<2)>>2]|0;if(!e){j=a;g=d}else{do{h=(c[e+4>>2]&-8)-k|0;j=h>>>0<d>>>0;d=j?h:d;a=j?e:a;e=c[e+16+(((c[e+16>>2]|0)==0&1)<<2)>>2]|0}while((e|0)!=0);j=a;g=d}h=j+k|0;if(j>>>0<h>>>0){f=c[j+24>>2]|0;b=c[j+12>>2]|0;do if((b|0)==(j|0)){a=j+20|0;b=c[a>>2]|0;if(!b){a=j+16|0;b=c[a>>2]|0;if(!b){d=0;break}}while(1){d=b+20|0;e=c[d>>2]|0;if(e|0){b=e;a=d;continue}d=b+16|0;e=c[d>>2]|0;if(!e)break;else{b=e;a=d}}c[a>>2]=0;d=b}else{d=c[j+8>>2]|0;c[d+12>>2]=b;c[b+8>>2]=d;d=b}while(0);do if(f|0){b=c[j+28>>2]|0;a=760+(b<<2)|0;if((j|0)==(c[a>>2]|0)){c[a>>2]=d;if(!d){c[115]=i&~(1<<b);break}}else{c[f+16+(((c[f+16>>2]|0)!=(j|0)&1)<<2)>>2]=d;if(!d)break}c[d+24>>2]=f;b=c[j+16>>2]|0;if(b|0){c[d+16>>2]=b;c[b+24>>2]=d}b=c[j+20>>2]|0;if(b|0){c[d+20>>2]=b;c[b+24>>2]=d}}while(0);if(g>>>0<16){w=g+k|0;c[j+4>>2]=w|3;w=j+w+4|0;c[w>>2]=c[w>>2]|1}else{c[j+4>>2]=k|3;c[h+4>>2]=g|1;c[h+g>>2]=g;if(m|0){e=c[119]|0;b=m>>>3;d=496+(b<<1<<2)|0;b=1<<b;if(!(n&b)){c[114]=n|b;b=d;a=d+8|0}else{a=d+8|0;b=c[a>>2]|0}c[a>>2]=e;c[b+12>>2]=e;c[e+8>>2]=b;c[e+12>>2]=d}c[116]=g;c[119]=h}w=j+8|0;l=x;return w|0}else n=k}else n=k}else n=k}else if(a>>>0<=4294967231){a=a+11|0;k=a&-8;j=c[115]|0;if(j){e=0-k|0;a=a>>>8;if(a)if(k>>>0>16777215)i=31;else{n=(a+1048320|0)>>>16&8;v=a<<n;m=(v+520192|0)>>>16&4;v=v<<m;i=(v+245760|0)>>>16&2;i=14-(m|n|i)+(v<<i>>>15)|0;i=k>>>(i+7|0)&1|i<<1}else i=0;d=c[760+(i<<2)>>2]|0;a:do if(!d){d=0;a=0;v=57}else{a=0;h=k<<((i|0)==31?0:25-(i>>>1)|0);g=0;while(1){f=(c[d+4>>2]&-8)-k|0;if(f>>>0<e>>>0)if(!f){a=d;e=0;f=d;v=61;break a}else{a=d;e=f}f=c[d+20>>2]|0;d=c[d+16+(h>>>31<<2)>>2]|0;g=(f|0)==0|(f|0)==(d|0)?g:f;f=(d|0)==0;if(f){d=g;v=57;break}else h=h<<((f^1)&1)}}while(0);if((v|0)==57){if((d|0)==0&(a|0)==0){a=2<<i;a=j&(a|0-a);if(!a){n=k;break}n=(a&0-a)+-1|0;h=n>>>12&16;n=n>>>h;g=n>>>5&8;n=n>>>g;i=n>>>2&4;n=n>>>i;m=n>>>1&2;n=n>>>m;d=n>>>1&1;a=0;d=c[760+((g|h|i|m|d)+(n>>>d)<<2)>>2]|0}if(!d){i=a;h=e}else{f=d;v=61}}if((v|0)==61)while(1){v=0;d=(c[f+4>>2]&-8)-k|0;n=d>>>0<e>>>0;d=n?d:e;a=n?f:a;f=c[f+16+(((c[f+16>>2]|0)==0&1)<<2)>>2]|0;if(!f){i=a;h=d;break}else{e=d;v=61}}if((i|0)!=0?h>>>0<((c[116]|0)-k|0)>>>0:0){g=i+k|0;if(i>>>0>=g>>>0){w=0;l=x;return w|0}f=c[i+24>>2]|0;b=c[i+12>>2]|0;do if((b|0)==(i|0)){a=i+20|0;b=c[a>>2]|0;if(!b){a=i+16|0;b=c[a>>2]|0;if(!b){b=0;break}}while(1){d=b+20|0;e=c[d>>2]|0;if(e|0){b=e;a=d;continue}d=b+16|0;e=c[d>>2]|0;if(!e)break;else{b=e;a=d}}c[a>>2]=0}else{w=c[i+8>>2]|0;c[w+12>>2]=b;c[b+8>>2]=w}while(0);do if(f){a=c[i+28>>2]|0;d=760+(a<<2)|0;if((i|0)==(c[d>>2]|0)){c[d>>2]=b;if(!b){e=j&~(1<<a);c[115]=e;break}}else{c[f+16+(((c[f+16>>2]|0)!=(i|0)&1)<<2)>>2]=b;if(!b){e=j;break}}c[b+24>>2]=f;a=c[i+16>>2]|0;if(a|0){c[b+16>>2]=a;c[a+24>>2]=b}a=c[i+20>>2]|0;if(a){c[b+20>>2]=a;c[a+24>>2]=b;e=j}else e=j}else e=j;while(0);do if(h>>>0>=16){c[i+4>>2]=k|3;c[g+4>>2]=h|1;c[g+h>>2]=h;b=h>>>3;if(h>>>0<256){d=496+(b<<1<<2)|0;a=c[114]|0;b=1<<b;if(!(a&b)){c[114]=a|b;b=d;a=d+8|0}else{a=d+8|0;b=c[a>>2]|0}c[a>>2]=g;c[b+12>>2]=g;c[g+8>>2]=b;c[g+12>>2]=d;break}b=h>>>8;if(b)if(h>>>0>16777215)b=31;else{v=(b+1048320|0)>>>16&8;w=b<<v;u=(w+520192|0)>>>16&4;w=w<<u;b=(w+245760|0)>>>16&2;b=14-(u|v|b)+(w<<b>>>15)|0;b=h>>>(b+7|0)&1|b<<1}else b=0;d=760+(b<<2)|0;c[g+28>>2]=b;a=g+16|0;c[a+4>>2]=0;c[a>>2]=0;a=1<<b;if(!(e&a)){c[115]=e|a;c[d>>2]=g;c[g+24>>2]=d;c[g+12>>2]=g;c[g+8>>2]=g;break}a=h<<((b|0)==31?0:25-(b>>>1)|0);d=c[d>>2]|0;while(1){if((c[d+4>>2]&-8|0)==(h|0)){v=97;break}e=d+16+(a>>>31<<2)|0;b=c[e>>2]|0;if(!b){v=96;break}else{a=a<<1;d=b}}if((v|0)==96){c[e>>2]=g;c[g+24>>2]=d;c[g+12>>2]=g;c[g+8>>2]=g;break}else if((v|0)==97){v=d+8|0;w=c[v>>2]|0;c[w+12>>2]=g;c[v>>2]=g;c[g+8>>2]=w;c[g+12>>2]=d;c[g+24>>2]=0;break}}else{w=h+k|0;c[i+4>>2]=w|3;w=i+w+4|0;c[w>>2]=c[w>>2]|1}while(0);w=i+8|0;l=x;return w|0}else n=k}else n=k}else n=-1;while(0);d=c[116]|0;if(d>>>0>=n>>>0){b=d-n|0;a=c[119]|0;if(b>>>0>15){w=a+n|0;c[119]=w;c[116]=b;c[w+4>>2]=b|1;c[w+b>>2]=b;c[a+4>>2]=n|3}else{c[116]=0;c[119]=0;c[a+4>>2]=d|3;w=a+d+4|0;c[w>>2]=c[w>>2]|1}w=a+8|0;l=x;return w|0}h=c[117]|0;if(h>>>0>n>>>0){u=h-n|0;c[117]=u;w=c[120]|0;v=w+n|0;c[120]=v;c[v+4>>2]=u|1;c[w+4>>2]=n|3;w=w+8|0;l=x;return w|0}if(!(c[232]|0)){c[234]=4096;c[233]=4096;c[235]=-1;c[236]=-1;c[237]=0;c[225]=0;a=o&-16^1431655768;c[o>>2]=a;c[232]=a;a=4096}else a=c[234]|0;i=n+48|0;j=n+47|0;g=a+j|0;f=0-a|0;k=g&f;if(k>>>0<=n>>>0){w=0;l=x;return w|0}a=c[224]|0;if(a|0?(m=c[222]|0,o=m+k|0,o>>>0<=m>>>0|o>>>0>a>>>0):0){w=0;l=x;return w|0}b:do if(!(c[225]&4)){d=c[120]|0;c:do if(d){e=904;while(1){a=c[e>>2]|0;if(a>>>0<=d>>>0?(r=e+4|0,(a+(c[r>>2]|0)|0)>>>0>d>>>0):0)break;a=c[e+8>>2]|0;if(!a){v=118;break c}else e=a}b=g-h&f;if(b>>>0<2147483647){a=Oa(b|0)|0;if((a|0)==((c[e>>2]|0)+(c[r>>2]|0)|0)){if((a|0)!=(-1|0)){h=b;g=a;v=135;break b}}else{e=a;v=126}}else b=0}else v=118;while(0);do if((v|0)==118){d=Oa(0)|0;if((d|0)!=(-1|0)?(b=d,p=c[233]|0,q=p+-1|0,b=((q&b|0)==0?0:(q+b&0-p)-b|0)+k|0,p=c[222]|0,q=b+p|0,b>>>0>n>>>0&b>>>0<2147483647):0){r=c[224]|0;if(r|0?q>>>0<=p>>>0|q>>>0>r>>>0:0){b=0;break}a=Oa(b|0)|0;if((a|0)==(d|0)){h=b;g=d;v=135;break b}else{e=a;v=126}}else b=0}while(0);do if((v|0)==126){d=0-b|0;if(!(i>>>0>b>>>0&(b>>>0<2147483647&(e|0)!=(-1|0))))if((e|0)==(-1|0)){b=0;break}else{h=b;g=e;v=135;break b}a=c[234]|0;a=j-b+a&0-a;if(a>>>0>=2147483647){h=b;g=e;v=135;break b}if((Oa(a|0)|0)==(-1|0)){Oa(d|0)|0;b=0;break}else{h=a+b|0;g=e;v=135;break b}}while(0);c[225]=c[225]|4;v=133}else{b=0;v=133}while(0);if(((v|0)==133?k>>>0<2147483647:0)?(u=Oa(k|0)|0,r=Oa(0)|0,s=r-u|0,t=s>>>0>(n+40|0)>>>0,!((u|0)==(-1|0)|t^1|u>>>0<r>>>0&((u|0)!=(-1|0)&(r|0)!=(-1|0))^1)):0){h=t?s:b;g=u;v=135}if((v|0)==135){b=(c[222]|0)+h|0;c[222]=b;if(b>>>0>(c[223]|0)>>>0)c[223]=b;j=c[120]|0;do if(j){b=904;while(1){a=c[b>>2]|0;d=b+4|0;e=c[d>>2]|0;if((g|0)==(a+e|0)){v=145;break}f=c[b+8>>2]|0;if(!f)break;else b=f}if(((v|0)==145?(c[b+12>>2]&8|0)==0:0)?j>>>0<g>>>0&j>>>0>=a>>>0:0){c[d>>2]=e+h;w=j+8|0;w=(w&7|0)==0?0:0-w&7;v=j+w|0;w=(c[117]|0)+(h-w)|0;c[120]=v;c[117]=w;c[v+4>>2]=w|1;c[v+w+4>>2]=40;c[121]=c[236];break}if(g>>>0<(c[118]|0)>>>0)c[118]=g;d=g+h|0;b=904;while(1){if((c[b>>2]|0)==(d|0)){v=153;break}a=c[b+8>>2]|0;if(!a)break;else b=a}if((v|0)==153?(c[b+12>>2]&8|0)==0:0){c[b>>2]=g;m=b+4|0;c[m>>2]=(c[m>>2]|0)+h;m=g+8|0;m=g+((m&7|0)==0?0:0-m&7)|0;b=d+8|0;b=d+((b&7|0)==0?0:0-b&7)|0;k=m+n|0;i=b-m-n|0;c[m+4>>2]=n|3;do if((b|0)!=(j|0)){if((b|0)==(c[119]|0)){w=(c[116]|0)+i|0;c[116]=w;c[119]=k;c[k+4>>2]=w|1;c[k+w>>2]=w;break}a=c[b+4>>2]|0;if((a&3|0)==1){h=a&-8;e=a>>>3;d:do if(a>>>0<256){a=c[b+8>>2]|0;d=c[b+12>>2]|0;if((d|0)==(a|0)){c[114]=c[114]&~(1<<e);break}else{c[a+12>>2]=d;c[d+8>>2]=a;break}}else{g=c[b+24>>2]|0;a=c[b+12>>2]|0;do if((a|0)==(b|0)){e=b+16|0;d=e+4|0;a=c[d>>2]|0;if(!a){a=c[e>>2]|0;if(!a){a=0;break}else d=e}while(1){e=a+20|0;f=c[e>>2]|0;if(f|0){a=f;d=e;continue}e=a+16|0;f=c[e>>2]|0;if(!f)break;else{a=f;d=e}}c[d>>2]=0}else{w=c[b+8>>2]|0;c[w+12>>2]=a;c[a+8>>2]=w}while(0);if(!g)break;d=c[b+28>>2]|0;e=760+(d<<2)|0;do if((b|0)!=(c[e>>2]|0)){c[g+16+(((c[g+16>>2]|0)!=(b|0)&1)<<2)>>2]=a;if(!a)break d}else{c[e>>2]=a;if(a|0)break;c[115]=c[115]&~(1<<d);break d}while(0);c[a+24>>2]=g;d=b+16|0;e=c[d>>2]|0;if(e|0){c[a+16>>2]=e;c[e+24>>2]=a}d=c[d+4>>2]|0;if(!d)break;c[a+20>>2]=d;c[d+24>>2]=a}while(0);b=b+h|0;f=h+i|0}else f=i;b=b+4|0;c[b>>2]=c[b>>2]&-2;c[k+4>>2]=f|1;c[k+f>>2]=f;b=f>>>3;if(f>>>0<256){d=496+(b<<1<<2)|0;a=c[114]|0;b=1<<b;if(!(a&b)){c[114]=a|b;b=d;a=d+8|0}else{a=d+8|0;b=c[a>>2]|0}c[a>>2]=k;c[b+12>>2]=k;c[k+8>>2]=b;c[k+12>>2]=d;break}b=f>>>8;do if(!b)b=0;else{if(f>>>0>16777215){b=31;break}v=(b+1048320|0)>>>16&8;w=b<<v;u=(w+520192|0)>>>16&4;w=w<<u;b=(w+245760|0)>>>16&2;b=14-(u|v|b)+(w<<b>>>15)|0;b=f>>>(b+7|0)&1|b<<1}while(0);e=760+(b<<2)|0;c[k+28>>2]=b;a=k+16|0;c[a+4>>2]=0;c[a>>2]=0;a=c[115]|0;d=1<<b;if(!(a&d)){c[115]=a|d;c[e>>2]=k;c[k+24>>2]=e;c[k+12>>2]=k;c[k+8>>2]=k;break}a=f<<((b|0)==31?0:25-(b>>>1)|0);d=c[e>>2]|0;while(1){if((c[d+4>>2]&-8|0)==(f|0)){v=194;break}e=d+16+(a>>>31<<2)|0;b=c[e>>2]|0;if(!b){v=193;break}else{a=a<<1;d=b}}if((v|0)==193){c[e>>2]=k;c[k+24>>2]=d;c[k+12>>2]=k;c[k+8>>2]=k;break}else if((v|0)==194){v=d+8|0;w=c[v>>2]|0;c[w+12>>2]=k;c[v>>2]=k;c[k+8>>2]=w;c[k+12>>2]=d;c[k+24>>2]=0;break}}else{w=(c[117]|0)+i|0;c[117]=w;c[120]=k;c[k+4>>2]=w|1}while(0);w=m+8|0;l=x;return w|0}b=904;while(1){a=c[b>>2]|0;if(a>>>0<=j>>>0?(w=a+(c[b+4>>2]|0)|0,w>>>0>j>>>0):0)break;b=c[b+8>>2]|0}f=w+-47|0;a=f+8|0;a=f+((a&7|0)==0?0:0-a&7)|0;f=j+16|0;a=a>>>0<f>>>0?j:a;b=a+8|0;d=g+8|0;d=(d&7|0)==0?0:0-d&7;v=g+d|0;d=h+-40-d|0;c[120]=v;c[117]=d;c[v+4>>2]=d|1;c[v+d+4>>2]=40;c[121]=c[236];d=a+4|0;c[d>>2]=27;c[b>>2]=c[226];c[b+4>>2]=c[227];c[b+8>>2]=c[228];c[b+12>>2]=c[229];c[226]=g;c[227]=h;c[229]=0;c[228]=b;b=a+24|0;do{v=b;b=b+4|0;c[b>>2]=7}while((v+8|0)>>>0<w>>>0);if((a|0)!=(j|0)){g=a-j|0;c[d>>2]=c[d>>2]&-2;c[j+4>>2]=g|1;c[a>>2]=g;b=g>>>3;if(g>>>0<256){d=496+(b<<1<<2)|0;a=c[114]|0;b=1<<b;if(!(a&b)){c[114]=a|b;b=d;a=d+8|0}else{a=d+8|0;b=c[a>>2]|0}c[a>>2]=j;c[b+12>>2]=j;c[j+8>>2]=b;c[j+12>>2]=d;break}b=g>>>8;if(b)if(g>>>0>16777215)d=31;else{v=(b+1048320|0)>>>16&8;w=b<<v;u=(w+520192|0)>>>16&4;w=w<<u;d=(w+245760|0)>>>16&2;d=14-(u|v|d)+(w<<d>>>15)|0;d=g>>>(d+7|0)&1|d<<1}else d=0;e=760+(d<<2)|0;c[j+28>>2]=d;c[j+20>>2]=0;c[f>>2]=0;b=c[115]|0;a=1<<d;if(!(b&a)){c[115]=b|a;c[e>>2]=j;c[j+24>>2]=e;c[j+12>>2]=j;c[j+8>>2]=j;break}a=g<<((d|0)==31?0:25-(d>>>1)|0);d=c[e>>2]|0;while(1){if((c[d+4>>2]&-8|0)==(g|0)){v=216;break}e=d+16+(a>>>31<<2)|0;b=c[e>>2]|0;if(!b){v=215;break}else{a=a<<1;d=b}}if((v|0)==215){c[e>>2]=j;c[j+24>>2]=d;c[j+12>>2]=j;c[j+8>>2]=j;break}else if((v|0)==216){v=d+8|0;w=c[v>>2]|0;c[w+12>>2]=j;c[v>>2]=j;c[j+8>>2]=w;c[j+12>>2]=d;c[j+24>>2]=0;break}}}else{w=c[118]|0;if((w|0)==0|g>>>0<w>>>0)c[118]=g;c[226]=g;c[227]=h;c[229]=0;c[123]=c[232];c[122]=-1;b=0;do{w=496+(b<<1<<2)|0;c[w+12>>2]=w;c[w+8>>2]=w;b=b+1|0}while((b|0)!=32);w=g+8|0;w=(w&7|0)==0?0:0-w&7;v=g+w|0;w=h+-40-w|0;c[120]=v;c[117]=w;c[v+4>>2]=w|1;c[v+w+4>>2]=40;c[121]=c[236]}while(0);b=c[117]|0;if(b>>>0>n>>>0){u=b-n|0;c[117]=u;w=c[120]|0;v=w+n|0;c[120]=v;c[v+4>>2]=u|1;c[w+4>>2]=n|3;w=w+8|0;l=x;return w|0}}c[(Ca()|0)>>2]=12;w=0;l=x;return w|0}function ya(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;if(!a)return;d=a+-8|0;f=c[118]|0;a=c[a+-4>>2]|0;b=a&-8;j=d+b|0;do if(!(a&1)){e=c[d>>2]|0;if(!(a&3))return;h=d+(0-e)|0;g=e+b|0;if(h>>>0<f>>>0)return;if((h|0)==(c[119]|0)){a=j+4|0;b=c[a>>2]|0;if((b&3|0)!=3){i=h;b=g;break}c[116]=g;c[a>>2]=b&-2;c[h+4>>2]=g|1;c[h+g>>2]=g;return}d=e>>>3;if(e>>>0<256){a=c[h+8>>2]|0;b=c[h+12>>2]|0;if((b|0)==(a|0)){c[114]=c[114]&~(1<<d);i=h;b=g;break}else{c[a+12>>2]=b;c[b+8>>2]=a;i=h;b=g;break}}f=c[h+24>>2]|0;a=c[h+12>>2]|0;do if((a|0)==(h|0)){d=h+16|0;b=d+4|0;a=c[b>>2]|0;if(!a){a=c[d>>2]|0;if(!a){a=0;break}else b=d}while(1){d=a+20|0;e=c[d>>2]|0;if(e|0){a=e;b=d;continue}d=a+16|0;e=c[d>>2]|0;if(!e)break;else{a=e;b=d}}c[b>>2]=0}else{i=c[h+8>>2]|0;c[i+12>>2]=a;c[a+8>>2]=i}while(0);if(f){b=c[h+28>>2]|0;d=760+(b<<2)|0;if((h|0)==(c[d>>2]|0)){c[d>>2]=a;if(!a){c[115]=c[115]&~(1<<b);i=h;b=g;break}}else{c[f+16+(((c[f+16>>2]|0)!=(h|0)&1)<<2)>>2]=a;if(!a){i=h;b=g;break}}c[a+24>>2]=f;b=h+16|0;d=c[b>>2]|0;if(d|0){c[a+16>>2]=d;c[d+24>>2]=a}b=c[b+4>>2]|0;if(b){c[a+20>>2]=b;c[b+24>>2]=a;i=h;b=g}else{i=h;b=g}}else{i=h;b=g}}else{i=d;h=d}while(0);if(h>>>0>=j>>>0)return;a=j+4|0;e=c[a>>2]|0;if(!(e&1))return;if(!(e&2)){a=c[119]|0;if((j|0)==(c[120]|0)){j=(c[117]|0)+b|0;c[117]=j;c[120]=i;c[i+4>>2]=j|1;if((i|0)!=(a|0))return;c[119]=0;c[116]=0;return}if((j|0)==(a|0)){j=(c[116]|0)+b|0;c[116]=j;c[119]=h;c[i+4>>2]=j|1;c[h+j>>2]=j;return}f=(e&-8)+b|0;d=e>>>3;do if(e>>>0<256){b=c[j+8>>2]|0;a=c[j+12>>2]|0;if((a|0)==(b|0)){c[114]=c[114]&~(1<<d);break}else{c[b+12>>2]=a;c[a+8>>2]=b;break}}else{g=c[j+24>>2]|0;a=c[j+12>>2]|0;do if((a|0)==(j|0)){d=j+16|0;b=d+4|0;a=c[b>>2]|0;if(!a){a=c[d>>2]|0;if(!a){d=0;break}else b=d}while(1){d=a+20|0;e=c[d>>2]|0;if(e|0){a=e;b=d;continue}d=a+16|0;e=c[d>>2]|0;if(!e)break;else{a=e;b=d}}c[b>>2]=0;d=a}else{d=c[j+8>>2]|0;c[d+12>>2]=a;c[a+8>>2]=d;d=a}while(0);if(g|0){a=c[j+28>>2]|0;b=760+(a<<2)|0;if((j|0)==(c[b>>2]|0)){c[b>>2]=d;if(!d){c[115]=c[115]&~(1<<a);break}}else{c[g+16+(((c[g+16>>2]|0)!=(j|0)&1)<<2)>>2]=d;if(!d)break}c[d+24>>2]=g;a=j+16|0;b=c[a>>2]|0;if(b|0){c[d+16>>2]=b;c[b+24>>2]=d}a=c[a+4>>2]|0;if(a|0){c[d+20>>2]=a;c[a+24>>2]=d}}}while(0);c[i+4>>2]=f|1;c[h+f>>2]=f;if((i|0)==(c[119]|0)){c[116]=f;return}}else{c[a>>2]=e&-2;c[i+4>>2]=b|1;c[h+b>>2]=b;f=b}a=f>>>3;if(f>>>0<256){d=496+(a<<1<<2)|0;b=c[114]|0;a=1<<a;if(!(b&a)){c[114]=b|a;a=d;b=d+8|0}else{b=d+8|0;a=c[b>>2]|0}c[b>>2]=i;c[a+12>>2]=i;c[i+8>>2]=a;c[i+12>>2]=d;return}a=f>>>8;if(a)if(f>>>0>16777215)a=31;else{h=(a+1048320|0)>>>16&8;j=a<<h;g=(j+520192|0)>>>16&4;j=j<<g;a=(j+245760|0)>>>16&2;a=14-(g|h|a)+(j<<a>>>15)|0;a=f>>>(a+7|0)&1|a<<1}else a=0;e=760+(a<<2)|0;c[i+28>>2]=a;c[i+20>>2]=0;c[i+16>>2]=0;b=c[115]|0;d=1<<a;do if(b&d){b=f<<((a|0)==31?0:25-(a>>>1)|0);d=c[e>>2]|0;while(1){if((c[d+4>>2]&-8|0)==(f|0)){a=73;break}e=d+16+(b>>>31<<2)|0;a=c[e>>2]|0;if(!a){a=72;break}else{b=b<<1;d=a}}if((a|0)==72){c[e>>2]=i;c[i+24>>2]=d;c[i+12>>2]=i;c[i+8>>2]=i;break}else if((a|0)==73){h=d+8|0;j=c[h>>2]|0;c[j+12>>2]=i;c[h>>2]=i;c[i+8>>2]=j;c[i+12>>2]=d;c[i+24>>2]=0;break}}else{c[115]=b|d;c[e>>2]=i;c[i+24>>2]=e;c[i+12>>2]=i;c[i+8>>2]=i}while(0);j=(c[122]|0)+-1|0;c[122]=j;if(!j)a=912;else return;while(1){a=c[a>>2]|0;if(!a)break;else a=a+8|0}c[122]=-1;return}function za(a){a=a|0;var b=0,d=0;b=l;l=l+16|0;d=b;c[d>>2]=Fa(c[a+60>>2]|0)|0;a=Ba(Z(6,d|0)|0)|0;l=b;return a|0}function Aa(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;f=l;l=l+32|0;g=f;e=f+20|0;c[g>>2]=c[a+60>>2];c[g+4>>2]=0;c[g+8>>2]=b;c[g+12>>2]=e;c[g+16>>2]=d;if((Ba(aa(140,g|0)|0)|0)<0){c[e>>2]=-1;a=-1}else a=c[e>>2]|0;l=f;return a|0}function Ba(a){a=a|0;if(a>>>0>4294963200){c[(Ca()|0)>>2]=0-a;a=-1}return a|0}function Ca(){return (Da()|0)+64|0}function Da(){return Ea()|0}function Ea(){return 8}function Fa(a){a=a|0;return a|0}function Ga(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,m=0,n=0,o=0,p=0;n=l;l=l+48|0;k=n+16|0;g=n;f=n+32|0;i=a+28|0;e=c[i>>2]|0;c[f>>2]=e;j=a+20|0;e=(c[j>>2]|0)-e|0;c[f+4>>2]=e;c[f+8>>2]=b;c[f+12>>2]=d;e=e+d|0;h=a+60|0;c[g>>2]=c[h>>2];c[g+4>>2]=f;c[g+8>>2]=2;g=Ba(da(146,g|0)|0)|0;a:do if((e|0)!=(g|0)){b=2;while(1){if((g|0)<0)break;e=e-g|0;p=c[f+4>>2]|0;o=g>>>0>p>>>0;f=o?f+8|0:f;b=(o<<31>>31)+b|0;p=g-(o?p:0)|0;c[f>>2]=(c[f>>2]|0)+p;o=f+4|0;c[o>>2]=(c[o>>2]|0)-p;c[k>>2]=c[h>>2];c[k+4>>2]=f;c[k+8>>2]=b;g=Ba(da(146,k|0)|0)|0;if((e|0)==(g|0)){m=3;break a}}c[a+16>>2]=0;c[i>>2]=0;c[j>>2]=0;c[a>>2]=c[a>>2]|32;if((b|0)==2)d=0;else d=d-(c[f+4>>2]|0)|0}else m=3;while(0);if((m|0)==3){p=c[a+44>>2]|0;c[a+16>>2]=p+(c[a+48>>2]|0);c[i>>2]=p;c[j>>2]=p}l=n;return d|0}function Ha(){return 952}function Ia(a){a=a|0;return 0}function Ja(a){a=a|0;return}function Ka(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=e+16|0;g=c[f>>2]|0;if(!g)if(!(La(e)|0)){g=c[f>>2]|0;h=5}else f=0;else h=5;a:do if((h|0)==5){j=e+20|0;i=c[j>>2]|0;f=i;if((g-i|0)>>>0<d>>>0){f=ha[c[e+36>>2]&3](e,b,d)|0;break}b:do if((a[e+75>>0]|0)>-1){i=d;while(1){if(!i){h=0;g=b;break b}g=i+-1|0;if((a[b+g>>0]|0)==10)break;else i=g}f=ha[c[e+36>>2]&3](e,b,i)|0;if(f>>>0<i>>>0)break a;h=i;g=b+i|0;d=d-i|0;f=c[j>>2]|0}else{h=0;g=b}while(0);Qa(f|0,g|0,d|0)|0;c[j>>2]=(c[j>>2]|0)+d;f=h+d|0}while(0);return f|0}function La(b){b=b|0;var d=0,e=0;d=b+74|0;e=a[d>>0]|0;a[d>>0]=e+255|e;d=c[b>>2]|0;if(!(d&8)){c[b+8>>2]=0;c[b+4>>2]=0;e=c[b+44>>2]|0;c[b+28>>2]=e;c[b+20>>2]=e;c[b+16>>2]=e+(c[b+48>>2]|0);b=0}else{c[b>>2]=d|32;b=-1}return b|0}function Ma(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=N(d,b)|0;d=(b|0)==0?0:d;if((c[e+76>>2]|0)>-1){g=(Ia(e)|0)==0;a=Ka(a,f,e)|0;if(!g)Ja(e)}else a=Ka(a,f,e)|0;if((a|0)!=(f|0))d=(a>>>0)/(b>>>0)|0;return d|0}function Na(){}function Oa(a){a=a|0;var b=0,d=0;d=a+15&-16|0;b=c[i>>2]|0;a=b+d|0;if((d|0)>0&(a|0)<(b|0)|(a|0)<0){W()|0;_(12);return -1}c[i>>2]=a;if((a|0)>(V()|0)?(U()|0)==0:0){c[i>>2]=b;_(12);return -1}return b|0}function Pa(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;h=b+e|0;d=d&255;if((e|0)>=67){while(b&3){a[b>>0]=d;b=b+1|0}f=h&-4|0;g=f-64|0;i=d|d<<8|d<<16|d<<24;while((b|0)<=(g|0)){c[b>>2]=i;c[b+4>>2]=i;c[b+8>>2]=i;c[b+12>>2]=i;c[b+16>>2]=i;c[b+20>>2]=i;c[b+24>>2]=i;c[b+28>>2]=i;c[b+32>>2]=i;c[b+36>>2]=i;c[b+40>>2]=i;c[b+44>>2]=i;c[b+48>>2]=i;c[b+52>>2]=i;c[b+56>>2]=i;c[b+60>>2]=i;b=b+64|0}while((b|0)<(f|0)){c[b>>2]=i;b=b+4|0}}while((b|0)<(h|0)){a[b>>0]=d;b=b+1|0}return h-e|0}function Qa(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;if((e|0)>=8192)return $(b|0,d|0,e|0)|0;h=b|0;g=b+e|0;if((b&3)==(d&3)){while(b&3){if(!e)return h|0;a[b>>0]=a[d>>0]|0;b=b+1|0;d=d+1|0;e=e-1|0}e=g&-4|0;f=e-64|0;while((b|0)<=(f|0)){c[b>>2]=c[d>>2];c[b+4>>2]=c[d+4>>2];c[b+8>>2]=c[d+8>>2];c[b+12>>2]=c[d+12>>2];c[b+16>>2]=c[d+16>>2];c[b+20>>2]=c[d+20>>2];c[b+24>>2]=c[d+24>>2];c[b+28>>2]=c[d+28>>2];c[b+32>>2]=c[d+32>>2];c[b+36>>2]=c[d+36>>2];c[b+40>>2]=c[d+40>>2];c[b+44>>2]=c[d+44>>2];c[b+48>>2]=c[d+48>>2];c[b+52>>2]=c[d+52>>2];c[b+56>>2]=c[d+56>>2];c[b+60>>2]=c[d+60>>2];b=b+64|0;d=d+64|0}while((b|0)<(e|0)){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0}}else{e=g-4|0;while((b|0)<(e|0)){a[b>>0]=a[d>>0]|0;a[b+1>>0]=a[d+1>>0]|0;a[b+2>>0]=a[d+2>>0]|0;a[b+3>>0]=a[d+3>>0]|0;b=b+4|0;d=d+4|0}}while((b|0)<(g|0)){a[b>>0]=a[d>>0]|0;b=b+1|0;d=d+1|0}return h|0}function Ra(a,b){a=a|0;b=b|0;return ga[a&1](b|0)|0}function Sa(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ha[a&3](b|0,c|0,d|0)|0}function Ta(a){a=a|0;S(0);return 0}function Ua(a,b,c){a=a|0;b=b|0;c=c|0;S(1);return 0}

// EMSCRIPTEN_END_FUNCS
var ga=[Ta,za];var ha=[Ua,Ga,Aa,Ua];return{_kiss_fftr_alloc:ua,_kiss_fftri:wa,_memset:Pa,setThrew:ma,_kiss_fftr:va,_kiss_fft_alloc:qa,_sbrk:Oa,_memcpy:Qa,stackAlloc:ia,getTempRet0:oa,setTempRet0:na,_kiss_fftr_free:ta,dynCall_iiii:Sa,_kiss_fft:sa,_emscripten_get_global_libc:Ha,dynCall_ii:Ra,stackSave:ja,_free:ya,runPostSets:Na,establishStackSpace:la,stackRestore:ka,_malloc:xa,_kiss_fft_free:pa}})


// EMSCRIPTEN_END_ASM
(Module.asmGlobalArg,Module.asmLibraryArg,buffer);var _kiss_fftr=Module["_kiss_fftr"]=asm["_kiss_fftr"];var getTempRet0=Module["getTempRet0"]=asm["getTempRet0"];var _free=Module["_free"]=asm["_free"];var runPostSets=Module["runPostSets"]=asm["runPostSets"];var setTempRet0=Module["setTempRet0"]=asm["setTempRet0"];var _kiss_fftr_alloc=Module["_kiss_fftr_alloc"]=asm["_kiss_fftr_alloc"];var _kiss_fftr_free=Module["_kiss_fftr_free"]=asm["_kiss_fftr_free"];var _kiss_fft_free=Module["_kiss_fft_free"]=asm["_kiss_fft_free"];var _kiss_fftri=Module["_kiss_fftri"]=asm["_kiss_fftri"];var _kiss_fft_alloc=Module["_kiss_fft_alloc"]=asm["_kiss_fft_alloc"];var _memset=Module["_memset"]=asm["_memset"];var _malloc=Module["_malloc"]=asm["_malloc"];var _kiss_fft=Module["_kiss_fft"]=asm["_kiss_fft"];var _emscripten_get_global_libc=Module["_emscripten_get_global_libc"]=asm["_emscripten_get_global_libc"];var _memcpy=Module["_memcpy"]=asm["_memcpy"];var stackAlloc=Module["stackAlloc"]=asm["stackAlloc"];var setThrew=Module["setThrew"]=asm["setThrew"];var _sbrk=Module["_sbrk"]=asm["_sbrk"];var stackRestore=Module["stackRestore"]=asm["stackRestore"];var establishStackSpace=Module["establishStackSpace"]=asm["establishStackSpace"];var stackSave=Module["stackSave"]=asm["stackSave"];var dynCall_ii=Module["dynCall_ii"]=asm["dynCall_ii"];var dynCall_iiii=Module["dynCall_iiii"]=asm["dynCall_iiii"];Runtime.stackAlloc=Module["stackAlloc"];Runtime.stackSave=Module["stackSave"];Runtime.stackRestore=Module["stackRestore"];Runtime.establishStackSpace=Module["establishStackSpace"];Runtime.setTempRet0=Module["setTempRet0"];Runtime.getTempRet0=Module["getTempRet0"];Module["asm"]=asm;Module["then"]=(function(func){if(Module["calledRun"]){func(Module)}else{var old=Module["onRuntimeInitialized"];Module["onRuntimeInitialized"]=(function(){if(old)old();func(Module)})}return Module});function ExitStatus(status){this.name="ExitStatus";this.message="Program terminated with exit("+status+")";this.status=status}ExitStatus.prototype=new Error;ExitStatus.prototype.constructor=ExitStatus;var initialStackTop;var preloadStartTime=null;var calledMain=false;dependenciesFulfilled=function runCaller(){if(!Module["calledRun"])run();if(!Module["calledRun"])dependenciesFulfilled=runCaller};Module["callMain"]=Module.callMain=function callMain(args){args=args||[];ensureInitRuntime();var argc=args.length+1;function pad(){for(var i=0;i<4-1;i++){argv.push(0)}}var argv=[allocate(intArrayFromString(Module["thisProgram"]),"i8",ALLOC_NORMAL)];pad();for(var i=0;i<argc-1;i=i+1){argv.push(allocate(intArrayFromString(args[i]),"i8",ALLOC_NORMAL));pad()}argv.push(0);argv=allocate(argv,"i32",ALLOC_NORMAL);try{var ret=Module["_main"](argc,argv,0);exit(ret,true)}catch(e){if(e instanceof ExitStatus){return}else if(e=="SimulateInfiniteLoop"){Module["noExitRuntime"]=true;return}else{var toLog=e;if(e&&typeof e==="object"&&e.stack){toLog=[e,e.stack]}Module.printErr("exception thrown: "+toLog);Module["quit"](1,e)}}finally{calledMain=true}};function run(args){args=args||Module["arguments"];if(preloadStartTime===null)preloadStartTime=Date.now();if(runDependencies>0){return}preRun();if(runDependencies>0)return;if(Module["calledRun"])return;function doRun(){if(Module["calledRun"])return;Module["calledRun"]=true;if(ABORT)return;ensureInitRuntime();preMain();if(Module["onRuntimeInitialized"])Module["onRuntimeInitialized"]();if(Module["_main"]&&shouldRunNow)Module["callMain"](args);postRun()}if(Module["setStatus"]){Module["setStatus"]("Running...");setTimeout((function(){setTimeout((function(){Module["setStatus"]("")}),1);doRun()}),1)}else{doRun()}}Module["run"]=Module.run=run;function exit(status,implicit){if(implicit&&Module["noExitRuntime"]){return}if(Module["noExitRuntime"]){}else{ABORT=true;EXITSTATUS=status;STACKTOP=initialStackTop;exitRuntime();if(Module["onExit"])Module["onExit"](status)}if(ENVIRONMENT_IS_NODE){process["exit"](status)}Module["quit"](status,new ExitStatus(status))}Module["exit"]=Module.exit=exit;var abortDecorators=[];function abort(what){if(Module["onAbort"]){Module["onAbort"](what)}if(what!==undefined){Module.print(what);Module.printErr(what);what=JSON.stringify(what)}else{what=""}ABORT=true;EXITSTATUS=1;var extra="\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.";var output="abort("+what+") at "+stackTrace()+extra;if(abortDecorators){abortDecorators.forEach((function(decorator){output=decorator(output,what)}))}throw output}Module["abort"]=Module.abort=abort;if(Module["preInit"]){if(typeof Module["preInit"]=="function")Module["preInit"]=[Module["preInit"]];while(Module["preInit"].length>0){Module["preInit"].pop()()}}var shouldRunNow=true;if(Module["noInitialRun"]){shouldRunNow=false}run()





  return KissFFTModule;
};
if (typeof module === "object" && module.exports) {
  module['exports'] = KissFFTModule;
};

}).call(this)}).call(this,require('_process'))
},{"_process":6,"fs":1,"path":5}],8:[function(require,module,exports){
"use strict";

var KissFFTModule = require('./KissFFT');


var kissFFTModule = KissFFTModule({});

var kiss_fftr_alloc = kissFFTModule.cwrap(
    'kiss_fftr_alloc', 'number', ['number', 'number', 'number', 'number' ]
);

var kiss_fftr = kissFFTModule.cwrap(
    'kiss_fftr', 'void', ['number', 'number', 'number' ]
);

var kiss_fftri = kissFFTModule.cwrap(
    'kiss_fftri', 'void', ['number', 'number', 'number' ]
);

var kiss_fftr_free = kissFFTModule.cwrap(
    'kiss_fftr_free', 'void', ['number']
);

var kiss_fft_alloc = kissFFTModule.cwrap(
    'kiss_fft_alloc', 'number', ['number', 'number', 'number', 'number' ]
);

var kiss_fft = kissFFTModule.cwrap(
    'kiss_fft', 'void', ['number', 'number', 'number' ]
);

var kiss_fft_free = kissFFTModule.cwrap(
    'kiss_fft_free', 'void', ['number']
);

var FFT = function (size) {

    this.size = size;
    this.fcfg = kiss_fft_alloc(size, false);
    this.icfg = kiss_fft_alloc(size, true);
    
    this.inptr = kissFFTModule._malloc(size*8 + size*8);
    this.outptr = this.inptr + size*8;
    
    this.cin = new Float32Array(kissFFTModule.HEAPU8.buffer, this.inptr, size*2);
    this.cout = new Float32Array(kissFFTModule.HEAPU8.buffer, this.outptr, size*2);
    
    this.forward = function(cin) {
	this.cin.set(cin);
	kiss_fft(this.fcfg, this.inptr, this.outptr);
	return new Float32Array(kissFFTModule.HEAPU8.buffer,
				this.outptr, this.size * 2);
    };
    
    this.inverse = function(cin) {
	this.cin.set(cpx);
	kiss_fft(this.icfg, this.inptr, this.outptr);
	return new Float32Array(kissFFTModule.HEAPU8.buffer,
				this.outptr, this.size * 2);
    };
    
    this.dispose = function() {
	kissFFTModule._free(this.inptr);
	kiss_fft_free(this.fcfg);
	kiss_fft_free(this.icfg);
    }
};

var FFTR = function (size) {

    this.size = size;
    this.fcfg = kiss_fftr_alloc(size, false);
    this.icfg = kiss_fftr_alloc(size, true);
    
    this.rptr = kissFFTModule._malloc(size*4 + (size+2)*4);
    this.cptr = this.rptr + size*4;
    
    this.ri = new Float32Array(kissFFTModule.HEAPU8.buffer, this.rptr, size);
    this.ci = new Float32Array(kissFFTModule.HEAPU8.buffer, this.cptr, size+2);
    
    this.forward = function(real) {
	this.ri.set(real);
	kiss_fftr(this.fcfg, this.rptr, this.cptr);
	return new Float32Array(kissFFTModule.HEAPU8.buffer,
				this.cptr, this.size + 2);
    };
    
    this.inverse = function(cpx) {
	this.ci.set(cpx);
	kiss_fftri(this.icfg, this.cptr, this.rptr);
	return new Float32Array(kissFFTModule.HEAPU8.buffer,
				this.rptr, this.size);
    };
    
    this.dispose = function() {
	kissFFTModule._free(this.rptr);
	kiss_fftr_free(this.fcfg);
	kiss_fftr_free(this.icfg);
    }
};

module.exports = {
    FFT: FFT,
    FFTR: FFTR
};

},{"./KissFFT":7}],9:[function(require,module,exports){
"use strict";

var _kissfftJs = require("kissfft-js");

var _process_fft = _interopRequireDefault(require("./wasm/process_fft"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * FFT filter with pan and percussive/harmonic separation

 * @class FilterProcessor
 * @extends AudioWorkletProcessor
 * written by goto@kmgoto.jp (goto@nanzan-u.ac.jp)
 * 
 * browserify filter-processor.js -p esmify > bundle.js
 *   Requirement
 *     npm install -g browserify
 *     npm install esmify --save-dev
 *     npm install browser-resolve --save-dev
 *
 * References (in BibTeX format)
 @inproceedings{Barry2004,
  title={Sound source separation: Azimuth discrimination and resynthesis},
  author={Barry, Dan and Lawlor, Bob and Coyle, Eugene},
  booktitle={7th International Conference on Digital Audio Effects, DAFX 04},
  year={2004}
}
@inproceedings{Fitzgerald2010,
  title={Harmonic/percussive separation using median filtering},
  author={Fitzgerald, Derry},
  booktitle={Proceedings of the International Conference 
  on Digital Audio Effects (DAFx)},
  volume={13},
  year={2010}
}
 */
class FilterProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.sampleRate = options.processorOptions.sampleRate;
    this.fftShift = options.processorOptions.fftShift; // 512 windowSize = 2*512 = 1024

    this.processFFT = new _process_fft.default.ProcessFFT(2 * this.fftShift, parseFloat(this.sampleRate));
    this.arg = this.processFFT.getInVector();
    this.ioSize = 128; // # samples per process (from the spec)

    console.log('Worklet options: ' + this.sampleRate + ' ' + this.fftShift);
    this.fftr = new _kissfftJs.FFTR(2 * this.fftShift); // kissfft-js

    this.hannWindow = [];

    for (let n = 0; n < 2 * this.fftShift; n++) this.hannWindow[n] = 0.5 * (1 - Math.cos(2 * Math.PI * n / (2 * this.sstShift)));

    this.fftObjBuffer = []; // up to 17

    this.inputBuffer = [[], []];
    this.outputBuffer = [[], []];
    this.filterChain = []; // fromPan, fromFreq, toPan, toFreq, action 
    // ('T': through, 'M': mute, 'P': percussive, 'H': harmonic)
    // this.port.onmessage = this.onmessage.bind(this);

    this.port.onmessage = e => {
      const {
        data
      } = e;
      console.log('worklet recvd: ', data);
      const res = {
        type: 'return',
        arg: ''
      };

      switch (data.function) {
        case 'presetFilter':
          this.processFFT.presetFilter(data.type, data.arg);
          res.arg = 'OK';
          break;

        default:
          res.arg = 'NG';
      }

      this.port.postMessage(res);
    }; // end onmessage() (should be in the constructor)

  } // end constructor()


  applyHannWindow(input) {
    const retval = input;
    retval.map((x, index) => x * this.hannWindow[index]);
    return retval;
  }

  process(inputs, outputs) {
    // Unit is 128 samples for AudioWorklet 
    // return true to continue on Chrome
    const input = inputs[0];
    const output = outputs[0];
    /*
      inputs[n][m][i] will access n-th input, m-th channel of that input, 
      and i-th sample of that channel.
      https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process
     */

    if (input.length !== 2) return true; // Stereo Only
    // Store input audio samples in buffer for one fft Window (fftShift*2)

    if (this.inputBuffer[0].length === 0) {
      this.inputBuffer[0] = [...input[0]];
      this.inputBuffer[1] = [...input[1]];
    } else {
      this.inputBuffer[0].push(...input[0]);
      this.inputBuffer[1].push(...input[1]);
    } // FFT if there are 1024 samples (===) should work


    if (this.inputBuffer[0].length >= 2 * this.fftShift) {
      // console.log('FFT ibuf len = ', this.inputBuffer[0].length);
      // FFT forward
      let fftCoef = this.justFFT(this.inputBuffer);
      this.inputBuffer[0].splice(0, this.fftShift);
      this.inputBuffer[1].splice(0, this.fftShift);

      if (true) {
        // prepare float vector for C++ class method arg
        // const vec = this.processFFT.returnVector();
        const nsamples = fftCoef[0].length;

        for (let i = 0; i < 2 * nsamples; i++) {
          if (i < nsamples) {
            // vec.push_back(fftCoef[0][i]);
            this.arg.set(i, fftCoef[0][i]);
          } else {
            // vec.push_back(fftCoef[1][i-nsamples]);
            this.arg.set(i, fftCoef[1][i - nsamples]);
          }
        }

        const ret = this.processFFT.process(this.arg); // const ret = this.processFFT.process(vec); vec.delete();
        // extract data from returned float vector

        for (let i = 0; i < ret.size(); i++) {
          if (i < ret.size() / 2) fftCoef[0][i] = ret.get(i);else fftCoef[1][i - ret.size() / 2] = ret.get(i);
        }

        ret.delete();
      } // Inverse


      const pcmData = [this.fftr.inverse(fftCoef[0]).map(x => x / (2 * this.fftShift)), this.fftr.inverse(fftCoef[1]).map(x => x / (2 * this.fftShift))]; // divide by windowSize
      // Store the output samples with overlap addition

      const len = this.outputBuffer[0].length;
      const base = Math.max(0, len - this.fftShift);

      for (let sample = 0; sample < 2 * this.fftShift; sample++) {
        if (base + sample < len) {// overlap addition
          // this.outputBuffer[0][base + sample] += pcmData[0][sample];
          // this.outputBuffer[1][base + sample] += pcmData[1][sample];
        } else {
          // new output
          this.outputBuffer[0][base + sample] = pcmData[0][sample];
          this.outputBuffer[1][base + sample] = pcmData[1][sample];
        }
      }
    } // end if (this.inputBuffer[0].length >= 2*this.fftShift)
    // no output because the last fftShift samples are to be overlaped
    // add delay


    if (this.outputBuffer[0].length < 64 * this.fftShift) return true; // output 128 (this.ioSize) samples

    output[0].set(this.outputBuffer[0].slice(0, this.ioSize));
    output[1].set(this.outputBuffer[1].slice(0, this.ioSize)); // delete output samples from the head

    this.outputBuffer[0].splice(0, this.ioSize);
    this.outputBuffer[1].splice(0, this.ioSize);
    return true;
  } // end process()


  justFFT(inputSamples) {
    return [this.fftr.forward(this.applyHannWindow(inputSamples[0])).slice(), this.fftr.forward(this.applyHannWindow(inputSamples[1])).slice()];
  }

} // end of the class


registerProcessor('filter-processor', FilterProcessor);

},{"./wasm/process_fft":10,"kissfft-js":8}],10:[function(require,module,exports){
(function (process,Buffer,__dirname){(function (){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof Module !== 'undefined' ? Module : {}; // --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.

var moduleOverrides = {};
var key;

for (key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

var arguments_ = [];
var thisProgram = './this.program';

var quit_ = function (status, toThrow) {
  throw toThrow;
}; // Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).


var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
ENVIRONMENT_IS_WEB = typeof window === 'object';
ENVIRONMENT_IS_WORKER = typeof importScripts === 'function'; // N.b. Electron.js environment is simultaneously a NODE-environment, but
// also a web environment.

ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof process.versions === 'object' && typeof process.versions.node === 'string';
ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (Module['ENVIRONMENT']) {
  throw new Error('Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -s ENVIRONMENT=web or -s ENVIRONMENT=node)');
} // `/` should be present at the end if `scriptDirectory` is not empty


var scriptDirectory = '';

function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  }

  return scriptDirectory + path;
} // Hooks that are implemented differently in different runtime environments.


var read_, readAsync, readBinary, setWindowTitle;
var nodeFS;
var nodePath;

if (ENVIRONMENT_IS_NODE) {
  if (ENVIRONMENT_IS_WORKER) {
    scriptDirectory = require('path').dirname(scriptDirectory) + '/';
  } else {
    scriptDirectory = __dirname + '/';
  } // include: node_shell_read.js


  read_ = function shell_read(filename, binary) {
    var ret = tryParseAsDataURI(filename);

    if (ret) {
      return binary ? ret : ret.toString();
    }

    if (!nodeFS) nodeFS = require('fs');
    if (!nodePath) nodePath = require('path');
    filename = nodePath['normalize'](filename);
    return nodeFS['readFileSync'](filename, binary ? null : 'utf8');
  };

  readBinary = function readBinary(filename) {
    var ret = read_(filename, true);

    if (!ret.buffer) {
      ret = new Uint8Array(ret);
    }

    assert(ret.buffer);
    return ret;
  }; // end include: node_shell_read.js


  if (process['argv'].length > 1) {
    thisProgram = process['argv'][1].replace(/\\/g, '/');
  }

  arguments_ = process['argv'].slice(2);

  if (typeof module !== 'undefined') {
    module['exports'] = Module;
  }

  process['on']('uncaughtException', function (ex) {
    // suppress ExitStatus exceptions from showing an error
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });
  process['on']('unhandledRejection', abort);

  quit_ = function (status) {
    process['exit'](status);
  };

  Module['inspect'] = function () {
    return '[Emscripten Module object]';
  };
} else if (ENVIRONMENT_IS_SHELL) {
  if (typeof read != 'undefined') {
    read_ = function shell_read(f) {
      var data = tryParseAsDataURI(f);

      if (data) {
        return intArrayToString(data);
      }

      return read(f);
    };
  }

  readBinary = function readBinary(f) {
    var data;
    data = tryParseAsDataURI(f);

    if (data) {
      return data;
    }

    if (typeof readbuffer === 'function') {
      return new Uint8Array(readbuffer(f));
    }

    data = read(f, 'binary');
    assert(typeof data === 'object');
    return data;
  };

  if (typeof scriptArgs != 'undefined') {
    arguments_ = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    arguments_ = arguments;
  }

  if (typeof quit === 'function') {
    quit_ = function (status) {
      quit(status);
    };
  }

  if (typeof print !== 'undefined') {
    // Prefer to use print/printErr where they exist, as they usually work better.
    if (typeof console === 'undefined') console =
    /** @type{!Console} */
    {};
    console.log =
    /** @type{!function(this:Console, ...*): undefined} */
    print;
    console.warn = console.error =
    /** @type{!function(this:Console, ...*): undefined} */
    typeof printErr !== 'undefined' ? printErr : print;
  }
} else // Note that this includes Node.js workers when relevant (pthreads is enabled).
  // Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
  // ENVIRONMENT_IS_NODE.
  if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    if (ENVIRONMENT_IS_WORKER) {
      // Check worker, not web, since window could be polyfilled
      scriptDirectory = self.location.href;
    } else if (typeof document !== 'undefined' && document.currentScript) {
      // web
      scriptDirectory = document.currentScript.src;
    } // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
    // otherwise, slice off the final part of the url to find the script directory.
    // if scriptDirectory does not contain a slash, lastIndexOf will return -1,
    // and scriptDirectory will correctly be replaced with an empty string.


    if (scriptDirectory.indexOf('blob:') !== 0) {
      scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf('/') + 1);
    } else {
      scriptDirectory = '';
    } // Differentiate the Web Worker from the Node Worker case, as reading must
    // be done differently.


    {
      // include: web_or_worker_shell_read.js
      read_ = function (url) {
        try {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, false);
          xhr.send(null);
          return xhr.responseText;
        } catch (err) {
          var data = tryParseAsDataURI(url);

          if (data) {
            return intArrayToString(data);
          }

          throw err;
        }
      };

      if (ENVIRONMENT_IS_WORKER) {
        readBinary = function (url) {
          try {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            xhr.responseType = 'arraybuffer';
            xhr.send(null);
            return new Uint8Array(
            /** @type{!ArrayBuffer} */
            xhr.response);
          } catch (err) {
            var data = tryParseAsDataURI(url);

            if (data) {
              return data;
            }

            throw err;
          }
        };
      }

      readAsync = function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';

        xhr.onload = function () {
          if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
            // file URLs can return 0
            onload(xhr.response);
            return;
          }

          var data = tryParseAsDataURI(url);

          if (data) {
            onload(data.buffer);
            return;
          }

          onerror();
        };

        xhr.onerror = onerror;
        xhr.send(null);
      }; // end include: web_or_worker_shell_read.js

    }

    setWindowTitle = function (title) {
      document.title = title;
    };
  } else {
    throw new Error('environment detection error');
  } // Set up the out() and err() hooks, which are how we can print to stdout or
// stderr, respectively.


var out = Module['print'] || console.log.bind(console);
var err = Module['printErr'] || console.warn.bind(console); // Merge back in the overrides

for (key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
} // Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.


moduleOverrides = null; // Emit code to handle expected values on the Module object. This applies Module.x
// to the proper local x. This has two benefits: first, we only emit it if it is
// expected to arrive, and second, by using a local everywhere else that can be
// minified.

if (Module['arguments']) arguments_ = Module['arguments'];

if (!Object.getOwnPropertyDescriptor(Module, 'arguments')) {
  Object.defineProperty(Module, 'arguments', {
    configurable: true,
    get: function () {
      abort('Module.arguments has been replaced with plain arguments_ (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)');
    }
  });
}

if (Module['thisProgram']) thisProgram = Module['thisProgram'];

if (!Object.getOwnPropertyDescriptor(Module, 'thisProgram')) {
  Object.defineProperty(Module, 'thisProgram', {
    configurable: true,
    get: function () {
      abort('Module.thisProgram has been replaced with plain thisProgram (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)');
    }
  });
}

if (Module['quit']) quit_ = Module['quit'];

if (!Object.getOwnPropertyDescriptor(Module, 'quit')) {
  Object.defineProperty(Module, 'quit', {
    configurable: true,
    get: function () {
      abort('Module.quit has been replaced with plain quit_ (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)');
    }
  });
} // perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message
// Assertions on removed incoming Module JS APIs.


assert(typeof Module['memoryInitializerPrefixURL'] === 'undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['pthreadMainPrefixURL'] === 'undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['cdInitializerPrefixURL'] === 'undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['filePackagePrefixURL'] === 'undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['read'] === 'undefined', 'Module.read option was removed (modify read_ in JS)');
assert(typeof Module['readAsync'] === 'undefined', 'Module.readAsync option was removed (modify readAsync in JS)');
assert(typeof Module['readBinary'] === 'undefined', 'Module.readBinary option was removed (modify readBinary in JS)');
assert(typeof Module['setWindowTitle'] === 'undefined', 'Module.setWindowTitle option was removed (modify setWindowTitle in JS)');
assert(typeof Module['TOTAL_MEMORY'] === 'undefined', 'Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY');

if (!Object.getOwnPropertyDescriptor(Module, 'read')) {
  Object.defineProperty(Module, 'read', {
    configurable: true,
    get: function () {
      abort('Module.read has been replaced with plain read_ (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)');
    }
  });
}

if (!Object.getOwnPropertyDescriptor(Module, 'readAsync')) {
  Object.defineProperty(Module, 'readAsync', {
    configurable: true,
    get: function () {
      abort('Module.readAsync has been replaced with plain readAsync (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)');
    }
  });
}

if (!Object.getOwnPropertyDescriptor(Module, 'readBinary')) {
  Object.defineProperty(Module, 'readBinary', {
    configurable: true,
    get: function () {
      abort('Module.readBinary has been replaced with plain readBinary (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)');
    }
  });
}

if (!Object.getOwnPropertyDescriptor(Module, 'setWindowTitle')) {
  Object.defineProperty(Module, 'setWindowTitle', {
    configurable: true,
    get: function () {
      abort('Module.setWindowTitle has been replaced with plain setWindowTitle (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)');
    }
  });
}

var IDBFS = 'IDBFS is no longer included by default; build with -lidbfs.js';
var PROXYFS = 'PROXYFS is no longer included by default; build with -lproxyfs.js';
var WORKERFS = 'WORKERFS is no longer included by default; build with -lworkerfs.js';
var NODEFS = 'NODEFS is no longer included by default; build with -lnodefs.js';
var STACK_ALIGN = 16;

function alignMemory(size, factor) {
  if (!factor) factor = STACK_ALIGN; // stack alignment (16-byte) by default

  return Math.ceil(size / factor) * factor;
}

function getNativeTypeSize(type) {
  switch (type) {
    case 'i1':
    case 'i8':
      return 1;

    case 'i16':
      return 2;

    case 'i32':
      return 4;

    case 'i64':
      return 8;

    case 'float':
      return 4;

    case 'double':
      return 8;

    default:
      {
        if (type[type.length - 1] === '*') {
          return 4; // A pointer
        } else if (type[0] === 'i') {
          var bits = Number(type.substr(1));
          assert(bits % 8 === 0, 'getNativeTypeSize invalid bits ' + bits + ', type ' + type);
          return bits / 8;
        } else {
          return 0;
        }
      }
  }
}

function warnOnce(text) {
  if (!warnOnce.shown) warnOnce.shown = {};

  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1;
    err(text);
  }
} // include: runtime_functions.js
// Wraps a JS function as a wasm function with a given signature.


function convertJsFunctionToWasm(func, sig) {
  // If the type reflection proposal is available, use the new
  // "WebAssembly.Function" constructor.
  // Otherwise, construct a minimal wasm module importing the JS function and
  // re-exporting it.
  if (typeof WebAssembly.Function === "function") {
    var typeNames = {
      'i': 'i32',
      'j': 'i64',
      'f': 'f32',
      'd': 'f64'
    };
    var type = {
      parameters: [],
      results: sig[0] == 'v' ? [] : [typeNames[sig[0]]]
    };

    for (var i = 1; i < sig.length; ++i) {
      type.parameters.push(typeNames[sig[i]]);
    }

    return new WebAssembly.Function(type, func);
  } // The module is static, with the exception of the type section, which is
  // generated based on the signature passed in.


  var typeSection = [0x01, // id: section,
  0x00, // length: 0 (placeholder)
  0x01, // count: 1
  0x60 // form: func
  ];
  var sigRet = sig.slice(0, 1);
  var sigParam = sig.slice(1);
  var typeCodes = {
    'i': 0x7f,
    // i32
    'j': 0x7e,
    // i64
    'f': 0x7d,
    // f32
    'd': 0x7c // f64

  }; // Parameters, length + signatures

  typeSection.push(sigParam.length);

  for (var i = 0; i < sigParam.length; ++i) {
    typeSection.push(typeCodes[sigParam[i]]);
  } // Return values, length + signatures
  // With no multi-return in MVP, either 0 (void) or 1 (anything else)


  if (sigRet == 'v') {
    typeSection.push(0x00);
  } else {
    typeSection = typeSection.concat([0x01, typeCodes[sigRet]]);
  } // Write the overall length of the type section back into the section header
  // (excepting the 2 bytes for the section id and length)


  typeSection[1] = typeSection.length - 2; // Rest of the module is static

  var bytes = new Uint8Array([0x00, 0x61, 0x73, 0x6d, // magic ("\0asm")
  0x01, 0x00, 0x00, 0x00 // version: 1
  ].concat(typeSection, [0x02, 0x07, // import section
  // (import "e" "f" (func 0 (type 0)))
  0x01, 0x01, 0x65, 0x01, 0x66, 0x00, 0x00, 0x07, 0x05, // export section
  // (export "f" (func 0 (type 0)))
  0x01, 0x01, 0x66, 0x00, 0x00])); // We can compile this wasm module synchronously because it is very small.
  // This accepts an import (at "e.f"), that it reroutes to an export (at "f")

  var module = new WebAssembly.Module(bytes);
  var instance = new WebAssembly.Instance(module, {
    'e': {
      'f': func
    }
  });
  var wrappedFunc = instance.exports['f'];
  return wrappedFunc;
}

var freeTableIndexes = []; // Weak map of functions in the table to their indexes, created on first use.

var functionsInTableMap;

function getEmptyTableSlot() {
  // Reuse a free index if there is one, otherwise grow.
  if (freeTableIndexes.length) {
    return freeTableIndexes.pop();
  } // Grow the table


  try {
    wasmTable.grow(1);
  } catch (err) {
    if (!(err instanceof RangeError)) {
      throw err;
    }

    throw 'Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.';
  }

  return wasmTable.length - 1;
} // Add a wasm function to the table.


function addFunctionWasm(func, sig) {
  // Check if the function is already in the table, to ensure each function
  // gets a unique index. First, create the map if this is the first use.
  if (!functionsInTableMap) {
    functionsInTableMap = new WeakMap();

    for (var i = 0; i < wasmTable.length; i++) {
      var item = wasmTable.get(i); // Ignore null values.

      if (item) {
        functionsInTableMap.set(item, i);
      }
    }
  }

  if (functionsInTableMap.has(func)) {
    return functionsInTableMap.get(func);
  } // It's not in the table, add it now.


  var ret = getEmptyTableSlot(); // Set the new value.

  try {
    // Attempting to call this with JS function will cause of table.set() to fail
    wasmTable.set(ret, func);
  } catch (err) {
    if (!(err instanceof TypeError)) {
      throw err;
    }

    assert(typeof sig !== 'undefined', 'Missing signature argument to addFunction: ' + func);
    var wrapped = convertJsFunctionToWasm(func, sig);
    wasmTable.set(ret, wrapped);
  }

  functionsInTableMap.set(func, ret);
  return ret;
}

function removeFunction(index) {
  functionsInTableMap.delete(wasmTable.get(index));
  freeTableIndexes.push(index);
} // 'sig' parameter is required for the llvm backend but only when func is not
// already a WebAssembly function.


function addFunction(func, sig) {
  assert(typeof func !== 'undefined');
  return addFunctionWasm(func, sig);
} // end include: runtime_functions.js
// include: runtime_debug.js
// end include: runtime_debug.js


function makeBigInt(low, high, unsigned) {
  return unsigned ? +(low >>> 0) + +(high >>> 0) * 4294967296.0 : +(low >>> 0) + +(high | 0) * 4294967296.0;
}

var tempRet0 = 0;

var setTempRet0 = function (value) {
  tempRet0 = value;
};

var getTempRet0 = function () {
  return tempRet0;
};

function getCompilerSetting(name) {
  throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for getCompilerSetting or emscripten_get_compiler_setting to work';
} // === Preamble library stuff ===
// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html


var wasmBinary;
if (Module['wasmBinary']) wasmBinary = Module['wasmBinary'];

if (!Object.getOwnPropertyDescriptor(Module, 'wasmBinary')) {
  Object.defineProperty(Module, 'wasmBinary', {
    configurable: true,
    get: function () {
      abort('Module.wasmBinary has been replaced with plain wasmBinary (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)');
    }
  });
}

var noExitRuntime = Module['noExitRuntime'] || true;

if (!Object.getOwnPropertyDescriptor(Module, 'noExitRuntime')) {
  Object.defineProperty(Module, 'noExitRuntime', {
    configurable: true,
    get: function () {
      abort('Module.noExitRuntime has been replaced with plain noExitRuntime (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)');
    }
  });
}

if (typeof WebAssembly !== 'object') {
  abort('no native wasm support detected');
} // include: runtime_safe_heap.js
// In MINIMAL_RUNTIME, setValue() and getValue() are only available when building with safe heap enabled, for heap safety checking.
// In traditional runtime, setValue() and getValue() are always available (although their use is highly discouraged due to perf penalties)

/** @param {number} ptr
    @param {number} value
    @param {string} type
    @param {number|boolean=} noSafe */


function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length - 1) === '*') type = 'i32'; // pointers are 32-bit

  switch (type) {
    case 'i1':
      HEAP8[ptr >> 0] = value;
      break;

    case 'i8':
      HEAP8[ptr >> 0] = value;
      break;

    case 'i16':
      HEAP16[ptr >> 1] = value;
      break;

    case 'i32':
      HEAP32[ptr >> 2] = value;
      break;

    case 'i64':
      tempI64 = [value >>> 0, (tempDouble = value, +Math.abs(tempDouble) >= 1.0 ? tempDouble > 0.0 ? (Math.min(+Math.floor(tempDouble / 4294967296.0), 4294967295.0) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296.0) >>> 0 : 0)], HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
      break;

    case 'float':
      HEAPF32[ptr >> 2] = value;
      break;

    case 'double':
      HEAPF64[ptr >> 3] = value;
      break;

    default:
      abort('invalid type for setValue: ' + type);
  }
}
/** @param {number} ptr
    @param {string} type
    @param {number|boolean=} noSafe */


function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length - 1) === '*') type = 'i32'; // pointers are 32-bit

  switch (type) {
    case 'i1':
      return HEAP8[ptr >> 0];

    case 'i8':
      return HEAP8[ptr >> 0];

    case 'i16':
      return HEAP16[ptr >> 1];

    case 'i32':
      return HEAP32[ptr >> 2];

    case 'i64':
      return HEAP32[ptr >> 2];

    case 'float':
      return HEAPF32[ptr >> 2];

    case 'double':
      return HEAPF64[ptr >> 3];

    default:
      abort('invalid type for getValue: ' + type);
  }

  return null;
} // end include: runtime_safe_heap.js
// Wasm globals


var wasmMemory; //========================================
// Runtime essentials
//========================================
// whether we are quitting the application. no code should run after this.
// set in exit() and abort()

var ABORT = false; // set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.

var EXITSTATUS;
/** @type {function(*, string=)} */

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
} // Returns the C function with a specified identifier (for C++, you need to do manual name mangling)


function getCFunc(ident) {
  var func = Module['_' + ident]; // closure exported function

  assert(func, 'Cannot call unknown function ' + ident + ', make sure it is exported');
  return func;
} // C calling interface.

/** @param {string|null=} returnType
    @param {Array=} argTypes
    @param {Arguments|Array=} args
    @param {Object=} opts */


function ccall(ident, returnType, argTypes, args, opts) {
  // For fast lookup of conversion functions
  var toC = {
    'string': function (str) {
      var ret = 0;

      if (str !== null && str !== undefined && str !== 0) {
        // null string
        // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
        var len = (str.length << 2) + 1;
        ret = stackAlloc(len);
        stringToUTF8(str, ret, len);
      }

      return ret;
    },
    'array': function (arr) {
      var ret = stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    }
  };

  function convertReturnValue(ret) {
    if (returnType === 'string') return UTF8ToString(ret);
    if (returnType === 'boolean') return Boolean(ret);
    return ret;
  }

  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  assert(returnType !== 'array', 'Return type should not be "array".');

  if (args) {
    for (var i = 0; i < args.length; i++) {
      var converter = toC[argTypes[i]];

      if (converter) {
        if (stack === 0) stack = stackSave();
        cArgs[i] = converter(args[i]);
      } else {
        cArgs[i] = args[i];
      }
    }
  }

  var ret = func.apply(null, cArgs);
  ret = convertReturnValue(ret);
  if (stack !== 0) stackRestore(stack);
  return ret;
}
/** @param {string=} returnType
    @param {Array=} argTypes
    @param {Object=} opts */


function cwrap(ident, returnType, argTypes, opts) {
  return function () {
    return ccall(ident, returnType, argTypes, arguments, opts);
  };
} // We used to include malloc/free by default in the past. Show a helpful error in
// builds with assertions.


var ALLOC_NORMAL = 0; // Tries to use _malloc()

var ALLOC_STACK = 1; // Lives for the duration of the current function call
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data.
// @allocator: How to allocate memory, see ALLOC_*

/** @type {function((Uint8Array|Array<number>), number)} */

function allocate(slab, allocator) {
  var ret;
  assert(typeof allocator === 'number', 'allocate no longer takes a type argument');
  assert(typeof slab !== 'number', 'allocate no longer takes a number as arg0');

  if (allocator == ALLOC_STACK) {
    ret = stackAlloc(slab.length);
  } else {
    ret = _malloc(slab.length);
  }

  if (slab.subarray || slab.slice) {
    HEAPU8.set(
    /** @type {!Uint8Array} */
    slab, ret);
  } else {
    HEAPU8.set(new Uint8Array(slab), ret);
  }

  return ret;
} // include: runtime_strings.js
// runtime_strings.js: Strings related runtime functions that are part of both MINIMAL_RUNTIME and regular runtime.
// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
// a copy of that string as a Javascript String object.


var UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined;
/**
 * @param {number} idx
 * @param {number=} maxBytesToRead
 * @return {string}
 */

function UTF8ArrayToString(heap, idx, maxBytesToRead) {
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx; // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  // (As a tiny code save trick, compare endPtr against endIdx using a negation, so that undefined means Infinity)

  while (heap[endPtr] && !(endPtr >= endIdx)) ++endPtr;

  if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(heap.subarray(idx, endPtr));
  } else {
    var str = ''; // If building with TextDecoder, we have already computed the string length above, so test loop end condition against that

    while (idx < endPtr) {
      // For UTF8 byte structure, see:
      // http://en.wikipedia.org/wiki/UTF-8#Description
      // https://www.ietf.org/rfc/rfc2279.txt
      // https://tools.ietf.org/html/rfc3629
      var u0 = heap[idx++];

      if (!(u0 & 0x80)) {
        str += String.fromCharCode(u0);
        continue;
      }

      var u1 = heap[idx++] & 63;

      if ((u0 & 0xE0) == 0xC0) {
        str += String.fromCharCode((u0 & 31) << 6 | u1);
        continue;
      }

      var u2 = heap[idx++] & 63;

      if ((u0 & 0xF0) == 0xE0) {
        u0 = (u0 & 15) << 12 | u1 << 6 | u2;
      } else {
        if ((u0 & 0xF8) != 0xF0) warnOnce('Invalid UTF-8 leading byte 0x' + u0.toString(16) + ' encountered when deserializing a UTF-8 string on the asm.js/wasm heap to a JS string!');
        u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heap[idx++] & 63;
      }

      if (u0 < 0x10000) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 0x10000;
        str += String.fromCharCode(0xD800 | ch >> 10, 0xDC00 | ch & 0x3FF);
      }
    }
  }

  return str;
} // Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns a
// copy of that string as a Javascript String object.
// maxBytesToRead: an optional length that specifies the maximum number of bytes to read. You can omit
//                 this parameter to scan the string until the first \0 byte. If maxBytesToRead is
//                 passed, and the string at [ptr, ptr+maxBytesToReadr[ contains a null byte in the
//                 middle, then the string will cut short at that byte index (i.e. maxBytesToRead will
//                 not produce a string of exact length [ptr, ptr+maxBytesToRead[)
//                 N.B. mixing frequent uses of UTF8ToString() with and without maxBytesToRead may
//                 throw JS JIT optimizations off, so it is worth to consider consistently using one
//                 style or the other.

/**
 * @param {number} ptr
 * @param {number=} maxBytesToRead
 * @return {string}
 */


function UTF8ToString(ptr, maxBytesToRead) {
  return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
} // Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
// encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   heap: the array to copy to. Each index in this array is assumed to be one 8-byte element.
//   outIdx: The starting offset in the array to begin the copying.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array.
//                    This count should include the null terminator,
//                    i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
//                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.


function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
    return 0;
  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.

  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i); // possibly a lead surrogate

    if (u >= 0xD800 && u <= 0xDFFF) {
      var u1 = str.charCodeAt(++i);
      u = 0x10000 + ((u & 0x3FF) << 10) | u1 & 0x3FF;
    }

    if (u <= 0x7F) {
      if (outIdx >= endIdx) break;
      heap[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      heap[outIdx++] = 0xC0 | u >> 6;
      heap[outIdx++] = 0x80 | u & 63;
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      heap[outIdx++] = 0xE0 | u >> 12;
      heap[outIdx++] = 0x80 | u >> 6 & 63;
      heap[outIdx++] = 0x80 | u & 63;
    } else {
      if (outIdx + 3 >= endIdx) break;
      if (u >= 0x200000) warnOnce('Invalid Unicode code point 0x' + u.toString(16) + ' encountered when serializing a JS string to an UTF-8 string on the asm.js/wasm heap! (Valid unicode code points should be in range 0-0x1FFFFF).');
      heap[outIdx++] = 0xF0 | u >> 18;
      heap[outIdx++] = 0x80 | u >> 12 & 63;
      heap[outIdx++] = 0x80 | u >> 6 & 63;
      heap[outIdx++] = 0x80 | u & 63;
    }
  } // Null-terminate the pointer to the buffer.


  heap[outIdx] = 0;
  return outIdx - startIdx;
} // Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Returns the number of bytes written, EXCLUDING the null terminator.


function stringToUTF8(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
} // Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.


function lengthBytesUTF8(str) {
  var len = 0;

  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var u = str.charCodeAt(i); // possibly a lead surrogate

    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | str.charCodeAt(++i) & 0x3FF;
    if (u <= 0x7F) ++len;else if (u <= 0x7FF) len += 2;else if (u <= 0xFFFF) len += 3;else len += 4;
  }

  return len;
} // end include: runtime_strings.js
// include: runtime_strings_extra.js
// runtime_strings_extra.js: Strings related runtime functions that are available only in regular runtime.
// Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.


function AsciiToString(ptr) {
  var str = '';

  while (1) {
    var ch = HEAPU8[ptr++ >> 0];
    if (!ch) return str;
    str += String.fromCharCode(ch);
  }
} // Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.


function stringToAscii(str, outPtr) {
  return writeAsciiToMemory(str, outPtr, false);
} // Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.


var UTF16Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-16le') : undefined;

function UTF16ToString(ptr, maxBytesToRead) {
  assert(ptr % 2 == 0, 'Pointer passed to UTF16ToString must be aligned to two bytes!');
  var endPtr = ptr; // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.

  var idx = endPtr >> 1;
  var maxIdx = idx + maxBytesToRead / 2; // If maxBytesToRead is not passed explicitly, it will be undefined, and this
  // will always evaluate to true. This saves on code size.

  while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;

  endPtr = idx << 1;

  if (endPtr - ptr > 32 && UTF16Decoder) {
    return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
  } else {
    var str = ''; // If maxBytesToRead is not passed explicitly, it will be undefined, and the for-loop's condition
    // will always evaluate to true. The loop is then terminated on the first null char.

    for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
      var codeUnit = HEAP16[ptr + i * 2 >> 1];
      if (codeUnit == 0) break; // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.

      str += String.fromCharCode(codeUnit);
    }

    return str;
  }
} // Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16 form. The copy will require at most str.length*4+2 bytes of space in the HEAP.
// Use the function lengthBytesUTF16() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=2, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<2 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.


function stringToUTF16(str, outPtr, maxBytesToWrite) {
  assert(outPtr % 2 == 0, 'Pointer passed to stringToUTF16 must be aligned to two bytes!');
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!'); // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.

  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }

  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2; // Null terminator.

  var startPtr = outPtr;
  var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;

  for (var i = 0; i < numCharsToWrite; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate

    HEAP16[outPtr >> 1] = codeUnit;
    outPtr += 2;
  } // Null-terminate the pointer to the HEAP.


  HEAP16[outPtr >> 1] = 0;
  return outPtr - startPtr;
} // Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.


function lengthBytesUTF16(str) {
  return str.length * 2;
}

function UTF32ToString(ptr, maxBytesToRead) {
  assert(ptr % 4 == 0, 'Pointer passed to UTF32ToString must be aligned to four bytes!');
  var i = 0;
  var str = ''; // If maxBytesToRead is not passed explicitly, it will be undefined, and this
  // will always evaluate to true. This saves on code size.

  while (!(i >= maxBytesToRead / 4)) {
    var utf32 = HEAP32[ptr + i * 4 >> 2];
    if (utf32 == 0) break;
    ++i; // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    // See http://unicode.org/faq/utf_bom.html#utf16-3

    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | ch >> 10, 0xDC00 | ch & 0x3FF);
    } else {
      str += String.fromCharCode(utf32);
    }
  }

  return str;
} // Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32 form. The copy will require at most str.length*4+4 bytes of space in the HEAP.
// Use the function lengthBytesUTF32() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=4, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<4 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.


function stringToUTF32(str, outPtr, maxBytesToWrite) {
  assert(outPtr % 4 == 0, 'Pointer passed to stringToUTF32 must be aligned to four bytes!');
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!'); // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.

  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }

  if (maxBytesToWrite < 4) return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;

  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate

    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | trailSurrogate & 0x3FF;
    }

    HEAP32[outPtr >> 2] = codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  } // Null-terminate the pointer to the HEAP.


  HEAP32[outPtr >> 2] = 0;
  return outPtr - startPtr;
} // Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.


function lengthBytesUTF32(str) {
  var len = 0;

  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // possibly a lead surrogate, so skip over the tail surrogate.

    len += 4;
  }

  return len;
} // Allocate heap space for a JS string, and write it there.
// It is the responsibility of the caller to free() that memory.


function allocateUTF8(str) {
  var size = lengthBytesUTF8(str) + 1;

  var ret = _malloc(size);

  if (ret) stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
} // Allocate stack space for a JS string, and write it there.


function allocateUTF8OnStack(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = stackAlloc(size);
  stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
} // Deprecated: This function should not be called because it is unsafe and does not provide
// a maximum length limit of how many bytes it is allowed to write. Prefer calling the
// function stringToUTF8Array() instead, which takes in a maximum length that can be used
// to be secure from out of bounds writes.

/** @deprecated
    @param {boolean=} dontAddNull */


function writeStringToMemory(string, buffer, dontAddNull) {
  warnOnce('writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!');
  var
  /** @type {number} */
  lastChar,
  /** @type {number} */
  end;

  if (dontAddNull) {
    // stringToUTF8Array always appends null. If we don't want to do that, remember the
    // character that existed at the location where the null will be placed, and restore
    // that after the write (below).
    end = buffer + lengthBytesUTF8(string);
    lastChar = HEAP8[end];
  }

  stringToUTF8(string, buffer, Infinity);
  if (dontAddNull) HEAP8[end] = lastChar; // Restore the value under the null character.
}

function writeArrayToMemory(array, buffer) {
  assert(array.length >= 0, 'writeArrayToMemory array must have a length (should be an array or typed array)');
  HEAP8.set(array, buffer);
}
/** @param {boolean=} dontAddNull */


function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    assert(str.charCodeAt(i) === str.charCodeAt(i) & 0xff);
    HEAP8[buffer++ >> 0] = str.charCodeAt(i);
  } // Null-terminate the pointer to the HEAP.


  if (!dontAddNull) HEAP8[buffer >> 0] = 0;
} // end include: runtime_strings_extra.js
// Memory management


function alignUp(x, multiple) {
  if (x % multiple > 0) {
    x += multiple - x % multiple;
  }

  return x;
}

var HEAP,
/** @type {ArrayBuffer} */
buffer,
/** @type {Int8Array} */
HEAP8,
/** @type {Uint8Array} */
HEAPU8,
/** @type {Int16Array} */
HEAP16,
/** @type {Uint16Array} */
HEAPU16,
/** @type {Int32Array} */
HEAP32,
/** @type {Uint32Array} */
HEAPU32,
/** @type {Float32Array} */
HEAPF32,
/** @type {Float64Array} */
HEAPF64;

function updateGlobalBufferAndViews(buf) {
  buffer = buf;
  Module['HEAP8'] = HEAP8 = new Int8Array(buf);
  Module['HEAP16'] = HEAP16 = new Int16Array(buf);
  Module['HEAP32'] = HEAP32 = new Int32Array(buf);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(buf);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(buf);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(buf);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(buf);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(buf);
}

var TOTAL_STACK = 5242880;
if (Module['TOTAL_STACK']) assert(TOTAL_STACK === Module['TOTAL_STACK'], 'the stack size can no longer be determined at runtime');
var INITIAL_MEMORY = Module['INITIAL_MEMORY'] || 16777216;

if (!Object.getOwnPropertyDescriptor(Module, 'INITIAL_MEMORY')) {
  Object.defineProperty(Module, 'INITIAL_MEMORY', {
    configurable: true,
    get: function () {
      abort('Module.INITIAL_MEMORY has been replaced with plain INITIAL_MEMORY (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)');
    }
  });
}

assert(INITIAL_MEMORY >= TOTAL_STACK, 'INITIAL_MEMORY should be larger than TOTAL_STACK, was ' + INITIAL_MEMORY + '! (TOTAL_STACK=' + TOTAL_STACK + ')'); // check for full engine support (use string 'subarray' to avoid closure compiler confusion)

assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && Int32Array.prototype.subarray !== undefined && Int32Array.prototype.set !== undefined, 'JS engine does not provide full typed array support'); // If memory is defined in wasm, the user can't provide it.

assert(!Module['wasmMemory'], 'Use of `wasmMemory` detected.  Use -s IMPORTED_MEMORY to define wasmMemory externally');
assert(INITIAL_MEMORY == 16777216, 'Detected runtime INITIAL_MEMORY setting.  Use -s IMPORTED_MEMORY to define wasmMemory dynamically'); // include: runtime_init_table.js
// In regular non-RELOCATABLE mode the table is exported
// from the wasm module and this will be assigned once
// the exports are available.

var wasmTable; // end include: runtime_init_table.js
// include: runtime_stack_check.js
// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.

function writeStackCookie() {
  var max = _emscripten_stack_get_end();

  assert((max & 3) == 0); // The stack grows downwards

  HEAPU32[(max >> 2) + 1] = 0x2135467;
  HEAPU32[(max >> 2) + 2] = 0x89BACDFE; // Also test the global address 0 for integrity.

  HEAP32[0] = 0x63736d65;
  /* 'emsc' */
}

function checkStackCookie() {
  if (ABORT) return;

  var max = _emscripten_stack_get_end();

  var cookie1 = HEAPU32[(max >> 2) + 1];
  var cookie2 = HEAPU32[(max >> 2) + 2];

  if (cookie1 != 0x2135467 || cookie2 != 0x89BACDFE) {
    abort('Stack overflow! Stack cookie has been overwritten, expected hex dwords 0x89BACDFE and 0x2135467, but received 0x' + cookie2.toString(16) + ' ' + cookie1.toString(16));
  } // Also test the global address 0 for integrity.


  if (HEAP32[0] !== 0x63736d65
  /* 'emsc' */
  ) abort('Runtime error: The application has corrupted its heap memory area (address zero)!');
} // end include: runtime_stack_check.js
// include: runtime_assertions.js
// Endianness check (note: assumes compiler arch was little-endian)


(function () {
  var h16 = new Int16Array(1);
  var h8 = new Int8Array(h16.buffer);
  h16[0] = 0x6373;
  if (h8[0] !== 0x73 || h8[1] !== 0x63) throw 'Runtime error: expected the system to be little-endian!';
})();

function abortFnPtrError(ptr, sig) {
  abort("Invalid function pointer " + ptr + " called with signature '" + sig + "'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this). Build with ASSERTIONS=2 for more info.");
} // end include: runtime_assertions.js


var __ATPRERUN__ = []; // functions called before the runtime is initialized

var __ATINIT__ = []; // functions called during startup

var __ATMAIN__ = []; // functions called when main() is to be run

var __ATEXIT__ = []; // functions called during shutdown

var __ATPOSTRUN__ = []; // functions called after the main() is called

var runtimeInitialized = false;
var runtimeExited = false;

__ATINIT__.push({
  func: function () {
    ___wasm_call_ctors();
  }
});

function preRun() {
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];

    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }

  callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
  checkStackCookie();
  assert(!runtimeInitialized);
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  checkStackCookie();
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  checkStackCookie();
  runtimeExited = true;
}

function postRun() {
  checkStackCookie();

  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];

    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }

  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}

function addOnExit(cb) {}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
} // include: runtime_math.js
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc


assert(Math.imul, 'This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.fround, 'This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.clz32, 'This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.trunc, 'This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill'); // end include: runtime_math.js
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// Module.preRun (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.

var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

var runDependencyTracking = {};

function getUniqueRunDependency(id) {
  var orig = id;

  while (1) {
    if (!runDependencyTracking[id]) return id;
    id = orig + Math.random();
  }
}

function addRunDependency(id) {
  runDependencies++;

  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;

    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function () {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }

        var shown = false;

        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            err('still waiting on run dependencies:');
          }

          err('dependency: ' + dep);
        }

        if (shown) {
          err('(end of list)');
        }
      }, 10000);
    }
  } else {
    err('warning: run dependency added without ID');
  }
}

function removeRunDependency(id) {
  runDependencies--;

  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    err('warning: run dependency removed without ID');
  }

  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }

    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}

Module["preloadedImages"] = {}; // maps url to image data

Module["preloadedAudios"] = {}; // maps url to audio data

/** @param {string|number=} what */

function abort(what) {
  if (Module['onAbort']) {
    Module['onAbort'](what);
  }

  what += '';
  err(what);
  ABORT = true;
  EXITSTATUS = 1;
  var output = 'abort(' + what + ') at ' + stackTrace();
  what = output; // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.

  var e = new WebAssembly.RuntimeError(what); // Throw the error whether or not MODULARIZE is set because abort is used
  // in code paths apart from instantiation where an exception is expected
  // to be thrown when abort is called.

  throw e;
} // {{MEM_INITIALIZER}}
// include: memoryprofiler.js
// end include: memoryprofiler.js
// show errors on likely calls to FS when it was not included


var FS = {
  error: function () {
    abort('Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with  -s FORCE_FILESYSTEM=1');
  },
  init: function () {
    FS.error();
  },
  createDataFile: function () {
    FS.error();
  },
  createPreloadedFile: function () {
    FS.error();
  },
  createLazyFile: function () {
    FS.error();
  },
  open: function () {
    FS.error();
  },
  mkdev: function () {
    FS.error();
  },
  registerDevice: function () {
    FS.error();
  },
  analyzePath: function () {
    FS.error();
  },
  loadFilesFromDB: function () {
    FS.error();
  },
  ErrnoError: function ErrnoError() {
    FS.error();
  }
};
Module['FS_createDataFile'] = FS.createDataFile;
Module['FS_createPreloadedFile'] = FS.createPreloadedFile; // include: URIUtils.js

function hasPrefix(str, prefix) {
  return String.prototype.startsWith ? str.startsWith(prefix) : str.indexOf(prefix) === 0;
} // Prefix of data URIs emitted by SINGLE_FILE and related options.


var dataURIPrefix = 'data:application/octet-stream;base64,'; // Indicates whether filename is a base64 data URI.

function isDataURI(filename) {
  return hasPrefix(filename, dataURIPrefix);
}

var fileURIPrefix = "file://"; // Indicates whether filename is delivered via file protocol (as opposed to http/https)

function isFileURI(filename) {
  return hasPrefix(filename, fileURIPrefix);
} // end include: URIUtils.js


function createExportWrapper(name, fixedasm) {
  return function () {
    var displayName = name;
    var asm = fixedasm;

    if (!fixedasm) {
      asm = Module['asm'];
    }

    assert(runtimeInitialized, 'native function `' + displayName + '` called before runtime initialization');
    assert(!runtimeExited, 'native function `' + displayName + '` called after runtime exit (use NO_EXIT_RUNTIME to keep it alive after main() exits)');

    if (!asm[name]) {
      assert(asm[name], 'exported native function `' + displayName + '` not found');
    }

    return asm[name].apply(null, arguments);
  };
}

var wasmBinaryFile = 'data:application/octet-stream;base64,AGFzbQEAAAABm4GAgAAXYAF/AX9gAAF/YAF/AGACf38AYAJ/fwF/YAN/f38Bf2ADf39/AGAAAGAEf39/fwBgBX9/f39/AGAGf39/f39/AGAEf39/fQBgBH9/f38Bf2ADf399AGADf399AX9gAX0BfWAIf39/f39/f38AYA1/f39/f39/f39/f39/AGACf30AYAR/f399AX9gAX8BfmADf35/AX5gAX8BfQKQh4CAACQDZW52Fl9lbWJpbmRfcmVnaXN0ZXJfY2xhc3MAEQNlbnYLaW52b2tlX3ZpaWkACANlbnYKaW52b2tlX2lpaQAFA2VudhtfX2N4YV9maW5kX21hdGNoaW5nX2NhdGNoXzIAAQNlbnYLZ2V0VGVtcFJldDAAAQNlbnYRX19yZXN1bWVFeGNlcHRpb24AAgNlbnYKaW52b2tlX3ZpaQAGA2VudgtpbnZva2VfaWlpaQAMA2VudhtfX2N4YV9maW5kX21hdGNoaW5nX2NhdGNoXzMAAANlbnYRX19jeGFfYmVnaW5fY2F0Y2gAAANlbnYMaW52b2tlX3ZpaWlpAAkDZW52GF9fY3hhX2FsbG9jYXRlX2V4Y2VwdGlvbgAAA2VudgtfX2N4YV90aHJvdwAGA2VudhRfX2N4YV9mcmVlX2V4Y2VwdGlvbgACA2VudiJfZW1iaW5kX3JlZ2lzdGVyX2NsYXNzX2NvbnN0cnVjdG9yAAoDZW52H19lbWJpbmRfcmVnaXN0ZXJfY2xhc3NfZnVuY3Rpb24AEANlbnYJaW52b2tlX2lpAAQDZW52C2ludm9rZV92aWlmAAsDZW52DV9lbXZhbF9pbmNyZWYAAgNlbnYNX2VtdmFsX2RlY3JlZgACA2VudglpbnZva2VfdmkAAwNlbnYRX2VtdmFsX3Rha2VfdmFsdWUABANlbnYVX2VtYmluZF9yZWdpc3Rlcl92b2lkAAMDZW52FV9lbWJpbmRfcmVnaXN0ZXJfYm9vbAAJA2VudhtfZW1iaW5kX3JlZ2lzdGVyX3N0ZF9zdHJpbmcAAwNlbnYcX2VtYmluZF9yZWdpc3Rlcl9zdGRfd3N0cmluZwAGA2VudhZfZW1iaW5kX3JlZ2lzdGVyX2VtdmFsAAMDZW52GF9lbWJpbmRfcmVnaXN0ZXJfaW50ZWdlcgAJA2VudhZfZW1iaW5kX3JlZ2lz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IQJBAEEANgLIJQJAIAJBAUYNACABQRBqJAAgAA8LQQAQCCEAEAQaIAAQagALCAAgACABEHALBgAgABBxCwgAIAAgARByCxAAIAAQcyABEHMgAhB0EHULbAEBfyMAQRBrIgQkACAEIAAgAxB2IQMgABB3IQBBAEEANgLIJUEeIAAgASACIANBBGoQCkEAKALIJSEAQQBBADYCyCUCQCAAQQFGDQAgAxB5GiAEQRBqJAAPCxADIQAQBBogAxB5GiAAEAUACxwBAX8gACABEHogABA+IQIgACABEHsgACACEHwLMAACQCAAKAIARQ0AIAAQfSAAEHcgACgCACAAEFoQfiAAEH9BADYCACAAQgA3AgALC2UBAX8jAEEQayICJAAgAiABNgIMIAAQgAEhAQJAIAIoAgwgAUsNAAJAIAAQWiIAIAFBAXZPDQAgAiAAQQF0NgIIIAJBCGogAkEMahCDASgCACEBCyACQRBqJAAgAQ8LIAAQoQQAC0QBAX8CQCAAEIABIAFPDQAgABChBAALIAAgABB3IAEQgQEiAjYCACAAIAI2AgQgABB/IAIgAUECdGo2AgAgAEEAEIIBCwIACyUBAX8jAEEQayICJAAgAkEIaiABELEBKAIAIQEgAkEQaiQAIAELFAAgACAAKAIAIAFBAnRqNgIAIAALmQEBA38jAEEQayICJAACQAJAIAIgACABEHYiASgCBCABKAIIRg0AA0AgABB3IQMgASgCBBCKASEEQQBBADYCyCVBHyADIAQQBkEAKALIJSEDQQBBADYCyCUgA0EBRg0CIAEgASgCBEEEaiIDNgIEIAMgASgCCEcNAAsLIAEQeRogAkEQaiQADwsQAyEDEAQaIAEQeRogAxAFAAsjAAJAIAAoAgBFDQAgABCZASAAEHcgACgCACAAEHEQfgsgAAszACAAIAAQlQEgABCVASAAEFpBAnRqIAAQlQEgABA+QQJ0aiAAEJUBIAAQWkECdGoQlgELBAAgAAsXACAAIAEQaxBsGiACEG0aIAAQbhogAAsLACAAEAkaELcEAAsEACAACxAAIAEQaxogAEEANgIAIAALBAAgAAsJACAAEG8aIAALBAAgAAswAQF/IwBBEGsiAiQAIAIgATYCACACIAA2AgggAiACQQhqEIQBIQAgAkEQaiQAIAALEwAgABCGASgCACAAKAIAa0ECdQsJACAAIAEQZBoLJwEBfyMAQRBrIgEkACABIAA2AgggAUEIahCFASEAIAFBEGokACAACwQAIAALHgACQCABIABrIgFFDQAgAiAAIAEQ8QQaCyACIAFqCyQAIAAgATYCACAAIAEoAgQiATYCBCAAIAEgAkECdGo2AgggAAsKACAAQQhqEI4BC2wBAX8jAEEQayIEJAAgBCACNgIAIAQgATYCCAJAIARBCGogBBCJAUUNAANAIAAgAygCABCKASAEQQhqEIsBEIwBIARBCGoQjQEaIAMgAygCAEEEajYCACAEQQhqIAQQiQENAAsLIARBEGokAAsRACAAKAIAIAAoAgQ2AgQgAAsCAAtmAQN/IAAoAgQhAgJAA0AgAiABRg0BIAAQdyEDIAJBfGoiAhCKASEEQQBBADYCyCVBICADIAQQBkEAKALIJSEDQQBBADYCyCUgA0EBRw0AC0EAEAghAhAEGiACEGoACyAAIAE2AgQLMQAgACAAEJUBIAAQlQEgABBaQQJ0aiAAEJUBIAFBAnRqIAAQlQEgABA+QQJ0ahCWAQsZAQF/IAAQPiEBIAAQmQEgACABEHwgABBiCwsAIAAgASACEJoBCwoAIABBCGoQmwELdwECfyMAQRBrIgEkACABIAAQoQEQogE2AgwQowEhAEEAQQA2AsglIAEgADYCCEEhIAFBDGogAUEIahACIQJBACgCyCUhAEEAQQA2AsglAkAgAEEBRg0AIAIoAgAhACABQRBqJAAgAA8LQQAQCCEBEAQaIAEQagALCwAgACABQQAQpQELMQAgACAAEJUBIAAQlQEgABBaQQJ0aiAAEJUBIAAQWkECdGogABCVASABQQJ0ahCWAQsJACAAIAEQsAELEAAgABCFASABEIUBa0ECdQsHACAAKAIACwoAIABBCGoQhwELBwAgABCIAQsEACAACwwAIAAgARCPAUEBcwsEACAACwcAIAAoAgALDgAgACABIAIQkAEQkQELEQAgACAAKAIAQQRqNgIAIAALBwAgABCTAQsNACAAEIUBIAEQhQFGCwQAIAALDgAgACABIAIQkAEQkgELDwAgASACEJABKgIAOAIACwQAIAALCQAgACABEJcBCwoAIAAoAgAQigELAgALCQAgACABEJgBCwIACwsAIAAgACgCABB7C0AAQQBBADYCyCVBIiABIAJBAnRBBBABQQAoAsglIQFBAEEANgLIJQJAIAFBAUYNAA8LQQAQCCEBEAQaIAEQagALBwAgABCgAQsLACAAIAEgAhCdAQsJACAAIAEQngELBwAgABCfAQsHACAAEKMECwQAIAALCgAgAEEIahCoAQsHACAAEKcBCwUAEKkBCwkAIAAgARCmAQsgAAJAIAAQqwEgAU8NAEG2CBCtAQALIAFBAnRBBBCuAQspAQJ/IwBBEGsiAiQAIAJBCGogASAAEKoBIQMgAkEQaiQAIAEgACADGwsHACAAEKsBCwcAIAAQrAELCABB/////wcLDQAgASgCACACKAIASQsIAEH/////AwsEACAAC08BAX9BCBALIQFBAEEANgLIJUEjIAEgABACGkEAKALIJSEAQQBBADYCyCUCQCAAQQFGDQAgAUHwHkEkEAwACxADIQAQBBogARANIAAQBQALBwAgABCiBAsXACAAIAEQrwQaIABByB5BCGo2AgAgAAspAQJ/IwBBEGsiAiQAIAJBCGogACABEKoBIQMgAkEQaiQAIAEgACADGwsLACAAIAE2AgAgAAsJACAAIAEQswELCQAgACABELQBCwkAIAFBADYCAAsFAEGICQsmACAAQSxqELoBGiAAQSBqELsBGiAAQRRqEEQaIABBCGoQRBogAAsFAEGICQsFAEGgCQsFAEHACQsPACAAELwBIAAQvQEaIAALDwAgABC+ASAAEL8BGiAACzYAIAAgABDAASAAEMABIAAQwQFBAnRqIAAQwAEgABDCAUECdGogABDAASAAEMEBQQJ0ahDDAQsmAAJAIAAoAgBFDQAgABDEASAAEMUBIAAoAgAgABDGARDHAQsgAAs2ACAAIAAQ0wEgABDTASAAENQBQQJ0aiAAENMBIAAQ1QFBAnRqIAAQ0wEgABDUAUECdGoQ1gELJgACQCAAKAIARQ0AIAAQ1wEgABDYASAAKAIAIAAQ2QEQ2gELIAALCgAgACgCABDIAQsHACAAEMYBCxAAIAAoAgQgACgCAGtBAnULAgALDAAgACAAKAIAEMwBCwoAIABBCGoQzgELEwAgABDJASgCACAAKAIAa0ECdQsLACAAIAEgAhDNAQsEACAACwoAIABBCGoQygELBwAgABDLAQsEACAAC2cBA38gACgCBCECAkADQCACIAFGDQEgABDFASEDIAJBfGoiAhDIASEEQQBBADYCyCVBJSADIAQQBkEAKALIJSEDQQBBADYCyCUgA0EBRw0AC0EAEAghAhAEGiACEGoACyAAIAE2AgQLQABBAEEANgLIJUEiIAEgAkECdEEEEAFBACgCyCUhAUEAQQA2AsglAkAgAUEBRg0ADwtBABAIIQEQBBogARBqAAsHACAAENIBCwkAIAAgARDQAQsJACAAIAEQ0QELAgALBAAgAAsKACAAKAIAENsBCwcAIAAQ2QELEAAgACgCBCAAKAIAa0ECdQsCAAsMACAAIAAoAgAQ3wELCgAgAEEIahDhAQsTACAAENwBKAIAIAAoAgBrQQJ1CwsAIAAgASACEOABCwQAIAALCgAgAEEIahDdAQsHACAAEN4BCwQAIAALZwEDfyAAKAIEIQICQANAIAIgAUYNASAAENgBIQMgAkF8aiICENsBIQRBAEEANgLIJUEmIAMgBBAGQQAoAsglIQNBAEEANgLIJSADQQFHDQALQQAQCCECEAQaIAIQagALIAAgATYCBAtAAEEAQQA2AsglQSIgASACQQJ0QQQQAUEAKALIJSEBQQBBADYCyCUCQCABQQFGDQAPC0EAEAghARAEGiABEGoACwcAIAAQ5QELCQAgACABEOMBCwkAIAAgARDkAQsCAAsEACAACwQAIAALBAAgAAs0ACAAIAI4AgQgACABNgIAIABBCGoQPBogAEEUahA8GiAAQSBqEPMBGiAAQSxqEPQBGiAACwQAQQMLBQAQ8AELBQBB5AkLPgEBfyMAQRBrIgMkACADIAEQ7QE2AgwgAyACEO4BOAIIIANBDGogA0EIaiAAEQQAEO8BIQAgA0EQaiQAIAALBwAgABDxAQsHACAAEPIBCwQAIAALBQBB2AkLBAAgAAsEACAACwoAIAAQ9QEaIAALCgAgABD2ARogAAtuAQJ/IwBBEGsiASQAIAAQaBogAEIANwIAIAFBADYCDEEAQQA2AsglQScgAEEIaiABQQxqIAFBCGoQBxpBACgCyCUhAkEAQQA2AsglAkAgAkEBRg0AIAFBEGokACAADwtBABAIIQAQBBogABBqAAtuAQJ/IwBBEGsiASQAIAAQaBogAEIANwIAIAFBADYCDEEAQQA2AsglQSggAEEIaiABQQxqIAFBCGoQBxpBACgCyCUhAkEAQQA2AsglAkAgAkEBRg0AIAFBEGokACAADwtBABAIIQAQBBogABBqAAsZACAAIAEQaxD4ARogAhBtGiAAEPkBGiAACxAAIAEQaxogAEEANgIAIAALCgAgABD6ARogAAsEACAACxkAIAAgARBrEPwBGiACEG0aIAAQ/QEaIAALEAAgARBrGiAAQQA2AgAgAAsKACAAEP4BGiAACwQAIAALBABBAwsFABCHAgsFAEGoCwuWAQECfyMAQRBrIgMkACABEIQCIAAoAgQiBEEBdWohASAAKAIAIQACQCAEQQFxRQ0AIAEoAgAgAGooAgAhAAsgAyABIAIQhQIgABEGAEEAQQA2AsglQSkgAxAQIQBBACgCyCUhAUEAQQA2AsglAkAgAUEBRg0AIAMQRBogA0EQaiQAIAAPCxADIQAQBBogAxBEGiAAEAUACxUBAX9BCBCiBCIBIAApAgA3AwAgAQsEACAACwQAIAALDwBBDBCiBCAAEIgCEIkCCwUAQewJCwQAIAALSgECfyAAIAEQdxCKAhCLAiECIAAgASgCADYCACAAIAEoAgQ2AgQgARB/KAIAIQMgAhB/IAM2AgAgARB/QQA2AgAgAUIANwIAIAALBAAgAAtyAQF/IwBBEGsiAiQAIAAQaBogAEIANwIAIAJBADYCDCABEIoCIQFBAEEANgLIJUEqIABBCGogAkEMaiABEAcaQQAoAsglIQFBAEEANgLIJQJAIAFBAUYNACACQRBqJAAgAA8LQQAQCCEAEAQaIAAQagALGAAgACABEGsQbBogACACEI0CEI4CGiAACwQAIAALCgAgARCNAhogAAsEAEECCwUAEJQCCwUAQbgLC5EBAQJ/IwBBEGsiAiQAIAEQhAIgACgCBCIDQQF1aiEBIAAoAgAhAAJAIANBAXFFDQAgASgCACAAaigCACEACyACIAEgABEDAEEAQQA2AsglQSkgAhAQIQBBACgCyCUhAUEAQQA2AsglAkAgAUEBRg0AIAIQRBogAkEQaiQAIAAPCxADIQAQBBogAhBEGiAAEAUACxUBAX9BCBCiBCIBIAApAgA3AwAgAQsFAEGwCwsEAEEECwUAEJsCCwUAQdgMC5gBAQJ/IwBBEGsiBCQAIAEQhAIgACgCBCIFQQF1aiEBIAAoAgAhAAJAIAVBAXFFDQAgASgCACAAaigCACEACyAEIAIQmgIgAxDyASEDQQBBADYCyCUgACABIAQgAxARQQAoAsglIQBBAEEANgLIJQJAIABBAUYNACAEEKsEGiAEQRBqJAAPCxADIQAQBBogBBCrBBogABAFAAsVAQF/QQgQogQiASAAKQIANwMAIAELEgAgACABQQRqIAEoAgAQnAIaCwUAQcALCywBAX8jAEEQayIDJAAgACADQQhqIAMQnQIaIAAgASACEKoEIANBEGokACAACxoAIAEQbRogABCeAhogAhBtGiAAEJ8CGiAACwQAIAALCgAgABCgAhogAAsEACAACw0AIAAQogIQowJBcGoLBwAgABC1AgsHACAAELQCCwwAIAAQpQIgAToACwsHACAAELgCCwoAIAAQpQIQpwILBwAgABC5AgstAQF/QQohAQJAIABBC0kNACAAQQFqEKkCIgAgAEF/aiIAIABBC0YbIQELIAELCgAgAEEPakFwcQsLACAAIAFBABCrAgsdAAJAIAAQtgIgAU8NAEG2CBCtAQALIAFBARCuAQsHACAAEK0CCwcAIAAQugILDAAgABClAiABNgIACxMAIAAQpQIgAUGAgICAeHI2AggLDAAgABClAiABNgIECxYAAkAgAkUNACAAIAEgAhDvBBoLIAALBAAgAAsMACAAIAEtAAA6AAALBwAgABC2AgsHACAAELcCCwQAQX8LBAAgAAsEACAACwQAIAALBAAgAAsNACAAELwCLQALQQd2CwcAIAAQwQILCwAgACABIAIQvgILPQBBAEEANgLIJUEiIAEgAkEBEAFBACgCyCUhAUEAQQA2AsglAkAgAUEBRg0ADwtBABAIIQEQBBogARBqAAsKACAAEKUCKAIACxEAIAAQvAIoAghB/////wdxCwQAIAALhQEBA38jAEEQayICJAAgAiAAQQEQdiEDIAAQdyEAIAMoAgQQigEhBCABEMgCIQFBAEEANgLIJUErIAAgBCABEAFBACgCyCUhAEEAQQA2AsglAkAgAEEBRg0AIAMgAygCBEEEajYCBCADEHkaIAJBEGokAA8LEAMhABAEGiADEHkaIAAQBQALvQEBBH8jAEEgayICJAAgABB3IQMgAkEIaiAAIAAQPkEBahBgIAAQPiADEMoCIgQoAggQigEhBSABEMgCIQFBAEEANgLIJUErIAMgBSABEAFBACgCyCUhA0EAQQA2AsglAkAgA0EBRg0AIAQgBCgCCEEEajYC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BCgCCCIAIAE2AgwgBCABNgIIIAFBGGpBADYCACABIAQ2AgwgASAANgIIC0EAQQAoApAmQX9qIgFBfyABGzYCkCYLC1YBAn9BACgCwCUiASAAQQNqQXxxIgJqIQACQAJAIAJBAUgNACAAIAFNDQELAkAgAD8AQRB0TQ0AIAAQIUUNAQtBACAANgLAJSABDwsQpARBMDYCAEF/C5EEAQN/AkAgAkGABEkNACAAIAEgAhAiGiAADwsgACACaiEDAkACQCABIABzQQNxDQACQAJAIAJBAU4NACAAIQIMAQsCQCAAQQNxDQAgACECDAELIAAhAgNAIAIgAS0AADoAACABQQFqIQEgAkEBaiICIANPDQEgAkEDcQ0ACwsCQCADQXxxIgRBwABJDQAgAiAEQUBqIgVLDQADQCACIAEoAgA2AgAgAiABKAIENgIEIAIgASgCCDYCCCACIAEoAgw2AgwgAiABKAIQNgIQIAIgASgCFDYCFCACIAEoAhg2AhggAiABKAIcNgIcIAIgASgCIDYCICACIAEoAiQ2AiQgAiABKAIoNgIoIAIgASgCLDYCLCACIAEoAjA2AjAgAiABKAI0NgI0IAIgASgCODYCOCACIAEoAjw2AjwgAUHAAGohASACQcAAaiICIAVNDQALCyACIARPDQEDQCACIAEoAgA2AgAgAUEEaiEBIAJBBGoiAiAESQ0ADAILAAsCQCADQQRPDQAgACECDAELAkAgA0F8aiIEIABPDQAgACECDAELIAAhAgNAIAIgAS0AADoAACACIAEtAAE6AAEgAiABLQACOgACIAIgAS0AAzoAAyABQQRqIQEgAkEEaiICIARNDQALCwJAIAIgA08NAANAIAIgAS0AADoAACABQQFqIQEgAkEBaiICIANHDQALCyAAC/ICAgN/AX4CQCACRQ0AIAIgAGoiA0F/aiABOgAAIAAgAToAACACQQNJDQAgA0F+aiABOgAAIAAgAToAASADQX1qIAE6AAAgACABOgACIAJBB0kNACADQXxqIAE6AAAgACABOgADIAJBCUkNACAAQQAgAGtBA3EiBGoiAyABQf8BcUGBgoQIbCIBNgIAIAMgAiAEa0F8cSIEaiICQXxqIAE2AgAgBEEJSQ0AIAMgATYCCCADIAE2AgQgAkF4aiABNgIAIAJBdGogATYCACAEQRlJDQAgAyAB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bG9jYXRvcklmRUVFRQAAAKQSAAC0BgAAAQAAAJAFAACkBgAAGBEAAKQGAACoEQAAdmlpZgAAAAAAAAAAAAAAAAAAAAAYEQAApAYAAJwRAACoEQAAnBEAANwGAABIBwAAkAUAAJwRAABOMTBlbXNjcmlwdGVuM3ZhbEUAAMQRAAA0BwAAMBEAAJAFAACcEQAAqBEAAGlpaWlmAHZvaWQAYm9vbABjaGFyAHNpZ25lZCBjaGFyAHVuc2lnbmVkIGNoYXIAc2hvcnQAdW5zaWduZWQgc2hvcnQAaW50AHVuc2lnbmVkIGludABsb25nAHVuc2lnbmVkIGxvbmcAZmxvYXQAZG91YmxlAHN0ZDo6c3RyaW5nAHN0ZDo6YmFzaWNfc3RyaW5nPHVuc2lnbmVkIGNoYXI+AHN0ZDo6d3N0cmluZwBzdGQ6OnUxNnN0cmluZwBzdGQ6OnUzMnN0cmluZwBlbXNjcmlwdGVuOjp2YWwAZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8Y2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8c2lnbmVkIGNoYXI+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGNoYXI+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHNob3J0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBzaG9ydD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBpbnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGxvbmc+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGxvbmc+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDhfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDhfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50MTZfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDE2X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDMyX3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQzMl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxmbG9hdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8ZG91YmxlPgBOU3QzX18yMTJiYXNpY19zdHJpbmdJaE5TXzExY2hhcl90cmFpdHNJaEVFTlNfOWFsbG9jYXRvckloRUVFRQAASBIAAHwKAAAAAAAAAQAAADgGAAAAAAAATlN0M19fMjEyYmFzaWNfc3RyaW5nSXdOU18xMWNoYXJfdHJhaXRzSXdFRU5TXzlhbGxvY2F0b3JJd0VFRUUAAEgSAADUCgAAAAAAAAEAAAA4BgAAAAAAAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0lEc05TXzExY2hhcl90cmFpdHNJRHNFRU5TXzlhbGxvY2F0b3JJRHNFRUVFAAAASBIAACwLAAAAAAAAAQAAADgGAAAAAAAATlN0M19fMjEyYmFzaWNfc3RyaW5nSURpTlNfMTFjaGFyX3RyYWl0c0lEaUVFTlNfOWFsbG9jYXRvcklEaUVFRUUAAABIEgAAiAsAAAAAAAABAAAAOAYAAAAAAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0ljRUUAAMQRAADkCwAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJYUVFAADEEQAADAwAAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWhFRQAAxBEAADQMAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lzRUUAAMQRAABcDAAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJdEVFAADEEQAAhAwAAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWlFRQAAxBEAAKwMAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lqRUUAAMQRAADUDAAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJbEVFAADEEQAA/AwAAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SW1FRQAAxBEAACQNAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lmRUUAAMQRAABMDQAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJZEVFAADEEQAAdA0AAHZlY3RvcgBiYXNpY19zdHJpbmcAdGVybWluYXRpbmcgd2l0aCAlcyBleGNlcHRpb24gb2YgdHlwZSAlczogJXMAdGVybWluYXRpbmcgd2l0aCAlcyBleGNlcHRpb24gb2YgdHlwZSAlcwB0ZXJtaW5hdGluZyB3aXRoICVzIGZvcmVpZ24gZXhjZXB0aW9uAHRlcm1pbmF0aW5nAHVuY2F1Z2h0AHRlcm1pbmF0ZV9oYW5kbGVyIHVuZXhwZWN0ZWRseSByZXR1cm5lZAB0ZXJtaW5hdGVfaGFuZGxlciB1bmV4cGVjdGVkbHkgdGhyZXcgYW4gZXhjZXB0aW9uAHN0ZDo6ZXhjZXB0aW9uAAAAAAAAAAwPAAAxAAAANwAAADgAAABzdGQ6OmJhZF9hbGxvYwAAAAAAAPQOAAAxAAAAOQAAADoAAABTdDlleGNlcHRpb24AAAAAxBEAAOQOAABTdDliYWRfYWxsb2MAAAAA7BEAAPwOAAD0DgAAAAAAADwPAAAkAAAAOwAAADwAAABTdDExbG9naWNfZXJyb3IA7BEAACwPAAD0DgAAAAAAAHAPAAAkAAAAPQAAADwAAABTdDEybGVuZ3RoX2Vycm9yAAAAAOwRAABcDwAAPA8AAFN0OXR5cGVfaW5mbwAAAADEEQAAfA8AAE4xMF9fY3h4YWJpdjExNl9fc2hpbV90eXBlX2luZm9FAAAAAOwRAACUDwAAjA8AAE4xMF9fY3h4YWJpdjExN19fY2xhc3NfdHlwZV9pbmZvRQAAAOwRAADEDwAAuA8AAE4xMF9fY3h4YWJpdjExN19fcGJhc2VfdHlwZV9pbmZvRQAAAOwRAAD0DwAAuA8AAE4xMF9fY3h4YWJpdjExOV9fcG9pbnRlcl90eXBlX2luZm9FAOwRAAAkEAAAGBAAAE4xMF9fY3h4YWJpdjEyMF9fZnVuY3Rpb25fdHlwZV9pbmZvRQAAAADsEQAAVBAAALgPAABOMTBfX2N4eGFiaXYxMjlfX3BvaW50ZXJfdG9fbWVtYmVyX3R5cGVfaW5mb0UAAADsEQAAiBAAABgQAAAAAAAACBEAAD4AAAA/AAAAQAAAAEEAAABCAAAATjEwX19jeHhhYml2MTIzX19mdW5kYW1lbnRhbF90eXBlX2luZm9FAOwRAADgEAAAuA8AAHYAAADMEAAAFBEAAERuAADMEAAAIBEAAGIAAADMEAAALBEAAGMAAADMEAAAOBEAAGgAAADMEAAARBEAAGEAAADMEAAAUBEAAHMAAADMEAAAXBEAAHQAAADMEAAAaBEAAGkAAADMEAAAdBEAAGoAAADMEAAAgBEAAGwAAADMEAAAjBEAAG0AAADMEAAAmBEAAGYAAADMEAAApBEAAGQAAADMEAAAsBEAAAAAAADoDwAAPgAAAEMAAABAAAAAQQAAAEQAAABFAAAARgAAAEcAAAAAAAAANBIAAD4AAABIAAAAQAAAAEEAAABEAAAASQAAAEoAAABLAAAATjEwX19jeHhhYml2MTIwX19zaV9jbGFzc190eXBlX2luZm9FAAAAAOwRAAAMEgAA6A8AAAAAAACQEgAAPgAAAEwAAABAAAAAQQAAAEQAAABNAAAATgAAAE8AAABOMTBfX2N4eGFiaXYxMjFfX3ZtaV9jbGFzc190eXBlX2luZm9FAAAA7BEAAGgSAADoDwAAAAAAAEgQAAA+AAAAUAAAAEAAAABBAAAAUQAAAABBuCULDDMAAAA4DgAA4BRQAA==';

if (!isDataURI(wasmBinaryFile)) {
  wasmBinaryFile = locateFile(wasmBinaryFile);
}

function getBinary(file) {
  try {
    if (file == wasmBinaryFile && wasmBinary) {
      return new Uint8Array(wasmBinary);
    }

    var binary = tryParseAsDataURI(file);

    if (binary) {
      return binary;
    }

    if (readBinary) {
      return readBinary(file);
    } else {
      throw "sync fetching of the wasm failed: you can preload it to Module['wasmBinary'] manually, or emcc.py will do that for you when generating HTML (but not JS)";
    }
  } catch (err) {
    abort(err);
  }
}

function getBinaryPromise() {
  // If we don't have the binary yet, try to to load it asynchronously.
  // Fetch has some additional restrictions over XHR, like it can't be used on a file:// url.
  // See https://github.com/github/fetch/pull/92#issuecomment-140665932
  // Cordova or Electron apps are typically loaded from a file:// url.
  // So use fetch if it is available and the url is not a file, otherwise fall back to XHR.
  if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
    if (typeof fetch === 'function' && !isFileURI(wasmBinaryFile)) {
      return fetch(wasmBinaryFile, {
        credentials: 'same-origin'
      }).then(function (response) {
        if (!response['ok']) {
          throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
        }

        return response['arrayBuffer']();
      }).catch(function () {
        return getBinary(wasmBinaryFile);
      });
    } else {
      if (readAsync) {
        // fetch is not available or url is file => try XHR (readAsync uses XHR internally)
        return new Promise(function (resolve, reject) {
          readAsync(wasmBinaryFile, function (response) {
            resolve(new Uint8Array(
            /** @type{!ArrayBuffer} */
            response));
          }, reject);
        });
      }
    }
  } // Otherwise, getBinary should be able to get it synchronously


  return Promise.resolve().then(function () {
    return getBinary(wasmBinaryFile);
  });
}

function instantiateSync(file, info) {
  var instance;
  var module;
  var binary;

  try {
    binary = getBinary(file);
    module = new WebAssembly.Module(binary);
    instance = new WebAssembly.Instance(module, info);
  } catch (e) {
    var str = e.toString();
    err('failed to compile wasm module: ' + str);

    if (str.indexOf('imported Memory') >= 0 || str.indexOf('memory import') >= 0) {
      err('Memory size incompatibility issues may be due to changing INITIAL_MEMORY at runtime to something too large. Use ALLOW_MEMORY_GROWTH to allow any size memory (and also make sure not to set INITIAL_MEMORY at runtime to something smaller than it was at compile time).');
    }

    throw e;
  }

  return [instance, module];
} // Create the wasm instance.
// Receives the wasm imports, returns the exports.


function createWasm() {
  // prepare imports
  var info = {
    'env': asmLibraryArg,
    'wasi_snapshot_preview1': asmLibraryArg
  }; // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup

  /** @param {WebAssembly.Module=} module*/

  function receiveInstance(instance, module) {
    var exports = instance.exports;
    Module['asm'] = exports;
    wasmMemory = Module['asm']['memory'];
    assert(wasmMemory, "memory not found in wasm exports"); // This assertion doesn't hold when emscripten is run in --post-link
    // mode.
    // TODO(sbc): Read INITIAL_MEMORY out of the wasm file in post-link mode.
    //assert(wasmMemory.buffer.byteLength === 16777216);

    updateGlobalBufferAndViews(wasmMemory.buffer);
    wasmTable = Module['asm']['__indirect_function_table'];
    assert(wasmTable, "table not found in wasm exports");
    removeRunDependency('wasm-instantiate');
  } // we can't run yet (except in a pthread, where we have a custom sync instantiator)


  addRunDependency('wasm-instantiate'); // Async compilation can be confusing when an error on the page overwrites Module
  // (for example, if the order of elements is wrong, and the one defining Module is
  // later), so we save Module and check it later.

  var trueModule = Module;

  function receiveInstantiatedSource(output) {
    // 'output' is a WebAssemblyInstantiatedSource object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    assert(Module === trueModule, 'the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?');
    trueModule = null; // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
    // When the regression is fixed, can restore the above USE_PTHREADS-enabled path.

    receiveInstance(output['instance']);
  }

  function instantiateArrayBuffer(receiver) {
    return getBinaryPromise().then(function (binary) {
      return WebAssembly.instantiate(binary, info);
    }).then(receiver, function (reason) {
      err('failed to asynchronously prepare wasm: ' + reason); // Warn on some common problems.

      if (isFileURI(wasmBinaryFile)) {
        err('warning: Loading from a file URI (' + wasmBinaryFile + ') is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing');
      }

      abort(reason);
    });
  } // Prefer streaming instantiation if available.
  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to run the instantiation parallel
  // to any other async startup actions they are performing.


  if (Module['instantiateWasm']) {
    try {
      var exports = Module['instantiateWasm'](info, receiveInstance);
      return exports;
    } catch (e) {
      err('Module.instantiateWasm callback failed with error: ' + e);
      return false;
    }
  }

  var result = instantiateSync(wasmBinaryFile, info);
  receiveInstance(result[0], result[1]);
  return Module['asm']; // exports were assigned here
} // Globals used by JS i64 conversions (see makeSetValue)


var tempDouble;
var tempI64; // === Body ===

var ASM_CONSTS = {};

function abortStackOverflow(allocSize) {
  abort('Stack overflow! Attempted to allocate ' + allocSize + ' bytes on the stack, but stack has only ' + (_emscripten_stack_get_free() + allocSize) + ' bytes available!');
}

function callRuntimeCallbacks(callbacks) {
  while (callbacks.length > 0) {
    var callback = callbacks.shift();

    if (typeof callback == 'function') {
      callback(Module); // Pass the module as the first argument.

      continue;
    }

    var func = callback.func;

    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        wasmTable.get(func)();
      } else {
        wasmTable.get(func)(callback.arg);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

function demangle(func) {
  warnOnce('warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling');
  return func;
}

function demangleAll(text) {
  var regex = /\b_Z[\w\d_]+/g;
  return text.replace(regex, function (x) {
    var y = demangle(x);
    return x === y ? x : y + ' [' + x + ']';
  });
}

function jsStackTrace() {
  var error = new Error();

  if (!error.stack) {
    // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
    // so try that as a special-case.
    try {
      throw new Error();
    } catch (e) {
      error = e;
    }

    if (!error.stack) {
      return '(no stack trace available)';
    }
  }

  return error.stack.toString();
}

function stackTrace() {
  var js = jsStackTrace();
  if (Module['extraStackTrace']) js += '\n' + Module['extraStackTrace']();
  return demangleAll(js);
}

var ExceptionInfoAttrs = {
  DESTRUCTOR_OFFSET: 0,
  REFCOUNT_OFFSET: 4,
  TYPE_OFFSET: 8,
  CAUGHT_OFFSET: 12,
  RETHROWN_OFFSET: 13,
  SIZE: 16
};

function ___cxa_allocate_exception(size) {
  // Thrown object is prepended by exception metadata block
  return _malloc(size + ExceptionInfoAttrs.SIZE) + ExceptionInfoAttrs.SIZE;
}

function ExceptionInfo(excPtr) {
  this.excPtr = excPtr;
  this.ptr = excPtr - ExceptionInfoAttrs.SIZE;

  this.set_type = function (type) {
    HEAP32[this.ptr + ExceptionInfoAttrs.TYPE_OFFSET >> 2] = type;
  };

  this.get_type = function () {
    return HEAP32[this.ptr + ExceptionInfoAttrs.TYPE_OFFSET >> 2];
  };

  this.set_destructor = function (destructor) {
    HEAP32[this.ptr + ExceptionInfoAttrs.DESTRUCTOR_OFFSET >> 2] = destructor;
  };

  this.get_destructor = function () {
    return HEAP32[this.ptr + ExceptionInfoAttrs.DESTRUCTOR_OFFSET >> 2];
  };

  this.set_refcount = function (refcount) {
    HEAP32[this.ptr + ExceptionInfoAttrs.REFCOUNT_OFFSET >> 2] = refcount;
  };

  this.set_caught = function (caught) {
    caught = caught ? 1 : 0;
    HEAP8[this.ptr + ExceptionInfoAttrs.CAUGHT_OFFSET >> 0] = caught;
  };

  this.get_caught = function () {
    return HEAP8[this.ptr + ExceptionInfoAttrs.CAUGHT_OFFSET >> 0] != 0;
  };

  this.set_rethrown = function (rethrown) {
    rethrown = rethrown ? 1 : 0;
    HEAP8[this.ptr + ExceptionInfoAttrs.RETHROWN_OFFSET >> 0] = rethrown;
  };

  this.get_rethrown = function () {
    return HEAP8[this.ptr + ExceptionInfoAttrs.RETHROWN_OFFSET >> 0] != 0;
  }; // Initialize native structure fields. Should be called once after allocated.


  this.init = function (type, destructor) {
    this.set_type(type);
    this.set_destructor(destructor);
    this.set_refcount(0);
    this.set_caught(false);
    this.set_rethrown(false);
  };

  this.add_ref = function () {
    var value = HEAP32[this.ptr + ExceptionInfoAttrs.REFCOUNT_OFFSET >> 2];
    HEAP32[this.ptr + ExceptionInfoAttrs.REFCOUNT_OFFSET >> 2] = value + 1;
  }; // Returns true if last reference released.


  this.release_ref = function () {
    var prev = HEAP32[this.ptr + ExceptionInfoAttrs.REFCOUNT_OFFSET >> 2];
    HEAP32[this.ptr + ExceptionInfoAttrs.REFCOUNT_OFFSET >> 2] = prev - 1;
    assert(prev > 0);
    return prev === 1;
  };
}

function CatchInfo(ptr) {
  this.free = function () {
    _free(this.ptr);

    this.ptr = 0;
  };

  this.set_base_ptr = function (basePtr) {
    HEAP32[this.ptr >> 2] = basePtr;
  };

  this.get_base_ptr = function () {
    return HEAP32[this.ptr >> 2];
  };

  this.set_adjusted_ptr = function (adjustedPtr) {
    var ptrSize = 4;
    HEAP32[this.ptr + ptrSize >> 2] = adjustedPtr;
  };

  this.get_adjusted_ptr = function () {
    var ptrSize = 4;
    return HEAP32[this.ptr + ptrSize >> 2];
  }; // Get pointer which is expected to be received by catch clause in C++ code. It may be adjusted
  // when the pointer is casted to some of the exception object base classes (e.g. when virtual
  // inheritance is used). When a pointer is thrown this method should return the thrown pointer
  // itself.


  this.get_exception_ptr = function () {
    // Work around a fastcomp bug, this code is still included for some reason in a build without
    // exceptions support.
    var isPointer = ___cxa_is_pointer_type(this.get_exception_info().get_type());

    if (isPointer) {
      return HEAP32[this.get_base_ptr() >> 2];
    }

    var adjusted = this.get_adjusted_ptr();
    if (adjusted !== 0) return adjusted;
    return this.get_base_ptr();
  };

  this.get_exception_info = function () {
    return new ExceptionInfo(this.get_base_ptr());
  };

  if (ptr === undefined) {
    this.ptr = _malloc(8);
    this.set_adjusted_ptr(0);
  } else {
    this.ptr = ptr;
  }
}

var exceptionCaught = [];

function exception_addRef(info) {
  info.add_ref();
}

var uncaughtExceptionCount = 0;

function ___cxa_begin_catch(ptr) {
  var catchInfo = new CatchInfo(ptr);
  var info = catchInfo.get_exception_info();

  if (!info.get_caught()) {
    info.set_caught(true);
    uncaughtExceptionCount--;
  }

  info.set_rethrown(false);
  exceptionCaught.push(catchInfo);
  exception_addRef(info);
  return catchInfo.get_exception_ptr();
}

var exceptionLast = 0;

function ___cxa_free_exception(ptr) {
  try {
    return _free(new ExceptionInfo(ptr).ptr);
  } catch (e) {
    err('exception during cxa_free_exception: ' + e);
  }
}

function exception_decRef(info) {
  // A rethrown exception can reach refcount 0; it must not be discarded
  // Its next handler will clear the rethrown flag and addRef it, prior to
  // final decRef and destruction here
  if (info.release_ref() && !info.get_rethrown()) {
    var destructor = info.get_destructor();

    if (destructor) {
      // In Wasm, destructors return 'this' as in ARM
      wasmTable.get(destructor)(info.excPtr);
    }

    ___cxa_free_exception(info.excPtr);
  }
}

function ___cxa_end_catch() {
  // Clear state flag.
  _setThrew(0);

  assert(exceptionCaught.length > 0); // Call destructor if one is registered then clear it.

  var catchInfo = exceptionCaught.pop();
  exception_decRef(catchInfo.get_exception_info());
  catchInfo.free();
  exceptionLast = 0; // XXX in decRef?
}

function ___resumeException(catchInfoPtr) {
  var catchInfo = new CatchInfo(catchInfoPtr);
  var ptr = catchInfo.get_base_ptr();

  if (!exceptionLast) {
    exceptionLast = ptr;
  }

  catchInfo.free();
  throw ptr;
}

function ___cxa_find_matching_catch_2() {
  var thrown = exceptionLast;

  if (!thrown) {
    // just pass through the null ptr
    setTempRet0(0 | 0);
    return 0 | 0;
  }

  var info = new ExceptionInfo(thrown);
  var thrownType = info.get_type();
  var catchInfo = new CatchInfo();
  catchInfo.set_base_ptr(thrown);

  if (!thrownType) {
    // just pass through the thrown ptr
    setTempRet0(0 | 0);
    return catchInfo.ptr | 0;
  }

  var typeArray = Array.prototype.slice.call(arguments); // can_catch receives a **, add indirection

  var stackTop = stackSave();
  var exceptionThrowBuf = stackAlloc(4);
  HEAP32[exceptionThrowBuf >> 2] = thrown; // The different catch blocks are denoted by different types.
  // Due to inheritance, those types may not precisely match the
  // type of the thrown object. Find one which matches, and
  // return the type of the catch block which should be called.

  for (var i = 0; i < typeArray.length; i++) {
    var caughtType = typeArray[i];

    if (caughtType === 0 || caughtType === thrownType) {
      // Catch all clause matched or exactly the same type is caught
      break;
    }

    if (___cxa_can_catch(caughtType, thrownType, exceptionThrowBuf)) {
      var adjusted = HEAP32[exceptionThrowBuf >> 2];

      if (thrown !== adjusted) {
        catchInfo.set_adjusted_ptr(adjusted);
      }

      setTempRet0(caughtType | 0);
      return catchInfo.ptr | 0;
    }
  }

  stackRestore(stackTop);
  setTempRet0(thrownType | 0);
  return catchInfo.ptr | 0;
}

function ___cxa_find_matching_catch_3() {
  var thrown = exceptionLast;

  if (!thrown) {
    // just pass through the null ptr
    setTempRet0(0 | 0);
    return 0 | 0;
  }

  var info = new ExceptionInfo(thrown);
  var thrownType = info.get_type();
  var catchInfo = new CatchInfo();
  catchInfo.set_base_ptr(thrown);

  if (!thrownType) {
    // just pass through the thrown ptr
    setTempRet0(0 | 0);
    return catchInfo.ptr | 0;
  }

  var typeArray = Array.prototype.slice.call(arguments); // can_catch receives a **, add indirection

  var stackTop = stackSave();
  var exceptionThrowBuf = stackAlloc(4);
  HEAP32[exceptionThrowBuf >> 2] = thrown; // The different catch blocks are denoted by different types.
  // Due to inheritance, those types may not precisely match the
  // type of the thrown object. Find one which matches, and
  // return the type of the catch block which should be called.

  for (var i = 0; i < typeArray.length; i++) {
    var caughtType = typeArray[i];

    if (caughtType === 0 || caughtType === thrownType) {
      // Catch all clause matched or exactly the same type is caught
      break;
    }

    if (___cxa_can_catch(caughtType, thrownType, exceptionThrowBuf)) {
      var adjusted = HEAP32[exceptionThrowBuf >> 2];

      if (thrown !== adjusted) {
        catchInfo.set_adjusted_ptr(adjusted);
      }

      setTempRet0(caughtType | 0);
      return catchInfo.ptr | 0;
    }
  }

  stackRestore(stackTop);
  setTempRet0(thrownType | 0);
  return catchInfo.ptr | 0;
}

function ___cxa_throw(ptr, type, destructor) {
  var info = new ExceptionInfo(ptr); // Initialize ExceptionInfo content after it was allocated in __cxa_allocate_exception.

  info.init(type, destructor);
  exceptionLast = ptr;
  uncaughtExceptionCount++;
  throw ptr;
}

function ___cxa_uncaught_exceptions() {
  return uncaughtExceptionCount;
}

function getShiftFromSize(size) {
  switch (size) {
    case 1:
      return 0;

    case 2:
      return 1;

    case 4:
      return 2;

    case 8:
      return 3;

    default:
      throw new TypeError('Unknown type size: ' + size);
  }
}

function embind_init_charCodes() {
  var codes = new Array(256);

  for (var i = 0; i < 256; ++i) {
    codes[i] = String.fromCharCode(i);
  }

  embind_charCodes = codes;
}

var embind_charCodes = undefined;

function readLatin1String(ptr) {
  var ret = "";
  var c = ptr;

  while (HEAPU8[c]) {
    ret += embind_charCodes[HEAPU8[c++]];
  }

  return ret;
}

var awaitingDependencies = {};
var registeredTypes = {};
var typeDependencies = {};
var char_0 = 48;
var char_9 = 57;

function makeLegalFunctionName(name) {
  if (undefined === name) {
    return '_unknown';
  }

  name = name.replace(/[^a-zA-Z0-9_]/g, '$');
  var f = name.charCodeAt(0);

  if (f >= char_0 && f <= char_9) {
    return '_' + name;
  } else {
    return name;
  }
}

function createNamedFunction(name, body) {
  name = makeLegalFunctionName(name);
  /*jshint evil:true*/

  return new Function("body", "return function " + name + "() {\n" + "    \"use strict\";" + "    return body.apply(this, arguments);\n" + "};\n")(body);
}

function extendError(baseErrorType, errorName) {
  var errorClass = createNamedFunction(errorName, function (message) {
    this.name = errorName;
    this.message = message;
    var stack = new Error(message).stack;

    if (stack !== undefined) {
      this.stack = this.toString() + '\n' + stack.replace(/^Error(:[^\n]*)?\n/, '');
    }
  });
  errorClass.prototype = Object.create(baseErrorType.prototype);
  errorClass.prototype.constructor = errorClass;

  errorClass.prototype.toString = function () {
    if (this.message === undefined) {
      return this.name;
    } else {
      return this.name + ': ' + this.message;
    }
  };

  return errorClass;
}

var BindingError = undefined;

function throwBindingError(message) {
  throw new BindingError(message);
}

var InternalError = undefined;

function throwInternalError(message) {
  throw new InternalError(message);
}

function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
  myTypes.forEach(function (type) {
    typeDependencies[type] = dependentTypes;
  });

  function onComplete(typeConverters) {
    var myTypeConverters = getTypeConverters(typeConverters);

    if (myTypeConverters.length !== myTypes.length) {
      throwInternalError('Mismatched type converter count');
    }

    for (var i = 0; i < myTypes.length; ++i) {
      registerType(myTypes[i], myTypeConverters[i]);
    }
  }

  var typeConverters = new Array(dependentTypes.length);
  var unregisteredTypes = [];
  var registered = 0;
  dependentTypes.forEach(function (dt, i) {
    if (registeredTypes.hasOwnProperty(dt)) {
      typeConverters[i] = registeredTypes[dt];
    } else {
      unregisteredTypes.push(dt);

      if (!awaitingDependencies.hasOwnProperty(dt)) {
        awaitingDependencies[dt] = [];
      }

      awaitingDependencies[dt].push(function () {
        typeConverters[i] = registeredTypes[dt];
        ++registered;

        if (registered === unregisteredTypes.length) {
          onComplete(typeConverters);
        }
      });
    }
  });

  if (0 === unregisteredTypes.length) {
    onComplete(typeConverters);
  }
}
/** @param {Object=} options */


function registerType(rawType, registeredInstance, options) {
  options = options || {};

  if (!('argPackAdvance' in registeredInstance)) {
    throw new TypeError('registerType registeredInstance requires argPackAdvance');
  }

  var name = registeredInstance.name;

  if (!rawType) {
    throwBindingError('type "' + name + '" must have a positive integer typeid pointer');
  }

  if (registeredTypes.hasOwnProperty(rawType)) {
    if (options.ignoreDuplicateRegistrations) {
      return;
    } else {
      throwBindingError("Cannot register type '" + name + "' twice");
    }
  }

  registeredTypes[rawType] = registeredInstance;
  delete typeDependencies[rawType];

  if (awaitingDependencies.hasOwnProperty(rawType)) {
    var callbacks = awaitingDependencies[rawType];
    delete awaitingDependencies[rawType];
    callbacks.forEach(function (cb) {
      cb();
    });
  }
}

function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
  var shift = getShiftFromSize(size);
  name = readLatin1String(name);
  registerType(rawType, {
    name: name,
    'fromWireType': function (wt) {
      // ambiguous emscripten ABI: sometimes return values are
      // true or false, and sometimes integers (0 or 1)
      return !!wt;
    },
    'toWireType': function (destructors, o) {
      return o ? trueValue : falseValue;
    },
    'argPackAdvance': 8,
    'readValueFromPointer': function (pointer) {
      // TODO: if heap is fixed (like in asm.js) this could be executed outside
      var heap;

      if (size === 1) {
        heap = HEAP8;
      } else if (size === 2) {
        heap = HEAP16;
      } else if (size === 4) {
        heap = HEAP32;
      } else {
        throw new TypeError("Unknown boolean type size: " + name);
      }

      return this['fromWireType'](heap[pointer >> shift]);
    },
    destructorFunction: null // This type does not need a destructor

  });
}

function ClassHandle_isAliasOf(other) {
  if (!(this instanceof ClassHandle)) {
    return false;
  }

  if (!(other instanceof ClassHandle)) {
    return false;
  }

  var leftClass = this.$$.ptrType.registeredClass;
  var left = this.$$.ptr;
  var rightClass = other.$$.ptrType.registeredClass;
  var right = other.$$.ptr;

  while (leftClass.baseClass) {
    left = leftClass.upcast(left);
    leftClass = leftClass.baseClass;
  }

  while (rightClass.baseClass) {
    right = rightClass.upcast(right);
    rightClass = rightClass.baseClass;
  }

  return leftClass === rightClass && left === right;
}

function shallowCopyInternalPointer(o) {
  return {
    count: o.count,
    deleteScheduled: o.deleteScheduled,
    preservePointerOnDelete: o.preservePointerOnDelete,
    ptr: o.ptr,
    ptrType: o.ptrType,
    smartPtr: o.smartPtr,
    smartPtrType: o.smartPtrType
  };
}

function throwInstanceAlreadyDeleted(obj) {
  function getInstanceTypeName(handle) {
    return handle.$$.ptrType.registeredClass.name;
  }

  throwBindingError(getInstanceTypeName(obj) + ' instance already deleted');
}

var finalizationGroup = false;

function detachFinalizer(handle) {}

function runDestructor($$) {
  if ($$.smartPtr) {
    $$.smartPtrType.rawDestructor($$.smartPtr);
  } else {
    $$.ptrType.registeredClass.rawDestructor($$.ptr);
  }
}

function releaseClassHandle($$) {
  $$.count.value -= 1;
  var toDelete = 0 === $$.count.value;

  if (toDelete) {
    runDestructor($$);
  }
}

function attachFinalizer(handle) {
  if ('undefined' === typeof FinalizationGroup) {
    attachFinalizer = function (handle) {
      return handle;
    };

    return handle;
  } // If the running environment has a FinalizationGroup (see
  // https://github.com/tc39/proposal-weakrefs), then attach finalizers
  // for class handles.  We check for the presence of FinalizationGroup
  // at run-time, not build-time.


  finalizationGroup = new FinalizationGroup(function (iter) {
    for (var result = iter.next(); !result.done; result = iter.next()) {
      var $$ = result.value;

      if (!$$.ptr) {
        console.warn('object already deleted: ' + $$.ptr);
      } else {
        releaseClassHandle($$);
      }
    }
  });

  attachFinalizer = function (handle) {
    finalizationGroup.register(handle, handle.$$, handle.$$);
    return handle;
  };

  detachFinalizer = function (handle) {
    finalizationGroup.unregister(handle.$$);
  };

  return attachFinalizer(handle);
}

function ClassHandle_clone() {
  if (!this.$$.ptr) {
    throwInstanceAlreadyDeleted(this);
  }

  if (this.$$.preservePointerOnDelete) {
    this.$$.count.value += 1;
    return this;
  } else {
    var clone = attachFinalizer(Object.create(Object.getPrototypeOf(this), {
      $$: {
        value: shallowCopyInternalPointer(this.$$)
      }
    }));
    clone.$$.count.value += 1;
    clone.$$.deleteScheduled = false;
    return clone;
  }
}

function ClassHandle_delete() {
  if (!this.$$.ptr) {
    throwInstanceAlreadyDeleted(this);
  }

  if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
    throwBindingError('Object already scheduled for deletion');
  }

  detachFinalizer(this);
  releaseClassHandle(this.$$);

  if (!this.$$.preservePointerOnDelete) {
    this.$$.smartPtr = undefined;
    this.$$.ptr = undefined;
  }
}

function ClassHandle_isDeleted() {
  return !this.$$.ptr;
}

var delayFunction = undefined;
var deletionQueue = [];

function flushPendingDeletes() {
  while (deletionQueue.length) {
    var obj = deletionQueue.pop();
    obj.$$.deleteScheduled = false;
    obj['delete']();
  }
}

function ClassHandle_deleteLater() {
  if (!this.$$.ptr) {
    throwInstanceAlreadyDeleted(this);
  }

  if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
    throwBindingError('Object already scheduled for deletion');
  }

  deletionQueue.push(this);

  if (deletionQueue.length === 1 && delayFunction) {
    delayFunction(flushPendingDeletes);
  }

  this.$$.deleteScheduled = true;
  return this;
}

function init_ClassHandle() {
  ClassHandle.prototype['isAliasOf'] = ClassHandle_isAliasOf;
  ClassHandle.prototype['clone'] = ClassHandle_clone;
  ClassHandle.prototype['delete'] = ClassHandle_delete;
  ClassHandle.prototype['isDeleted'] = ClassHandle_isDeleted;
  ClassHandle.prototype['deleteLater'] = ClassHandle_deleteLater;
}

function ClassHandle() {}

var registeredPointers = {};

function ensureOverloadTable(proto, methodName, humanName) {
  if (undefined === proto[methodName].overloadTable) {
    var prevFunc = proto[methodName]; // Inject an overload resolver function that routes to the appropriate overload based on the number of arguments.

    proto[methodName] = function () {
      // TODO This check can be removed in -O3 level "unsafe" optimizations.
      if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
        throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!");
      }

      return proto[methodName].overloadTable[arguments.length].apply(this, arguments);
    }; // Move the previous function into the overload table.


    proto[methodName].overloadTable = [];
    proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
  }
}
/** @param {number=} numArguments */


function exposePublicSymbol(name, value, numArguments) {
  if (Module.hasOwnProperty(name)) {
    if (undefined === numArguments || undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments]) {
      throwBindingError("Cannot register public name '" + name + "' twice");
    } // We are exposing a function with the same name as an existing function. Create an overload table and a function selector
    // that routes between the two.


    ensureOverloadTable(Module, name, name);

    if (Module.hasOwnProperty(numArguments)) {
      throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!");
    } // Add the new function into the overload table.


    Module[name].overloadTable[numArguments] = value;
  } else {
    Module[name] = value;

    if (undefined !== numArguments) {
      Module[name].numArguments = numArguments;
    }
  }
}
/** @constructor */


function RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast) {
  this.name = name;
  this.constructor = constructor;
  this.instancePrototype = instancePrototype;
  this.rawDestructor = rawDestructor;
  this.baseClass = baseClass;
  this.getActualType = getActualType;
  this.upcast = upcast;
  this.downcast = downcast;
  this.pureVirtualFunctions = [];
}

function upcastPointer(ptr, ptrClass, desiredClass) {
  while (ptrClass !== desiredClass) {
    if (!ptrClass.upcast) {
      throwBindingError("Expected null or instance of " + desiredClass.name + ", got an instance of " + ptrClass.name);
    }

    ptr = ptrClass.upcast(ptr);
    ptrClass = ptrClass.baseClass;
  }

  return ptr;
}

function constNoSmartPtrRawPointerToWireType(destructors, handle) {
  if (handle === null) {
    if (this.isReference) {
      throwBindingError('null is not a valid ' + this.name);
    }

    return 0;
  }

  if (!handle.$$) {
    throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
  }

  if (!handle.$$.ptr) {
    throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
  }

  var handleClass = handle.$$.ptrType.registeredClass;
  var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
  return ptr;
}

function genericPointerToWireType(destructors, handle) {
  var ptr;

  if (handle === null) {
    if (this.isReference) {
      throwBindingError('null is not a valid ' + this.name);
    }

    if (this.isSmartPointer) {
      ptr = this.rawConstructor();

      if (destructors !== null) {
        destructors.push(this.rawDestructor, ptr);
      }

      return ptr;
    } else {
      return 0;
    }
  }

  if (!handle.$$) {
    throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
  }

  if (!handle.$$.ptr) {
    throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
  }

  if (!this.isConst && handle.$$.ptrType.isConst) {
    throwBindingError('Cannot convert argument of type ' + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + ' to parameter type ' + this.name);
  }

  var handleClass = handle.$$.ptrType.registeredClass;
  ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);

  if (this.isSmartPointer) {
    // TODO: this is not strictly true
    // We could support BY_EMVAL conversions from raw pointers to smart pointers
    // because the smart pointer can hold a reference to the handle
    if (undefined === handle.$$.smartPtr) {
      throwBindingError('Passing raw pointer to smart pointer is illegal');
    }

    switch (this.sharingPolicy) {
      case 0:
        // NONE
        // no upcasting
        if (handle.$$.smartPtrType === this) {
          ptr = handle.$$.smartPtr;
        } else {
          throwBindingError('Cannot convert argument of type ' + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + ' to parameter type ' + this.name);
        }

        break;

      case 1:
        // INTRUSIVE
        ptr = handle.$$.smartPtr;
        break;

      case 2:
        // BY_EMVAL
        if (handle.$$.smartPtrType === this) {
          ptr = handle.$$.smartPtr;
        } else {
          var clonedHandle = handle['clone']();
          ptr = this.rawShare(ptr, __emval_register(function () {
            clonedHandle['delete']();
          }));

          if (destructors !== null) {
            destructors.push(this.rawDestructor, ptr);
          }
        }

        break;

      default:
        throwBindingError('Unsupporting sharing policy');
    }
  }

  return ptr;
}

function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
  if (handle === null) {
    if (this.isReference) {
      throwBindingError('null is not a valid ' + this.name);
    }

    return 0;
  }

  if (!handle.$$) {
    throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
  }

  if (!handle.$$.ptr) {
    throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
  }

  if (handle.$$.ptrType.isConst) {
    throwBindingError('Cannot convert argument of type ' + handle.$$.ptrType.name + ' to parameter type ' + this.name);
  }

  var handleClass = handle.$$.ptrType.registeredClass;
  var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
  return ptr;
}

function simpleReadValueFromPointer(pointer) {
  return this['fromWireType'](HEAPU32[pointer >> 2]);
}

function RegisteredPointer_getPointee(ptr) {
  if (this.rawGetPointee) {
    ptr = this.rawGetPointee(ptr);
  }

  return ptr;
}

function RegisteredPointer_destructor(ptr) {
  if (this.rawDestructor) {
    this.rawDestructor(ptr);
  }
}

function RegisteredPointer_deleteObject(handle) {
  if (handle !== null) {
    handle['delete']();
  }
}

function downcastPointer(ptr, ptrClass, desiredClass) {
  if (ptrClass === desiredClass) {
    return ptr;
  }

  if (undefined === desiredClass.baseClass) {
    return null; // no conversion
  }

  var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);

  if (rv === null) {
    return null;
  }

  return desiredClass.downcast(rv);
}

function getInheritedInstanceCount() {
  return Object.keys(registeredInstances).length;
}

function getLiveInheritedInstances() {
  var rv = [];

  for (var k in registeredInstances) {
    if (registeredInstances.hasOwnProperty(k)) {
      rv.push(registeredInstances[k]);
    }
  }

  return rv;
}

function setDelayFunction(fn) {
  delayFunction = fn;

  if (deletionQueue.length && delayFunction) {
    delayFunction(flushPendingDeletes);
  }
}

function init_embind() {
  Module['getInheritedInstanceCount'] = getInheritedInstanceCount;
  Module['getLiveInheritedInstances'] = getLiveInheritedInstances;
  Module['flushPendingDeletes'] = flushPendingDeletes;
  Module['setDelayFunction'] = setDelayFunction;
}

var registeredInstances = {};

function getBasestPointer(class_, ptr) {
  if (ptr === undefined) {
    throwBindingError('ptr should not be undefined');
  }

  while (class_.baseClass) {
    ptr = class_.upcast(ptr);
    class_ = class_.baseClass;
  }

  return ptr;
}

function getInheritedInstance(class_, ptr) {
  ptr = getBasestPointer(class_, ptr);
  return registeredInstances[ptr];
}

function makeClassHandle(prototype, record) {
  if (!record.ptrType || !record.ptr) {
    throwInternalError('makeClassHandle requires ptr and ptrType');
  }

  var hasSmartPtrType = !!record.smartPtrType;
  var hasSmartPtr = !!record.smartPtr;

  if (hasSmartPtrType !== hasSmartPtr) {
    throwInternalError('Both smartPtrType and smartPtr must be specified');
  }

  record.count = {
    value: 1
  };
  return attachFinalizer(Object.create(prototype, {
    $$: {
      value: record
    }
  }));
}

function RegisteredPointer_fromWireType(ptr) {
  // ptr is a raw pointer (or a raw smartpointer)
  // rawPointer is a maybe-null raw pointer
  var rawPointer = this.getPointee(ptr);

  if (!rawPointer) {
    this.destructor(ptr);
    return null;
  }

  var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);

  if (undefined !== registeredInstance) {
    // JS object has been neutered, time to repopulate it
    if (0 === registeredInstance.$$.count.value) {
      registeredInstance.$$.ptr = rawPointer;
      registeredInstance.$$.smartPtr = ptr;
      return registeredInstance['clone']();
    } else {
      // else, just increment reference count on existing object
      // it already has a reference to the smart pointer
      var rv = registeredInstance['clone']();
      this.destructor(ptr);
      return rv;
    }
  }

  function makeDefaultHandle() {
    if (this.isSmartPointer) {
      return makeClassHandle(this.registeredClass.instancePrototype, {
        ptrType: this.pointeeType,
        ptr: rawPointer,
        smartPtrType: this,
        smartPtr: ptr
      });
    } else {
      return makeClassHandle(this.registeredClass.instancePrototype, {
        ptrType: this,
        ptr: ptr
      });
    }
  }

  var actualType = this.registeredClass.getActualType(rawPointer);
  var registeredPointerRecord = registeredPointers[actualType];

  if (!registeredPointerRecord) {
    return makeDefaultHandle.call(this);
  }

  var toType;

  if (this.isConst) {
    toType = registeredPointerRecord.constPointerType;
  } else {
    toType = registeredPointerRecord.pointerType;
  }

  var dp = downcastPointer(rawPointer, this.registeredClass, toType.registeredClass);

  if (dp === null) {
    return makeDefaultHandle.call(this);
  }

  if (this.isSmartPointer) {
    return makeClassHandle(toType.registeredClass.instancePrototype, {
      ptrType: toType,
      ptr: dp,
      smartPtrType: this,
      smartPtr: ptr
    });
  } else {
    return makeClassHandle(toType.registeredClass.instancePrototype, {
      ptrType: toType,
      ptr: dp
    });
  }
}

function init_RegisteredPointer() {
  RegisteredPointer.prototype.getPointee = RegisteredPointer_getPointee;
  RegisteredPointer.prototype.destructor = RegisteredPointer_destructor;
  RegisteredPointer.prototype['argPackAdvance'] = 8;
  RegisteredPointer.prototype['readValueFromPointer'] = simpleReadValueFromPointer;
  RegisteredPointer.prototype['deleteObject'] = RegisteredPointer_deleteObject;
  RegisteredPointer.prototype['fromWireType'] = RegisteredPointer_fromWireType;
}
/** @constructor
    @param {*=} pointeeType,
    @param {*=} sharingPolicy,
    @param {*=} rawGetPointee,
    @param {*=} rawConstructor,
    @param {*=} rawShare,
    @param {*=} rawDestructor,
     */


function RegisteredPointer(name, registeredClass, isReference, isConst, // smart pointer properties
isSmartPointer, pointeeType, sharingPolicy, rawGetPointee, rawConstructor, rawShare, rawDestructor) {
  this.name = name;
  this.registeredClass = registeredClass;
  this.isReference = isReference;
  this.isConst = isConst; // smart pointer properties

  this.isSmartPointer = isSmartPointer;
  this.pointeeType = pointeeType;
  this.sharingPolicy = sharingPolicy;
  this.rawGetPointee = rawGetPointee;
  this.rawConstructor = rawConstructor;
  this.rawShare = rawShare;
  this.rawDestructor = rawDestructor;

  if (!isSmartPointer && registeredClass.baseClass === undefined) {
    if (isConst) {
      this['toWireType'] = constNoSmartPtrRawPointerToWireType;
      this.destructorFunction = null;
    } else {
      this['toWireType'] = nonConstNoSmartPtrRawPointerToWireType;
      this.destructorFunction = null;
    }
  } else {
    this['toWireType'] = genericPointerToWireType; // Here we must leave this.destructorFunction undefined, since whether genericPointerToWireType returns
    // a pointer that needs to be freed up is runtime-dependent, and cannot be evaluated at registration time.
    // TODO: Create an alternative mechanism that allows removing the use of var destructors = []; array in
    //       craftInvokerFunction altogether.
  }
}
/** @param {number=} numArguments */


function replacePublicSymbol(name, value, numArguments) {
  if (!Module.hasOwnProperty(name)) {
    throwInternalError('Replacing nonexistant public symbol');
  } // If there's an overload table for this symbol, replace the symbol in the overload table instead.


  if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
    Module[name].overloadTable[numArguments] = value;
  } else {
    Module[name] = value;
    Module[name].argCount = numArguments;
  }
}

function dynCallLegacy(sig, ptr, args) {
  assert('dynCall_' + sig in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');

  if (args && args.length) {
    // j (64-bit integer) must be passed in as two numbers [low 32, high 32].
    assert(args.length === sig.substring(1).replace(/j/g, '--').length);
  } else {
    assert(sig.length == 1);
  }

  var f = Module["dynCall_" + sig];
  return args && args.length ? f.apply(null, [ptr].concat(args)) : f.call(null, ptr);
}

function dynCall(sig, ptr, args) {
  // Without WASM_BIGINT support we cannot directly call function with i64 as
  // part of thier signature, so we rely the dynCall functions generated by
  // wasm-emscripten-finalize
  if (sig.indexOf('j') != -1) {
    return dynCallLegacy(sig, ptr, args);
  }

  assert(wasmTable.get(ptr), 'missing table entry in dynCall: ' + ptr);
  return wasmTable.get(ptr).apply(null, args);
}

function getDynCaller(sig, ptr) {
  assert(sig.indexOf('j') >= 0, 'getDynCaller should only be called with i64 sigs');
  var argCache = [];
  return function () {
    argCache.length = arguments.length;

    for (var i = 0; i < arguments.length; i++) {
      argCache[i] = arguments[i];
    }

    return dynCall(sig, ptr, argCache);
  };
}

function embind__requireFunction(signature, rawFunction) {
  signature = readLatin1String(signature);

  function makeDynCaller() {
    if (signature.indexOf('j') != -1) {
      return getDynCaller(signature, rawFunction);
    }

    return wasmTable.get(rawFunction);
  }

  var fp = makeDynCaller();

  if (typeof fp !== "function") {
    throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction);
  }

  return fp;
}

var UnboundTypeError = undefined;

function getTypeName(type) {
  var ptr = ___getTypeName(type);

  var rv = readLatin1String(ptr);

  _free(ptr);

  return rv;
}

function throwUnboundTypeError(message, types) {
  var unboundTypes = [];
  var seen = {};

  function visit(type) {
    if (seen[type]) {
      return;
    }

    if (registeredTypes[type]) {
      return;
    }

    if (typeDependencies[type]) {
      typeDependencies[type].forEach(visit);
      return;
    }

    unboundTypes.push(type);
    seen[type] = true;
  }

  types.forEach(visit);
  throw new UnboundTypeError(message + ': ' + unboundTypes.map(getTypeName).join([', ']));
}

function __embind_register_class(rawType, rawPointerType, rawConstPointerType, baseClassRawType, getActualTypeSignature, getActualType, upcastSignature, upcast, downcastSignature, downcast, name, destructorSignature, rawDestructor) {
  name = readLatin1String(name);
  getActualType = embind__requireFunction(getActualTypeSignature, getActualType);

  if (upcast) {
    upcast = embind__requireFunction(upcastSignature, upcast);
  }

  if (downcast) {
    downcast = embind__requireFunction(downcastSignature, downcast);
  }

  rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
  var legalFunctionName = makeLegalFunctionName(name);
  exposePublicSymbol(legalFunctionName, function () {
    // this code cannot run if baseClassRawType is zero
    throwUnboundTypeError('Cannot construct ' + name + ' due to unbound types', [baseClassRawType]);
  });
  whenDependentTypesAreResolved([rawType, rawPointerType, rawConstPointerType], baseClassRawType ? [baseClassRawType] : [], function (base) {
    base = base[0];
    var baseClass;
    var basePrototype;

    if (baseClassRawType) {
      baseClass = base.registeredClass;
      basePrototype = baseClass.instancePrototype;
    } else {
      basePrototype = ClassHandle.prototype;
    }

    var constructor = createNamedFunction(legalFunctionName, function () {
      if (Object.getPrototypeOf(this) !== instancePrototype) {
        throw new BindingError("Use 'new' to construct " + name);
      }

      if (undefined === registeredClass.constructor_body) {
        throw new BindingError(name + " has no accessible constructor");
      }

      var body = registeredClass.constructor_body[arguments.length];

      if (undefined === body) {
        throw new BindingError("Tried to invoke ctor of " + name + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(registeredClass.constructor_body).toString() + ") parameters instead!");
      }

      return body.apply(this, arguments);
    });
    var instancePrototype = Object.create(basePrototype, {
      constructor: {
        value: constructor
      }
    });
    constructor.prototype = instancePrototype;
    var registeredClass = new RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast);
    var referenceConverter = new RegisteredPointer(name, registeredClass, true, false, false);
    var pointerConverter = new RegisteredPointer(name + '*', registeredClass, false, false, false);
    var constPointerConverter = new RegisteredPointer(name + ' const*', registeredClass, false, true, false);
    registeredPointers[rawType] = {
      pointerType: pointerConverter,
      constPointerType: constPointerConverter
    };
    replacePublicSymbol(legalFunctionName, constructor);
    return [referenceConverter, pointerConverter, constPointerConverter];
  });
}

function heap32VectorToArray(count, firstElement) {
  var array = [];

  for (var i = 0; i < count; i++) {
    array.push(HEAP32[(firstElement >> 2) + i]);
  }

  return array;
}

function runDestructors(destructors) {
  while (destructors.length) {
    var ptr = destructors.pop();
    var del = destructors.pop();
    del(ptr);
  }
}

function __embind_register_class_constructor(rawClassType, argCount, rawArgTypesAddr, invokerSignature, invoker, rawConstructor) {
  assert(argCount > 0);
  var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
  invoker = embind__requireFunction(invokerSignature, invoker);
  var args = [rawConstructor];
  var destructors = [];
  whenDependentTypesAreResolved([], [rawClassType], function (classType) {
    classType = classType[0];
    var humanName = 'constructor ' + classType.name;

    if (undefined === classType.registeredClass.constructor_body) {
      classType.registeredClass.constructor_body = [];
    }

    if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
      throw new BindingError("Cannot register multiple constructors with identical number of parameters (" + (argCount - 1) + ") for class '" + classType.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!");
    }

    classType.registeredClass.constructor_body[argCount - 1] = function unboundTypeHandler() {
      throwUnboundTypeError('Cannot construct ' + classType.name + ' due to unbound types', rawArgTypes);
    };

    whenDependentTypesAreResolved([], rawArgTypes, function (argTypes) {
      classType.registeredClass.constructor_body[argCount - 1] = function constructor_body() {
        if (arguments.length !== argCount - 1) {
          throwBindingError(humanName + ' called with ' + arguments.length + ' arguments, expected ' + (argCount - 1));
        }

        destructors.length = 0;
        args.length = argCount;

        for (var i = 1; i < argCount; ++i) {
          args[i] = argTypes[i]['toWireType'](destructors, arguments[i - 1]);
        }

        var ptr = invoker.apply(null, args);
        runDestructors(destructors);
        return argTypes[0]['fromWireType'](ptr);
      };

      return [];
    });
    return [];
  });
}

function new_(constructor, argumentList) {
  if (!(constructor instanceof Function)) {
    throw new TypeError('new_ called with constructor type ' + typeof constructor + " which is not a function");
  }
  /*
   * Previously, the following line was just:
      function dummy() {};
      * Unfortunately, Chrome was preserving 'dummy' as the object's name, even though at creation, the 'dummy' has the
   * correct constructor name.  Thus, objects created with IMVU.new would show up in the debugger as 'dummy', which
   * isn't very helpful.  Using IMVU.createNamedFunction addresses the issue.  Doublely-unfortunately, there's no way
   * to write a test for this behavior.  -NRD 2013.02.22
   */


  var dummy = createNamedFunction(constructor.name || 'unknownFunctionName', function () {});
  dummy.prototype = constructor.prototype;
  var obj = new dummy();
  var r = constructor.apply(obj, argumentList);
  return r instanceof Object ? r : obj;
}

function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
  // humanName: a human-readable string name for the function to be generated.
  // argTypes: An array that contains the embind type objects for all types in the function signature.
  //    argTypes[0] is the type object for the function return value.
  //    argTypes[1] is the type object for function this object/class type, or null if not crafting an invoker for a class method.
  //    argTypes[2...] are the actual function parameters.
  // classType: The embind type object for the class to be bound, or null if this is not a method of a class.
  // cppInvokerFunc: JS Function object to the C++-side function that interops into C++ code.
  // cppTargetFunc: Function pointer (an integer to FUNCTION_TABLE) to the target C++ function the cppInvokerFunc will end up calling.
  var argCount = argTypes.length;

  if (argCount < 2) {
    throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
  }

  var isClassMethodFunc = argTypes[1] !== null && classType !== null; // Free functions with signature "void function()" do not need an invoker that marshalls between wire types.
  // TODO: This omits argument count check - enable only at -O3 or similar.
  //    if (ENABLE_UNSAFE_OPTS && argCount == 2 && argTypes[0].name == "void" && !isClassMethodFunc) {
  //       return FUNCTION_TABLE[fn];
  //    }
  // Determine if we need to use a dynamic stack to store the destructors for the function parameters.
  // TODO: Remove this completely once all function invokers are being dynamically generated.

  var needsDestructorStack = false;

  for (var i = 1; i < argTypes.length; ++i) {
    // Skip return value at index 0 - it's not deleted here.
    if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) {
      // The type does not define a destructor function - must use dynamic stack
      needsDestructorStack = true;
      break;
    }
  }

  var returns = argTypes[0].name !== "void";
  var argsList = "";
  var argsListWired = "";

  for (var i = 0; i < argCount - 2; ++i) {
    argsList += (i !== 0 ? ", " : "") + "arg" + i;
    argsListWired += (i !== 0 ? ", " : "") + "arg" + i + "Wired";
  }

  var invokerFnBody = "return function " + makeLegalFunctionName(humanName) + "(" + argsList + ") {\n" + "if (arguments.length !== " + (argCount - 2) + ") {\n" + "throwBindingError('function " + humanName + " called with ' + arguments.length + ' arguments, expected " + (argCount - 2) + " args!');\n" + "}\n";

  if (needsDestructorStack) {
    invokerFnBody += "var destructors = [];\n";
  }

  var dtorStack = needsDestructorStack ? "destructors" : "null";
  var args1 = ["throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam"];
  var args2 = [throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1]];

  if (isClassMethodFunc) {
    invokerFnBody += "var thisWired = classParam.toWireType(" + dtorStack + ", this);\n";
  }

  for (var i = 0; i < argCount - 2; ++i) {
    invokerFnBody += "var arg" + i + "Wired = argType" + i + ".toWireType(" + dtorStack + ", arg" + i + "); // " + argTypes[i + 2].name + "\n";
    args1.push("argType" + i);
    args2.push(argTypes[i + 2]);
  }

  if (isClassMethodFunc) {
    argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired;
  }

  invokerFnBody += (returns ? "var rv = " : "") + "invoker(fn" + (argsListWired.length > 0 ? ", " : "") + argsListWired + ");\n";

  if (needsDestructorStack) {
    invokerFnBody += "runDestructors(destructors);\n";
  } else {
    for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
      // Skip return value at index 0 - it's not deleted here. Also skip class type if not a method.
      var paramName = i === 1 ? "thisWired" : "arg" + (i - 2) + "Wired";

      if (argTypes[i].destructorFunction !== null) {
        invokerFnBody += paramName + "_dtor(" + paramName + "); // " + argTypes[i].name + "\n";
        args1.push(paramName + "_dtor");
        args2.push(argTypes[i].destructorFunction);
      }
    }
  }

  if (returns) {
    invokerFnBody += "var ret = retType.fromWireType(rv);\n" + "return ret;\n";
  } else {}

  invokerFnBody += "}\n";
  args1.push(invokerFnBody);
  var invokerFunction = new_(Function, args1).apply(null, args2);
  return invokerFunction;
}

function __embind_register_class_function(rawClassType, methodName, argCount, rawArgTypesAddr, // [ReturnType, ThisType, Args...]
invokerSignature, rawInvoker, context, isPureVirtual) {
  var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
  methodName = readLatin1String(methodName);
  rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
  whenDependentTypesAreResolved([], [rawClassType], function (classType) {
    classType = classType[0];
    var humanName = classType.name + '.' + methodName;

    if (isPureVirtual) {
      classType.registeredClass.pureVirtualFunctions.push(methodName);
    }

    function unboundTypesHandler() {
      throwUnboundTypeError('Cannot call ' + humanName + ' due to unbound types', rawArgTypes);
    }

    var proto = classType.registeredClass.instancePrototype;
    var method = proto[methodName];

    if (undefined === method || undefined === method.overloadTable && method.className !== classType.name && method.argCount === argCount - 2) {
      // This is the first overload to be registered, OR we are replacing a function in the base class with a function in the derived class.
      unboundTypesHandler.argCount = argCount - 2;
      unboundTypesHandler.className = classType.name;
      proto[methodName] = unboundTypesHandler;
    } else {
      // There was an existing function with the same name registered. Set up a function overload routing table.
      ensureOverloadTable(proto, methodName, humanName);
      proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
    }

    whenDependentTypesAreResolved([], rawArgTypes, function (argTypes) {
      var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context); // Replace the initial unbound-handler-stub function with the appropriate member function, now that all types
      // are resolved. If multiple overloads are registered for this function, the function goes into an overload table.

      if (undefined === proto[methodName].overloadTable) {
        // Set argCount in case an overload is registered later
        memberFunction.argCount = argCount - 2;
        proto[methodName] = memberFunction;
      } else {
        proto[methodName].overloadTable[argCount - 2] = memberFunction;
      }

      return [];
    });
    return [];
  });
}

var emval_free_list = [];
var emval_handle_array = [{}, {
  value: undefined
}, {
  value: null
}, {
  value: true
}, {
  value: false
}];

function __emval_decref(handle) {
  if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
    emval_handle_array[handle] = undefined;
    emval_free_list.push(handle);
  }
}

function count_emval_handles() {
  var count = 0;

  for (var i = 5; i < emval_handle_array.length; ++i) {
    if (emval_handle_array[i] !== undefined) {
      ++count;
    }
  }

  return count;
}

function get_first_emval() {
  for (var i = 5; i < emval_handle_array.length; ++i) {
    if (emval_handle_array[i] !== undefined) {
      return emval_handle_array[i];
    }
  }

  return null;
}

function init_emval() {
  Module['count_emval_handles'] = count_emval_handles;
  Module['get_first_emval'] = get_first_emval;
}

function __emval_register(value) {
  switch (value) {
    case undefined:
      {
        return 1;
      }

    case null:
      {
        return 2;
      }

    case true:
      {
        return 3;
      }

    case false:
      {
        return 4;
      }

    default:
      {
        var handle = emval_free_list.length ? emval_free_list.pop() : emval_handle_array.length;
        emval_handle_array[handle] = {
          refcount: 1,
          value: value
        };
        return handle;
      }
  }
}

function __embind_register_emval(rawType, name) {
  name = readLatin1String(name);
  registerType(rawType, {
    name: name,
    'fromWireType': function (handle) {
      var rv = emval_handle_array[handle].value;

      __emval_decref(handle);

      return rv;
    },
    'toWireType': function (destructors, value) {
      return __emval_register(value);
    },
    'argPackAdvance': 8,
    'readValueFromPointer': simpleReadValueFromPointer,
    destructorFunction: null // This type does not need a destructor
    // TODO: do we need a deleteObject here?  write a test where
    // emval is passed into JS via an interface

  });
}

function _embind_repr(v) {
  if (v === null) {
    return 'null';
  }

  var t = typeof v;

  if (t === 'object' || t === 'array' || t === 'function') {
    return v.toString();
  } else {
    return '' + v;
  }
}

function floatReadValueFromPointer(name, shift) {
  switch (shift) {
    case 2:
      return function (pointer) {
        return this['fromWireType'](HEAPF32[pointer >> 2]);
      };

    case 3:
      return function (pointer) {
        return this['fromWireType'](HEAPF64[pointer >> 3]);
      };

    default:
      throw new TypeError("Unknown float type: " + name);
  }
}

function __embind_register_float(rawType, name, size) {
  var shift = getShiftFromSize(size);
  name = readLatin1String(name);
  registerType(rawType, {
    name: name,
    'fromWireType': function (value) {
      return value;
    },
    'toWireType': function (destructors, value) {
      // todo: Here we have an opportunity for -O3 level "unsafe" optimizations: we could
      // avoid the following if() and assume value is of proper type.
      if (typeof value !== "number" && typeof value !== "boolean") {
        throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
      }

      return value;
    },
    'argPackAdvance': 8,
    'readValueFromPointer': floatReadValueFromPointer(name, shift),
    destructorFunction: null // This type does not need a destructor

  });
}

function integerReadValueFromPointer(name, shift, signed) {
  // integers are quite common, so generate very specialized functions
  switch (shift) {
    case 0:
      return signed ? function readS8FromPointer(pointer) {
        return HEAP8[pointer];
      } : function readU8FromPointer(pointer) {
        return HEAPU8[pointer];
      };

    case 1:
      return signed ? function readS16FromPointer(pointer) {
        return HEAP16[pointer >> 1];
      } : function readU16FromPointer(pointer) {
        return HEAPU16[pointer >> 1];
      };

    case 2:
      return signed ? function readS32FromPointer(pointer) {
        return HEAP32[pointer >> 2];
      } : function readU32FromPointer(pointer) {
        return HEAPU32[pointer >> 2];
      };

    default:
      throw new TypeError("Unknown integer type: " + name);
  }
}

function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
  name = readLatin1String(name);

  if (maxRange === -1) {
    // LLVM doesn't have signed and unsigned 32-bit types, so u32 literals come out as 'i32 -1'. Always treat those as max u32.
    maxRange = 4294967295;
  }

  var shift = getShiftFromSize(size);

  var fromWireType = function (value) {
    return value;
  };

  if (minRange === 0) {
    var bitshift = 32 - 8 * size;

    fromWireType = function (value) {
      return value << bitshift >>> bitshift;
    };
  }

  var isUnsignedType = name.indexOf('unsigned') != -1;
  registerType(primitiveType, {
    name: name,
    'fromWireType': fromWireType,
    'toWireType': function (destructors, value) {
      // todo: Here we have an opportunity for -O3 level "unsafe" optimizations: we could
      // avoid the following two if()s and assume value is of proper type.
      if (typeof value !== "number" && typeof value !== "boolean") {
        throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
      }

      if (value < minRange || value > maxRange) {
        throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ', ' + maxRange + ']!');
      }

      return isUnsignedType ? value >>> 0 : value | 0;
    },
    'argPackAdvance': 8,
    'readValueFromPointer': integerReadValueFromPointer(name, shift, minRange !== 0),
    destructorFunction: null // This type does not need a destructor

  });
}

function __embind_register_memory_view(rawType, dataTypeIndex, name) {
  var typeMapping = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array];
  var TA = typeMapping[dataTypeIndex];

  function decodeMemoryView(handle) {
    handle = handle >> 2;
    var heap = HEAPU32;
    var size = heap[handle]; // in elements

    var data = heap[handle + 1]; // byte offset into emscripten heap

    return new TA(buffer, data, size);
  }

  name = readLatin1String(name);
  registerType(rawType, {
    name: name,
    'fromWireType': decodeMemoryView,
    'argPackAdvance': 8,
    'readValueFromPointer': decodeMemoryView
  }, {
    ignoreDuplicateRegistrations: true
  });
}

function __embind_register_std_string(rawType, name) {
  name = readLatin1String(name);
  var stdStringIsUTF8 //process only std::string bindings with UTF8 support, in contrast to e.g. std::basic_string<unsigned char>
  = name === "std::string";
  registerType(rawType, {
    name: name,
    'fromWireType': function (value) {
      var length = HEAPU32[value >> 2];
      var str;

      if (stdStringIsUTF8) {
        var decodeStartPtr = value + 4; // Looping here to support possible embedded '0' bytes

        for (var i = 0; i <= length; ++i) {
          var currentBytePtr = value + 4 + i;

          if (i == length || HEAPU8[currentBytePtr] == 0) {
            var maxRead = currentBytePtr - decodeStartPtr;
            var stringSegment = UTF8ToString(decodeStartPtr, maxRead);

            if (str === undefined) {
              str = stringSegment;
            } else {
              str += String.fromCharCode(0);
              str += stringSegment;
            }

            decodeStartPtr = currentBytePtr + 1;
          }
        }
      } else {
        var a = new Array(length);

        for (var i = 0; i < length; ++i) {
          a[i] = String.fromCharCode(HEAPU8[value + 4 + i]);
        }

        str = a.join('');
      }

      _free(value);

      return str;
    },
    'toWireType': function (destructors, value) {
      if (value instanceof ArrayBuffer) {
        value = new Uint8Array(value);
      }

      var getLength;
      var valueIsOfTypeString = typeof value === 'string';

      if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
        throwBindingError('Cannot pass non-string to std::string');
      }

      if (stdStringIsUTF8 && valueIsOfTypeString) {
        getLength = function () {
          return lengthBytesUTF8(value);
        };
      } else {
        getLength = function () {
          return value.length;
        };
      } // assumes 4-byte alignment


      var length = getLength();

      var ptr = _malloc(4 + length + 1);

      HEAPU32[ptr >> 2] = length;

      if (stdStringIsUTF8 && valueIsOfTypeString) {
        stringToUTF8(value, ptr + 4, length + 1);
      } else {
        if (valueIsOfTypeString) {
          for (var i = 0; i < length; ++i) {
            var charCode = value.charCodeAt(i);

            if (charCode > 255) {
              _free(ptr);

              throwBindingError('String has UTF-16 code units that do not fit in 8 bits');
            }

            HEAPU8[ptr + 4 + i] = charCode;
          }
        } else {
          for (var i = 0; i < length; ++i) {
            HEAPU8[ptr + 4 + i] = value[i];
          }
        }
      }

      if (destructors !== null) {
        destructors.push(_free, ptr);
      }

      return ptr;
    },
    'argPackAdvance': 8,
    'readValueFromPointer': simpleReadValueFromPointer,
    destructorFunction: function (ptr) {
      _free(ptr);
    }
  });
}

function __embind_register_std_wstring(rawType, charSize, name) {
  name = readLatin1String(name);
  var decodeString, encodeString, getHeap, lengthBytesUTF, shift;

  if (charSize === 2) {
    decodeString = UTF16ToString;
    encodeString = stringToUTF16;
    lengthBytesUTF = lengthBytesUTF16;

    getHeap = function () {
      return HEAPU16;
    };

    shift = 1;
  } else if (charSize === 4) {
    decodeString = UTF32ToString;
    encodeString = stringToUTF32;
    lengthBytesUTF = lengthBytesUTF32;

    getHeap = function () {
      return HEAPU32;
    };

    shift = 2;
  }

  registerType(rawType, {
    name: name,
    'fromWireType': function (value) {
      // Code mostly taken from _embind_register_std_string fromWireType
      var length = HEAPU32[value >> 2];
      var HEAP = getHeap();
      var str;
      var decodeStartPtr = value + 4; // Looping here to support possible embedded '0' bytes

      for (var i = 0; i <= length; ++i) {
        var currentBytePtr = value + 4 + i * charSize;

        if (i == length || HEAP[currentBytePtr >> shift] == 0) {
          var maxReadBytes = currentBytePtr - decodeStartPtr;
          var stringSegment = decodeString(decodeStartPtr, maxReadBytes);

          if (str === undefined) {
            str = stringSegment;
          } else {
            str += String.fromCharCode(0);
            str += stringSegment;
          }

          decodeStartPtr = currentBytePtr + charSize;
        }
      }

      _free(value);

      return str;
    },
    'toWireType': function (destructors, value) {
      if (!(typeof value === 'string')) {
        throwBindingError('Cannot pass non-string to C++ string type ' + name);
      } // assumes 4-byte alignment


      var length = lengthBytesUTF(value);

      var ptr = _malloc(4 + length + charSize);

      HEAPU32[ptr >> 2] = length >> shift;
      encodeString(value, ptr + 4, length + charSize);

      if (destructors !== null) {
        destructors.push(_free, ptr);
      }

      return ptr;
    },
    'argPackAdvance': 8,
    'readValueFromPointer': simpleReadValueFromPointer,
    destructorFunction: function (ptr) {
      _free(ptr);
    }
  });
}

function __embind_register_void(rawType, name) {
  name = readLatin1String(name);
  registerType(rawType, {
    isVoid: true,
    // void return values can be optimized out sometimes
    name: name,
    'argPackAdvance': 0,
    'fromWireType': function () {
      return undefined;
    },
    'toWireType': function (destructors, o) {
      // TODO: assert if anything else is given?
      return undefined;
    }
  });
}

function __emval_incref(handle) {
  if (handle > 4) {
    emval_handle_array[handle].refcount += 1;
  }
}

function requireRegisteredType(rawType, humanName) {
  var impl = registeredTypes[rawType];

  if (undefined === impl) {
    throwBindingError(humanName + " has unknown type " + getTypeName(rawType));
  }

  return impl;
}

function __emval_take_value(type, argv) {
  type = requireRegisteredType(type, '_emval_take_value');
  var v = type['readValueFromPointer'](argv);
  return __emval_register(v);
}

function _emscripten_memcpy_big(dest, src, num) {
  HEAPU8.copyWithin(dest, src, src + num);
}

function _emscripten_get_heap_size() {
  return HEAPU8.length;
}

function abortOnCannotGrowMemory(requestedSize) {
  abort('Cannot enlarge memory arrays to size ' + requestedSize + ' bytes (OOM). Either (1) compile with  -s INITIAL_MEMORY=X  with X higher than the current value ' + HEAP8.length + ', (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ');
}

function _emscripten_resize_heap(requestedSize) {
  abortOnCannotGrowMemory(requestedSize);
}

function _getTempRet0() {
  return getTempRet0() | 0;
}

embind_init_charCodes();
BindingError = Module['BindingError'] = extendError(Error, 'BindingError');
;
InternalError = Module['InternalError'] = extendError(Error, 'InternalError');
;
init_ClassHandle();
init_RegisteredPointer();
init_embind();
;
UnboundTypeError = Module['UnboundTypeError'] = extendError(Error, 'UnboundTypeError');
;
init_emval();
;
var ASSERTIONS = true;
/** @type {function(string, boolean=, number=)} */

function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}

function intArrayToString(array) {
  var ret = [];

  for (var i = 0; i < array.length; i++) {
    var chr = array[i];

    if (chr > 0xFF) {
      if (ASSERTIONS) {
        assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      }

      chr &= 0xFF;
    }

    ret.push(String.fromCharCode(chr));
  }

  return ret.join('');
} // Copied from https://github.com/strophe/strophejs/blob/e06d027/src/polyfills.js#L149
// This code was written by Tyler Akins and has been placed in the
// public domain.  It would be nice if you left this header intact.
// Base64 code from Tyler Akins -- http://rumkin.com

/**
 * Decodes a base64 string.
 * @param {string} input The string to decode.
 */


var decodeBase64 = typeof atob === 'function' ? atob : function (input) {
  var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  var output = '';
  var chr1, chr2, chr3;
  var enc1, enc2, enc3, enc4;
  var i = 0; // remove all characters that are not A-Z, a-z, 0-9, +, /, or =

  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');

  do {
    enc1 = keyStr.indexOf(input.charAt(i++));
    enc2 = keyStr.indexOf(input.charAt(i++));
    enc3 = keyStr.indexOf(input.charAt(i++));
    enc4 = keyStr.indexOf(input.charAt(i++));
    chr1 = enc1 << 2 | enc2 >> 4;
    chr2 = (enc2 & 15) << 4 | enc3 >> 2;
    chr3 = (enc3 & 3) << 6 | enc4;
    output = output + String.fromCharCode(chr1);

    if (enc3 !== 64) {
      output = output + String.fromCharCode(chr2);
    }

    if (enc4 !== 64) {
      output = output + String.fromCharCode(chr3);
    }
  } while (i < input.length);

  return output;
}; // Converts a string of base64 into a byte array.
// Throws error on invalid input.

function intArrayFromBase64(s) {
  if (typeof ENVIRONMENT_IS_NODE === 'boolean' && ENVIRONMENT_IS_NODE) {
    var buf;

    try {
      // TODO: Update Node.js externs, Closure does not recognize the following Buffer.from()

      /**@suppress{checkTypes}*/
      buf = Buffer.from(s, 'base64');
    } catch (_) {
      buf = new Buffer(s, 'base64');
    }

    return new Uint8Array(buf['buffer'], buf['byteOffset'], buf['byteLength']);
  }

  try {
    var decoded = decodeBase64(s);
    var bytes = new Uint8Array(decoded.length);

    for (var i = 0; i < decoded.length; ++i) {
      bytes[i] = decoded.charCodeAt(i);
    }

    return bytes;
  } catch (_) {
    throw new Error('Converting base64 string to bytes failed.');
  }
} // If filename is a base64 data URI, parses and returns data (Buffer on node,
// Uint8Array otherwise). If filename is not a base64 data URI, returns undefined.


function tryParseAsDataURI(filename) {
  if (!isDataURI(filename)) {
    return;
  }

  return intArrayFromBase64(filename.slice(dataURIPrefix.length));
}

var asmLibraryArg = {
  "__cxa_allocate_exception": ___cxa_allocate_exception,
  "__cxa_begin_catch": ___cxa_begin_catch,
  "__cxa_end_catch": ___cxa_end_catch,
  "__cxa_find_matching_catch_2": ___cxa_find_matching_catch_2,
  "__cxa_find_matching_catch_3": ___cxa_find_matching_catch_3,
  "__cxa_free_exception": ___cxa_free_exception,
  "__cxa_throw": ___cxa_throw,
  "__cxa_uncaught_exceptions": ___cxa_uncaught_exceptions,
  "__resumeException": ___resumeException,
  "_embind_register_bool": __embind_register_bool,
  "_embind_register_class": __embind_register_class,
  "_embind_register_class_constructor": __embind_register_class_constructor,
  "_embind_register_class_function": __embind_register_class_function,
  "_embind_register_emval": __embind_register_emval,
  "_embind_register_float": __embind_register_float,
  "_embind_register_integer": __embind_register_integer,
  "_embind_register_memory_view": __embind_register_memory_view,
  "_embind_register_std_string": __embind_register_std_string,
  "_embind_register_std_wstring": __embind_register_std_wstring,
  "_embind_register_void": __embind_register_void,
  "_emval_decref": __emval_decref,
  "_emval_incref": __emval_incref,
  "_emval_take_value": __emval_take_value,
  "emscripten_memcpy_big": _emscripten_memcpy_big,
  "emscripten_resize_heap": _emscripten_resize_heap,
  "getTempRet0": _getTempRet0,
  "invoke_i": invoke_i,
  "invoke_ii": invoke_ii,
  "invoke_iii": invoke_iii,
  "invoke_iiii": invoke_iiii,
  "invoke_v": invoke_v,
  "invoke_vi": invoke_vi,
  "invoke_vii": invoke_vii,
  "invoke_viif": invoke_viif,
  "invoke_viii": invoke_viii,
  "invoke_viiii": invoke_viiii
};
var asm = createWasm();
/** @type {function(...*):?} */

var ___wasm_call_ctors = Module["___wasm_call_ctors"] = createExportWrapper("__wasm_call_ctors", asm);
/** @type {function(...*):?} */


var ___getTypeName = Module["___getTypeName"] = createExportWrapper("__getTypeName", asm);
/** @type {function(...*):?} */


var ___embind_register_native_and_builtin_types = Module["___embind_register_native_and_builtin_types"] = createExportWrapper("__embind_register_native_and_builtin_types", asm);
/** @type {function(...*):?} */


var ___errno_location = Module["___errno_location"] = createExportWrapper("__errno_location", asm);
/** @type {function(...*):?} */


var _malloc = Module["_malloc"] = createExportWrapper("malloc", asm);
/** @type {function(...*):?} */


var _fflush = Module["_fflush"] = createExportWrapper("fflush", asm);
/** @type {function(...*):?} */


var stackSave = Module["stackSave"] = createExportWrapper("stackSave", asm);
/** @type {function(...*):?} */

var stackRestore = Module["stackRestore"] = createExportWrapper("stackRestore", asm);
/** @type {function(...*):?} */

var stackAlloc = Module["stackAlloc"] = createExportWrapper("stackAlloc", asm);
/** @type {function(...*):?} */

var _emscripten_stack_init = Module["_emscripten_stack_init"] = asm["emscripten_stack_init"];
/** @type {function(...*):?} */


var _emscripten_stack_get_free = Module["_emscripten_stack_get_free"] = asm["emscripten_stack_get_free"];
/** @type {function(...*):?} */


var _emscripten_stack_get_end = Module["_emscripten_stack_get_end"] = asm["emscripten_stack_get_end"];
/** @type {function(...*):?} */


var _setThrew = Module["_setThrew"] = createExportWrapper("setThrew", asm);
/** @type {function(...*):?} */


var _free = Module["_free"] = createExportWrapper("free", asm);
/** @type {function(...*):?} */


var __ZSt18uncaught_exceptionv = Module["__ZSt18uncaught_exceptionv"] = createExportWrapper("_ZSt18uncaught_exceptionv", asm);
/** @type {function(...*):?} */


var ___cxa_can_catch = Module["___cxa_can_catch"] = createExportWrapper("__cxa_can_catch", asm);
/** @type {function(...*):?} */


var ___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = createExportWrapper("__cxa_is_pointer_type", asm);

function invoke_viii(index, a1, a2, a3) {
  var sp = stackSave();

  try {
    wasmTable.get(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (e !== e + 0 && e !== 'longjmp') throw e;

    _setThrew(1, 0);
  }
}

function invoke_iii(index, a1, a2) {
  var sp = stackSave();

  try {
    return wasmTable.get(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (e !== e + 0 && e !== 'longjmp') throw e;

    _setThrew(1, 0);
  }
}

function invoke_vii(index, a1, a2) {
  var sp = stackSave();

  try {
    wasmTable.get(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (e !== e + 0 && e !== 'longjmp') throw e;

    _setThrew(1, 0);
  }
}

function invoke_iiii(index, a1, a2, a3) {
  var sp = stackSave();

  try {
    return wasmTable.get(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (e !== e + 0 && e !== 'longjmp') throw e;

    _setThrew(1, 0);
  }
}

function invoke_viiii(index, a1, a2, a3, a4) {
  var sp = stackSave();

  try {
    wasmTable.get(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (e !== e + 0 && e !== 'longjmp') throw e;

    _setThrew(1, 0);
  }
}

function invoke_ii(index, a1) {
  var sp = stackSave();

  try {
    return wasmTable.get(index)(a1);
  } catch (e) {
    stackRestore(sp);
    if (e !== e + 0 && e !== 'longjmp') throw e;

    _setThrew(1, 0);
  }
}

function invoke_viif(index, a1, a2, a3) {
  var sp = stackSave();

  try {
    wasmTable.get(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (e !== e + 0 && e !== 'longjmp') throw e;

    _setThrew(1, 0);
  }
}

function invoke_vi(index, a1) {
  var sp = stackSave();

  try {
    wasmTable.get(index)(a1);
  } catch (e) {
    stackRestore(sp);
    if (e !== e + 0 && e !== 'longjmp') throw e;

    _setThrew(1, 0);
  }
}

function invoke_v(index) {
  var sp = stackSave();

  try {
    wasmTable.get(index)();
  } catch (e) {
    stackRestore(sp);
    if (e !== e + 0 && e !== 'longjmp') throw e;

    _setThrew(1, 0);
  }
}

function invoke_i(index) {
  var sp = stackSave();

  try {
    return wasmTable.get(index)();
  } catch (e) {
    stackRestore(sp);
    if (e !== e + 0 && e !== 'longjmp') throw e;

    _setThrew(1, 0);
  }
} // === Auto-generated postamble setup entry stuff ===


if (!Object.getOwnPropertyDescriptor(Module, "intArrayFromString")) Module["intArrayFromString"] = function () {
  abort("'intArrayFromString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "intArrayToString")) Module["intArrayToString"] = function () {
  abort("'intArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "ccall")) Module["ccall"] = function () {
  abort("'ccall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "cwrap")) Module["cwrap"] = function () {
  abort("'cwrap' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "setValue")) Module["setValue"] = function () {
  abort("'setValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "getValue")) Module["getValue"] = function () {
  abort("'getValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "allocate")) Module["allocate"] = function () {
  abort("'allocate' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "UTF8ArrayToString")) Module["UTF8ArrayToString"] = function () {
  abort("'UTF8ArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "UTF8ToString")) Module["UTF8ToString"] = function () {
  abort("'UTF8ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF8Array")) Module["stringToUTF8Array"] = function () {
  abort("'stringToUTF8Array' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF8")) Module["stringToUTF8"] = function () {
  abort("'stringToUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF8")) Module["lengthBytesUTF8"] = function () {
  abort("'lengthBytesUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "stackTrace")) Module["stackTrace"] = function () {
  abort("'stackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "addOnPreRun")) Module["addOnPreRun"] = function () {
  abort("'addOnPreRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "addOnInit")) Module["addOnInit"] = function () {
  abort("'addOnInit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "addOnPreMain")) Module["addOnPreMain"] = function () {
  abort("'addOnPreMain' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "addOnExit")) Module["addOnExit"] = function () {
  abort("'addOnExit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "addOnPostRun")) Module["addOnPostRun"] = function () {
  abort("'addOnPostRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "writeStringToMemory")) Module["writeStringToMemory"] = function () {
  abort("'writeStringToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "writeArrayToMemory")) Module["writeArrayToMemory"] = function () {
  abort("'writeArrayToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "writeAsciiToMemory")) Module["writeAsciiToMemory"] = function () {
  abort("'writeAsciiToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "addRunDependency")) Module["addRunDependency"] = function () {
  abort("'addRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
};
if (!Object.getOwnPropertyDescriptor(Module, "removeRunDependency")) Module["removeRunDependency"] = function () {
  abort("'removeRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
};
if (!Object.getOwnPropertyDescriptor(Module, "FS_createFolder")) Module["FS_createFolder"] = function () {
  abort("'FS_createFolder' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "FS_createPath")) Module["FS_createPath"] = function () {
  abort("'FS_createPath' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
};
if (!Object.getOwnPropertyDescriptor(Module, "FS_createDataFile")) Module["FS_createDataFile"] = function () {
  abort("'FS_createDataFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
};
if (!Object.getOwnPropertyDescriptor(Module, "FS_createPreloadedFile")) Module["FS_createPreloadedFile"] = function () {
  abort("'FS_createPreloadedFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
};
if (!Object.getOwnPropertyDescriptor(Module, "FS_createLazyFile")) Module["FS_createLazyFile"] = function () {
  abort("'FS_createLazyFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
};
if (!Object.getOwnPropertyDescriptor(Module, "FS_createLink")) Module["FS_createLink"] = function () {
  abort("'FS_createLink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "FS_createDevice")) Module["FS_createDevice"] = function () {
  abort("'FS_createDevice' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
};
if (!Object.getOwnPropertyDescriptor(Module, "FS_unlink")) Module["FS_unlink"] = function () {
  abort("'FS_unlink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
};
if (!Object.getOwnPropertyDescriptor(Module, "getLEB")) Module["getLEB"] = function () {
  abort("'getLEB' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "getFunctionTables")) Module["getFunctionTables"] = function () {
  abort("'getFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "alignFunctionTables")) Module["alignFunctionTables"] = function () {
  abort("'alignFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "registerFunctions")) Module["registerFunctions"] = function () {
  abort("'registerFunctions' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "addFunction")) Module["addFunction"] = function () {
  abort("'addFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "removeFunction")) Module["removeFunction"] = function () {
  abort("'removeFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "getFuncWrapper")) Module["getFuncWrapper"] = function () {
  abort("'getFuncWrapper' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "prettyPrint")) Module["prettyPrint"] = function () {
  abort("'prettyPrint' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "makeBigInt")) Module["makeBigInt"] = function () {
  abort("'makeBigInt' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "dynCall")) Module["dynCall"] = function () {
  abort("'dynCall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "getCompilerSetting")) Module["getCompilerSetting"] = function () {
  abort("'getCompilerSetting' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "print")) Module["print"] = function () {
  abort("'print' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "printErr")) Module["printErr"] = function () {
  abort("'printErr' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "getTempRet0")) Module["getTempRet0"] = function () {
  abort("'getTempRet0' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "setTempRet0")) Module["setTempRet0"] = function () {
  abort("'setTempRet0' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "callMain")) Module["callMain"] = function () {
  abort("'callMain' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "abort")) Module["abort"] = function () {
  abort("'abort' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "stringToNewUTF8")) Module["stringToNewUTF8"] = function () {
  abort("'stringToNewUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "setFileTime")) Module["setFileTime"] = function () {
  abort("'setFileTime' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "abortOnCannotGrowMemory")) Module["abortOnCannotGrowMemory"] = function () {
  abort("'abortOnCannotGrowMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "emscripten_realloc_buffer")) Module["emscripten_realloc_buffer"] = function () {
  abort("'emscripten_realloc_buffer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "ENV")) Module["ENV"] = function () {
  abort("'ENV' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "ERRNO_CODES")) Module["ERRNO_CODES"] = function () {
  abort("'ERRNO_CODES' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "ERRNO_MESSAGES")) Module["ERRNO_MESSAGES"] = function () {
  abort("'ERRNO_MESSAGES' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "setErrNo")) Module["setErrNo"] = function () {
  abort("'setErrNo' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "readSockaddr")) Module["readSockaddr"] = function () {
  abort("'readSockaddr' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "writeSockaddr")) Module["writeSockaddr"] = function () {
  abort("'writeSockaddr' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "DNS")) Module["DNS"] = function () {
  abort("'DNS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "getHostByName")) Module["getHostByName"] = function () {
  abort("'getHostByName' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "GAI_ERRNO_MESSAGES")) Module["GAI_ERRNO_MESSAGES"] = function () {
  abort("'GAI_ERRNO_MESSAGES' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "Protocols")) Module["Protocols"] = function () {
  abort("'Protocols' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "Sockets")) Module["Sockets"] = function () {
  abort("'Sockets' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "getRandomDevice")) Module["getRandomDevice"] = function () {
  abort("'getRandomDevice' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "traverseStack")) Module["traverseStack"] = function () {
  abort("'traverseStack' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "UNWIND_CACHE")) Module["UNWIND_CACHE"] = function () {
  abort("'UNWIND_CACHE' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "withBuiltinMalloc")) Module["withBuiltinMalloc"] = function () {
  abort("'withBuiltinMalloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "readAsmConstArgsArray")) Module["readAsmConstArgsArray"] = function () {
  abort("'readAsmConstArgsArray' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "readAsmConstArgs")) Module["readAsmConstArgs"] = function () {
  abort("'readAsmConstArgs' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "mainThreadEM_ASM")) Module["mainThreadEM_ASM"] = function () {
  abort("'mainThreadEM_ASM' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "jstoi_q")) Module["jstoi_q"] = function () {
  abort("'jstoi_q' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "jstoi_s")) Module["jstoi_s"] = function () {
  abort("'jstoi_s' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "getExecutableName")) Module["getExecutableName"] = function () {
  abort("'getExecutableName' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "listenOnce")) Module["listenOnce"] = function () {
  abort("'listenOnce' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "autoResumeAudioContext")) Module["autoResumeAudioContext"] = function () {
  abort("'autoResumeAudioContext' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "dynCallLegacy")) Module["dynCallLegacy"] = function () {
  abort("'dynCallLegacy' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "getDynCaller")) Module["getDynCaller"] = function () {
  abort("'getDynCaller' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "dynCall")) Module["dynCall"] = function () {
  abort("'dynCall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "callRuntimeCallbacks")) Module["callRuntimeCallbacks"] = function () {
  abort("'callRuntimeCallbacks' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "abortStackOverflow")) Module["abortStackOverflow"] = function () {
  abort("'abortStackOverflow' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "reallyNegative")) Module["reallyNegative"] = function () {
  abort("'reallyNegative' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "unSign")) Module["unSign"] = function () {
  abort("'unSign' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "reSign")) Module["reSign"] = function () {
  abort("'reSign' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "formatString")) Module["formatString"] = function () {
  abort("'formatString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "PATH")) Module["PATH"] = function () {
  abort("'PATH' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "PATH_FS")) Module["PATH_FS"] = function () {
  abort("'PATH_FS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "SYSCALLS")) Module["SYSCALLS"] = function () {
  abort("'SYSCALLS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "syscallMmap2")) Module["syscallMmap2"] = function () {
  abort("'syscallMmap2' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "syscallMunmap")) Module["syscallMunmap"] = function () {
  abort("'syscallMunmap' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "getSocketFromFD")) Module["getSocketFromFD"] = function () {
  abort("'getSocketFromFD' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "getSocketAddress")) Module["getSocketAddress"] = function () {
  abort("'getSocketAddress' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "JSEvents")) Module["JSEvents"] = function () {
  abort("'JSEvents' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "registerKeyEventCallback")) Module["registerKeyEventCallback"] = function () {
  abort("'registerKeyEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "specialHTMLTargets")) Module["specialHTMLTargets"] = function () {
  abort("'specialHTMLTargets' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "maybeCStringToJsString")) Module["maybeCStringToJsString"] = function () {
  abort("'maybeCStringToJsString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "findEventTarget")) Module["findEventTarget"] = function () {
  abort("'findEventTarget' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "findCanvasEventTarget")) Module["findCanvasEventTarget"] = function () {
  abort("'findCanvasEventTarget' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "getBoundingClientRect")) Module["getBoundingClientRect"] = function () {
  abort("'getBoundingClientRect' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "fillMouseEventData")) Module["fillMouseEventData"] = function () {
  abort("'fillMouseEventData' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "registerMouseEventCallback")) Module["registerMouseEventCallback"] = function () {
  abort("'registerMouseEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "registerWheelEventCallback")) Module["registerWheelEventCallback"] = function () {
  abort("'registerWheelEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "registerUiEventCallback")) Module["registerUiEventCallback"] = function () {
  abort("'registerUiEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "registerFocusEventCallback")) Module["registerFocusEventCallback"] = function () {
  abort("'registerFocusEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "fillDeviceOrientationEventData")) Module["fillDeviceOrientationEventData"] = function () {
  abort("'fillDeviceOrientationEventData' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "registerDeviceOrientationEventCallback")) Module["registerDeviceOrientationEventCallback"] = function () {
  abort("'registerDeviceOrientationEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "fillDeviceMotionEventData")) Module["fillDeviceMotionEventData"] = function () {
  abort("'fillDeviceMotionEventData' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "registerDeviceMotionEventCallback")) Module["registerDeviceMotionEventCallback"] = function () {
  abort("'registerDeviceMotionEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "screenOrientation")) Module["screenOrientation"] = function () {
  abort("'screenOrientation' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "fillOrientationChangeEventData")) Module["fillOrientationChangeEventData"] = function () {
  abort("'fillOrientationChangeEventData' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "registerOrientationChangeEventCallback")) Module["registerOrientationChangeEventCallback"] = function () {
  abort("'registerOrientationChangeEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "fillFullscreenChangeEventData")) Module["fillFullscreenChangeEventData"] = function () {
  abort("'fillFullscreenChangeEventData' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "registerFullscreenChangeEventCallback")) Module["registerFullscreenChangeEventCallback"] = function () {
  abort("'registerFullscreenChangeEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "registerRestoreOldStyle")) Module["registerRestoreOldStyle"] = function () {
  abort("'registerRestoreOldStyle' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "hideEverythingExceptGivenElement")) Module["hideEverythingExceptGivenElement"] = function () {
  abort("'hideEverythingExceptGivenElement' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "restoreHiddenElements")) Module["restoreHiddenElements"] = function () {
  abort("'restoreHiddenElements' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "setLetterbox")) Module["setLetterbox"] = function () {
  abort("'setLetterbox' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "currentFullscreenStrategy")) Module["currentFullscreenStrategy"] = function () {
  abort("'currentFullscreenStrategy' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "restoreOldWindowedStyle")) Module["restoreOldWindowedStyle"] = function () {
  abort("'restoreOldWindowedStyle' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "softFullscreenResizeWebGLRenderTarget")) Module["softFullscreenResizeWebGLRenderTarget"] = function () {
  abort("'softFullscreenResizeWebGLRenderTarget' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "doRequestFullscreen")) Module["doRequestFullscreen"] = function () {
  abort("'doRequestFullscreen' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "fillPointerlockChangeEventData")) Module["fillPointerlockChangeEventData"] = function () {
  abort("'fillPointerlockChangeEventData' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "registerPointerlockChangeEventCallback")) Module["registerPointerlockChangeEventCallback"] = function () {
  abort("'registerPointerlockChangeEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "registerPointerlockErrorEventCallback")) Module["registerPointerlockErrorEventCallback"] = function () {
  abort("'registerPointerlockErrorEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "requestPointerLock")) Module["requestPointerLock"] = function () {
  abort("'requestPointerLock' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "fillVisibilityChangeEventData")) Module["fillVisibilityChangeEventData"] = function () {
  abort("'fillVisibilityChangeEventData' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "registerVisibilityChangeEventCallback")) Module["registerVisibilityChangeEventCallback"] = function () {
  abort("'registerVisibilityChangeEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "registerTouchEventCallback")) Module["registerTouchEventCallback"] = function () {
  abort("'registerTouchEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "fillGamepadEventData")) Module["fillGamepadEventData"] = function () {
  abort("'fillGamepadEventData' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "registerGamepadEventCallback")) Module["registerGamepadEventCallback"] = function () {
  abort("'registerGamepadEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "registerBeforeUnloadEventCallback")) Module["registerBeforeUnloadEventCallback"] = function () {
  abort("'registerBeforeUnloadEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "fillBatteryEventData")) Module["fillBatteryEventData"] = function () {
  abort("'fillBatteryEventData' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "battery")) Module["battery"] = function () {
  abort("'battery' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "registerBatteryEventCallback")) Module["registerBatteryEventCallback"] = function () {
  abort("'registerBatteryEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "setCanvasElementSize")) Module["setCanvasElementSize"] = function () {
  abort("'setCanvasElementSize' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "getCanvasElementSize")) Module["getCanvasElementSize"] = function () {
  abort("'getCanvasElementSize' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "polyfillSetImmediate")) Module["polyfillSetImmediate"] = function () {
  abort("'polyfillSetImmediate' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "demangle")) Module["demangle"] = function () {
  abort("'demangle' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "demangleAll")) Module["demangleAll"] = function () {
  abort("'demangleAll' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "jsStackTrace")) Module["jsStackTrace"] = function () {
  abort("'jsStackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "stackTrace")) Module["stackTrace"] = function () {
  abort("'stackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "getEnvStrings")) Module["getEnvStrings"] = function () {
  abort("'getEnvStrings' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "checkWasiClock")) Module["checkWasiClock"] = function () {
  abort("'checkWasiClock' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "flush_NO_FILESYSTEM")) Module["flush_NO_FILESYSTEM"] = function () {
  abort("'flush_NO_FILESYSTEM' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64")) Module["writeI53ToI64"] = function () {
  abort("'writeI53ToI64' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64Clamped")) Module["writeI53ToI64Clamped"] = function () {
  abort("'writeI53ToI64Clamped' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64Signaling")) Module["writeI53ToI64Signaling"] = function () {
  abort("'writeI53ToI64Signaling' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToU64Clamped")) Module["writeI53ToU64Clamped"] = function () {
  abort("'writeI53ToU64Clamped' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToU64Signaling")) Module["writeI53ToU64Signaling"] = function () {
  abort("'writeI53ToU64Signaling' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "readI53FromI64")) Module["readI53FromI64"] = function () {
  abort("'readI53FromI64' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "readI53FromU64")) Module["readI53FromU64"] = function () {
  abort("'readI53FromU64' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "convertI32PairToI53")) Module["convertI32PairToI53"] = function () {
  abort("'convertI32PairToI53' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "convertU32PairToI53")) Module["convertU32PairToI53"] = function () {
  abort("'convertU32PairToI53' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "uncaughtExceptionCount")) Module["uncaughtExceptionCount"] = function () {
  abort("'uncaughtExceptionCount' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "exceptionLast")) Module["exceptionLast"] = function () {
  abort("'exceptionLast' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "exceptionCaught")) Module["exceptionCaught"] = function () {
  abort("'exceptionCaught' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "ExceptionInfoAttrs")) Module["ExceptionInfoAttrs"] = function () {
  abort("'ExceptionInfoAttrs' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "ExceptionInfo")) Module["ExceptionInfo"] = function () {
  abort("'ExceptionInfo' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "CatchInfo")) Module["CatchInfo"] = function () {
  abort("'CatchInfo' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "exception_addRef")) Module["exception_addRef"] = function () {
  abort("'exception_addRef' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "exception_decRef")) Module["exception_decRef"] = function () {
  abort("'exception_decRef' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "Browser")) Module["Browser"] = function () {
  abort("'Browser' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "funcWrappers")) Module["funcWrappers"] = function () {
  abort("'funcWrappers' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "getFuncWrapper")) Module["getFuncWrapper"] = function () {
  abort("'getFuncWrapper' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "setMainLoop")) Module["setMainLoop"] = function () {
  abort("'setMainLoop' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "FS")) Module["FS"] = function () {
  abort("'FS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "mmapAlloc")) Module["mmapAlloc"] = function () {
  abort("'mmapAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "MEMFS")) Module["MEMFS"] = function () {
  abort("'MEMFS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "TTY")) Module["TTY"] = function () {
  abort("'TTY' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "PIPEFS")) Module["PIPEFS"] = function () {
  abort("'PIPEFS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "SOCKFS")) Module["SOCKFS"] = function () {
  abort("'SOCKFS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "_setNetworkCallback")) Module["_setNetworkCallback"] = function () {
  abort("'_setNetworkCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "tempFixedLengthArray")) Module["tempFixedLengthArray"] = function () {
  abort("'tempFixedLengthArray' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "miniTempWebGLFloatBuffers")) Module["miniTempWebGLFloatBuffers"] = function () {
  abort("'miniTempWebGLFloatBuffers' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "heapObjectForWebGLType")) Module["heapObjectForWebGLType"] = function () {
  abort("'heapObjectForWebGLType' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "heapAccessShiftForWebGLHeap")) Module["heapAccessShiftForWebGLHeap"] = function () {
  abort("'heapAccessShiftForWebGLHeap' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "GL")) Module["GL"] = function () {
  abort("'GL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGet")) Module["emscriptenWebGLGet"] = function () {
  abort("'emscriptenWebGLGet' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "computeUnpackAlignedImageSize")) Module["computeUnpackAlignedImageSize"] = function () {
  abort("'computeUnpackAlignedImageSize' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGetTexPixelData")) Module["emscriptenWebGLGetTexPixelData"] = function () {
  abort("'emscriptenWebGLGetTexPixelData' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGetUniform")) Module["emscriptenWebGLGetUniform"] = function () {
  abort("'emscriptenWebGLGetUniform' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGetVertexAttrib")) Module["emscriptenWebGLGetVertexAttrib"] = function () {
  abort("'emscriptenWebGLGetVertexAttrib' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "writeGLArray")) Module["writeGLArray"] = function () {
  abort("'writeGLArray' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "AL")) Module["AL"] = function () {
  abort("'AL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "SDL_unicode")) Module["SDL_unicode"] = function () {
  abort("'SDL_unicode' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "SDL_ttfContext")) Module["SDL_ttfContext"] = function () {
  abort("'SDL_ttfContext' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "SDL_audio")) Module["SDL_audio"] = function () {
  abort("'SDL_audio' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "SDL")) Module["SDL"] = function () {
  abort("'SDL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "SDL_gfx")) Module["SDL_gfx"] = function () {
  abort("'SDL_gfx' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "GLUT")) Module["GLUT"] = function () {
  abort("'GLUT' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "EGL")) Module["EGL"] = function () {
  abort("'EGL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "GLFW_Window")) Module["GLFW_Window"] = function () {
  abort("'GLFW_Window' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "GLFW")) Module["GLFW"] = function () {
  abort("'GLFW' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "GLEW")) Module["GLEW"] = function () {
  abort("'GLEW' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "IDBStore")) Module["IDBStore"] = function () {
  abort("'IDBStore' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "runAndAbortIfError")) Module["runAndAbortIfError"] = function () {
  abort("'runAndAbortIfError' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "emval_handle_array")) Module["emval_handle_array"] = function () {
  abort("'emval_handle_array' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "emval_free_list")) Module["emval_free_list"] = function () {
  abort("'emval_free_list' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "emval_symbols")) Module["emval_symbols"] = function () {
  abort("'emval_symbols' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "init_emval")) Module["init_emval"] = function () {
  abort("'init_emval' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "count_emval_handles")) Module["count_emval_handles"] = function () {
  abort("'count_emval_handles' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "get_first_emval")) Module["get_first_emval"] = function () {
  abort("'get_first_emval' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "getStringOrSymbol")) Module["getStringOrSymbol"] = function () {
  abort("'getStringOrSymbol' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "requireHandle")) Module["requireHandle"] = function () {
  abort("'requireHandle' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "emval_newers")) Module["emval_newers"] = function () {
  abort("'emval_newers' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "craftEmvalAllocator")) Module["craftEmvalAllocator"] = function () {
  abort("'craftEmvalAllocator' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "emval_get_global")) Module["emval_get_global"] = function () {
  abort("'emval_get_global' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "emval_methodCallers")) Module["emval_methodCallers"] = function () {
  abort("'emval_methodCallers' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "InternalError")) Module["InternalError"] = function () {
  abort("'InternalError' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "BindingError")) Module["BindingError"] = function () {
  abort("'BindingError' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "UnboundTypeError")) Module["UnboundTypeError"] = function () {
  abort("'UnboundTypeError' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "PureVirtualError")) Module["PureVirtualError"] = function () {
  abort("'PureVirtualError' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "init_embind")) Module["init_embind"] = function () {
  abort("'init_embind' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "throwInternalError")) Module["throwInternalError"] = function () {
  abort("'throwInternalError' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "throwBindingError")) Module["throwBindingError"] = function () {
  abort("'throwBindingError' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "throwUnboundTypeError")) Module["throwUnboundTypeError"] = function () {
  abort("'throwUnboundTypeError' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "ensureOverloadTable")) Module["ensureOverloadTable"] = function () {
  abort("'ensureOverloadTable' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "exposePublicSymbol")) Module["exposePublicSymbol"] = function () {
  abort("'exposePublicSymbol' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "replacePublicSymbol")) Module["replacePublicSymbol"] = function () {
  abort("'replacePublicSymbol' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "extendError")) Module["extendError"] = function () {
  abort("'extendError' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "createNamedFunction")) Module["createNamedFunction"] = function () {
  abort("'createNamedFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "registeredInstances")) Module["registeredInstances"] = function () {
  abort("'registeredInstances' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "getBasestPointer")) Module["getBasestPointer"] = function () {
  abort("'getBasestPointer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "registerInheritedInstance")) Module["registerInheritedInstance"] = function () {
  abort("'registerInheritedInstance' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "unregisterInheritedInstance")) Module["unregisterInheritedInstance"] = function () {
  abort("'unregisterInheritedInstance' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "getInheritedInstance")) Module["getInheritedInstance"] = function () {
  abort("'getInheritedInstance' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "getInheritedInstanceCount")) Module["getInheritedInstanceCount"] = function () {
  abort("'getInheritedInstanceCount' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "getLiveInheritedInstances")) Module["getLiveInheritedInstances"] = function () {
  abort("'getLiveInheritedInstances' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "registeredTypes")) Module["registeredTypes"] = function () {
  abort("'registeredTypes' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "awaitingDependencies")) Module["awaitingDependencies"] = function () {
  abort("'awaitingDependencies' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "typeDependencies")) Module["typeDependencies"] = function () {
  abort("'typeDependencies' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "registeredPointers")) Module["registeredPointers"] = function () {
  abort("'registeredPointers' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "registerType")) Module["registerType"] = function () {
  abort("'registerType' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "whenDependentTypesAreResolved")) Module["whenDependentTypesAreResolved"] = function () {
  abort("'whenDependentTypesAreResolved' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "embind_charCodes")) Module["embind_charCodes"] = function () {
  abort("'embind_charCodes' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "embind_init_charCodes")) Module["embind_init_charCodes"] = function () {
  abort("'embind_init_charCodes' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "readLatin1String")) Module["readLatin1String"] = function () {
  abort("'readLatin1String' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "getTypeName")) Module["getTypeName"] = function () {
  abort("'getTypeName' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "heap32VectorToArray")) Module["heap32VectorToArray"] = function () {
  abort("'heap32VectorToArray' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "requireRegisteredType")) Module["requireRegisteredType"] = function () {
  abort("'requireRegisteredType' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "getShiftFromSize")) Module["getShiftFromSize"] = function () {
  abort("'getShiftFromSize' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "integerReadValueFromPointer")) Module["integerReadValueFromPointer"] = function () {
  abort("'integerReadValueFromPointer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "enumReadValueFromPointer")) Module["enumReadValueFromPointer"] = function () {
  abort("'enumReadValueFromPointer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "floatReadValueFromPointer")) Module["floatReadValueFromPointer"] = function () {
  abort("'floatReadValueFromPointer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "simpleReadValueFromPointer")) Module["simpleReadValueFromPointer"] = function () {
  abort("'simpleReadValueFromPointer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "runDestructors")) Module["runDestructors"] = function () {
  abort("'runDestructors' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "new_")) Module["new_"] = function () {
  abort("'new_' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "craftInvokerFunction")) Module["craftInvokerFunction"] = function () {
  abort("'craftInvokerFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "embind__requireFunction")) Module["embind__requireFunction"] = function () {
  abort("'embind__requireFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "tupleRegistrations")) Module["tupleRegistrations"] = function () {
  abort("'tupleRegistrations' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "structRegistrations")) Module["structRegistrations"] = function () {
  abort("'structRegistrations' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "genericPointerToWireType")) Module["genericPointerToWireType"] = function () {
  abort("'genericPointerToWireType' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "constNoSmartPtrRawPointerToWireType")) Module["constNoSmartPtrRawPointerToWireType"] = function () {
  abort("'constNoSmartPtrRawPointerToWireType' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "nonConstNoSmartPtrRawPointerToWireType")) Module["nonConstNoSmartPtrRawPointerToWireType"] = function () {
  abort("'nonConstNoSmartPtrRawPointerToWireType' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "init_RegisteredPointer")) Module["init_RegisteredPointer"] = function () {
  abort("'init_RegisteredPointer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "RegisteredPointer")) Module["RegisteredPointer"] = function () {
  abort("'RegisteredPointer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "RegisteredPointer_getPointee")) Module["RegisteredPointer_getPointee"] = function () {
  abort("'RegisteredPointer_getPointee' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "RegisteredPointer_destructor")) Module["RegisteredPointer_destructor"] = function () {
  abort("'RegisteredPointer_destructor' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "RegisteredPointer_deleteObject")) Module["RegisteredPointer_deleteObject"] = function () {
  abort("'RegisteredPointer_deleteObject' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "RegisteredPointer_fromWireType")) Module["RegisteredPointer_fromWireType"] = function () {
  abort("'RegisteredPointer_fromWireType' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "runDestructor")) Module["runDestructor"] = function () {
  abort("'runDestructor' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "releaseClassHandle")) Module["releaseClassHandle"] = function () {
  abort("'releaseClassHandle' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "finalizationGroup")) Module["finalizationGroup"] = function () {
  abort("'finalizationGroup' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "detachFinalizer_deps")) Module["detachFinalizer_deps"] = function () {
  abort("'detachFinalizer_deps' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "detachFinalizer")) Module["detachFinalizer"] = function () {
  abort("'detachFinalizer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "attachFinalizer")) Module["attachFinalizer"] = function () {
  abort("'attachFinalizer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "makeClassHandle")) Module["makeClassHandle"] = function () {
  abort("'makeClassHandle' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "init_ClassHandle")) Module["init_ClassHandle"] = function () {
  abort("'init_ClassHandle' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "ClassHandle")) Module["ClassHandle"] = function () {
  abort("'ClassHandle' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "ClassHandle_isAliasOf")) Module["ClassHandle_isAliasOf"] = function () {
  abort("'ClassHandle_isAliasOf' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "throwInstanceAlreadyDeleted")) Module["throwInstanceAlreadyDeleted"] = function () {
  abort("'throwInstanceAlreadyDeleted' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "ClassHandle_clone")) Module["ClassHandle_clone"] = function () {
  abort("'ClassHandle_clone' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "ClassHandle_delete")) Module["ClassHandle_delete"] = function () {
  abort("'ClassHandle_delete' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "deletionQueue")) Module["deletionQueue"] = function () {
  abort("'deletionQueue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "ClassHandle_isDeleted")) Module["ClassHandle_isDeleted"] = function () {
  abort("'ClassHandle_isDeleted' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "ClassHandle_deleteLater")) Module["ClassHandle_deleteLater"] = function () {
  abort("'ClassHandle_deleteLater' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "flushPendingDeletes")) Module["flushPendingDeletes"] = function () {
  abort("'flushPendingDeletes' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "delayFunction")) Module["delayFunction"] = function () {
  abort("'delayFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "setDelayFunction")) Module["setDelayFunction"] = function () {
  abort("'setDelayFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "RegisteredClass")) Module["RegisteredClass"] = function () {
  abort("'RegisteredClass' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "shallowCopyInternalPointer")) Module["shallowCopyInternalPointer"] = function () {
  abort("'shallowCopyInternalPointer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "downcastPointer")) Module["downcastPointer"] = function () {
  abort("'downcastPointer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "upcastPointer")) Module["upcastPointer"] = function () {
  abort("'upcastPointer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "validateThis")) Module["validateThis"] = function () {
  abort("'validateThis' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "char_0")) Module["char_0"] = function () {
  abort("'char_0' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "char_9")) Module["char_9"] = function () {
  abort("'char_9' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "makeLegalFunctionName")) Module["makeLegalFunctionName"] = function () {
  abort("'makeLegalFunctionName' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "warnOnce")) Module["warnOnce"] = function () {
  abort("'warnOnce' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "stackSave")) Module["stackSave"] = function () {
  abort("'stackSave' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "stackRestore")) Module["stackRestore"] = function () {
  abort("'stackRestore' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "stackAlloc")) Module["stackAlloc"] = function () {
  abort("'stackAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "AsciiToString")) Module["AsciiToString"] = function () {
  abort("'AsciiToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "stringToAscii")) Module["stringToAscii"] = function () {
  abort("'stringToAscii' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "UTF16ToString")) Module["UTF16ToString"] = function () {
  abort("'UTF16ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF16")) Module["stringToUTF16"] = function () {
  abort("'stringToUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF16")) Module["lengthBytesUTF16"] = function () {
  abort("'lengthBytesUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "UTF32ToString")) Module["UTF32ToString"] = function () {
  abort("'UTF32ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF32")) Module["stringToUTF32"] = function () {
  abort("'stringToUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF32")) Module["lengthBytesUTF32"] = function () {
  abort("'lengthBytesUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "allocateUTF8")) Module["allocateUTF8"] = function () {
  abort("'allocateUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "allocateUTF8OnStack")) Module["allocateUTF8OnStack"] = function () {
  abort("'allocateUTF8OnStack' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
Module["writeStackCookie"] = writeStackCookie;
Module["checkStackCookie"] = checkStackCookie;
if (!Object.getOwnPropertyDescriptor(Module, "intArrayFromBase64")) Module["intArrayFromBase64"] = function () {
  abort("'intArrayFromBase64' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "tryParseAsDataURI")) Module["tryParseAsDataURI"] = function () {
  abort("'tryParseAsDataURI' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};
if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_NORMAL")) Object.defineProperty(Module, "ALLOC_NORMAL", {
  configurable: true,
  get: function () {
    abort("'ALLOC_NORMAL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
});
if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_STACK")) Object.defineProperty(Module, "ALLOC_STACK", {
  configurable: true,
  get: function () {
    abort("'ALLOC_STACK' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
});
var calledRun;
/**
 * @constructor
 * @this {ExitStatus}
 */

function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
}

var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!calledRun) run();
  if (!calledRun) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
};

function stackCheckInit() {
  // This is normally called automatically during __wasm_call_ctors but need to
  // get these values before even running any of the ctors so we call it redundantly
  // here.
  // TODO(sbc): Move writeStackCookie to native to to avoid this.
  _emscripten_stack_init();

  writeStackCookie();
}
/** @type {function(Array=)} */


function run(args) {
  args = args || arguments_;

  if (runDependencies > 0) {
    return;
  }

  stackCheckInit();
  preRun(); // a preRun added a dependency, run will be called later

  if (runDependencies > 0) {
    return;
  }

  function doRun() {
    // run may have just been called through dependencies being fulfilled just in this very frame,
    // or while the async setStatus time below was happening
    if (calledRun) return;
    calledRun = true;
    Module['calledRun'] = true;
    if (ABORT) return;
    initRuntime();
    preMain();
    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();
    assert(!Module['_main'], 'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]');
    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function () {
      setTimeout(function () {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }

  checkStackCookie();
}

Module['run'] = run;

function checkUnflushedContent() {
  // Compiler settings do not allow exiting the runtime, so flushing
  // the streams is not possible. but in ASSERTIONS mode we check
  // if there was something to flush, and if so tell the user they
  // should request that the runtime be exitable.
  // Normally we would not even include flush() at all, but in ASSERTIONS
  // builds we do so just for this check, and here we see if there is any
  // content to flush, that is, we check if there would have been
  // something a non-ASSERTIONS build would have not seen.
  // How we flush the streams depends on whether we are in SYSCALLS_REQUIRE_FILESYSTEM=0
  // mode (which has its own special function for this; otherwise, all
  // the code is inside libc)
  var oldOut = out;
  var oldErr = err;
  var has = false;

  out = err = function (x) {
    has = true;
  };

  try {
    // it doesn't matter if it fails
    var flush = null;
    if (flush) flush();
  } catch (e) {}

  out = oldOut;
  err = oldErr;

  if (has) {
    warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the FAQ), or make sure to emit a newline when you printf etc.');
    warnOnce('(this may also be due to not including full filesystem support - try building with -s FORCE_FILESYSTEM=1)');
  }
}
/** @param {boolean|number=} implicit */


function exit(status, implicit) {
  checkUnflushedContent(); // if this is just main exit-ing implicitly, and the status is 0, then we
  // don't need to do anything here and can just leave. if the status is
  // non-zero, though, then we need to report it.
  // (we may have warned about this earlier, if a situation justifies doing so)

  if (implicit && noExitRuntime && status === 0) {
    return;
  }

  if (noExitRuntime) {
    // if exit() was called, we may warn the user if the runtime isn't actually being shut down
    if (!implicit) {
      var msg = 'program exited (with status: ' + status + '), but EXIT_RUNTIME is not set, so halting execution but not exiting the runtime or preventing further async execution (build with EXIT_RUNTIME=1, if you want a true shutdown)';
      err(msg);
    }
  } else {
    EXITSTATUS = status;
    exitRuntime();
    if (Module['onExit']) Module['onExit'](status);
    ABORT = true;
  }

  quit_(status, new ExitStatus(status));
}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];

  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

run();
var _default = Module;
exports.default = _default;

}).call(this)}).call(this,require('_process'),require("buffer").Buffer,"/wasm")
},{"_process":6,"buffer":3,"fs":1,"path":5}]},{},[9]);
