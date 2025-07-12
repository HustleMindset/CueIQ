import React, { useEffect, useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 🟢 Update this path if needed
const poolTableImage = require('../assets/images/pooltable_bk.jpg');

const TABLE_WIDTH = 300;
const TABLE_HEIGHT = 600;
const BALL_RADIUS = 12;
const BALL_DIAMETER = BALL_RADIUS * 2;

const BALL_COLORS = {
  1: '#FDB927', 2: '#0046AD', 3: '#C8102E', 4: '#552583',
  5: '#FF6F00', 6: '#006847', 7: '#8B4513', 8: '#000000',
  9: '#FDB927', 10: '#0046AD', 11: '#C8102E', 12: '#552583',
  13: '#FF6F00', 14: '#006847', 15: '#8B4513',
};

export default function ShotLogger() {
  const [balls, setBalls] = useState([]);

  useEffect(() => {
    console.log('ShotLogger basic loaded');
  }, []);

  const addBall = (number) => {
    const newBall = {
      id: Date.now(),
      number,
      x: TABLE_WIDTH / 2,
      y: TABLE_HEIGHT / 2,
      color: BALL_COLORS[number],
    };
    setBalls((prev) => [...prev, newBall]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <View style={styles.tableWrapper}>
        <ImageBackground source={poolTableImage} style={styles.table} resizeMode="contain">
          {balls.map((ball) => (
            <View
              key={ball.id}
              style={{
                position: 'absolute',
                width: BALL_DIAMETER,
                height: BALL_DIAMETER,
                borderRadius: BALL_RADIUS,
                backgroundColor: ball.color,
                left: ball.x - BALL_RADIUS,
                top: ball.y - BALL_RADIUS,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>{ball.number}</Text>
            </View>
          ))}
        </ImageBackground>
      </View>

      <View style={styles.bottomContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.pickerContent}>
            {Array.from({ length: 15 }, (_, i) => i + 1).map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.pickerBallButton,
                  { backgroundColor: BALL_COLORS[num] },
                ]}
                onPress={() => addBall(num)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: 5,
    alignItems: 'center',
    height: 60,
  },
  pickerBallButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
});
