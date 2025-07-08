import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ImageBackground,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Line, Svg } from 'react-native-svg';

const poolTableImage = require('../assets/images/pooltable_bk.jpg');

const TABLE_WIDTH = 300;
const TABLE_HEIGHT = 600;
const BALL_RADIUS = 12;
const BALL_DIAMETER = BALL_RADIUS * 2;

const RAIL_WIDTH_X = 35;
const RAIL_WIDTH_Y = 75;

const MIN_X = RAIL_WIDTH_X;
const MAX_X = TABLE_WIDTH - RAIL_WIDTH_X;
const MIN_Y = RAIL_WIDTH_Y;
const MAX_Y = TABLE_HEIGHT - RAIL_WIDTH_Y;

const BALL_COLORS: { [key: number]: string } = {
  0: '#FFFFFF',
  1: '#FDB927',
  2: '#0046AD',
  3: '#C8102E',
  4: '#552583',
  5: '#FF6F00',
  6: '#006847',
  7: '#8B4513',
  8: '#000000',
  9: '#FDB927',
  10: '#0046AD',
  11: '#C8102E',
  12: '#552583',
  13: '#FF6F00',
  14: '#006847',
  15: '#8B4513',
};
const PICKER_BALL_DIAMETER = 45;
const PICKER_BALL_MARGIN = 5;

interface Ball {
  id: number;
  number: number;
  x: number;
  y: number;
  color: string;
  isStriped: boolean;
}

interface PathPoint {
  x: number;
  y: number;
}

const DraggableBall = React.memo(({ ball, onDragEnd, onDoubleTap, mode, otherBalls, selectedBallId, onSelect }: { ball: Ball; onDragEnd: (id: number, x: number, y: number) => void; onDoubleTap: (id: number) => void; mode: string; otherBalls: Ball[]; selectedBallId: number | null; onSelect: (id: number) => void }) => {
  const [x, setX] = useState(ball.x);
  const [y, setY] = useState(ball.y);
  const positionRef = useRef({ x: ball.x, y: ball.y }); // Track live position
  const ballRef = useRef<Ball>(ball); // Track live prop
  const startRef = useRef({ x: ball.x, y: ball.y }); // Track drag start position
  const touchRef = useRef<{ x: number; y: number } | null>(null); // Track touch anchor
  const lastTap = useRef<number>(0);
  const tapTimeout = useRef<NodeJS.Timeout | null>(null);

  // Sync state and positionRef with prop changes
  useEffect(() => {
    if (__DEV__) console.log(`Syncing state for ball ${ball.id} to prop: ${ball.x}, ${ball.y}`);
    setX(ball.x);
    setY(ball.y);
    positionRef.current = { x: ball.x, y: ball.y };
    ballRef.current = ball; // Update ballRef with latest prop
  }, [ball.x, ball.y]);

  // Sync positionRef with state changes during drag
  useEffect(() => {
    positionRef.current = { x, y };
  }, [x, y]);

  const getContrastingBorderColor = (ballColor: string) => {
    // Simple contrast check: use black for light colors, white for dark
    const isLight = ['#FFFFFF', '#FDB927'].includes(ballColor.toUpperCase());
    return isLight ? '#000000' : '#FFFFFF';
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Claim the touch immediately in move mode
        onStartShouldSetPanResponder: () => mode === 'move',
        // Confirm drag with a small movement threshold
        onMoveShouldSetPanResponder: (evt, gestureState) =>
          mode === 'move' && (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2),
        onPanResponderGrant: (evt) => {
          if (!ball.id) {
            if (__DEV__) console.log('Ball ID is undefined, skipping drag');
            return;
          }
          startRef.current = positionRef.current; // Set drag start position
          touchRef.current = { x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY }; // Set initial touch
          onSelect(ball.id); // Always select this ball on drag start
          if (__DEV__) {
            const { x: currX, y: currY } = positionRef.current;
            console.log('Drag began for ball:', ball.id, 'at live state:', currX, currY);
          }
        },
        onPanResponderMove: (evt) => {
          if (!ball.id || !touchRef.current) return;
          const dx = evt.nativeEvent.pageX - touchRef.current.x;
          const dy = evt.nativeEvent.pageY - touchRef.current.y;
          if (__DEV__) console.log('Delta:', { dx, dy });
          // Compute unconstrained target
          let unclampedX = startRef.current.x + dx;
          let unclampedY = startRef.current.y + dy;
          // Clamp against rails
          let newX = Math.max(MIN_X + BALL_RADIUS, Math.min(unclampedX, MAX_X - BALL_RADIUS));
          let newY = Math.max(MIN_Y + BALL_RADIUS, Math.min(unclampedY, MAX_Y - BALL_RADIUS));
          if (__DEV__) console.log('Unclamped position:', { unclampedX, unclampedY });

          // Check for collision with other balls
          let collisionDetected = false;
          for (const otherBall of otherBalls) {
            if (otherBall.id !== ball.id) {
              const dxToOther = newX - otherBall.x;
              const dyToOther = newY - otherBall.y;
              const distance = Math.sqrt(dxToOther * dxToOther + dyToOther * dyToOther);
              const minDistance = BALL_DIAMETER; // Minimum distance to prevent overlap

              if (distance < minDistance) {
                collisionDetected = true;
                // Calculate overlap and resolve by moving away along the collision normal
                const overlap = minDistance - distance;
                const normalX = dxToOther / distance;
                const normalY = dyToOther / distance;
                newX += normalX * overlap * 0.5; // Move half the overlap to share adjustment
                newY += normalY * overlap * 0.5;
                // Clamp again after collision resolution to stay within rails
                newX = Math.max(MIN_X + BALL_RADIUS, Math.min(newX, MAX_X - BALL_RADIUS));
                newY = Math.max(MIN_Y + BALL_RADIUS, Math.min(newY, MAX_Y - BALL_RADIUS));
                if (__DEV__) console.log('Collision detected, adjusted to:', { newX, newY });
                break; // Handle one collision at a time for simplicity
              }
            }
          }

          // When hitting a rail or after collision adjustment, reset startRef and touchRef
          if (newX !== unclampedX || collisionDetected) {
            startRef.current.x = newX;
            touchRef.current.x = evt.nativeEvent.pageX;
          }
          if (newY !== unclampedY || collisionDetected) {
            startRef.current.y = newY;
            touchRef.current.y = evt.nativeEvent.pageY;
          }
          if (__DEV__) console.log('Calculated new position:', { newX, newY });
          setX(newX);
          setY(newY); // Force continuous update
        },
        onPanResponderRelease: () => {
          if (!ball.id) return;
          const { x: finalX, y: finalY } = positionRef.current; // Use synced positionRef
          if (__DEV__) {
            console.log('State before release:', { x: finalX, y: finalY });
            console.log('Drag ended at:', finalX, finalY);
          }
          onDragEnd(ball.id, finalX, finalY); // Use synced position
          // Do not clear selection here; it’s managed by parent
          touchRef.current = null; // Reset touch anchor
        },
        onPanResponderTerminate: () => {
          touchRef.current = null; // Reset on gesture cancellation
          // Do not clear selection here; it’s managed by parent
        },
      }),
    [mode, otherBalls]
  );

  const handlePress = useCallback(() => {
    const now = Date.now();
    const doubleTapDelay = 300;
    if (__DEV__) console.log('Tap detected for ball:', ball.id, 'at time:', now); // Debug tap
    if (tapTimeout.current) {
      clearTimeout(tapTimeout.current);
      tapTimeout.current = null;
      if (now - lastTap.current < doubleTapDelay) {
        if (__DEV__) console.log('Double-tap detected for ball:', ball.id); // Debug double-tap
        if (!ball.id) return;
        onDoubleTap(ball.id); // Trigger double-tap to remove
      }
    } else {
      lastTap.current = now;
      tapTimeout.current = setTimeout(() => {
        tapTimeout.current = null;
        if (__DEV__) console.log('Single tap timeout for ball:', ball.id); // Debug timeout
      }, doubleTapDelay);
    }
    onSelect(ball.id); // Select on tap or single press
  }, [ball.id, onDoubleTap, onSelect]);

  return (
    <View
      {...panResponder.panHandlers} // Outer View handles drag gestures
      style={[
        styles.ballOnTable,
        { left: x - BALL_RADIUS, top: y - BALL_RADIUS },
      ]}
    >
      <Pressable
        onPress={handlePress} // Inner Pressable handles taps
        style={styles.ballVisualContainer} // Ensure proper layout
      >
        <View
          key={ball.id} // Force new instance per prop change
        >
          <View
            style={[
              styles.ballVisual,
              {
                backgroundColor: ball.color,
                borderWidth: selectedBallId === ball.id ? 3 : (ball.isStriped ? 2 : ball.number === 0 ? 1 : 0), // Dynamic border width
                borderColor: selectedBallId === ball.id ? getContrastingBorderColor(ball.color) : '#000000', // Contrast-based border
                borderRadius: BALL_RADIUS,
              },
            ]}
          >
            {ball.number > 0 && <Text style={styles.ballText(ball.number)}>{ball.number}</Text>}
          </View>
        </View>
      </Pressable>
    </View>
  );
});

export default function ShotLogger() {
  const [balls, setBalls] = useState<Ball[]>([]);
  const [paths, setPaths] = useState<{ [key: number]: PathPoint[] }>({});
  const [mode, setMode] = useState('move');
  const [selectedBallId, setSelectedBallId] = useState<number | null>(null); // Track selected ball
  const tableOffset = useRef({ x: 0, y: 0 }).current;

  const isBallPlaced = (number: number) => balls.some((b) => b.number === number);

  const addBall = (number: number) => {
    if (isBallPlaced(number)) return;
    const newBall = {
      id: Date.now(),
      number,
      x: mode === 'draw' ? MIN_X + BALL_RADIUS : TABLE_WIDTH / 2,
      y: mode === 'draw' ? MAX_Y - BALL_RADIUS : TABLE_HEIGHT / 4,
      color: BALL_COLORS[number],
      isStriped: number >= 9,
    };
    setBalls((prev) => [...prev, newBall]);
  };

  const removeBall = (id: number) => {
    const ballToRemove = balls.find((b) => b.id === id);
    if (ballToRemove) {
      setBalls((prev) => prev.filter((b) => b.id !== id)); // Remove from balls
      setPaths((prev) => {
        const newPaths = { ...prev };
        delete newPaths[id];
        return newPaths;
      });
      if (selectedBallId === id) setSelectedBallId(null); // Clear selection if removed ball was selected
      if (__DEV__) console.log('Ball removed:', ballToRemove.number, 'id:', id); // Debug removal
    }
  };

  const updateBallPosition = (id: number, newX: number, newY: number) => {
    setBalls((prev) => {
      const updatedBalls = prev.map((b) =>
        b.id === id ? { ...b, x: newX, y: newY } : b
      );
      if (__DEV__) console.log('Updated balls array post-set:', updatedBalls.map((b) => ({ id: b.id, x: b.x, y: b.y })));
      return updatedBalls;
    });
  };

  const startDrawing = (id: number, x: number, y: number) => {
    if (mode === 'draw') {
      const adjustedX = x - tableOffset.x;
      const adjustedY = y - tableOffset.y;
      setPaths((prev) => ({
        ...prev,
        [id]: [{ x: adjustedX, y: adjustedY }],
      }));
    }
  };

  const continueDrawing = (id: number, x: number, y: number) => {
    if (mode === 'draw') {
      const adjustedX = x - tableOffset.x;
      const adjustedY = y - tableOffset.y;
      setPaths((prev) => {
        const currentPath = prev[id] || [];
        return {
          ...prev,
          [id]: [...currentPath, { x: adjustedX, y: adjustedY }],
        };
      });
    }
  };

  const handleTouchStart = (event: { nativeEvent: { pageX: number; pageY: number } }, id: number) => {
    if (mode === 'draw') {
      handleTouchMove(event, id); // Start with the first point
    }
  };

  const handleTouchMove = (event: { nativeEvent: { pageX: number; pageY: number } }, id: number) => {
    if (mode === 'draw') {
      const { pageX, pageY } = event.nativeEvent;
      if (!tableOffset.x || !tableOffset.y) {
        const layout = event.nativeEvent.target.getBoundingClientRect();
        tableOffset.x = layout.left;
        tableOffset.y = layout.top + 100; // Adjust for marginTop
      }
      continueDrawing(id, pageX, pageY);
    }
  };

  const onSelect = (id: number) => {
    setSelectedBallId(id); // Always set selectedBallId, no toggle
  };

  return (
    <View style={styles.screen} onLayout={(event) => {
      const { x, y } = event.nativeEvent.layout;
      if (!tableOffset.x || !tableOffset.y) {
        tableOffset.x = x;
        tableOffset.y = y + 100; // Adjust for marginTop
      }
    }}>
      <View style={styles.header}>
        {/* Placeholder for header */}
      </View>
      <View style={styles.tableWrapper}>
        <ImageBackground source={poolTableImage} style={styles.table} resizeMode="contain">
          {balls.map((ball) => (
            <View
              key={ball.id}
              onTouchStart={(e) => handleTouchStart(e, ball.id)}
              onTouchMove={(e) => handleTouchMove(e, ball.id)}
            >
              <DraggableBall
                ball={ball}
                onDragEnd={updateBallPosition}
                onDoubleTap={removeBall}
                mode={mode}
                otherBalls={balls.filter((b) => b.id !== ball.id)} // Pass other balls for collision detection
                selectedBallId={selectedBallId}
                onSelect={onSelect}
              />
              {paths[ball.id] && (
                <Svg style={styles.table}>
                  {paths[ball.id].map((point, index) => (
                    index > 0 && (
                      <Line
                        key={`line-${index}`}
                        x1={paths[ball.id][index - 1].x}
                        y1={paths[ball.id][index - 1].y}
                        x2={point.x}
                        y2={point.y}
                        stroke={ball.color}
                        strokeWidth="2"
                        strokeDasharray="5, 5"
                      />
                    )
                  ))}
                </Svg>
              )}
            </View>
          ))}
        </ImageBackground>
      </View>
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            { backgroundColor: mode === 'draw' ? '#007AFF' : '#34C759' },
          ]}
          onPress={() => setMode((prev) => (prev === 'move' ? 'draw' : 'move'))}
        >
          <Text style={styles.saveText}>
            {mode === 'move' ? 'Switch to Draw' : 'Switch to Move'}
          </Text>
        </TouchableOpacity>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.pickerContent}>
            {Array.from({ length: 16 }, (_, i) => i).map((num) => {
              const isDisabled = isBallPlaced(num);
              return (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.pickerBallButton,
                    {
                      backgroundColor: BALL_COLORS[num],
                      borderWidth: num >= 9 ? 3 : num === 0 ? 1 : 0,
                      borderColor: '#FFFFFF',
                      opacity: isDisabled ? 0.4 : 1,
                    },
                  ]}
                  disabled={isDisabled}
                  onPress={() => addBall(num)}
                >
                  {num > 0 && <Text style={styles.ballText(num)}>{num}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'black' },
  header: { position: 'absolute', top: 50, left: 20, zIndex: 10, height: 32 },
  tableWrapper: {
    width: TABLE_WIDTH,
    height: TABLE_HEIGHT,
    alignSelf: 'center',
    marginTop: 100,
  },
  table: { width: '100%', height: '100%', position: 'relative' },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    backgroundColor: '#1C1C1E',
  },
  pickerContent: {
    flexDirection: 'row',
    paddingHorizontal: PICKER_BALL_MARGIN,
    alignItems: 'center',
    height: 60,
  },
  pickerBallButton: {
    width: PICKER_BALL_DIAMETER,
    height: PICKER_BALL_DIAMETER,
    borderRadius: PICKER_BALL_DIAMETER / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: PICKER_BALL_MARGIN,
  },
  ballText: (number: number) => ({
    color: number > 8 || number === 7 ? '#FFFFFF' : '#000000',
    fontWeight: 'bold',
    fontSize: 16,
  }),
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
  ballVisualContainer: {
    // Ensure the Pressable matches the ball size
    width: BALL_DIAMETER,
    height: BALL_DIAMETER,
  },
  modeButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  saveText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
});