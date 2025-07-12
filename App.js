import { registerRootComponent } from 'expo';
import ShotLogger from './components/ShotLogger';

function App() {
  return <ShotLogger />;
}

registerRootComponent(App);

export default App;
