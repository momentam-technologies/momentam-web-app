"use client";
import { useState } from 'react';
import { authAPI } from '@/lib/api';

export default function TestConnection() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await authAPI.testConnection();
      setResult({ success: true, data: response });
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await authAPI.login('admin@momentam.com', 'admin123');
      setResult({ success: true, data: response });
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Connection Test</h1>
      
      <div className="space-y-4">
        <button
          onClick={testConnection}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Connection'}
        </button>
        
        <button
          onClick={testLogin}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50 ml-4"
        >
          {loading ? 'Testing...' : 'Test Login'}
        </button>
      </div>

      {result && (
        <div className="mt-4 p-4 border rounded">
          <h3 className="font-bold mb-2">
            {result.success ? '✅ Success' : '❌ Error'}
          </h3>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 