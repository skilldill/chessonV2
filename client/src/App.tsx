
import { AppScreen } from "./screens/AppScreen/AppScreen";
import { CreateRoomScreen } from "./screens/CreateRoomScreen/CreateRoomScreen";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import 'react-chessboard-ui/dist/index.css';

import { useImagePreloader } from "./hooks/useImagePreloader";

// Импорт критических изображений
import WhiteFlagPNG from "./assets/white-flag.png";
import CrossMarkRedPNG from "./assets/cross-mark.png";
import HandShakePNG from "./assets/handshake.png";
import CursorSVG from "./assets/cursor.svg";
import FemaleTechnologistPNG from "./assets/female-technologist.png";
import ShrugPNG from "./assets/shrug.png";

// Импорт аватаров
import Cat1PNG from "./assets/avatars/cat_1.png";
import Cat2PNG from "./assets/avatars/cat_2.png";
import Cat3PNG from "./assets/avatars/cat_3.png";
import Cat4PNG from "./assets/avatars/cat_4.png";
import Cat5PNG from "./assets/avatars/cat_5.png";
import Cat6PNG from "./assets/avatars/cat_6.png";
import Cat7PNG from "./assets/avatars/cat_7.png";
import Cat8PNG from "./assets/avatars/cat_8.png";
import { useRestoreGame } from "./hooks/useRestoreGame";

// Все изображения для предзагрузки (вынесено за пределы компонента)
const ALL_IMAGES = [
  // Критические изображения интерфейса
  WhiteFlagPNG,
  CrossMarkRedPNG,
  HandShakePNG,
  CursorSVG,
  FemaleTechnologistPNG,
  ShrugPNG,
  // Аватары
  Cat1PNG,
  Cat2PNG,
  Cat3PNG,
  Cat4PNG,
  Cat5PNG,
  Cat6PNG,
  Cat7PNG,
  Cat8PNG,
];

function App() {
  // Используем хук для холодной прогрузки всех изображений
  useImagePreloader(ALL_IMAGES);
  useRestoreGame();

  return (
    <Router>
      <Switch>
        <Route exact path="/" component={CreateRoomScreen} />
        <Route path="/:roomId" component={AppScreen} />
      </Switch>
    </Router>
  );
}

export default App
