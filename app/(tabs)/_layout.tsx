import { HapticTab } from '@/components/HapticTab';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

// Tab bar background component
const TabBarBackground = () => {
  return (
    <View 
      style={{
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#fff',
        borderTopWidth: 0,
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
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 3,
    borderColor: '#fff',
  },
  tabBarItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#000',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default function TabLayout() {
  const isIOS = Platform.OS === 'ios';

  const tabBarOptions = {
    tabBarActiveTintColor: '#000',
    tabBarInactiveTintColor: '#999',
    headerShown: false,
    tabBarButton: HapticTab,
    tabBarBackground: () => <TabBarBackground />,
    tabBarStyle: {
      position: 'absolute',
      height: isIOS ? 90 : 80,
      borderTopWidth: 0,
      backgroundColor: '#fff',
      elevation: 0,
      shadowOpacity: 0.1,
      left: 0,
      right: 0,
      bottom: 0,
      paddingBottom: 0,
      paddingTop: 0,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowRadius: 4,
    },
    tabBarItemStyle: {
      paddingVertical: 8,
      height: '100%',
      justifyContent: 'center',
      paddingBottom: Platform.OS === 'ios' ? 20 : 8,
      borderRadius: 10,
      marginHorizontal: 4,
      marginBottom: 4,
      backgroundColor: 'transparent',
    },
    tabBarActiveBackgroundColor: 'transparent',
    tabBarInactiveBackgroundColor: 'transparent',
    tabBarHideOnKeyboard: true,
  } as const;

  return (
    <Tabs screenOptions={tabBarOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vaults"
        options={{
          title: 'Vault',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="lock" size={24} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="sign-off"
        options={{
          title: 'Sign-Off',
          tabBarButton: (props) => (
            <View style={styles.tabBarCenterContainer}>
              <TouchableOpacity
                style={styles.signOffButton}
                onPress={props.onPress}
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
          title: 'Heirs',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account-group" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="person" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
