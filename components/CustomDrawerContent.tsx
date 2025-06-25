import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const [notes, setNotes] = useState('');

  return (
    <View style={styles.drawer}>
      <Text style={styles.title}>Notes</Text>
      <TextInput
        style={styles.input}
        value={notes}
        onChangeText={setNotes}
        placeholder="Write your notes here"
        placeholderTextColor="#aaa"
        multiline
      />
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          props.navigation.reset({
            index: 0,
            routes: [{ name: 'ShotLogger' }],
          });
        }}
      >
        <Text style={styles.buttonText}>Reset Table</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#111',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    color: '#fff',
    borderColor: '#444',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
  },
});
