import React, { useContext } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../../context/AuthContext';

export default function TabLayout() {
  const { user } = useContext(AuthContext);
  
  // Wardens and visitors don't use the personal QR tab
  const showQRTab = user?.role === 'student';

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#6C63FF',
      tabBarInactiveTintColor: '#666666',
      headerShown: false,
      tabBarStyle: { 
        height: 60, 
        paddingBottom: 10, 
        paddingTop: 10,
        backgroundColor: '#1A1A1A',
        borderTopColor: '#2A2A2A',
        borderTopWidth: 1,
      }
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="qr"
        options={{
          title: 'QR Code',
          href: showQRTab ? '/(app)/(tabs)/qr' : null,
          tabBarIcon: ({ color }) => <Ionicons name="qr-code" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Completely hide the explore placeholder from the tab bar
        }}
      />
    </Tabs>
  );
}
