DEPS = ProcessFFT.cpp

build: $(DEPS)
	@emcc --bind -O1 \
	-s WASM=1 \
	-s BINARYEN_ASYNC_COMPILATION=0 \
	-s DISABLE_EXCEPTION_CATCHING=0 \
	-s SINGLE_FILE=1 \
	-s ASSERTIONS=1 \
	ProcessFFT.cpp \
	-o process_fft.js \
	--post-js ./post-export.js

clean:
	@rm -f process_filter.js

# https://github.com/GoogleChromeLabs/web-audio-samples/blob/master/audio-worklet/design-pattern/wasm/Makefile
