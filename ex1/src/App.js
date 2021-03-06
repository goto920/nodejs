import React from 'react'; // reactの機能を取り込む (使う)
import './App.css'; // このディレクトリ (フォルダ) にあるApp.css を読み込む

class App extends React.Component { // classを定義 (文字コードはUTF-8)
  constructor(props){
    super();
    this.state = {tempC: 0, tempF: 32};
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event){
    if (event.target.name === "tempCset"){
      this.setState({tempC: event.target.value});
      this.setState({tempF: event.target.value*9/5 + 32});
    }
    if (event.target.name === "tempFset"){
      this.setState({tempF: event.target.value});
      this.setState({tempC: (event.target.value - 32)*5/9});
    }

  }

  render () { // 描画処理

    const cMax = 300, cMin = -200;

    return (
      <div className="App">
      Ex1: US単位とメトリックの変換<hr />
      <input type="number" name="tempFset" value={this.state.tempF} onInput={this.handleChange} /> F<br /> 
      <input type="number" name="tempCset" value={this.state.tempC} onInput={this.handleChange} /> C<br />
      {cMin}(C)&nbsp;
       <input type="range" name="tempCset" min={cMin} max={cMax} value={this.state.tempC} onChange={this.handleChange} /> {cMax}(C)
      <hr />
      </div>
      );

   }

   convertTemp(event){
     if (event.target.name === "tempF"){
       let tempF = parseFloat(event.target.value);
       let tempC = (tempF - 32)*5/9;
       this.setState ({tempC: tempC, tempF: tempF})
     }

     if (event.target.name === "tempC"){
       let tempC = parseFloat(event.target.value);
       let tempF = tempC*9/5 + 32;
       this.setState ({tempC: tempC, tempF: tempF})
     }

  }

} // class Appの終わり

/* 複数行のコメントアウト (けしてもよい)
function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}
*/

export default App;
