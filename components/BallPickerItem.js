// components/BallPickerItem.js

import React, { useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

export default function BallPickerItem({ number, color, disabled, onDrop }) {
  const pan = useRef(new Animated.ValueXY()).current;
  const isDragging = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      // Start pan only on long press
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => isDragging.current,
      onPanResponderGrant: () => {
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        isDragging.current = false;
        onDrop(number, gesture.moveX, gesture.moveY);
        pan.setValue({ x: 0, y: 0 });
      },
    })
  ).current;

  return (
    <View style={styles.wrapper}>
      <TouchableWithoutFeedback
        delayLongPress={300}
        disabled={disabled}
        onLongPress={() => {
          // begin drag
          isDragging.current = true;
          pan.setValue({ x: 0, y: 0 });
        }}
      >
        <Animated.View
          style={[
            styles.ball,
            { backgroundColor: color, opacity: disabled ? 0.3 : 1 },
            pan.getLayout(),
          ]}
          {...panResponder.panHandlers}
        >
          <Text style={styles.text}>{number}</Text>
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginHorizontal: 6 },
  ball: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: { color: '#fff', fontWeight: 'bold' },
});
