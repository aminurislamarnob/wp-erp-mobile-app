import React from 'react';
import { Image, View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

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
import MoreScreen from '../screens/more/MoreScreen';
import MoreSettingsScreen from '../screens/more/MoreSettingsScreen';
import ChangePasswordScreen from '../screens/more/ChangePasswordScreen';
import StandupScreen from '../screens/more/StandupScreen';
import StandupFormScreen from '../screens/more/StandupFormScreen';
import ReimbursementScreen from '../screens/reimbursement/ReimbursementScreen';
import NewPaymentRequestScreen from '../screens/reimbursement/NewPaymentRequestScreen';
import PaymentRequestDetailScreen from '../screens/reimbursement/PaymentRequestDetailScreen';
import NotesScreen from '../screens/notes/NotesScreen';
import NoteDetailScreen from '../screens/notes/NoteDetailScreen';
import NoteEditorScreen from '../screens/notes/NoteEditorScreen';
import NoteFilterScreen from '../screens/notes/NoteFilterScreen';
import LabelManagerScreen from '../screens/notes/LabelManagerScreen';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const ProfileStackNav = createNativeStackNavigator();
const LeaveStackNav = createNativeStackNavigator();
const MoreStackNav = createNativeStackNavigator();
const NotesStackNav = createNativeStackNavigator();

function NotesStackScreen() {
  return (
    <NotesStackNav.Navigator screenOptions={{ headerShown: false }}>
      <NotesStackNav.Screen name="NotesList" component={NotesScreen} />
      <NotesStackNav.Screen name="NoteDetail" component={NoteDetailScreen} />
      <NotesStackNav.Screen name="NoteEditor" component={NoteEditorScreen} />
      <NotesStackNav.Screen name="NoteFilter" component={NoteFilterScreen} />
      <NotesStackNav.Screen name="LabelManager" component={LabelManagerScreen} />
    </NotesStackNav.Navigator>
  );
}

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

function MoreStackScreen() {
  return (
    <MoreStackNav.Navigator screenOptions={{ headerShown: false }}>
      <MoreStackNav.Screen name="MoreHome" component={MoreScreen} />
      <MoreStackNav.Screen name="MoreStandup" component={StandupScreen} />
      <MoreStackNav.Screen name="MoreStandupForm" component={StandupFormScreen} />
      <MoreStackNav.Screen name="MoreAttendance" component={AttendanceScreen} />
      <MoreStackNav.Screen name="MoreReimbursement" component={ReimbursementScreen} />
      <MoreStackNav.Screen name="MorePaymentRequestNew" component={NewPaymentRequestScreen} />
      <MoreStackNav.Screen name="MorePaymentRequestDetail" component={PaymentRequestDetailScreen} />
      <MoreStackNav.Screen name="MoreAnnouncements" component={AnnouncementsScreen} />
      <MoreStackNav.Screen name="AnnouncementDetail" component={AnnouncementDetailScreen} />
      <MoreStackNav.Screen name="MoreLabelManager" component={LabelManagerScreen} />
      <MoreStackNav.Screen name="MoreTeamDirectory" component={TeamDirectoryScreen} />
      <MoreStackNav.Screen name="MoreSettings" component={MoreSettingsScreen} />
      <MoreStackNav.Screen name="MoreChangePassword" component={ChangePasswordScreen} />
    </MoreStackNav.Navigator>
  );
}

function MainTabs() {
  const { isModuleActive } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 4),
          height: 66 + Math.max(insets.bottom - 4, 0),
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Leave"
        component={LeaveStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="calendar" size={size} color={color} />,
        }}
      />
      {isModuleActive('attendance') && (
        <Tab.Screen
          name="Attendance"
          component={AttendanceScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Feather name="clock" size={size} color={color} />,
          }}
        />
      )}
      <Tab.Screen
        name="Profile"
        component={ProfileStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="more-vertical" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isLoading, isAuthenticated } = useAuth();
  const { colors, isDark } = useTheme();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2D5BDB' }}>
        <Image
          source={require('../../assets/icon.png')}
          style={{ width: 160, height: 160 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <RootStack.Screen name="Main" component={MainTabs} />
            <RootStack.Screen name="Announcements" component={AnnouncementsScreen} />
            <RootStack.Screen name="AnnouncementDetail" component={AnnouncementDetailScreen} />
            <RootStack.Screen name="Notes" component={NotesStackScreen} />
          </>
        ) : (
          <RootStack.Screen name="Login" component={LoginScreen} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
