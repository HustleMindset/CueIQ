import { AppRegistry, SafeAreaView } from 'react-native';
import ShotLogger from './components/ShotLogger';

const App = () => (
  <SafeAreaView style={{ flex: 1 }}>
    <ShotLogger />
  </SafeAreaView>
);

AppRegistry.registerComponent('main', () => App);
export default App;