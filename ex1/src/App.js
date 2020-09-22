// 後藤が今まで書いたプログラムは https://github.com/goto920/nodejs/ にある

import React from 'react'; // reactの機能を取り込む (使う)
// import logo from './logo.svg'; // 行内のコメントアウト (無効にする)
import './App.css'; // このディレクトリ (フォルダ) にあるApp.css を読み込む

class App extends React.Component { // classを定義 (文字コードはUTF-8)
  render () { // 描画処理
    // 描画時の再計算処理など
    // divタグの中にHTMLを拡張した記法でいろいろかく。returnの中ではHTMLのコメントは使えないが
    // {/* から */} でコメントが入れられる
      // classNameには、cssにある定義を適用
    return (
      <div className="App">
      Ex1、まずは文字だけ (文字コードはUTF-8) に限る<hr /> {/* HTMLのbr、hrは普通に使える */}
      この後に、ボタン、スライダ、テキスト入力ボックスなどを配置する
      </div>
    );
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
