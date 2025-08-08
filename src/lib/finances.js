import { api } from './api';

// Fetch total revenue, profit, and other financial metrics
export const getFinancialMetrics = async () => {
  try {
    console.log('💰 FRONTEND: Fetching financial metrics from backend');
    const metrics = await api.get('/finances/metrics');
    
    console.log('✅ FRONTEND: Financial metrics received');
    return metrics;
  } catch (error) {
    console.error('❌ FRONTEND: Error fetching financial metrics:', error);
    throw error;
  }
};

// Fetch recent transactions
export const getRecentTransactions = async () => {
  try {
    console.log('💳 FRONTEND: Fetching recent transactions from backend');
    const transactions = await api.get('/finances/transactions');
    
    console.log('✅ FRONTEND: Recent transactions received');
    return transactions;
  } catch (error) {
    console.error('❌ FRONTEND: Error fetching recent transactions:', error);
    throw error;
  }
};

// Fetch payment methods distribution
export const getPaymentMethods = async () => {
  try {
    console.log('💳 FRONTEND: Fetching payment methods from backend');
    const paymentMethods = await api.get('/finances/payment-methods');
    
    console.log('✅ FRONTEND: Payment methods received');
    return paymentMethods;
  } catch (error) {
    console.error('❌ FRONTEND: Error fetching payment methods:', error);
    throw error;
  }
};

// Fetch revenue trends
export const getRevenueTrends = async (period = 'monthly') => {
  try {
    console.log('📈 FRONTEND: Fetching revenue trends from backend');
    const trends = await api.get(`/finances/trends?period=${period}`);
    
    console.log('✅ FRONTEND: Revenue trends received');
    return trends;
  } catch (error) {
    console.error('❌ FRONTEND: Error fetching revenue trends:', error);
    throw error;
  }
};

// Fetch payout summary
export const getPayoutSummary = async () => {
  try {
    console.log('💸 FRONTEND: Fetching payout summary from backend');
    const payoutSummary = await api.get('/finances/payouts');
    
    console.log('✅ FRONTEND: Payout summary received');
    return payoutSummary;
  } catch (error) {
    console.error('❌ FRONTEND: Error fetching payout summary:', error);
    throw error;
  }
};