import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { authService } from '@/services/auth.service';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const user = await authService.signUp(email, password, email.split('@')[0]);
        if (!user.emailVerified) {
          await authService.sendEmailVerification();
          Alert.alert(
            'Verification Email Sent',
            'Please check your email to verify your account before logging in.'
          );
          setIsSignUp(false);
        } else {
          Alert.alert('Success', 'Account created successfully!');
          router.back();
        }
      } else {
        const user = await authService.signIn(email, password);
        if (!user.emailVerified) {
          Alert.alert(
            'Email Not Verified',
            'Please verify your email before logging in. Would you like us to send another verification email?',
            [
              {
                text: 'Cancel',
                style: 'cancel'
              },
              {
                text: 'Send Email',
                onPress: async () => {
                  try {
                    await authService.sendEmailVerification();
                    Alert.alert('Success', 'Verification email sent!');
                  } catch (error: any) {
                    Alert.alert('Error', error.message || 'Failed to send verification email');
                  }
                }
              }
            ]
          );
        } else {
          router.back();
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Login'}</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isSignUp ? 'Sign Up' : 'Login'}
            </Text>
          )}
        </TouchableOpacity>

        {!isSignUp && (
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/auth/reset-password')}
          >
            <Text style={styles.linkButtonText}>Forgot Password?</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsSignUp(!isSignUp)}
        >
          <Text style={styles.switchButtonText}>
            {isSignUp ? 'Already have an account? Login' : 'Need an account? Sign Up'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FF4B4B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    padding: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  linkButtonText: {
    color: '#FF4B4B',
    fontSize: 16,
  },
  switchButton: {
    padding: 15,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#666',
    fontSize: 16,
  },
}); 