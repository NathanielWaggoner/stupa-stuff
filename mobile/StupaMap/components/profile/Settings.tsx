import React from 'react';
import { StyleSheet, Text, View, Switch, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface SettingsProps {
  settings?: {
    notifications: boolean;
    darkMode: boolean;
    language: string;
  };
  onSettingChange?: (key: string, value: any) => void;
  onLanguagePress?: () => void;
  onLogout?: () => void;
}

export function Settings({
  settings = {
    notifications: true,
    darkMode: false,
    language: 'English',
  },
  onSettingChange,
  onLanguagePress,
  onLogout,
}: SettingsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      
      <View style={styles.section}>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <FontAwesome name="bell" size={20} color="#666" />
            <Text style={styles.settingLabel}>Notifications</Text>
          </View>
          <Switch
            value={settings.notifications}
            onValueChange={(value) => onSettingChange?.('notifications', value)}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <FontAwesome name="moon-o" size={20} color="#666" />
            <Text style={styles.settingLabel}>Dark Mode</Text>
          </View>
          <Switch
            value={settings.darkMode}
            onValueChange={(value) => onSettingChange?.('darkMode', value)}
          />
        </View>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={onLanguagePress}
        >
          <View style={styles.settingInfo}>
            <FontAwesome name="language" size={20} color="#666" />
            <Text style={styles.settingLabel}>Language</Text>
          </View>
          <View style={styles.settingValue}>
            <Text style={styles.valueText}>{settings.language}</Text>
            <FontAwesome name="chevron-right" size={16} color="#666" />
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={onLogout}
      >
        <FontAwesome name="sign-out" size={20} color="#FF4B4B" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  section: {
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F0',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  logoutText: {
    color: '#FF4B4B',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 