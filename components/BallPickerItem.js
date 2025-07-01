import React, { useRef } from 'react';
import {
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const LONG_PRESS_MS = 300;   // how long before we start dragging
const MOVE_THRESHOLD = 5;    // how far finger must move to count as drag

export default function BallPickerItem({
  number,
  color,
  disabled,
  onDragStart,   // () => void
  onDragMove,    // (num, pageX, pageY) => void
  onDrop,        // (num, pageX, pageY) => void
  onDoubleTap,   // (num) => void
}) {
  const lastTap = useRef(0);
  const dragTimer = useRef(null);
  const isDragging = useRef(false);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (evt) => {
        // reset flags
        isDragging.current = false;
        // start long-press timer
        dragTimer.current = setTimeout(() => {
          isDragging.current = true;
          onDragStart(number);
        }, LONG_PRESS_MS);
      },

      onPanResponderMove: (evt, gs) => {
        // if already dragging & moved enough, inform parent of new ghost pos
        if (isDragging.current && Math.hypot(gs.dx, gs.dy) > MOVE_THRESHOLD) {
          onDragMove(number, evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        }
      },

      onPanResponderRelease: (evt, gs) => {
        clearTimeout(dragTimer.current);

        // if we were dragging, drop
        if (isDragging.current) {
          onDrop(number, evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        } else {
          // treat as tap → detect double-tap
          const now = Date.now();
          if (now - lastTap.current < LONG_PRESS_MS) {
            onDoubleTap(number);
          }
          lastTap.current = now;
        }
      },

      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: () => clearTimeout(dragTimer.current),
    })
  ).current;

  return (
    <View style={styles.wrapper} {...pan.panHandlers}>
      <View
        style={[
          styles.ball,
          { backgroundColor: color, opacity: disabled ? 0.3 : 1 },
        ]}
      >
        <Text style={styles.text}>{number}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 6,
  },
  ball: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
