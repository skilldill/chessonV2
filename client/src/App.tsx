import femaleTechnologist from './assets/female-technologist.png';
import shrug from './assets/shrug.png';

function App() {
  return (
    <div className="container">
      <div className="containerTitle">
        <h1 className="titleChesson">Chesson.ru</h1>
      </div>
      <div className="containerComingSoon">
        <img src={shrug} alt="Девушка не понимает" className="chessImage" />
        <img src={femaleTechnologist} alt="Девушка-технолог" className="chessImage" />
      </div>
    </div>
  )
}

export default App
