#!/bin/sh

browserify filter-processor.js -p esmify > bundle.js

# browserify filter-processor-wasm.js -p esmify > bundle.js
