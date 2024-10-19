import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Dimensions, Modal, StatusBar, FlatList, RefreshControl } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, withRepeat, withSequence, FadeInDown, FadeInUp } from 'react-native-reanimated';
import AnimatedHeader from '../components/AnimatedHeader';
import useScrollPosition from '../hooks/useScrollPosition';
import { getBookingsByPhotographerId } from '../../lib/appwrite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Add these new functions at the top of the file, after imports
const calculateEarnings = (bookings) => {
  const companyFee = 0.15; // 15% company fee
  let totalGross = 0;
  let totalNet = 0;
  let completedBookings = 0;

  bookings.forEach(booking => {
    if (booking.status === 'completed') {
      const price = parseFloat(booking.price);
      totalGross += price;
      totalNet += price * (1 - companyFee);
      completedBookings++;
    }
  });

  const averagePerDay = completedBookings > 0 ? totalNet / completedBookings : 0;
  const completionRate = bookings.length > 0 ? (completedBookings / bookings.length) * 100 : 0;

  return {
    totalGrossEarnings: totalGross,
    totalNetEarnings: totalNet,
    averagePerDay,
    totalBookings: bookings.length,
    completedBookings,
    completionRate
  };
};

const getEarningsData = (bookings, timeFrame) => {
  const companyFee = 0.15;
  const now = new Date();
  const data = {};

  bookings.forEach(booking => {
    if (booking.status === 'completed') {
      const bookingDate = new Date(booking.date);
      let key;

      switch (timeFrame) {
        case 'weekly':
          key = bookingDate.toLocaleDateString('en-US', { weekday: 'short' });
          break;
        case 'monthly':
          key = bookingDate.getDate().toString();
          break;
        case 'yearly':
          key = bookingDate.toLocaleDateString('en-US', { month: 'short' });
          break;
      }

      if (!data[key]) {
        data[key] = 0;
      }
      data[key] += parseFloat(booking.price) * (1 - companyFee);
    }
  });

  return Object.entries(data).map(([day, amount]) => ({ day, amount }));
};

const Earnings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState('weekly');
  const [summaryData, setSummaryData] = useState({
    totalGrossEarnings: 0,
    totalNetEarnings: 0,
    averagePerDay: 0,
    totalBookings: 0,
    completedBookings: 0,
    completionRate: 0
  });
  const [selectedCard, setSelectedCard] = useState(null);
  const [earningsData, setEarningsData] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const navigation = useNavigation();
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const scrollY = useScrollPosition();
  const bellRotate = useSharedValue(0);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const fetchedBookings = await getBookingsByPhotographerId(userId);
        setBookings(fetchedBookings);
        const earnings = calculateEarnings(fetchedBookings);
        setSummaryData(earnings);
        setEarningsData(getEarningsData(fetchedBookings, timeFrame));
        
        // Set recent transactions
        const sortedBookings = fetchedBookings
          .filter(booking => booking.status === 'completed')
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 10);
        setRecentTransactions(sortedBookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleTimeFrameChange = (newTimeFrame) => {
    setTimeFrame(newTimeFrame);
    setEarningsData(getEarningsData(bookings, newTimeFrame));
  };

  const animateBell = () => {
    bellRotate.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(-1, { duration: 200 }),
      withTiming(0, { duration: 200 })
    );
  };

  const IconAnimation = ({ name, color }) => {
    const scale = useSharedValue(1);

    useEffect(() => {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(1, { duration: 1000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        true
      );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <Animated.View style={animatedStyle}>
        <FontAwesome5 name={name} size={20} color={color} />
      </Animated.View>
    );
  };

  const SummaryCard = ({ title, value, icon, delay, onPress }) => (
    <Animatable.View 
      animation="fadeInUp" 
      delay={delay} 
      className="w-full bg-white rounded-xl p-4 shadow-sm"
    >
      <TouchableOpacity onPress={onPress} className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="bg-sky-100 rounded-full p-3 mr-4">
            <FontAwesome5 name={icon} size={20} color="#0284c7" />
          </View>
          <View className="flex-1">
            <Text className="text-sm text-sky-600">{title}</Text>
            <Animatable.Text 
              animation="fadeIn" 
              delay={delay + 300} 
              className="text-lg font-bold text-sky-800"
            >
              {value}
            </Animatable.Text>
          </View>
        </View>
        <Animatable.View 
          animation="fadeIn" 
          delay={delay + 600}
          className="bg-sky-500 rounded-full px-4 py-2"
        >
          <Text className="text-sm text-white font-medium">View</Text>
        </Animatable.View>
      </TouchableOpacity>
    </Animatable.View>
  );

  const RecentTransactions = ({ transactions }) => (
    <Animatable.View animation="fadeIn" className="w-full bg-white rounded-xl shadow-sm mt-6 pb-6">
      <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
        <Text className="text-lg font-pbold text-sky-800">Recent Transactions</Text>
        <TouchableOpacity className="flex-row items-center" onPress={() => setShowAllTransactions(true)}>
          <Text className="text-sm font-pregular text-sky-600 mr-1">See All</Text>
          <Ionicons name="chevron-forward" size={14} color="#0284c7" />
        </TouchableOpacity>
      </View>
      <ScrollView className="p-4" style={{ maxHeight: 300 }}>
        {transactions.map((item, index) => (
          <TransactionCard key={item.$id} item={item} index={index} />
        ))}
      </ScrollView>
    </Animatable.View>
  );

  const TransactionCard = ({ item, index }) => (
    <Animatable.View 
      animation="fadeInUp" 
      delay={index * 100}
      className="mb-4 last:mb-0"
    >
      <LinearGradient
        colors={['#f0f9ff', '#e0f2fe']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-3 rounded-lg"
      >
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-sm font-psemibold text-gray-800">{item.package}</Text>
            <Text className="text-xs font-pregular text-gray-600 mt-1">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
          </View>
          <View className="items-end">
            <Text className="text-sm font-pbold text-gray-900">TZS {parseFloat(item.price).toLocaleString()}</Text>
            <Text className="text-xs font-pregular text-gray-600 mt-1">{JSON.parse(item.userDetails).name}</Text>
          </View>
        </View>
        <View className="mt-2 self-start bg-green-100 px-2 py-1 rounded-full">
          <Text className="text-xs font-psemibold text-green-800">Completed</Text>
        </View>
      </LinearGradient>
    </Animatable.View>
  );

  const AllTransactionsModal = ({ visible, onClose, transactions }) => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-green-50">
        <SafeAreaView className="flex-1">
          <View className="flex-row justify-between items-center p-4 bg-white">
            <Text className="text-xl font-pbold text-sky-800">All Transactions</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#0284c7" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={transactions}
            renderItem={({ item, index }) => (
              <TransactionCard item={item} index={index} />
            )}
            keyExtractor={(item) => item.$id}
            contentContainerStyle={{ padding: 16 }}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );

  const handleViewDetailedReport = () => {
    const completedBookings = bookings.filter(booking => booking.status === 'completed');
    navigation.navigate('DetailedEarningsReport', { 
      bookings: completedBookings.map(booking => ({
        $id: booking.$id,
        date: booking.date,
        package: booking.package,
        price: booking.price,
      }))
    });
  };

  const DetailModal = ({ visible, onClose, data }) => {
    if (!data) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View className="flex-1 justify-end">
          <BlurView intensity={90} tint="light" className="rounded-t-3xl overflow-hidden">
            <SafeAreaView className="bg-white/90 p-6 rounded-t-3xl">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="font-pbold text-2xl text-sky-800">{data.title}</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color="#0284c7" />
                </TouchableOpacity>
              </View>
              <Animatable.View animation="fadeInUp" delay={300}>
                <Text className="font-pbold text-4xl text-sky-900 mb-4">{data.value}</Text>
                <Text className="font-pmedium text-sky-600 mb-2">Breakdown:</Text>
                {data.breakdown.map((item, index) => (
                  <View key={index} className="flex-row justify-between mb-2">
                    <Text className="font-pmedium text-sky-800">{item.label}</Text>
                    <Text className="font-pbold text-sky-800">{item.value}</Text>
                  </View>
                ))}
              </Animatable.View>
              <Animatable.View animation="fadeInUp" delay={600} className="mt-6">
                <TouchableOpacity 
                  className="bg-sky-500 rounded-xl p-4"
                  onPress={handleViewDetailedReport}
                >
                  <Text className="font-pbold text-white text-center">View Detailed Report</Text>
                </TouchableOpacity>
              </Animatable.View>
            </SafeAreaView>
          </BlurView>
        </View>
      </Modal>
    );
  };

  const handleCardPress = (cardData) => {
    setSelectedCard(cardData);
  };

  const EarningsOverview = () => (
    <Animatable.View animation="fadeIn" className="bg-green-500/10 rounded-3xl p-5 mb-6">
      <BlurView intensity={10} tint="light" className="absolute inset-0 rounded-3xl" />
      <Text className="font-pbold text-xl text-green-800 mb-4">Earnings Overview</Text>
      <View className="flex-row items-center justify-between w-full mb-4">
        {['weekly', 'monthly', 'yearly'].map((period) => (
          <TouchableOpacity
            key={period}
            onPress={() => handleTimeFrameChange(period)}
            className={`px-4 py-2 rounded-full ${timeFrame === period ? 'bg-green-500' : 'bg-white'}`}
          >
            <Text className={`font-pmedium text-sm ${timeFrame === period ? 'text-white' : 'text-green-800'}`}>
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {earningsData.map((item, index) => (
        <Animatable.View 
          key={item.day} 
          animation="fadeInUp" 
          delay={index * 100}
          className="flex-row justify-between items-center py-3 border-b border-green-200"
        >
          <Text className="font-pmedium text-green-700">{item.day}</Text>
          <Text className="font-pbold text-green-800">TSh {item.amount.toLocaleString()}</Text>
        </Animatable.View>
      ))}
    </Animatable.View>
  );

  const renderHeader = () => (
    <View className="px-4 pt-5">
      <Animated.View 
        entering={FadeInDown}
        className="w-full mb-8"
      >
        <BlurView intensity={20} tint="light" className="rounded-3xl overflow-hidden">
          <View className="bg-sky-800 p-5">
            <Text className="font-pmedium text-base text-sky-200">Quick Stats</Text>
            <Text className="font-pbold text-2xl text-white mt-1">Earnings Overview</Text>
            
            <View className="mt-4 space-y-4">
              <View className="flex-row justify-between">
                <StatCard 
                  title="Gross Earnings" 
                  value={`TZS ${summaryData.totalGrossEarnings.toLocaleString()}`} 
                  icon="money-bill-wave" 
                  color="sky"
                />
                <StatCard 
                  title="Net Earnings" 
                  value={`TZS ${summaryData.totalNetEarnings.toLocaleString()}`} 
                  icon="money-bill-alt" 
                  color="blue"
                />
              </View>
              <View className="flex-row justify-between">
                <StatCard 
                  title="Total Bookings" 
                  value={summaryData.totalBookings.toString()} 
                  icon="calendar-check" 
                  color="sky"
                />
                <StatCard 
                  title="Completion Rate" 
                  value={`${summaryData.completionRate.toFixed(1)}%`} 
                  icon="check-circle" 
                  color="sky"
                />
              </View>
            </View>
          </View>
        </BlurView>
      </Animated.View>
    </View>
  );

  const CustomRefreshControl = ({ refreshing }) => {
    if (!refreshing) return null;

    return (
      <View className="w-full h-full flex justify-center items-center bg-white/80">
        <BlurView intensity={20} tint="light" className="flex-1 justify-center items-center">
          <Animatable.View animation="pulse" easing="ease-out" iterationCount="infinite">
            <FontAwesome5 name="chart-line" size={64} color="#0284c7" />
          </Animatable.View>
          <Animatable.Text animation="fadeIn" className="mt-4 text-sky-800 font-pbold text-lg">
            Refreshing Earnings...
          </Animatable.Text>
        </BlurView>
      </View>
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookings();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <BlurView intensity={20} tint="light" className="flex-1 justify-center items-center">
          <Animatable.View animation="pulse" easing="ease-out" iterationCount="infinite">
            <FontAwesome5 name="chart-line" size={64} color="#0284c7" />
          </Animatable.View>
          <Animatable.Text animation="fadeIn" className="mt-4 text-sky-800 font-pbold text-lg">
            Loading Earnings...
          </Animatable.Text>
        </BlurView>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" />
      <AnimatedHeader 
        scrollY={scrollY} 
        title="Earnings" 
        onBellPress={animateBell}
        bellRotate={bellRotate}
      />
      <SafeAreaView className="flex-1" edges={['right', 'left', 'bottom']}>
        <Animated.ScrollView 
          className="w-full h-full"
          contentContainerStyle={{ paddingTop: StatusBar.currentHeight + 70 }}
          onScroll={scrollY.scrollHandler}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="transparent"
              colors={['transparent']}
              style={{ backgroundColor: 'transparent' }}
            />
          }
        >
          {renderHeader()}
          <View className="w-full px-4">
            <EarningsOverview />

            <View className="w-full space-y-4">
              <SummaryCard 
                title="Gross Earnings" 
                value={`TZS ${summaryData.totalGrossEarnings.toLocaleString()}`} 
                icon="money-bill-wave" 
                delay={200}
                onPress={() => handleCardPress({
                  title: "Gross Earnings",
                  value: `TZS ${summaryData.totalGrossEarnings.toLocaleString()}`,
                  breakdown: [
                    { label: "Net Earnings", value: `TZS ${summaryData.totalNetEarnings.toLocaleString()}` },
                    { label: "Company Fee", value: `TZS ${(summaryData.totalGrossEarnings - summaryData.totalNetEarnings).toLocaleString()}` },
                    { label: "Completed Bookings", value: summaryData.completedBookings.toString() },
                  ]
                })}
              />
              <SummaryCard 
                title="Avg. Per Day" 
                value={`TZS ${summaryData.averagePerDay.toLocaleString()}`} 
                icon="chart-line" 
                delay={400}
                onPress={() => handleCardPress({
                  title: "Average Per Day",
                  value: `TZS ${summaryData.averagePerDay.toLocaleString()}`,
                  breakdown: [
                    { label: "Total Net Earnings", value: `TZS ${summaryData.totalNetEarnings.toLocaleString()}` },
                    { label: "Completed Bookings", value: summaryData.completedBookings.toString() },
                    { label: "Avg. Booking Value", value: `TZS ${(summaryData.totalNetEarnings / summaryData.completedBookings).toLocaleString()}` },
                  ]
                })}
              />
              <SummaryCard 
                title="Total Bookings" 
                value={summaryData.totalBookings.toString()} 
                icon="calendar-check" 
                delay={600}
                onPress={() => handleCardPress({
                  title: "Total Bookings",
                  value: summaryData.totalBookings.toString(),
                  breakdown: [
                    { label: "Completed", value: summaryData.completedBookings.toString() },
                    { label: "Pending", value: (summaryData.totalBookings - summaryData.completedBookings).toString() },
                    { label: "Completion Rate", value: `${summaryData.completionRate.toFixed(1)}%` },
                  ]
                })}
              />
              <SummaryCard 
                title="Completion Rate" 
                value={`${summaryData.completionRate.toFixed(1)}%`} 
                icon="check-circle" 
                delay={800}
                onPress={() => handleCardPress({
                  title: "Completion Rate",
                  value: `${summaryData.completionRate.toFixed(1)}%`,
                  breakdown: [
                    { label: "Completed Bookings", value: summaryData.completedBookings.toString() },
                    { label: "Total Bookings", value: summaryData.totalBookings.toString() },
                    { label: "Avg. Earnings per Booking", value: `TZS ${(summaryData.totalNetEarnings / summaryData.completedBookings).toLocaleString()}` },
                  ]
                })}
              />
            </View>

            <RecentTransactions transactions={recentTransactions} />
          </View>
        </Animated.ScrollView>
        <CustomRefreshControl refreshing={refreshing} />
      </SafeAreaView>

      <DetailModal 
        visible={!!selectedCard} 
        onClose={() => setSelectedCard(null)} 
        data={selectedCard}
      />

      <AllTransactionsModal
        visible={showAllTransactions}
        onClose={() => setShowAllTransactions(false)}
        transactions={recentTransactions}
      />
    </View>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <View className={`bg-${color}-100 rounded-xl p-3 w-[48%]`}>
    <View className="flex-row items-center mb-2">
      <FontAwesome5 name={icon} size={16} color={`#${color === 'sky' ? '0284c7' : color === 'green' ? '22c55e' : color === 'yellow' ? 'eab308' : '6366f1'}`} />
      <Text className={`text-xs font-pregular text-${color}-800 ml-2`}>{title}</Text>
    </View>
    <Text className={`text-lg font-pbold text-${color}-900`}>{value}</Text>
  </View>
);

export default Earnings;