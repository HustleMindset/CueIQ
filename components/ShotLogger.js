import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function ShotLogger() {
  const [mode, setMode] = useState('move');

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.screen}>
        <Text>ShotLogger (Minimal Mode)</Text>
        <TouchableOpacity
          style={styles.modeButton}
          onPress={() => setMode((prev) => (prev === 'move' ? 'draw' : 'move'))}
        >
          <Text style={styles.saveText}>
            {mode === 'move' ? 'Switch to Draw' : 'Switch to Move'}
          </Text>
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  modeButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#34C759',
  },
  saveText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
});