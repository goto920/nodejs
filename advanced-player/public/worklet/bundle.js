(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
},{"_process":6,"fs":4,"path":5}],2:[function(require,module,exports){
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

},{"./KissFFT":1}],3:[function(require,module,exports){
"use strict";

var _kissfftJs = require("kissfft-js");

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
// import Windowing from 'fft-windowing'; // did not work in worklet
class FilterProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.sampleRate = options.processorOptions.sampleRate;
    this.fftShift = options.processorOptions.fftShift; // 512 windowSize = 2*512 = 1024

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
          this.presetFilter(data.type, data.arg);
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

  addFilter(fromPan, fromFreq, toPan, toFreq, action) {
    let fromFreqIndex = Math.min(this.fftShift, Math.round(this.fftShift * (2 * fromFreq / this.sampleRate)));
    let toFreqIndex = Math.min(this.fftShift, Math.round(this.fftShift * (2 * toFreq / this.sampleRate)));
    this.filterChain.push({
      fromPan: fromPan,
      fromFreqIndex: fromFreqIndex,
      toPan: toPan,
      toFreqIndex: toFreqIndex,
      action: action
    });
  } // end addFilter()


  clearAllFilter() {
    this.filterChain.length = 0;
  }

  presetFilter(type, option) {
    this.clearAllFilter();
    console.log('filter, option ', type, option);
    let width;

    switch (type) {
      case 'bypass':
        break;

      case 'drumCover':
        width = option;
        this.addFilter(-1, 0, 1, 30000, "H");
        this.addFilter(-width / 2, 220, width / 2, 4000, "T");
        this.addFilter(-1.0, 220, -0.9, 4000, "T");
        this.addFilter(0.9, 220, 1.0, 4000, "T");
        break;

      case 'karaokeMale':
        width = option;
        this.addFilter(-width / 2, 220, width / 2, 8000, "M");
        break;

      case 'karaokeFemale':
        width = option;
        this.addFilter(-width / 2, 350, width / 2, 8000, "M");
        break;

      case 'percussive':
        this.addFilter(-1, 0, 1, 30000, "P");
        break;

      case 'harmonic':
        this.addFilter(-1, 0, 1, 30000, "H");
        break;

      default:
    }
  } // end presetFilter()


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

      /* // fot Test
        const fftCoef = this.justFFT(this.inputBuffer);
        this.inputBuffer[0].splice(0,this.fftShift); 
        this.inputBuffer[1].splice(0,this.fftShift);
      */
      // process effect
      const fftObj = this.calcFFT(this.inputBuffer); // Shift by deleting fftShift samples from the head

      this.inputBuffer[0].splice(0, this.fftShift);
      this.inputBuffer[1].splice(0, this.fftShift);
      if (fftObj === null) return true;
      const fftCoef = this.fftFilter(fftObj); // Inverse

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


    if (this.outputBuffer[0].length < 64 * this.fftShift) return true; // output 128 (this.ioSize) samples

    output[0].set(this.outputBuffer[0].slice(0, this.ioSize));
    output[1].set(this.outputBuffer[1].slice(0, this.ioSize)); // delete output samples from the head

    this.outputBuffer[0].splice(0, this.ioSize);
    this.outputBuffer[1].splice(0, this.ioSize);
    return true;
  } // end process()


  calcFFT(inputSamples) {
    const fftCoef = [this.fftr.forward(this.applyHannWindow(inputSamples[0])).slice(), this.fftr.forward(this.applyHannWindow(inputSamples[1])).slice()]; // 0: Left, 1: Right

    const power = [new Float32Array(this.fftShift + 1), new Float32Array(this.fftShift + 1)]; // 0: Left, 1: Right plus1 for DC

    for (let freqBin = 0; freqBin <= this.fftShift; freqBin++) {
      power[0][freqBin] = fftCoef[0][2 * freqBin] * fftCoef[0][2 * freqBin] + fftCoef[0][2 * freqBin + 1] * fftCoef[0][2 * freqBin + 1];
      power[1][freqBin] = fftCoef[1][2 * freqBin] * fftCoef[1][2 * freqBin] + fftCoef[1][2 * freqBin + 1] * fftCoef[1][2 * freqBin + 1];
    }

    const fftObj = {
      fftCoef: fftCoef,
      pan: [],
      power: power,
      percL: [],
      percR: []
    };
    this.calcPan(fftObj); // values returned in fftObj

    this.fftObjBuffer.push(fftObj); // append to the buffer

    const fftObjRet = this.calcPerc(this.fftObjBuffer); // fftObj returned if there are enough samples

    return fftObjRet;
  } // end calcFFT


  calcPan(fftObj) {
    const fft = fftObj.fftCoef;
    const numCoef = fft[0].length / 2;
    const pan = new Float32Array(numCoef);
    const panAmp = new Float32Array(numCoef);
    /*
      Note: frequency-domain data is stored from dc up to 2pi. 
      so cx_out[0] is the dc bin of the FFT and cx_out[nfft/2] is 
      the Nyquist bin (if exists)
    */
    //    console.log('numCoef', numCoef);

    for (let freqBin = 0; freqBin < numCoef; freqBin++) {
      const base = 2 * freqBin;
      const innerProd = fft[0][base] * fft[1][base] + fft[0][base + 1] * fft[1][base + 1];
      const crossProd = fft[0][base] * fft[1][base + 1] - fft[0][base + 1] * fft[1][base]; // Don't forget minus

      const abs = Math.sqrt(Math.pow(fft[0][base] + fft[1][base], 2) + Math.pow(fft[0][base + 1] + fft[1][base + 1], 2));
      const absL = Math.sqrt(Math.pow(fft[0][base], 2) + Math.pow(fft[0][base + 1], 2));
      const absR = Math.sqrt(Math.pow(fft[1][base], 2) + Math.pow(fft[1][base + 1], 2));
      const absLR = Math.sqrt(Math.pow(fft[0][base] - fft[1][base], 2) + Math.pow(fft[0][base + 1] - fft[1][base + 1], 2));
      let frac = 0;

      if (absL < absR) {
        if (innerProd < 0) {
          frac = 0;
          panAmp[freqBin] = (absLR - absL) / abs;
        } else if (innerProd <= absR * absR) {
          frac = innerProd / (absR * absR);
          panAmp[freqBin] = Math.max(absL, absLR) - Math.abs(crossProd) / absR;
        } else {
          frac = 1;
          panAmp[freqBin] = absL - absLR;
        }

        pan[freqBin] = (1 - frac) / (1 + frac); // console.log('bin, fracA', freqBin, frac);
      } else {
        // absL >= absR
        if (innerProd < 0) {
          frac = 0;
          panAmp[freqBin] = (absLR - absR) / abs;
        } else if (innerProd <= absL * absL) {
          frac = innerProd / (absL * absL);
          panAmp[freqBin] = Math.max(absR, absLR) - Math.abs(crossProd) / absL;
        } else {
          frac = 1;
          panAmp[freqBin] = absR - absLR;
        }

        pan[freqBin] = (frac - 1) / (1 + frac);
      } // console.log('bin, fracB', freqBin, frac);


      if (isNaN(pan[freqBin])) pan[freqBin] = 0;
      if (isNaN(panAmp[freqBin])) panAmp[freqBin] = 0;
    } // end for freqBin


    fftObj.pan = pan;
    fftObj.panAmp = panAmp;
    return;
  } // end calcPan()


  calcPerc(fftObjBuffer) {
    const median = arr => {
      const mid = Math.floor(arr.length / 2),
            nums = [...arr].sort((a, b) => a - b);
      return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
    };

    const buflen = fftObjBuffer.length; // console.log ('buflen', buflen);

    if (buflen < 17) return null; // not enough data

    const percL = new Float32Array(this.fftShift + 1).fill(0.5); // +1 for DC

    const percR = new Float32Array(this.fftShift + 1).fill(0.5); // also used as power

    const index = 8;
    const fftObj = fftObjBuffer[index];

    for (let freqBin = 0; freqBin <= this.fftShift; freqBin++) {
      const from = Math.max(0, freqBin - 9);
      const to = Math.min(freqBin + 9, this.fftShift + 1); // to (not incl.) 

      const pMedianL = median(fftObj.power[0].slice(from, to));
      const pMedianR = median(fftObj.power[1].slice(from, to));
      const powerArrayL = [];
      const powerArrayR = [];

      for (let time = 0; time < buflen; time++) {
        // buflen (max 17)
        powerArrayL.push(fftObjBuffer[time].power[0][freqBin]);
        powerArrayR.push(fftObjBuffer[time].power[1][freqBin]);
      }

      const hMedianL = median(powerArrayL);
      const hMedianR = median(powerArrayR);
      percL[freqBin] = pMedianL * pMedianL / (pMedianL * pMedianL + hMedianL * hMedianL);
      if (isNaN(percL[freqBin])) percL[freqBin] = 0.5;
      percR[freqBin] = pMedianR * pMedianR / (pMedianR * pMedianR + hMedianR * hMedianR);
      if (isNaN(percR[freqBin])) percR[freqBin] = 0.5;
    }

    fftObjBuffer[index].percL = percL;
    fftObjBuffer[index].percR = percR;
    const retval = {
      fftCoef: [fftObj.fftCoef[0].slice(), fftObj.fftCoef[1].slice()],
      pan: fftObj.pan.slice(),
      panAmp: fftObj.panAmp.slice(),
      power: [fftObj.power[0].slice(), fftObj.power[1].slice()],
      perc: [percL.slice(), percR.slice()]
    }; // fftObj

    if (buflen >= 17) fftObjBuffer.splice(0, 1);
    return retval;
  } // end calcPerc()


  fftFilter(fftObj) {
    const fftL = fftObj.fftCoef[0];
    const fftR = fftObj.fftCoef[1];
    const percL = fftObj.perc[0];
    const percR = fftObj.perc[1]; // return [fftL, fftR]; // for test

    let outL = fftL.slice();
    let outR = fftR.slice();

    for (let i = 0; i < this.filterChain.length; i++) {
      let filter = this.filterChain[i];
      let action = filter.action;

      for (let f = filter.fromFreqIndex; f <= filter.toFreqIndex; f++) {
        if (fftObj.pan[f] < filter.fromPan || fftObj.pan[f] > filter.toPan) continue;

        switch (action) {
          case 'T':
            // original signal
            outL[2 * f] = fftL[2 * f];
            outL[2 * f + 1] = fftL[2 * f + 1];
            outR[2 * f] = fftR[2 * f];
            outR[2 * f + 1] = fftR[2 * f + 1];
            break;

          case 'M':
            // mute
            outL[2 * f] = outL[2 * f + 1] = 0; // real, image

            outR[2 * f] = outR[2 * f + 1] = 0; // real, image

            break;

          case 'P':
            outL[2 * f] = fftL[2 * f] * percL[f];
            outL[2 * f + 1] = fftL[2 * f + 1] * percL[f];
            outR[2 * f] = fftR[2 * f] * percR[f];
            outR[2 * f + 1] = fftR[2 * f + 1] * percR[f];
            break;

          case 'H':
            outL[2 * f] = fftL[2 * f] * (1 - percL[f]);
            outL[2 * f + 1] = fftL[2 * f + 1] * (1 - percL[f]);
            outR[2 * f] = fftR[2 * f] * (1 - percR[f]);
            outR[2 * f + 1] = fftR[2 * f + 1] * (1 - percR[f]);
            break;

          default:
            console.log('Filter undef action', action);
        }
      }
    }

    return [outL, outR];
  } // end fftFilter()


  justFFT(inputSamples) {
    return [this.fftr.forward(this.applyHannWindow(inputSamples[0])).slice(), this.fftr.forward(this.applyHannWindow(inputSamples[1])).slice()];
  }

} // end of the class


registerProcessor('filter-processor', FilterProcessor);

},{"kissfft-js":2}],4:[function(require,module,exports){

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

},{}]},{},[3]);
