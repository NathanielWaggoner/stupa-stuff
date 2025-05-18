# Stupa Map App - Map Interface Architecture

## Overview
The Map Interface is the primary user interaction point of the Stupa Map App. It provides an interactive OpenStreetMap-based interface showing stupa locations, allows users to explore stupas, and add new ones. This document outlines the technical architecture for implementing this core feature.

## Map Provider Architecture

### OpenStreetMap Integration
```typescript
interface MapConfig {
  tileServer: string;
  attribution: string;
  maxZoom: number;
  defaultStyle: MapStyle;
}

interface MapStyle {
  religious: {
    stupas: LayerStyle;
    temples: LayerStyle;
    sacred_sites: LayerStyle;
  };
  base: {
    terrain: LayerStyle;
    labels: LayerStyle;
  };
}

// Custom OSM tile configuration
const osmConfig: MapConfig = {
  tileServer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19,
  defaultStyle: {
    religious: {
      stupas: {
        icon: 'stupa-marker',
        minZoom: 10,
        cluster: true
      },
      // ... other religious site styles
    },
    base: {
      // ... base map styles
    }
  }
};
```

## Components Architecture

### Map Core
```typescript
interface MapViewProps {
  initialRegion?: Region;
  onRegionChange?: (region: Region) => void;
  onMarkerSelect?: (stupa: StupaMarker) => void;
  onLongPress?: (coordinate: LatLng) => void;
  tileConfig?: MapConfig;
}

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface StupaMarker {
  id: string;
  coordinate: LatLng;
  title: string;
  description?: string;
  osmId?: string;  // OpenStreetMap ID if exists
  osmTags?: Record<string, string>;  // OSM metadata
}
```

### Component Hierarchy
```
MapScreen
├── MapView (react-native-maps with OSM provider)
│   ├── StupaMarkers
│   │   ├── CustomMarkerIcons
│   │   └── MarkerClusters
│   ├── UserLocationMarker
│   └── AttributionOverlay
├── SearchBar
├── FilterControls
│   ├── LayerToggle
│   └── CategoryFilters
└── MarkerDetailSheet (Bottom Sheet)
    ├── StupaDetails
    ├── VideoPlayer
    └── PrayerSection
```

## Data Model

### Firestore Collections

```typescript
// Stupa Collection
interface Stupa {
  id: string;
  location: FirebaseFirestore.GeoPoint;
  title: string;
  description: string;
  createdBy: string;  // user ID
  createdAt: Timestamp;
  isPublic: boolean;
  videoUrls: string[];
  prayerCount: number;
  lastPrayerAt: Timestamp;
  
  // OpenStreetMap Integration
  osmId?: string;
  osmTags?: {
    'historic:stupa'?: string;
    'religion'?: string;
    'denomination'?: string;
    'name:*'?: string;  // Multilingual names
  };
  lastOsmSync?: Timestamp;
}

// Spatial Index Collection (for efficient geo-queries)
interface StupaLocation {
  stupaId: string;
  location: FirebaseFirestore.GeoPoint;
  geohash: string;  // For location-based queries
  osmId?: string;   // For OSM data synchronization
}
```

## Key Features Implementation

### 1. Map Initialization with OSM
```typescript
// hooks/useMapInitialization.ts
const useMapInitialization = () => {
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [tileConfig, setTileConfig] = useState<MapConfig>(osmConfig);
  
  useEffect(() => {
    // Request location permissions
    // Get user's current location
    // Initialize map region
    
    // Load custom tile configuration
    const loadTileConfig = async () => {
      const customTiles = await AsyncStorage.getItem('customTiles');
      if (customTiles) {
        setTileConfig({
          ...osmConfig,
          ...JSON.parse(customTiles)
        });
      }
    };
    
    loadTileConfig();
  }, []);
  
  return { region, setRegion, tileConfig };
};
```

### 2. Stupa Markers Loading with OSM Data
```typescript
// services/stupaQueries.ts
const loadStupasInRegion = async (region: Region) => {
  const center = new firebase.firestore.GeoPoint(
    region.latitude,
    region.longitude
  );
  
  // Calculate bounding box from region
  const radiusInM = 50000; // 50km radius
  
  // 1. Load stupas from Firestore
  const firestoreStupas = await firebase.firestore()
    .collection('stupas')
    .where('location', '>=', calculateBounds(center, radiusInM).lower)
    .where('location', '<=', calculateBounds(center, radiusInM).upper)
    .get();
    
  // 2. Load additional stupas from OSM
  const osmStupas = await fetchOSMStupas(region);
  
  // 3. Merge and deduplicate results
  return mergeAndDeduplicateStupas(firestoreStupas, osmStupas);
};

const fetchOSMStupas = async (region: Region) => {
  const query = `
    [out:json];
    (
      node["historic"="stupa"]({{bbox}});
      way["historic"="stupa"]({{bbox}});
      relation["historic"="stupa"]({{bbox}});
    );
    out body;
    >;
    out skel qt;
  `;
  
  const response = await fetch(
    `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
  );
  
  return transformOSMResponse(await response.json());
};
```

### 3. Marker Clustering
```typescript
// components/MarkerClusters.tsx
interface ClusterConfig {
  radius: number;
  maxZoom: number;
  minPoints: number;
  customStyles: {
    small: ClusterStyle;
    medium: ClusterStyle;
    large: ClusterStyle;
  };
}

const clusterConfig: ClusterConfig = {
  radius: 50,
  maxZoom: 16,
  minPoints: 2,
  customStyles: {
    small: {
      textColor: '#FF9800',
      backgroundColor: '#FFF3E0',
      borderRadius: 15
    },
    // ... other styles
  }
};
```

### 4. OSM Data Synchronization
```typescript
// services/osmSync.ts
interface OSMSyncConfig {
  syncInterval: number;  // milliseconds
  batchSize: number;    // number of stupas per batch
  retryAttempts: number;
}

const syncWithOSM = async (stupa: Stupa) => {
  if (!stupa.osmId) {
    // Create new OSM node if it doesn't exist
    const osmId = await createOSMNode(stupa);
    await updateStupaWithOSMId(stupa.id, osmId);
  } else {
    // Update existing OSM node
    await updateOSMNode(stupa.osmId, stupa);
  }
  
  // Update last sync timestamp
  await firebase.firestore()
    .collection('stupas')
    .doc(stupa.id)
    .update({
      lastOsmSync: firebase.firestore.FieldValue.serverTimestamp()
    });
};
```

## Performance Optimizations

### 1. Tile Management
- Custom tile server configuration
- Tile caching
- Progressive loading based on zoom level
- Offline tile storage

### 2. Data Loading
- Geospatial query optimization
- OSM data caching
- Incremental loading
- Background sync for OSM updates

### 3. Rendering Performance
- Custom marker clustering
- Viewport-based rendering
- Hardware acceleration
- Reduced marker redraws

## Dependencies

```json
{
  "react-native-maps": "^1.7.1",
  "@react-native-community/geolocation": "^3.0.6",
  "supercluster": "^8.0.1",
  "@turf/turf": "^6.5.0",
  "osmtogeojson": "^3.0.0-beta.5"
}
```

## Getting Started

1. Set up OpenStreetMap tile server configuration
2. Configure map component with OSM provider
3. Implement custom marker clustering
4. Set up OSM data synchronization
5. Add offline support
6. Implement custom map styles
7. Add attribution and licensing compliance

## OSM Contribution Guidelines

1. **Data Quality**
   - Verify stupa locations before submission
   - Include required tags and attributes
   - Follow OSM tagging conventions

2. **Community Engagement**
   - Coordinate with local OSM communities
   - Participate in mapping events
   - Share improvements with OSM community

3. **Technical Requirements**
   - Follow OSM API usage guidelines
   - Implement proper error handling
   - Maintain data synchronization

4. **Legal Compliance**
   - Include proper attribution
   - Follow OSM licensing requirements
   - Respect data privacy guidelines 