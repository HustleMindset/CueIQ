import React from 'react';
import { SafeAreaView } from 'react-native';
import ShotLogger from '../components/ShotLogger'; // adjust path if needed

export default function Index() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ShotLogger />
    </SafeAreaView>
  );
}
