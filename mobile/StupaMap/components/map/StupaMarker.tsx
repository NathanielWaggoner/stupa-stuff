import React from 'react';
import { View, StyleSheet } from 'react-native';

interface StupaMarkerProps {
  size?: number;
  color?: string;
}

export function StupaMarker({ size = 36, color = '#E9A200' }: StupaMarkerProps) {
  return (
    <View style={styles.container}>
      {/* Spire */}
      <View style={[styles.spire, { backgroundColor: color }]} />
      {/* Top of the stupa */}
      <View style={[styles.top, { backgroundColor: color }]} />
      <View style={[styles.stair2, { backgroundColor: color }]} />
      <View style={[styles.stair1, { backgroundColor: color }]} />
      {/* Main body of the stupa */}
      <View style={[styles.body, { backgroundColor: color }]} />
      {/* Base of the stupa */}
      <View style={[styles.stair1, { backgroundColor: color }]} />
      <View style={[styles.bottom, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    width: 24,
    height: 4,
    borderRadius: 2,
  },
  stair1: {
    width: 20,
    height: 4,
    borderRadius: 2,
  },
  stair2: {
    width: 16,
    height: 4,
    borderRadius: 2,
  },
  body: {
    width: 14,
    height: 16,
    marginTop: -2,
  },
  top: {
    width: 12,
    height: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginTop: -2,
  },
  spire: {
    width: 4,
    height: 8,
    marginTop: -2,
  },
}); 