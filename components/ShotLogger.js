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
import Animated, { cancelAnimation, runOnJS, useAnimatedProps, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';

import poolTableImage from '../assets/images/pooltable.jpg'; // Ensure path is correct

// --- Constants ---
const TABLE_WIDTH = 300;
const TABLE_HEIGHT = 600;
const BALL_RADIUS = 12;
const BALL_DIAMETER = BALL_RADIUS * 2;

// Final adjustment to the top/bottom rail boundaries.
const RAIL_WIDTH_X = 35; // Width of the left/right (long) rails.
const RAIL_WIDTH_Y = 75; // Width of the top/bottom (short) rails.

const MIN_X = RAIL_WIDTH_X + BALL_RADIUS;
const MAX_X = TABLE_WIDTH - RAIL_WIDTH_X - BALL_RADIUS;
const MIN_Y = RAIL_WIDTH_Y + BALL_RADIUS;
const MAX_Y = TABLE_HEIGHT - RAIL_WIDTH_Y - BALL_RADIUS;

const BALL_COLORS = {
  0: '#FFFFFF', // Cue Ball
  1: '#FDB927', 2: '#0046AD', 3: '#C8102E', 4: '#552583', 5: '#FF6F00',
  6: '#006847', 7: '#8B4513', 8: '#000000', 9: '#FDB927', 10: '#0046AD',
  11: '#C8102E', 12: '#552583', 13: '#FF6F00', 14: '#006847', 15: '#8B4513',
};
const PICKER_BALL_DIAMETER = 45;
const PICKER_BALL_MARGIN = 5;

const AnimatedLine = Animated.createAnimatedComponent(Line);

// --- Draggable Ball Component (Handles its own dragging and tapping) ---
const DraggableBall = ({ ball, onDragEnd, onSelect, onDoubleTap, selectedBallId }) => {
  const isDragging = useSharedValue(false);
  const x = useSharedValue(ball.x);
  const y = useSharedValue(ball.y);
  const startX = useSharedValue(ball.x);
  const startY = useSharedValue(ball.y);
  const pulse = useSharedValue(1);

  useEffect(() => {
    // This ensures the ball's animated position updates if its state changes from the parent
    x.value = withSpring(ball.x);
    y.value = withSpring(ball.y);
  }, [ball.x, ball.y]);

  useEffect(() => {
    if (selectedBallId === ball.id) {
      pulse.value = withRepeat(withSequence(withTiming(1.15, { duration: 500 }), withTiming(1, { duration: 500 })), -1, true);
    } else {
      cancelAnimation(pulse);
      pulse.value = withSpring(1);
    }
  }, [selectedBallId, ball.id, pulse]);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      isDragging.value = true;
      startX.value = x.value; // Store the starting position
      startY.value = y.value;
    })
    .onUpdate((event) => {
      const newX = startX.value + event.translationX;
      const newY = startY.value + event.translationY;
      x.value = Math.max(MIN_X, Math.min(newX, MAX_X));
      y.value = Math.max(MIN_Y, Math.min(newY, MAX_Y));
    })
    .onEnd(() => {
      // Update the state only at the end of the drag
      runOnJS(onDragEnd)(ball.id, x.value, y.value);
    })
    .onFinalize(() => {
      isDragging.value = false;
    });

  const tapGesture = Gesture.Tap().onStart(() => { runOnJS(onSelect)(ball.id); });
  const doubleTapGesture = Gesture.Tap().numberOfTaps(2).onStart(() => { runOnJS(onDoubleTap)(ball.id); });
  const composedTap = Gesture.Exclusive(doubleTapGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = isDragging.value ? 1.2 : pulse.value;
    return {
      position: 'absolute',
      left: x.value - BALL_RADIUS,
      top: y.value - BALL_RADIUS,
      transform: [{ scale }],
      zIndex: isDragging.value ? 100 : 1,
    };
  });

  return (
    <GestureDetector gesture={Gesture.Race(panGesture, composedTap)}>
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
  // **FIX**: Store paths in an object with the ball ID as the key
  const [paths, setPaths] = useState({});

  const isDrawingPath = useSharedValue(false);
  const pathStartX = useSharedValue(0);
  const pathStartY = useSharedValue(0);
  const pathEndX = useSharedValue(0);
  const pathEndY = useSharedValue(0);
  const pathColor = useSharedValue('#FFFFFF');
  const ghostBallNumber = useSharedValue(0);
  const isGhostBallStriped = useSharedValue(false);

  const isBallPlaced = (number) => balls.some((b) => b.number === number);

  const addBall = (number) => {
    if (isBallPlaced(number)) return;
    setBalls((prev) => [
      ...prev,
      { id: Date.now(), number, x: TABLE_WIDTH / 2, y: TABLE_HEIGHT / 4, color: BALL_COLORS[number], isStriped: number >= 9 },
    ]);
  };

  const removeBall = (id) => {
    setBalls((prev) => prev.filter((b) => b.id !== id));
    // Also remove any path associated with this ball
    setPaths(prev => {
        const newPaths = {...prev};
        delete newPaths[id];
        return newPaths;
    });
  };

  const updateBallPosition = (id, newX, newY) => {
    setBalls(prev => prev.map(b => b.id === id ? { ...b, x: newX, y: newY } : b));
  };
  
  const handleSelectBall = (id) => {
    setSelectedBallId(prev => prev === id ? null : id);
  };

  // **FIX**: Function to add/update a completed path for a specific ball
  const upsertPath = (path) => {
    setPaths(prev => ({
        ...prev,
        [path.ballId]: path // Overwrites the existing path for this ballId
    }));
  };

  const pathDrawingGesture = Gesture.Pan()
    .minPointers(2)
    .maxPointers(2)
    .onBegin((event) => {
      const selectedBall = balls.find(b => b.id === selectedBallId);
      if (selectedBall) {
        isDrawingPath.value = true;
        pathStartX.value = selectedBall.x;
        pathStartY.value = selectedBall.y;
        pathColor.value = selectedBall.color;
        ghostBallNumber.value = selectedBall.number;
        isGhostBallStriped.value = selectedBall.isStriped;
      }
    })
    .onUpdate((event) => {
      // **FIX**: Only update the path if both fingers are still on the screen
      if (isDrawingPath.value && event.numberOfPointers === 2) {
        pathEndX.value = event.x;
        pathEndY.value = event.y;
      }
    })
    .onEnd(() => {
      if (isDrawingPath.value) {
        // **FIX**: On release, save/update the path for the selected ball
        const newPath = {
            id: Date.now(),
            ballId: selectedBallId, // Associate path with the ball
            startX: pathStartX.value,
            startY: pathStartY.value,
            endX: pathEndX.value,
            endY: pathEndY.value,
            color: pathColor.value,
            number: ghostBallNumber.value,
            isStriped: isGhostBallStriped.value,
        };
        runOnJS(upsertPath)(newPath);
        isDrawingPath.value = false;
      }
    });

  const animatedLineProps = useAnimatedProps(() => ({
    x1: pathStartX.value,
    y1: pathStartY.value,
    x2: pathEndX.value,
    y2: pathEndY.value,
    stroke: pathColor.value,
    opacity: isDrawingPath.value ? 1 : 0,
  }));

  const ghostBallStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: pathEndX.value - BALL_RADIUS,
    top: pathEndY.value - BALL_RADIUS,
    opacity: isDrawingPath.value ? 0.5 : 0,
  }));
  
  const ghostBallVisualProps = useAnimatedProps(() => ({
    backgroundColor: pathColor.value,
    borderWidth: isGhostBallStriped.value ? 2 : (ghostBallNumber.value === 0 ? 1 : 0),
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Ionicons name="menu-outline" size={32} color="white" onPress={() => navigation.openDrawer()} />
        </View>

        <GestureDetector gesture={pathDrawingGesture}>
          <View style={styles.tableWrapper}>
            <ImageBackground source={poolTableImage} style={styles.table} resizeMode="contain">
              <Svg height="100%" width="100%" style={{ position: 'absolute' }}>
                {/* Render all the saved paths from the object */}
                {Object.values(paths).map(path => (
                    <G key={path.id}>
                        <Line
                            x1={path.startX}
                            y1={path.startY}
                            x2={path.endX}
                            y2={path.endY}
                            stroke={path.color}
                            strokeWidth="2"
                            strokeDasharray="5, 5"
                        />
                        <G x={path.endX} y={path.endY}>
                            <Circle
                                cx={0} cy={0} r={BALL_RADIUS}
                                fill={path.color} opacity={0.5}
                                stroke={path.isStriped ? '#FFFFFF' : '#000000'}
                                strokeWidth={path.isStriped ? 2 : 1}
                                strokeOpacity={0.5}
                            />
                            {path.number > 0 && 
                                <SvgText x={0} y={4} fontSize={10} fontWeight="bold" fill={path.number > 8 || path.number === 7 ? '#FFFFFF' : '#000000'} textAnchor="middle" opacity={0.7}>
                                    {path.number}
                                </SvgText>
                            }
                        </G>
                    </G>
                ))}
                {/* Render the actively drawing path */}
                <AnimatedLine animatedProps={animatedLineProps} strokeWidth="2" strokeDasharray="5, 5" />
              </Svg>
              <Animated.View style={[styles.ballOnTable, ghostBallStyle]}>
                <Animated.View style={[styles.ballVisual, ghostBallVisualProps]} />
              </Animated.View>
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
        </GestureDetector>

        <View style={styles.bottomContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.pickerContent}>
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
  pickerContent: { flexDirection: 'row', paddingHorizontal: PICKER_BALL_MARGIN, alignItems: 'center', height: 60 },
  pickerBallButton: { width: PICKER_BALL_DIAMETER, height: PICKER_BALL_DIAMETER, borderRadius: PICKER_BALL_DIAMETER / 2, justifyContent: 'center', alignItems: 'center', marginHorizontal: PICKER_BALL_MARGIN },
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
    borderColor: '#000000',
  },
  saveButtonWrapper: { backgroundColor: '#007AFF', paddingVertical: 15, alignItems: 'center', marginTop: 15, marginHorizontal: 20, borderRadius: 10 },
  saveText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
});
