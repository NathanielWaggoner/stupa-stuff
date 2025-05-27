import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Image } from 'react-native';
import ImageView from 'react-native-image-viewing';

interface PhotoViewerProps {
  imageUrl: string;
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

export function PhotoViewer({ imageUrl, style, resizeMode = 'cover' }: PhotoViewerProps) {
  const [isImageViewVisible, setIsImageViewVisible] = useState(false);

  const images = [
    {
      uri: imageUrl,
    },
  ];

  return (
    <>
      <TouchableOpacity
        onPress={() => setIsImageViewVisible(true)}
        style={[styles.container, style]}
      >
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, style]}
          resizeMode={resizeMode}
        />
      </TouchableOpacity>

      <ImageView
        images={images}
        imageIndex={0}
        visible={isImageViewVisible}
        onRequestClose={() => setIsImageViewVisible(false)}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
}); 