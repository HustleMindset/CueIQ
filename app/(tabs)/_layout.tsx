import { createDrawerNavigator } from '@react-navigation/drawer';
import CustomDrawerContent from '../../components/CustomDrawerContent';
import ShotLogger from '../../components/ShotLogger';

const Drawer = createDrawerNavigator();

export default function Layout() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="ShotLogger" component={ShotLogger} />
    </Drawer.Navigator>
  );
}
