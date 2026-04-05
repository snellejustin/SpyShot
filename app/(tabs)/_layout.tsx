import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { COLORS } from '@/constants/design';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                tabBarStyle: {
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                    borderTopColor: COLORS.border,
                    borderTopWidth: 1,
                },
                headerShown: false,
                tabBarButton: HapticTab,
            }}>
            <Tabs.Screen
                name="(index)"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => <Ionicons size={28} name={focused ? 'home' : 'home-outline'} color={color} />,
                }}
            />
            <Tabs.Screen
                name="groups"
                options={{
                    title: 'Groups',
                    tabBarIcon: ({ color, focused }) => <Ionicons size={28} name={focused ? 'people' : 'people-outline'} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => <Ionicons size={28} name={focused ? 'person' : 'person-outline'} color={color} />,
                }}
            />
        </Tabs>
    );
}
