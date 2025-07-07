import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ImageBackground,
  PanResponder,
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

const DraggableBall = React.memo(({ ball, onDragEnd, onDoubleTap, mode }: { ball: Ball; onDragEnd: (id: number, x: number, y: number) => void; onDoubleTap: (id: number) => void; mode: string }) => {
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

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => mode === 'move',
        onMoveShouldSetPanResponder: () => mode === 'move',
        onPanResponderGrant: (evt) => {
          if (!ball.id) {
            if (__DEV__) console.log('Ball ID is undefined, skipping drag');
            return;
          }
          startRef.current = positionRef.current; // Set drag start position
          touchRef.current = { x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY }; // Set initial touch
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
          const newX = Math.max(MIN_X + BALL_RADIUS, Math.min(unclampedX, MAX_X - BALL_RADIUS));
          const newY = Math.max(MIN_Y + BALL_RADIUS, Math.min(unclampedY, MAX_Y - BALL_RADIUS));
          // When hitting a rail, reset startRef and touchRef
          if (newX !== unclampedX) {
            startRef.current.x = newX;
            touchRef.current.x = evt.nativeEvent.pageX;
          }
          if (newY !== unclampedY) {
            startRef.current.y = newY;
            touchRef.current.y = evt.nativeEvent.pageY;
          }
          if (__DEV__) console.log('Calculated new position:', { newX, newY });
          setX(newX);
          setY(newY); // Force continuous update
        },
        onPanResponderRelease: () => {
          if (!ball.id) return;
          positionRef.current = { x, y }; // Update live position
          if (__DEV__) {
            const { x: endX, y: endY } = positionRef.current;
            console.log('State before release:', { x: endX, y: endY });
            console.log('Drag ended at:', endX, endY);
          }
          onDragEnd(ball.id, x, y); // Use current state
          touchRef.current = null; // Reset touch anchor
        },
        onPanResponderTerminate: () => {
          touchRef.current = null; // Reset on gesture cancellation
        },
      }),
    [mode]
  );

  const handlePress = useCallback(() => {
    const now = Date.now();
    const doubleTapDelay = 300;
    if (tapTimeout.current) {
      clearTimeout(tapTimeout.current);
      tapTimeout.current = null;
      if (now - lastTap.current < doubleTapDelay) {
        if (!ball.id) return;
        onDoubleTap(ball.id);
      }
    } else {
      lastTap.current = now;
      tapTimeout.current = setTimeout(() => {
        tapTimeout.current = null;
      }, doubleTapDelay);
    }
  }, [ball.id, onDoubleTap]);

  return (
    <View
      key={ball.id} // Force new instance per prop change
      {...panResponder.panHandlers}
      style={[
        styles.ballOnTable,
        { left: x - BALL_RADIUS, top: y - BALL_RADIUS },
      ]}
      onPress={handlePress}
    >
      <View
        style={[
          styles.ballVisual,
          {
            backgroundColor: ball.color,
            borderWidth: ball.isStriped ? 2 : ball.number === 0 ? 1 : 0,
          },
        ]}
      >
        {ball.number > 0 && <Text style={styles.ballText(ball.number)}>{ball.number}</Text>}
      </View>
    </View>
  );
});

export default function ShotLogger() {
  const [balls, setBalls] = useState<Ball[]>([]);
  const [paths, setPaths] = useState<{ [key: number]: PathPoint[] }>({});
  const [mode, setMode] = useState('move');
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
    setBalls((prev) => prev.filter((b) => b.id !== id));
    setPaths((prev) => {
      const newPaths = { ...prev };
      delete newPaths[id];
      return newPaths;
    });
  };

  const updateBallPosition = (id: number, newX: number, newY: number) => {
    setBalls((prev) => {
      const updatedBalls = prev.map((b) =>
        b.id === id ? { ...b, x: newX, y: newY } : b
      );
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
  modeButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  saveText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
});