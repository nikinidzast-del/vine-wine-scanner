import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../theme';

interface Props {
  opacity?: number;
  size?: number;
  blur?: boolean;
  style?: ViewStyle;
}

export function BottleSilhouette({ opacity = 0.15, size = 300, style }: Props) {
  const scale = size / 300;

  return (
    <View style={[styles.container, style, { opacity }]} pointerEvents="none">
      <Svg width={size} height={size * 1.6} viewBox="0 0 300 480">
        <Defs>
          <LinearGradient id="bottleGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.accent} stopOpacity="0.3" />
            <Stop offset="0.5" stopColor={colors.accent} stopOpacity="0.6" />
            <Stop offset="1" stopColor={colors.accent} stopOpacity="0.3" />
          </LinearGradient>
        </Defs>
        <Path
          d="M130 30 L130 80 Q130 90 140 95 L160 105 Q170 110 170 120 L170 140 Q170 145 165 148 L135 160 Q120 168 110 180 L90 210 Q80 230 80 260 L80 420 Q80 450 100 460 L130 470 Q150 475 170 470 L200 460 Q220 450 220 420 L220 260 Q220 230 210 210 L190 180 Q180 168 165 160 L135 148 Q130 145 130 140 L130 120 Q130 110 140 105 L160 95 Q170 90 170 80 L170 50 Q170 40 160 35 L145 30 Q140 28 130 30 Z"
          fill="url(#bottleGrad)"
          stroke={colors.accent}
          strokeWidth={1.5}
        />
        <Path
          d="M125 65 L125 85"
          stroke={colors.accent}
          strokeWidth={1}
          strokeOpacity={0.4}
        />
        <Path
          d="M135 20 Q135 5 150 5 Q165 5 165 20"
          stroke={colors.accent}
          strokeWidth={1.5}
          fill="none"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
