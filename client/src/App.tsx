
import { AppScreen } from "./screens/AppScreen/AppScreen";
import { VerifyEmailScreen } from "./screens/VerifyEmailScreen/VerifyEmailScreen";
import { LoginScreen } from "./screens/LoginScreen/LoginScreen";
import { SignupScreen } from "./screens/SignupScreen/SignupScreen";
import { SignupSuccessScreen } from "./screens/SignupSuccessScreen/SignupSuccessScreen";
import { ProfileScreen } from "./screens/ProfileScreen/ProfileScreen";
import { ForgotPasswordScreen } from "./screens/ForgotPasswordScreen/ForgotPasswordScreen";
import { ResetPasswordScreen } from "./screens/ResetPasswordScreen/ResetPasswordScreen";
import { HomeScreen } from "./screens/HomeScreen/HomeScreen";
import { CreateRoomScreen } from "./screens/CreateRoomScreen/CreateRoomScreen";
import { HomeRedirect } from "./components/HomeRedirect/HomeRedirect";
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
import { useUserAppearancePreload } from "./hooks/useUserAppearancePreload";
import { CreateCustomFenRoomScreen } from "./screens/CreateCustomFenRoomScreen/CreateCustomFenRoomScreen";

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
  // Предзагрузка темы доски в localStorage при заходе в приложение
  useUserAppearancePreload();

  return (
    <Router>
      <Switch>
        <Route exact path="/" component={HomeRedirect} />
        <Route exact path="/main" component={HomeScreen} />
        <Route exact path="/create-room" component={CreateRoomScreen} />
        <Route path="/game/:roomId" component={AppScreen} />
        <Route exact path="/custom/room" component={CreateCustomFenRoomScreen} />
        <Route exact path="/verify-email" component={VerifyEmailScreen} />
        <Route exact path="/login" component={LoginScreen} />
        <Route exact path="/signup" component={SignupScreen} />
        <Route exact path="/signup-success" component={SignupSuccessScreen} />
        <Route exact path="/forgot-password" component={ForgotPasswordScreen} />
        <Route exact path="/reset-password" component={ResetPasswordScreen} />
        <Route exact path="/profile" component={ProfileScreen} />
      </Switch>
    </Router>
  );
}

export default App
