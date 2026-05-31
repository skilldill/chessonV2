import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';

import 'react-chessboard-ui/dist/index.css';
import './styles/index.css';
import './theme/variables.css';

// Custom screens
import CreateRoomScreen from './screens/CreateRoomScreen/CreateRoomScreen';
import QuickPlayWaitingScreen from './screens/QuickPlayWaitingScreen/QuickPlayWaitingScreen';
import AppScreen from './screens/AppScreen/AppScreen';
import VerifyEmailScreen from './screens/VerifyEmailScreen/VerifyEmailScreen';
import LoginScreen from './screens/LoginScreen/LoginScreen';
import SignupScreen from './screens/SignupScreen/SignupScreen';
import SignupSuccessScreen from './screens/SignupSuccessScreen/SignupSuccessScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen/ResetPasswordScreen';
import ProfileScreen from './screens/ProfileScreen/ProfileScreen';
import { CreateTournamentScreen, TournamentRoomScreen } from './screens/TournamentScreen/TournamentScreen';
import { HomeRedirect } from './components/HomeRedirect/HomeRedirect';
import { MainAuthGuard } from './components/HomeRedirect/MainAuthGuard';
import { useRestoreGame } from './hooks/useRestoreGame';
import { useUserAppearancePreload } from './hooks/useUserAppearancePreload';
import { GameAnalysisScreen } from './screens/GameAnalysisScreen/GameAnalysisScreen';
import PuzzleListScreen from './screens/PuzzleListScreen/PuzzleListScreen';
import PuzzleScreen from './screens/PuzzleScreen/PuzzleScreen';

const App: React.FC = () => {
  useRestoreGame();
  useUserAppearancePreload();

  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/game/:roomId">
          <AppScreen />
        </Route>
        <Route exact path="/analyze/:gameId">
          <GameAnalysisScreen />
        </Route>
        <Route exact path="/puzzles">
          <PuzzleListScreen />
        </Route>
        <Route exact path="/puzzles/:puzzleId">
          <PuzzleScreen />
        </Route>
        <Route
          exact
          path="/analize/:gameId"
          render={({ match }: any) => <Redirect to={`/analyze/${match.params.gameId}`} />}
        />
        <Route exact path="/">
          <HomeRedirect />
        </Route>
        <Route exact path="/main">
          <MainAuthGuard />
        </Route>
        <Route exact path="/quick-play">
          <QuickPlayWaitingScreen />
        </Route>
        <Route exact path="/create-room">
          <CreateRoomScreen />
        </Route>
        <Route exact path="/tournaments/new">
          <CreateTournamentScreen />
        </Route>
        <Route exact path="/tournaments/:tournamentId">
          <TournamentRoomScreen />
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
      </Switch>
    </BrowserRouter>
  );
};

export default App;
