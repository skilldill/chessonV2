import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';


import 'react-chessboard-ui/dist/index.css';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
// import '@ionic/react/css/padding.css';
// import '@ionic/react/css/float-elements.css';
// import '@ionic/react/css/text-alignment.css';
// import '@ionic/react/css/text-transformation.css';
// import '@ionic/react/css/flex-utils.css';
// import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
// import '@ionic/react/css/palettes/dark.system.css';


/* Tailwind */
import './styles/index.css';

/* Theme variables */
import './theme/variables.css';

// Custom screens
import CreateRoomScreen from './screens/CreateRoomScreen/CreateRoomScreen';
import AppScreen from './screens/AppScreen/AppScreen';
import GameScreen from './screens/GameScreen/GameScreen';
import VerifyEmailScreen from './screens/VerifyEmailScreen/VerifyEmailScreen';
import LoginScreen from './screens/LoginScreen/LoginScreen';
import SignupScreen from './screens/SignupScreen/SignupScreen';
import SignupSuccessScreen from './screens/SignupSuccessScreen/SignupSuccessScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen/ResetPasswordScreen';
import ProfileScreen from './screens/ProfileScreen/ProfileScreen';
import { HomeRedirect } from './components/HomeRedirect/HomeRedirect';
import { useRestoreGame } from './hooks/useRestoreGame';

setupIonicReact();

const App: React.FC = () => {
  useRestoreGame();

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/game/:roomId">
            <AppScreen />
          </Route>
          <Route exact path="/">
            <HomeRedirect />
          </Route>
          <Route exact path="/verify-email">
            <VerifyEmailScreen />
          </Route>
          <Route exact path="/login">
            <LoginScreen />
          </Route>
          <Route exact path="/signup">
            <SignupScreen />
          </Route>
          <Route exact path="/signup-success">
            <SignupSuccessScreen />
          </Route>
          <Route exact path="/forgot-password">
            <ForgotPasswordScreen />
          </Route>
          <Route exact path="/reset-password">
            <ResetPasswordScreen />
          </Route>
          <Route exact path="/profile">
            <ProfileScreen />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
