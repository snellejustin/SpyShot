import { Tabs, router } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { COLORS, SHADOWS } from '@/constants/design';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import Ionicons from '@expo/vector-icons/Ionicons';

function NewEventButton({ onPress }: { onPress: () => void }) {
    return (
        <TouchableOpacity style={styles.newEventButton} onPress={onPress} activeOpacity={0.8}>
            <View style={styles.newEventCircle}>
                <Ionicons name="add" size={30} color={COLORS.gray900} />
            </View>
        </TouchableOpacity>
    );
}

export default function TabLayout() {
    const colorScheme = useColorScheme();

    const handleNewEvent = () => {
        Alert.alert('New Event', 'Where are you meeting?', [
            { text: 'Cafe', onPress: () => router.push('/create-group?type=cafe') },
            { text: 'Home', onPress: () => router.push('/create-group?type=home') },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                tabBarStyle: {
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                    borderTopColor: COLORS.border,
                    borderTopWidth: 1,
                    height: 85,
                    paddingBottom: 20,
                },
                headerShown: false,
                tabBarButton: HapticTab,
            }}>
            <Tabs.Screen
                name="(index)"
                options={{
                    title: 'Feed',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons size={26} name={focused ? 'home' : 'home-outline'} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="groups"
                options={{
                    title: 'Groups',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons size={26} name={focused ? 'people' : 'people-outline'} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="new-event"
                options={{
                    title: '',
                    tabBarButton: () => <NewEventButton onPress={handleNewEvent} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons size={26} name={focused ? 'person' : 'person-outline'} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    newEventButton: {
        top: -18,
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
    newEventCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.primary,
    },
});
