import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import {
    ImageBackground,
    PanResponder,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View,
    findNodeHandle,
} from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

import poolTableImage from '../assets/images/pooltable.jpg';

const TABLE_WIDTH = 300;
const TABLE_HEIGHT = 600;
const BALL_RADIUS = 12;
const TABLE_PADDING = 15; // visual "rails" zone

const BALL_COLORS = {
  1: '#FDB927', 2: '#0046AD', 3: '#C8102E', 4: '#552583',
  5: '#FF6F00', 6: '#006847', 7: '#8B4513', 8: '#000000',
  9: '#FDB927', 10: '#0046AD', 11: '#C8102E', 12: '#552583',
  13: '#FF6F00', 14: '#006847', 15: '#8B4513',
};

export default function ShotLogger() {
  const navigation = useNavigation();
  const [balls, setBalls] = useState([]);
  const [selectedBallId, setSelectedBallId] = useState(null);
  const [draggedBallNum, setDraggedBallNum] = useState(null);
  const [disabledNumbers, setDisabledNumbers] = useState([]);
  const tableRef = useRef();
  const lastTapRef = useRef({});

  const isBallPlaced = (num) => disabledNumbers.includes(num);

  const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

  const addBall = (number, x = TABLE_WIDTH / 2, y = TABLE_HEIGHT / 2) => {
    if (isBallPlaced(number)) return;
    const clampedX = clamp(x, TABLE_PADDING, TABLE_WIDTH - TABLE_PADDING);
    const clampedY = clamp(y, TABLE_PADDING, TABLE_HEIGHT - TABLE_PADDING);

    setBalls((prev) => [
      ...prev,
      {
        id: Date.now(),
        number,
        x: clampedX,
        y: clampedY,
        color: BALL_COLORS[number],
        isStriped: number >= 9,
      },
    ]);
    setDisabledNumbers((prev) => [...prev, number]);
  };

  const removeBall = (id) => {
    const ball = balls.find((b) => b.id === id);
    if (!ball) return;
    setBalls((prev) => prev.filter((b) => b.id !== id));
    setDisabledNumbers((prev) => prev.filter((n) => n !== ball.number));
    if (selectedBallId === id) setSelectedBallId(null);
  };

  const onBallTap = (id) => {
    const now = Date.now();
    const delta = now - (lastTapRef.current[id] || 0);
    if (delta < 300) {
      removeBall(id);
    } else {
      lastTapRef.current[id] = now;
      setSelectedBallId((prev) => (prev === id ? null : id));
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        if (selectedBallId !== null) {
          UIManager.measure(findNodeHandle(tableRef.current), (_, __, ___, ____, px, py) => {
            const x = clamp(gesture.moveX - px, TABLE_PADDING, TABLE_WIDTH - TABLE_PADDING);
            const y = clamp(gesture.moveY - py, TABLE_PADDING, TABLE_HEIGHT - TABLE_PADDING);
            setBalls((prev) =>
              prev.map((b) => (b.id === selectedBallId ? { ...b, x, y } : b))
            );
          });
        }
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  const onDropFromPicker = (e, number) => {
    UIManager.measure(findNodeHandle(tableRef.current), (_, __, ___, ____, px, py) => {
      const { pageX, pageY } = e.nativeEvent;
      const x = clamp(pageX - px, TABLE_PADDING, TABLE_WIDTH - TABLE_PADDING);
      const y = clamp(pageY - py, TABLE_PADDING, TABLE_HEIGHT - TABLE_PADDING);
      addBall(number, x, y);
    });
  };

  const renderBalls = () =>
    balls.map((ball) => (
      <React.Fragment key={ball.id}>
        <Pressable onPress={() => onBallTap(ball.id)} style={{ position: 'absolute' }}>
          <Circle
            cx={ball.x}
            cy={ball.y}
            r={BALL_RADIUS}
            fill={ball.color}
            stroke={selectedBallId === ball.id ? '#ffffff' : ball.isStriped ? '#fff' : 'black'}
            strokeWidth={selectedBallId === ball.id ? 3 : ball.isStriped ? 2 : 1}
          />
          <SvgText
            x={ball.x}
            y={ball.y + 5}
            fontSize="10"
            fontWeight="bold"
            fill={ball.number === 8 ? '#fff' : '#000'}
            textAnchor="middle"
          >
            {ball.number}
          </SvgText>
        </Pressable>
      </React.Fragment>
    ));

  const onSave = () => {
    console.log('Saved layout:', balls);
  };

  return (
    <View style={styles.screen}>
      {/* Menu */}
      <TouchableOpacity style={styles.menuIcon} onPress={() => navigation.openDrawer()}>
        <Ionicons name="menu" size={28} color="white" />
      </TouchableOpacity>

      {/* Table */}
      <View style={styles.tableWrapper} ref={tableRef} {...panResponder.panHandlers}>
        <ImageBackground source={poolTableImage} style={styles.table} resizeMode="contain">
          <Svg width={TABLE_WIDTH} height={TABLE_HEIGHT}>{renderBalls()}</Svg>
        </ImageBackground>
      </View>

      {/* Ball Picker */}
      <ScrollView horizontal contentContainerStyle={styles.ballPicker} showsHorizontalScrollIndicator={false}>
        {Array.from({ length: 15 }, (_, i) => {
          const num = i + 1;
          const disabled = isBallPlaced(num);
          return (
            <TouchableOpacity
              key={num}
              style={[
                styles.ballButton,
                {
                  backgroundColor: BALL_COLORS[num],
                  borderWidth: num >= 9 ? 2 : 0,
                  borderColor: num >= 9 ? '#fff' : 'transparent',
                  opacity: disabled ? 0.3 : 1,
                },
              ]}
              disabled={disabled}
              onPress={(e) => {
                if (!disabled) addBall(num);
              }}
              onLongPress={(e) => {
                if (!disabled) onDropFromPicker(e, num);
              }}
            >
              <Text style={styles.ballText}>{num}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.saveButton} onPress={onSave}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'black', alignItems: 'center', paddingTop: 40 },
  menuIcon: { position: 'absolute', top: 40, left: 20, zIndex: 10 },
  tableWrapper: {
    width: TABLE_WIDTH,
    height: TABLE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  table: { width: '100%', height: '100%' },
  ballPicker: { paddingHorizontal: 10, paddingBottom: 10 },
  ballButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  ballText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    marginTop: 10,
    width: 120,
    alignItems: 'center',
  },
  saveText: { color: 'white', fontWeight: 'bold' },
});
