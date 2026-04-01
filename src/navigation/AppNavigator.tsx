import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors, fontSize } from '../constants/theme';

import LoginScreen from '../screens/auth/LoginScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import LeaveScreen from '../screens/leave/LeaveScreen';
import NewLeaveRequestScreen from '../screens/leave/NewLeaveRequestScreen';
import LeaveDetailScreen from '../screens/leave/LeaveDetailScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import TeamDirectoryScreen from '../screens/profile/TeamDirectoryScreen';
import AttendanceScreen from '../screens/attendance/AttendanceScreen';
import AnnouncementsScreen from '../screens/announcements/AnnouncementsScreen';
import AnnouncementDetailScreen from '../screens/announcements/AnnouncementDetailScreen';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const ProfileStackNav = createNativeStackNavigator();
const LeaveStackNav = createNativeStackNavigator();

function ProfileStackScreen() {
  return (
    <ProfileStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStackNav.Screen name="MyProfile" component={ProfileScreen} />
      <ProfileStackNav.Screen name="TeamDirectory" component={TeamDirectoryScreen} />
    </ProfileStackNav.Navigator>
  );
}

function LeaveStackScreen() {
  return (
    <LeaveStackNav.Navigator screenOptions={{ headerShown: false }}>
      <LeaveStackNav.Screen name="LeaveList" component={LeaveScreen} />
      <LeaveStackNav.Screen name="NewLeaveRequest" component={NewLeaveRequestScreen} />
      <LeaveStackNav.Screen name="LeaveDetail" component={LeaveDetailScreen} />
    </LeaveStackNav.Navigator>
  );
}

function MainTabs() {
  const { isModuleActive } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Leave"
        component={LeaveStackScreen}
        options={{
          title: 'Leave',
          tabBarIcon: ({ color, size }) => <Feather name="calendar" size={size} color={color} />,
        }}
      />
      {isModuleActive('attendance') && (
        <Tab.Screen
          name="Attendance"
          component={AttendanceScreen}
          options={{
            title: 'Attendance',
            tabBarIcon: ({ color, size }) => <Feather name="clock" size={size} color={color} />,
          }}
        />
      )}
      <Tab.Screen
        name="Profile"
        component={ProfileStackScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <RootStack.Screen name="Main" component={MainTabs} />
            <RootStack.Screen name="Announcements" component={AnnouncementsScreen} />
            <RootStack.Screen name="AnnouncementDetail" component={AnnouncementDetailScreen} />
          </>
        ) : (
          <RootStack.Screen name="Login" component={LoginScreen} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
