import React from 'react';
import { SafeAreaView } from 'react-native';
import ShotLogger from './components/ShotLogger';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ShotLogger />
    </SafeAreaView>
  );
}
