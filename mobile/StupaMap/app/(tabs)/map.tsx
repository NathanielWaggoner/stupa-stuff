import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Region, Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { stupaService } from '@/services/stupa.service';
import { Stupa } from '@/store/slices/stupaSlice';

const MapScreen = () => {
  const [region, setRegion] = useState<Region>({
    latitude: 27.7172,
    longitude: 85.3240,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [stupas, setStupas] = useState<Stupa[]>([]);

  useEffect(() => {
    // Request location permissions
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    })();
  }, []);

  useEffect(() => {
    // Subscribe to stupas in the current region
    const unsubscribe = stupaService.subscribeToStupasInRegion(region, (updatedStupas) => {
      setStupas(updatedStupas);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [region]);

  const handleRegionChange = (newRegion: Region) => {
    setRegion(newRegion);
  };

  const handleMarkerPress = (stupa: Stupa) => {
    router.push({
      pathname: '/stupa-details',
      params: { id: stupa.id }
    });
  };

  const handleMapLongPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    router.push({
      pathname: '/add-stupa',
      params: {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      },
    });
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={handleRegionChange}
        onLongPress={handleMapLongPress}
        showsUserLocation
        showsMyLocationButton
      >
        {stupas.map((stupa) => (
          <Marker
            key={stupa.id}
            coordinate={{
              latitude: stupa.location.latitude,
              longitude: stupa.location.longitude,
            }}
            onPress={() => handleMarkerPress(stupa)}
          >
            <FontAwesome name="map-marker" size={36} color="#FF4B4B" />
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{stupa.title}</Text>
                <Text style={styles.calloutDescription}>{stupa.description}</Text>
                <Text style={styles.calloutPrayers}>
                  {stupa.prayerCount} prayers offered
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  callout: {
    padding: 10,
    maxWidth: 200,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  calloutPrayers: {
    fontSize: 12,
    color: '#666',
  },
}); 