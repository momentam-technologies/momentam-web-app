import { Image, StatusBar, StyleSheet, Text, View } from 'react-native'
import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { icons } from '../../constants'

const TabIcon = ({ icon, color, name, focused }) => {
  return (
    <View className="items-center justify-center gap-2">
      <Image
        source={icon}
        resizeMode="contain"
        tintColor={color}
        className="w-6 h-6"
      />
      <Text className={`${focused ? 'font-psemibold' : 'font-pmedium'} text-sm`} style={{ color: color}}>{name}</Text>
    </View>
  )
}

const TabsLayout = () => {
  return (
    <>
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          tabBarActiveTintColor: '#075985',
          tabBarInactiveTintColor: '#44403c',
          tabBarStyle: {
            backgroundColor: '#f5f5f5', 
            height: 84,
          }
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.home1}
                color={color}
                name="Home"
                focused={focused}
              />
            )
          }}
        />

        <Tabs.Screen
          name="uploads"
          options={{
            title: 'Uploads',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.upload1}
                color={color}
                name="Uploads"
                focused={focused}
              />
            )
          }}
        />

        <Tabs.Screen
          name="earnings"
          options={{
            title: 'Earnings',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.coins}
                color={color}
                name="Earnings"
                focused={focused}
              />
            )
          }}
        />

        <Tabs.Screen
          name="account"
          options={{
            title: 'Account',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.account}
                color={color}
                name="Account"
                focused={focused}
              />
            )
          }}
        />
      </Tabs>
      <StatusBar
        backgroundColor="#075985"
        barStyle="light-content"
      />


    </>
  )
}

export default TabsLayout;