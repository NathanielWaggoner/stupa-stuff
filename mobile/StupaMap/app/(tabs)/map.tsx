import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Region, Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { stupaService } from '@/services/stupa.service';
import { Stupa } from '@/store/slices/stupaSlice';
import { StupaMarker } from '@/components/map/StupaMarker';

const MapScreen = () => {
  const [region, setRegion] = useState<Region>({
    latitude: 27.7172,
    longitude: 85.3240,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [stupas, setStupas] = useState<Stupa[]>([]);
  const [isMoving, setIsMoving] = useState(false);

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

  const handleRegionChange = useCallback((newRegion: Region) => {
    setIsMoving(true);
  }, []);

  const handleRegionChangeComplete = useCallback((newRegion: Region) => {
    setIsMoving(false);
    // Only update if the region has actually changed
    if (
      Math.abs(newRegion.latitude - region.latitude) > 0.002 ||
      Math.abs(newRegion.longitude - region.longitude) > 0.002 ||
      Math.abs(newRegion.latitudeDelta - region.latitudeDelta) > 0.002 ||
      Math.abs(newRegion.longitudeDelta - region.longitudeDelta) > 0.002
    ) {
      setRegion(newRegion);
    }
  }, [region]);

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
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={handleRegionChangeComplete}
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
            <StupaMarker color="#FFD700" />
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