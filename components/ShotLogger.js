import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// Import the new gesture handler and animation libraries
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, runOnJS, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import poolTableImage from '../assets/images/pooltable.jpg'; // Ensure path is correct

// --- Constants ---
const TABLE_WIDTH = 300;
const TABLE_HEIGHT = 600;
const BALL_RADIUS = 12;
const BALL_DIAMETER = BALL_RADIUS * 2;

// Final adjustment to the top/bottom rail boundaries.
const RAIL_WIDTH_X = 35; // Width of the left/right (long) rails.
const RAIL_WIDTH_Y = 75; // Width of the top/bottom (short) rails.

const MIN_X = RAIL_WIDTH_X;
const MAX_X = TABLE_WIDTH - RAIL_WIDTH_X;
const MIN_Y = RAIL_WIDTH_Y;
const MAX_Y = TABLE_HEIGHT - RAIL_WIDTH_Y;

const BALL_COLORS = {
  0: '#FFFFFF', // Cue Ball
  1: '#FDB927', 2: '#0046AD', 3: '#C8102E', 4: '#552583', 5: '#FF6F00',
  6: '#006847', 7: '#8B4513', 8: '#000000', 9: '#FDB927', 10: '#0046AD',
  11: '#C8102E', 12: '#552583', 13: '#FF6F00', 14: '#006847', 15: '#8B4513',
};
const PICKER_BALL_DIAMETER = 45;
const PICKER_BALL_MARGIN = 5;


// --- Draggable Ball Component (for balls on the table) ---
const DraggableBall = ({ ball, onDragEnd, onDoubleTap, onSelect, selectedBallId }) => {
  const isDragging = useSharedValue(false);
  const x = useSharedValue(ball.x);
  const y = useSharedValue(ball.y);
  const startX = useSharedValue(ball.x);
  const startY = useSharedValue(ball.y);
  const pulse = useSharedValue(1); // For the selection animation

  // This effect handles the pulsing animation when a ball is selected
  useEffect(() => {
    if (selectedBallId === ball.id) {
      // Start the pulsing animation
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1, // infinite repeat
        true // reverse direction
      );
    } else {
      // Stop the animation and return to normal size
      cancelAnimation(pulse);
      pulse.value = withSpring(1);
    }
  }, [selectedBallId, ball.id, pulse]);

  // Pan gesture for moving balls on the table
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      isDragging.value = true;
      startX.value = x.value;
      startY.value = y.value;
    })
    .onUpdate((event) => {
      // Calculate the potential new position for the ball's CENTER
      const newX = startX.value + event.translationX;
      const newY = startY.value + event.translationY;

      // Clamp the CENTER of the ball so its EDGE stays within the playable area
      x.value = Math.max(MIN_X + BALL_RADIUS, Math.min(newX, MAX_X - BALL_RADIUS));
      y.value = Math.max(MIN_Y + BALL_RADIUS, Math.min(newY, MAX_Y - BALL_RADIUS));
    })
    .onEnd(() => {
      // Use runOnJS to update React state from the UI thread
      runOnJS(onDragEnd)(ball.id, x.value, y.value);
    })
    .onFinalize(() => {
      isDragging.value = false;
    });

  // Tap gesture for double-tapping to remove
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      runOnJS(onDoubleTap)(ball.id);
    });
    
  // Tap gesture for single-tapping to select
  const singleTapGesture = Gesture.Tap()
    .onStart(() => {
      runOnJS(onSelect)(ball.id);
    });

  // Combine gestures: The double tap must fail before the single tap can activate.
  const tapGestures = Gesture.Exclusive(doubleTapGesture, singleTapGesture);
  // The pan gesture should take precedence over taps if the finger moves.
  const composedGesture = Gesture.Race(panGesture, tapGestures);

  // Animated style for smooth movement and selection feedback
  const animatedStyle = useAnimatedStyle(() => {
    // When dragging, use a fixed larger scale. Otherwise, use the pulse animation value.
    const scale = isDragging.value ? 1.2 : pulse.value;
    return {
      position: 'absolute',
      left: x.value - BALL_RADIUS,
      top: y.value - BALL_RADIUS,
      transform: [{ scale: scale }], // Use the calculated scale directly
      zIndex: isDragging.value ? 100 : 10,
    };
  });

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.ballOnTable, animatedStyle]}>
         <View style={[styles.ballVisual, { backgroundColor: ball.color, borderWidth: ball.isStriped ? 2 : (ball.number === 0 ? 1 : 0) }]}>
            {ball.number > 0 && <Text style={styles.ballText(ball.number)}>{ball.number}</Text>}
        </View>
      </Animated.View>
    </GestureDetector>
  );
};


// --- The Main Component ---
export default function ShotLogger() {
  const navigation = useNavigation();
  const [balls, setBalls] = useState([]);
  const [selectedBallId, setSelectedBallId] = useState(null);

  // --- Ball Management ---
  const isBallPlaced = (number) => balls.some((b) => b.number === number);

  const addBall = (number) => {
    if (isBallPlaced(number)) return;
    setBalls((prev) => [
      ...prev,
      { id: Date.now(), number, x: TABLE_WIDTH / 2, y: TABLE_HEIGHT / 4, color: BALL_COLORS[number], isStriped: number >= 9 },
    ]);
  };

  const removeBall = (id) => {
    const ballToRemove = balls.find(b => b.id === id);
    if (ballToRemove) {
        setBalls((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const updateBallPosition = (id, newX, newY) => {
    // Also clamp here for consistency, though the live drag is handled in DraggableBall
    const clampedX = Math.max(MIN_X + BALL_RADIUS, Math.min(newX, MAX_X - BALL_RADIUS));
    const clampedY = Math.max(MIN_Y + BALL_RADIUS, Math.min(newY, MAX_Y - BALL_RADIUS));
    setBalls(prev => prev.map(b => b.id === id ? { ...b, x: clampedX, y: clampedY } : b));
  };
  
  const handleSelectBall = (id) => {
      setSelectedBallId(prev => prev === id ? null : id);
  }
  
  return (
    // GestureHandlerRootView is required at the root of your app
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Ionicons name="menu-outline" size={32} color="white" onPress={() => navigation.openDrawer()} />
        </View>

        <View style={styles.tableWrapper}>
            <ImageBackground source={poolTableImage} style={styles.table} resizeMode="contain">
                {balls.map((ball) => (
                    <DraggableBall 
                      key={ball.id} 
                      ball={ball} 
                      onDragEnd={updateBallPosition}
                      onDoubleTap={removeBall}
                      onSelect={handleSelectBall}
                      selectedBallId={selectedBallId}
                    />
                ))}
            </ImageBackground>
        </View>

        {/* The Ball Picker */}
        <View style={styles.bottomContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.pickerContent}>
                    {/* Create an array from 0 to 15 for the picker */}
                    {Array.from({ length: 16 }, (_, i) => i).map((num) => {
                        const isDisabled = isBallPlaced(num);
                        return (
                            <TouchableOpacity
                                key={num}
                                style={[styles.pickerBallButton, {
                                    backgroundColor: BALL_COLORS[num],
                                    borderWidth: num >= 9 ? 3 : (num === 0 ? 1 : 0),
                                    borderColor: '#FFFFFF',
                                    opacity: isDisabled ? 0.4 : 1,
                                }]}
                                disabled={isDisabled}
                                onPress={() => addBall(num)}
                            >
                                {/* Only show number for balls 1-15 */}
                                {num > 0 && <Text style={styles.ballText(num)}>{num}</Text>}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
            <TouchableOpacity style={styles.saveButtonWrapper} onPress={() => console.log(JSON.stringify(balls))}>
              <Text style={styles.saveText}>Save Layout</Text>
            </TouchableOpacity>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'black' },
  header: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  tableWrapper: { width: TABLE_WIDTH, height: TABLE_HEIGHT, alignSelf: 'center', marginTop: 100 },
  table: { width: '100%', height: '100%', position: 'relative' },
  bottomContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 40, backgroundColor: '#1C1C1E' },
  pickerContent: {flexDirection: 'row', paddingHorizontal: PICKER_BALL_MARGIN, alignItems: 'center', height: 60},
  pickerBallButton: { width: PICKER_BALL_DIAMETER, height: PICKER_BALL_DIAMETER, borderRadius: PICKER_BALL_DIAMETER/2, justifyContent: 'center', alignItems: 'center', marginHorizontal: PICKER_BALL_MARGIN },
  ballText: (number) => ({ color: number > 8 || number === 7 ? '#FFFFFF' : '#000000', fontWeight: 'bold', fontSize: 16 }),
  ballOnTable: {
    width: BALL_DIAMETER,
    height: BALL_DIAMETER,
    position: 'absolute',
  },
  ballVisual: {
    width: '100%',
    height: '100%',
    borderRadius: BALL_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#000000', // Border for cue ball on table
  },
  saveButtonWrapper: { backgroundColor: '#007AFF', paddingVertical: 15, alignItems: 'center', marginTop: 15, marginHorizontal: 20, borderRadius: 10 },
  saveText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
});
