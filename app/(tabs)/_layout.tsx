import { HapticTab } from '@/components/HapticTab';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Tab bar background component
const TabBarBackground = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  return (
    <View 
      style={{
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.backgroundSecondary,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
      }}
    />
  );
};

const styles = StyleSheet.create({
  tabBarCenterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: 80,
    backgroundColor: 'transparent',
  },
  signOffButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabBarItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default function TabLayout() {
  const isIOS = Platform.OS === 'ios';
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  const tabBarOptions = {
    tabBarActiveTintColor: colors.purple.primary,
    tabBarInactiveTintColor: colors.textSecondary,
    headerShown: false,
    tabBarButton: HapticTab,
    tabBarBackground: () => <TabBarBackground />,
    tabBarStyle: {
      position: 'absolute',
      height: isIOS ? 90 : 80,
      borderTopWidth: 0,
      backgroundColor: colors.backgroundSecondary,
      elevation: 0,
      shadowOpacity: 0.2,
      left: 0,
      right: 0,
      bottom: 0,
      paddingBottom: 0,
      paddingTop: 0,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowRadius: 8,
    },
    tabBarItemStyle: {
      paddingVertical: 8,
      height: '100%',
      justifyContent: 'center',
      paddingBottom: Platform.OS === 'ios' ? 20 : 8,
      borderRadius: 12,
      marginHorizontal: 2,
      marginBottom: 4,
      backgroundColor: 'transparent',
      overflow: 'hidden',
    },
    tabBarActiveBackgroundColor: 'rgba(139, 92, 246, 0.15)',
    tabBarInactiveBackgroundColor: 'transparent',
    tabBarHideOnKeyboard: true,
  } as const;

  return (
    <Tabs screenOptions={tabBarOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              name="home" 
              size={24} 
              color={color}
              style={{ opacity: focused ? 1 : 0.7 }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="vaults"
        options={{
          title: 'Coffres-forts',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              name="lock" 
              size={24} 
              color={color}
              style={{ opacity: focused ? 1 : 0.7 }}
            />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="sign-off"
        options={{
          title: 'Sign-off',
          tabBarButton: (props) => (
            <View style={styles.tabBarCenterContainer}>
              <TouchableOpacity
                style={styles.signOffButton}
                onPress={props.onPress}
                activeOpacity={0.8}
              >
                <MaterialIcons name="power-settings-new" size={28} color="white" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="heirs"
        options={{
          title: 'Héritiers',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name="account-group" 
              size={24} 
              color={color}
              style={{ opacity: focused ? 1 : 0.7 }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              name="person" 
              size={24} 
              color={color}
              style={{ opacity: focused ? 1 : 0.7 }}
            />
          ),
        }}
      />
    </Tabs>
  );
}
