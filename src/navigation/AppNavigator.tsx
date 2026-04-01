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

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const ProfileStackNav = createNativeStackNavigator();
const LeaveStackNav = createNativeStackNavigator();

function ProfileStackScreen() {
  return (
    <ProfileStackNav.Navigator
      screenOptions={{
        headerTintColor: colors.text,
      }}
    >
      <ProfileStackNav.Screen
        name="MyProfile"
        component={ProfileScreen}
        options={{ title: 'My Profile' }}
      />
      <ProfileStackNav.Screen
        name="TeamDirectory"
        component={TeamDirectoryScreen}
        options={{ title: 'Team Directory' }}
      />
    </ProfileStackNav.Navigator>
  );
}

function LeaveStackScreen() {
  return (
    <LeaveStackNav.Navigator
      screenOptions={{
        headerTintColor: colors.text,
      }}
    >
      <LeaveStackNav.Screen
        name="LeaveList"
        component={LeaveScreen}
        options={{ title: 'My Leave' }}
      />
      <LeaveStackNav.Screen
        name="NewLeaveRequest"
        component={NewLeaveRequestScreen}
        options={{ title: 'New Leave Request' }}
      />
      <LeaveStackNav.Screen
        name="LeaveDetail"
        component={LeaveDetailScreen}
        options={{ title: 'Leave Details' }}
      />
    </LeaveStackNav.Navigator>
  );
}

function MainTabs() {
  const { isModuleActive } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
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
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Leave"
        component={LeaveStackScreen}
        options={{
          headerShown: false,
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
        name="Announcements"
        component={AnnouncementsScreen}
        options={{
          title: 'News',
          tabBarIcon: ({ color, size }) => <Feather name="bell" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackScreen}
        options={{
          headerShown: false,
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
          <RootStack.Screen name="Main" component={MainTabs} />
        ) : (
          <RootStack.Screen name="Login" component={LoginScreen} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
