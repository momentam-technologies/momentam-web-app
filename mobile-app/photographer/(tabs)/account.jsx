import { FlatList, Image, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, Alert, Modal, Dimensions, StatusBar, ActivityIndicator } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { icons, images } from '../../constants';
import { getUserById, updateUserField, updateAvatar, logout } from '../../lib/appwrite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import * as ImageManipulator from 'expo-image-manipulator';

const { width, height } = Dimensions.get('window');

const Account = () => {
  const [user, setUser] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showDropdown, setShowDropdown] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const languages = [
    { code: 'en', name: 'English', icon: icons.englishFlag },
    { code: 'sw', name: 'Swahili', icon: icons.swahiliFlag },
  ];

  const scale = useSharedValue(1);
  const dot1Opacity = useSharedValue(0.3);
  const dot2Opacity = useSharedValue(0.3);
  const dot3Opacity = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.ease }),
        withTiming(1, { duration: 1000, easing: Easing.ease })
      ),
      -1,
      true
    );

    dot1Opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.3, { duration: 600 })
      ),
      -1,
      true
    );
    dot2Opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 300 }),
        withTiming(1, { duration: 600 }),
        withTiming(0.3, { duration: 300 })
      ),
      -1,
      true
    );
    dot3Opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      true
    );

    fetchUserData();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dot1Style = useAnimatedStyle(() => ({ opacity: dot1Opacity.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: dot2Opacity.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: dot3Opacity.value }));

  const fetchUserData = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const userData = await getUserById(userId);
        setUser(userData);
        setEditedName(userData.name);
        setEditedEmail(userData.email);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
    setShowDropdown(false);
  };

  const handleUpdateInformation = async () => {
    try {
      await updateUserField(user.phone, 'name', editedName);
      await updateUserField(user.phone, 'email', editedEmail);
      setUser({ ...user, name: editedName, email: editedEmail });
      setShowUpdateModal(false);
      Alert.alert('Success', 'Information updated successfully');
    } catch (error) {
      console.error('Error updating information:', error);
      Alert.alert('Error', 'Failed to update information');
    }
  };

  const compressImage = useCallback(async (uri) => {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 300 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  }, []);

  const handleChangeAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setIsUploading(true);
        const compressedUri = await compressImage(result.assets[0].uri);
        const newAvatarUrl = await updateAvatar(user.$id, compressedUri);
        setUser({ ...user, avatar: newAvatarUrl });
        Alert.alert('Success', 'Avatar updated successfully');
      }
    } catch (error) {
      console.error('Error changing avatar:', error);
      Alert.alert('Error', 'Failed to update avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      await AsyncStorage.removeItem('isLoggedIn'); // Add this line
      router.replace('/');
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out');
    }
  };

  const renderModal = (visible, onClose, title, content) => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/30">
        <BlurView intensity={20} tint="light" className="w-[90%] rounded-3xl overflow-hidden">
          <View className="bg-white/90 p-6 rounded-3xl w-full">
            <Text className="text-xl font-pbold mb-4">{title}</Text>
            {content}
            <TouchableOpacity
              onPress={onClose}
              className="bg-sky-800 py-2 px-4 rounded-full mt-4 self-end"
            >
              <Text className="text-white text-center font-pbold">Close</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </Modal>
  );

  const AccountOption = ({ icon, title, onPress }) => {
    return (
      <TouchableOpacity onPress={onPress} className="flex-row items-center mt-5 w-full justify-between px-8">
        <View className="flex-row gap-4 items-center">
          <View className="bg-sky-100 p-2 rounded-full">
            {icon}
          </View>
          <Text className="font-pmedium text-base tracking-widest">{title}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#0284c7" />
      </TouchableOpacity>
    );
  };

  const LoadingModal = ({ visible }) => (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
    >
      <View className="flex-1 bg-black/30 justify-center items-center">
        <BlurView intensity={20} tint="light" className="p-6 rounded-2xl">
          <View className="bg-white/90 p-6 rounded-xl items-center">
            <ActivityIndicator size="large" color="#0284c7" />
            <Text className="mt-4 text-sky-800 font-pmedium text-center">Uploading photo...</Text>
          </View>
        </BlurView>
      </View>
    </Modal>
  );

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-sky-50">
        <BlurView intensity={20} tint="light" className="flex-1 justify-center items-center">
          <View className="bg-white/80 p-8 rounded-3xl items-center">
            <Animated.View style={animatedStyle}>
              <FontAwesome5 name="user-circle" size={64} color="#0284c7" />
            </Animated.View>
            <Text className="mt-4 text-sky-800 font-pbold text-lg">Loading Account...</Text>
            <View className="flex-row mt-4">
              <Animated.View style={[styles.dot, dot1Style]} />
              <Animated.View style={[styles.dot, dot2Style]} />
              <Animated.View style={[styles.dot, dot3Style]} />
            </View>
          </View>
        </BlurView>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['right', 'left', 'bottom']}>
        <ScrollView className="w-full h-full pt-10"
          contentContainerStyle={{ paddingTop: StatusBar.currentHeight || 0 }}
        >          
          <View className="w-full items-start justify-start">
            <View className="flex items-end px-8 pb-4 w-full flex-row gap-2">
              <Text className="font-pbold text-xl">Account</Text>
            </View>

            <View className="flex flex-row w-full items-center justify-between mt-6 px-8">
              <View className="flex gap-2 items-start justify-start">
                <Text className="font-pbold text-xl text-sky-800 tracking-wide leading-loose">
                  {user.name}
                </Text>
                <Text className="font-pmedium tracking-wide leading-loose">
                  {user.phone}
                </Text>
                <Text className="font-pmedium tracking-wide leading-loose">
                  {user.email}
                </Text>
              </View>
              <TouchableOpacity onPress={handleChangeAvatar} className="relative">
                <Image
                  source={{ uri: user.avatar }}
                  className="w-[90px] h-[90px] rounded-full"
                  alt="user avatar"
                  resizeMode="cover"
                />
                <View className="absolute bottom-0 right-0 bg-sky-500 rounded-full p-1">
                  <Ionicons name="pencil" size={16} color="white" />
                </View>
              </TouchableOpacity>
            </View>

            <AccountOption 
              icon={<MaterialIcons name="update" size={24} color="#0284c7" />}
              title="Update Information"
              onPress={() => setShowUpdateModal(true)}
            />

            <AccountOption 
              icon={<FontAwesome5 name="user-friends" size={24} color="#0284c7" />}
              title="Invite Friend"
              onPress={() => setShowInviteModal(true)}
            />

            <AccountOption 
              icon={<MaterialIcons name="description" size={24} color="#0284c7" />}
              title="Terms of Use"
              onPress={() => setShowTermsModal(true)}
            />

            <AccountOption 
              icon={<Ionicons name="language" size={24} color="#0284c7" />}
              title="Language"
              onPress={() => setShowDropdown(!showDropdown)}
            />

            <TouchableOpacity onPress={handleLogout} className="mt-10 px-8">
              <Text className="font-pmedium text-base tracking-widest text-red-700">Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Update Information Modal */}
        {renderModal(
          showUpdateModal,
          () => setShowUpdateModal(false),
          "Update Information",
          <View>
            <TextInput
              value={editedName}
              onChangeText={setEditedName}
              placeholder="Name"
              className="border border-gray-300 rounded-lg font-pmedium p-2 mb-2"
            />
            <TextInput
              value={editedEmail}
              onChangeText={setEditedEmail}
              placeholder="Email"
              className="border border-gray-300 rounded-lg font-pmedium p-2 mb-2"
            />
            <TouchableOpacity
              onPress={handleUpdateInformation}
              className="bg-sky-800 py-2 px-4 rounded-full mt-2"
            >
              <Text className="text-white text-center font-pbold">Update</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Invite Friend Modal */}
        {renderModal(
          showInviteModal,
          () => setShowInviteModal(false),
          "Invite Friend",
          <View>
            <Text className="font-pregular">Invite your friends to join Momentam!</Text>
            <TextInput
              placeholder="Friend's Email"
              className="border border-gray-300 rounded-lg p-2 mt-2 font-pregular"
            />
            <TouchableOpacity
              onPress={() => {
                // Implement invite friend logic here
                setShowInviteModal(false);
                Alert.alert('Invitation Sent', 'Your friend has been invited to join Momentam!');
              }}
              className="bg-sky-800 py-2 px-4 rounded-full mt-2"
            >
              <Text className="text-white text-center font-pbold">Send Invite</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Terms of Use Modal */}
        {renderModal(
          showTermsModal,
          () => setShowTermsModal(false),
          "Terms of Use",
          <ScrollView style={{ maxHeight: 300 }}>
            <Text className="font-pregular">
              {/* Add your terms of use text here */}
              These are the terms of use for Momentam. By using our app, you agree to our Terms and Conditions.
            </Text>
          </ScrollView>
        )}

        {/* Language Dropdown Modal */}
        {renderModal(
          showDropdown,
          () => setShowDropdown(false),
          "Select Language",
          <FlatList
            data={languages}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="p-2 flex-row items-center"
                onPress={() => handleLanguageSelect(item.name)}
              >
                <Ionicons 
                  name={selectedLanguage === item.name ? "radio-button-on" : "radio-button-off"} 
                  size={24} 
                  color="#0284c7" 
                  style={{ marginRight: 10 }}
                />
                <Text className="text-base font-psemibold">{item.name}</Text>
                <Image
                  source={item.icon}
                  style={{ width: 24, height: 24, marginLeft: 10 }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
          />
        )}

        <LoadingModal visible={isUploading} />
      </SafeAreaView>
    </View>
  )
}

const styles = {
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0284c7',
    marginHorizontal: 4,
  },
};

export default Account;