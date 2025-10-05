import { AppScreen } from "./screens/AppScreen/AppScreen";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/:roomId" component={AppScreen} />
      </Switch>
    </Router>
  );
}

export default App
