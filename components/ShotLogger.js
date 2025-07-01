import React, { useRef, useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, View } from 'react-native';
import { DraxProvider, DraxView } from 'react-native-drax';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import poolTableImage from '../assets/images/pooltable.jpg';

const TABLE_W = 300, TABLE_H = 600, R = 18;

const COLORS = {
  1:'#FDB927',2:'#0046AD',3:'#C8102E',4:'#552583',
  5:'#FF6F00',6:'#006847',7:'#8B4513',8:'#000000',
  9:'#FDB927',10:'#0046AD',11:'#C8102E',12:'#552583',
 13:'#FF6F00',14:'#006847',15:'#8B4513',
};

export default function ShotLogger() {
  const [balls, setBalls] = useState([]);
  const [used, setUsed]   = useState([]);
  const tableRef = useRef();

  const onReceiveDragDrop = ({ payload, dragPosition }) => {
    const { x: pageX, y: pageY } = dragPosition;
    tableRef.current.measure((x,y,w,h,px,py) => {
      // convert page coords to table-local
      const lx = pageX - px;
      const ly = pageY - py;
      if (lx<0||lx>TABLE_W||ly<0||ly>TABLE_H) return;
      setBalls(b => [...b, { id:Date.now(), number:payload, x:lx, y:ly }]);
      setUsed(u => [...u, payload]);
    });
  };

  return (
    <DraxProvider>
      <View style={s.container}>
        <ImageBackground
          ref={tableRef}
          source={poolTableImage}
          style={s.table}
        >
          <Svg width={TABLE_W} height={TABLE_H}>
            {balls.map(b=>(
              <React.Fragment key={b.id}>
                <Circle
                  cx={b.x} cy={b.y} r={R}
                  fill={COLORS[b.number]}
                  stroke="#fff" strokeWidth={2}
                />
                <SvgText
                  x={b.x} y={b.y+5}
                  fontSize="14" fontWeight="bold"
                  fill={b.number===8?'#fff':'#000'}
                  textAnchor="middle">
                  {b.number}
                </SvgText>
              </React.Fragment>
            ))}
          </Svg>
          <DraxView
            style={s.receiver}
            receptive={true}
            onReceiveDragDrop={onReceiveDragDrop}
          />
        </ImageBackground>

        <ScrollView horizontal contentContainerStyle={s.picker}>
          {Array.from({length:15},(_,i)=>i+1).map(num=>(
            <DraxView
              key={num}
              style={[s.draggable,{backgroundColor:COLORS[num]}]}
              draggingStyle={s.dragging}
              dragPayload={num}
              longPressDelay={200}
              disabled={used.includes(num)}
            >
              <Svg><Circle cx={18} cy={18} r={R} fill="transparent" /></Svg>
              <SvgText
                x={18} y={22}
                fontSize="14" fontWeight="bold"
                fill="#fff" textAnchor="middle">
                {num}
              </SvgText>
            </DraxView>
          ))}
        </ScrollView>
      </View>
    </DraxProvider>
  );
}

const s = StyleSheet.create({
  container:{flex:1,alignItems:'center',backgroundColor:'#000',paddingTop:40},
  table:    { width:TABLE_W, height:TABLE_H, marginBottom:20 },
  receiver: { position:'absolute', top:0,left:0,width:TABLE_W,height:TABLE_H },
  picker:   { paddingHorizontal:10, paddingBottom:20 },
  draggable:{ width:36, height:36, marginHorizontal:6, justifyContent:'center',alignItems:'center' },
  dragging: { opacity:0.4, scale:1.2 },
});
