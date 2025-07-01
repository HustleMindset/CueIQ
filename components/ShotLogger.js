// components/ShotLogger.js

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import {
  findNodeHandle,
  ImageBackground,
  PanResponder,
  ScrollView,
  StyleSheet,
  UIManager,
  View,
} from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

import poolTableImage from '../assets/images/pooltable.jpg';
import BallPickerItem from './BallPickerItem';

const TABLE_W = 300;
const TABLE_H = 600;
const R = 18;          // ball radius
const PAD = R + 5;     // padding so balls stay fully inside

const COLORS = {
  1:'#FDB927',2:'#0046AD',3:'#C8102E',4:'#552583',
  5:'#FF6F00',6:'#006847',7:'#8B4513',8:'#000',
  9:'#FDB927',10:'#0046AD',11:'#C8102E',12:'#552583',
  13:'#FF6F00',14:'#006847',15:'#8B4513',
};

export default function ShotLogger() {
  const nav = useNavigation();
  const [balls, setBalls]       = useState([]);
  const [used, setUsed]         = useState([]);       // numbers placed
  const [selectedId, setSelId]  = useState(null);

  const tableRef    = useRef();
  const tableLayout = useRef({ x:0, y:0 });

  // clamp helper
  const clamp = (v, min, max) => Math.max(min, Math.min(v, max));

  // drop from picker:
  const onDrop = (num, px, py) => {
    if (used.includes(num)) return;
    // if release outside table, ignore
    const lx = px - tableLayout.current.x;
    const ly = py - tableLayout.current.y;
    if (lx < 0||lx>TABLE_W||ly<0||ly>TABLE_H) return;

    const x = clamp(lx, PAD, TABLE_W - PAD);
    const y = clamp(ly, PAD, TABLE_H - PAD);
    setBalls(b => [...b, { id: Date.now(), number:num, x, y }]);
    setUsed(u => [...u, num]);
  };

  // measure table once
  const onTableLayout = () => {
    const node = findNodeHandle(tableRef.current);
    UIManager.measure(node, (_x,_y,_w,_h,pageX,pageY) => {
      tableLayout.current = { x:pageX, y:pageY };
    });
  };

  // responder for moving existing ball
  const mover = useRef(PanResponder.create({
    onStartShouldSetPanResponder: (e) => {
      const { locationX:lx, locationY:ly } = e.nativeEvent;
      // hit-test
      const hit = balls.find(b=>Math.hypot(lx - b.x, ly - b.y) <= R);
      if (hit) {
        setSelId(hit.id);
        return true;
      }
      return false;
    },
    onPanResponderMove: (_, g) => {
      if (selectedId == null) return;
      const nx = clamp(g.moveX - tableLayout.current.x, PAD, TABLE_W - PAD);
      const ny = clamp(g.moveY - tableLayout.current.y, PAD, TABLE_H - PAD);
      setBalls(bs => bs.map(b=> b.id===selectedId?{...b,x:nx,y:ny}:b));
    },
    onPanResponderRelease: () => setSelId(null),
  })).current;

  return (
    <View style={s.screen}>

      <Ionicons
        name="menu"
        size={28}
        color="#fff"
        style={s.menu}
        onPress={()=>nav.openDrawer()}
      />

      <View
        ref={tableRef}
        style={s.tableWrap}
        onLayout={onTableLayout}
        {...mover.panHandlers}
      >
        <ImageBackground
          source={poolTableImage}
          style={s.tableBg}
        >
          <Svg width={TABLE_W} height={TABLE_H}>
            {balls.map(b=>(
              <React.Fragment key={b.id}>
                <Circle
                  cx={b.x}
                  cy={b.y}
                  r={R}
                  fill={COLORS[b.number]}
                  stroke={selectedId===b.id?'#fff':'#000'}
                  strokeWidth={selectedId===b.id?3:1}
                />
                <SvgText
                  x={b.x}
                  y={b.y+5}
                  fontSize="14"
                  fontWeight="bold"
                  fill={b.number===8?'#fff':'#000'}
                  textAnchor="middle"
                >
                  {b.number}
                </SvgText>
              </React.Fragment>
            ))}
          </Svg>
        </ImageBackground>
      </View>

      <ScrollView
        horizontal
        contentContainerStyle={s.picker}
        showsHorizontalScrollIndicator={false}
      >
        {Array.from({length:15},(_,i)=>i+1).map(num=>(
          <BallPickerItem
            key={num}
            number={num}
            color={COLORS[num]}
            disabled={used.includes(num)}
            onDrop={onDrop}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen:   { flex:1, backgroundColor:'#000', alignItems:'center', paddingTop:40 },
  menu:     { position:'absolute', top:40, left:20, zIndex:10 },
  tableWrap:{ width:TABLE_W, height:TABLE_H, marginBottom:20 },
  tableBg:  { width:TABLE_W, height:TABLE_H },
  picker:   { paddingHorizontal:10, paddingBottom:20 },
});
