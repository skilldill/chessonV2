
import { AppScreen } from "./screens/AppScreen/AppScreen";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import 'react-chessboard-ui/dist/index.css';
import { GameScreenTest } from "./__tests__/GameScreen.test";

function App() {
  return (
    <Router>
      <Switch>
        {import.meta.env.VITE_TEST_MODE && <Route path="/test/gameScreen" component={GameScreenTest} />}
        <Route path="/:roomId" component={AppScreen} />
      </Switch>
    </Router>
  );
}

export default App
