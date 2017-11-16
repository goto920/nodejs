# nodejs

Programming practice for nodejs and react application

1. metronome -- simple metronome using React and Web Audio API

try at http://kmgoto.jp/nodejs/metronome/

Time is not very accurate used WAAClock repeat function only.

      this.clock.start()
      let num = this.state.bpm*(this.state.denominator/4)
      this.setState({playing: true})
      this.tickEvent = this.clock.callbackAtTime(
         this.playClick,
        context.currentTime
      ).repeat(60/num) 

-----------------------
2. feedbackBooster -- user interface for Feedback Booster written in Java

client -- UI Only
   client/src -- client Javascript source code

index.js -- Web application server (express) 
  config -- server key and password hash (user: admin password: admin)
  server

java -- Java module
  FeedbackBoosterNoGUI.jar (compiled)
  src/ Java source code and Makefile

How To Use
                                                        Guitar amp
                                                          microphone
                                                            |
                                                            V
PC (Linux/Windows etc.) with Java VM (java command) -- audio Interface
            :                                               |
        Web Browser (PC or smart phone)                     V
                                                         vibration speaker
                                                          (exciter)
                                                        taped on E. Guitar  
                                                        (headphone for test)

1) compile Java code (or use FeedbackBoosterNoGUI.jar)

   npm run javac

2) set up client Javascript file
 
   npm run bundle

3) start web server

   npm start

4) start web browser 

   https://localhost:3000/
   https://ipV4address:3000/
   https://[::1]:3000/
   https://[ipV6address:3000/

   Add exception for the self-signed server certificate

5) login with admin, admin (first time) 
   (or JSON Web Token)

6) start application

   Select Input port and Output port
   Player control: bypass or process (the program starts on the server)


