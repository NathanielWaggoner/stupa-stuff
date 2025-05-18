# Stupa Map App - User Experience & Interface Architecture

## Overview
This document outlines the user experience and interface architecture for the Stupa Map App, focusing on navigation flows, component design system, accessibility, internationalization, and responsive design patterns.

## Navigation Architecture

### Navigation Structure
```typescript
type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
  Settings: undefined;
};

type MainTabParamList = {
  Map: undefined;
  Discover: undefined;
  Prayer: undefined;
  Profile: undefined;
};

type MapStackParamList = {
  MapView: undefined;
  StupaDetail: { stupaId: string };
  AddStupa: undefined;
  VideoViewer: { videoId: string };
};
```

### Navigation Flows
```
App Entry
├── Onboarding (first-time users)
│   ├── Welcome
│   ├── Features Introduction
│   └── Permissions Request
├── Authentication
│   ├── Login
│   └── Registration
└── Main Application
    ├── Map Tab
    │   ├── Map View
    │   ├── Stupa Detail
    │   ├── Add Stupa
    │   └── Video Viewer
    ├── Discover Tab
    │   ├── Featured Stupas
    │   ├── Near Me
    │   └── Collections
    ├── Prayer Tab
    │   ├── Prayer Counter
    │   ├── Prayer History
    │   └── Community Prayers
    └── Profile Tab
        ├── User Info
        ├── Contributions
        └── Settings
```

## Design System

### Theme Configuration
```typescript
interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: {
      primary: string;
      secondary: string;
    };
    text: {
      primary: string;
      secondary: string;
      accent: string;
    };
    status: {
      success: string;
      error: string;
      warning: string;
      info: string;
    };
  };
  typography: {
    fontFamily: {
      primary: string;
      secondary: string;
    };
    fontSize: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
    };
    fontWeight: {
      regular: string;
      medium: string;
      bold: string;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}
```

### Component Library
```typescript
// Core Components
interface CoreComponents {
  Button: {
    Primary: ButtonComponent;
    Secondary: ButtonComponent;
    Text: ButtonComponent;
    Icon: ButtonComponent;
  };
  Input: {
    Text: InputComponent;
    Search: InputComponent;
    TextArea: InputComponent;
  };
  Card: {
    Basic: CardComponent;
    Interactive: CardComponent;
    Media: CardComponent;
  };
  Typography: {
    H1: TypographyComponent;
    H2: TypographyComponent;
    Body: TypographyComponent;
    Caption: TypographyComponent;
  };
}

// Composite Components
interface CompositeComponents {
  StupaCard: React.FC<{
    stupa: Stupa;
    onPress: () => void;
  }>;
  PrayerCounter: React.FC<{
    count: number;
    onPray: () => void;
  }>;
  VideoThumbnail: React.FC<{
    video: Video;
    onPlay: () => void;
  }>;
}
```

## Accessibility Implementation

### Accessibility Configuration
```typescript
interface AccessibilityConfig {
  // Screen reader support
  screenReader: {
    enabled: boolean;
    announcements: {
      [key: string]: string;
    };
  };
  
  // Visual adjustments
  visual: {
    highContrast: boolean;
    fontSize: number;
    reduceMotion: boolean;
  };
  
  // Input methods
  input: {
    touchTarget: {
      minSize: number;
      spacing: number;
    };
    keyboard: {
      shortcuts: {
        [key: string]: string;
      };
    };
  };
}
```

### Accessibility Hooks
```typescript
const useAccessibility = () => {
  const [config, setConfig] = useState<AccessibilityConfig>(defaultConfig);
  
  // Screen reader integration
  const announce = (message: string) => {
    if (config.screenReader.enabled) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  };
  
  // Dynamic text scaling
  const getScaledFontSize = (baseSize: number) => {
    return baseSize * config.visual.fontSize;
  };
  
  return {
    config,
    setConfig,
    announce,
    getScaledFontSize,
  };
};
```

## Internationalization (i18n)

### Language Support
```typescript
interface I18nConfig {
  defaultLanguage: string;
  supportedLanguages: {
    [code: string]: {
      name: string;
      direction: 'ltr' | 'rtl';
      dateFormat: string;
      numberFormat: string;
    };
  };
  translations: {
    [key: string]: {
      [language: string]: string;
    };
  };
}

const i18nConfig: I18nConfig = {
  defaultLanguage: 'en',
  supportedLanguages: {
    en: {
      name: 'English',
      direction: 'ltr',
      dateFormat: 'MM/DD/YYYY',
      numberFormat: 'en-US'
    },
    hi: {
      name: 'हिंदी',
      direction: 'ltr',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: 'hi-IN'
    },
    // Add more languages
  }
};
```

### Translation System
```typescript
const useTranslation = () => {
  const [language, setLanguage] = useState(i18nConfig.defaultLanguage);
  
  const t = (key: string, params?: object) => {
    let translation = i18nConfig.translations[key]?.[language];
    if (!translation) return key;
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        translation = translation.replace(`{{${key}}}`, value);
      });
    }
    
    return translation;
  };
  
  return { t, language, setLanguage };
};
```

## Responsive Design

### Breakpoints
```typescript
const breakpoints = {
  xs: 0,
  sm: 600,
  md: 960,
  lg: 1280,
  xl: 1920,
};

const useResponsive = () => {
  const [windowDimensions, setWindowDimensions] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  });
  
  // Update dimensions on change
  useEffect(() => {
    const subscription = Dimensions.addEventListener(
      'change',
      ({ window }) => {
        setWindowDimensions({
          width: window.width,
          height: window.height,
        });
      }
    );
    
    return () => subscription?.remove();
  }, []);
  
  return {
    isExtraSmall: windowDimensions.width < breakpoints.sm,
    isSmall: windowDimensions.width >= breakpoints.sm && windowDimensions.width < breakpoints.md,
    isMedium: windowDimensions.width >= breakpoints.md && windowDimensions.width < breakpoints.lg,
    isLarge: windowDimensions.width >= breakpoints.lg && windowDimensions.width < breakpoints.xl,
    isExtraLarge: windowDimensions.width >= breakpoints.xl,
  };
};
```

### Layout Components
```typescript
interface LayoutProps {
  spacing?: keyof typeof theme.spacing;
  direction?: 'row' | 'column';
  wrap?: boolean;
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  align?: 'start' | 'center' | 'end' | 'stretch';
}

const Container: React.FC<LayoutProps> = ({ children, ...props }) => {
  const responsive = useResponsive();
  
  return (
    <View
      style={[
        styles.container,
        responsive.isSmall && styles.containerSmall,
        responsive.isMedium && styles.containerMedium,
        // ... other responsive styles
      ]}
    >
      {children}
    </View>
  );
};
```

## State Management

### Global State Architecture
```typescript
interface AppState {
  theme: ThemeConfig;
  accessibility: AccessibilityConfig;
  i18n: {
    language: string;
    direction: 'ltr' | 'rtl';
  };
  user: {
    preferences: UserPreferences;
    settings: UserSettings;
  };
}

const AppContext = createContext<{
  state: AppState;
  dispatch: Dispatch<AppAction>;
}>(null);

const AppProvider: React.FC = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};
```

## Performance Optimizations

### Component Optimization
```typescript
// Memoization of expensive components
const MemoizedStupaCard = React.memo(StupaCard, (prev, next) => {
  return (
    prev.stupa.id === next.stupa.id &&
    prev.stupa.prayerCount === next.stupa.prayerCount
  );
});

// Virtualized lists for better performance
const VirtualizedStupaList: React.FC<{
  stupas: Stupa[];
  onStupaPress: (stupa: Stupa) => void;
}> = ({ stupas, onStupaPress }) => {
  const renderItem = useCallback(({ item }: { item: Stupa }) => (
    <MemoizedStupaCard
      stupa={item}
      onPress={() => onStupaPress(item)}
    />
  ), [onStupaPress]);
  
  return (
    <VirtualizedList
      data={stupas}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      getItemCount={data => data.length}
      getItem={(data, index) => data[index]}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
    />
  );
};
```

## Dependencies

```json
{
  "@react-navigation/native": "^6.x",
  "@react-navigation/stack": "^6.x",
  "react-native-reanimated": "^2.x",
  "react-native-gesture-handler": "^2.x",
  "react-native-safe-area-context": "^4.x",
  "react-native-localization": "^2.x",
  "@react-native-async-storage/async-storage": "^1.x",
  "react-native-responsive-screen": "^1.x"
}
```

## Getting Started

1. Set up navigation structure
2. Implement design system
3. Configure accessibility features
4. Set up internationalization
5. Implement responsive layouts
6. Add performance optimizations
7. Configure state management
8. Test across different devices and orientations 