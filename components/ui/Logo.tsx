import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

type LogoProps = {
  size?: number;
  showText?: boolean;
};

export const Logo = ({ size = 100, showText = true }: LogoProps) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>DL</Text>
      </View>
      {showText && <Text style={styles.appName}>Digital Legacy</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logo: {
    width: '80%',
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  appName: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});
