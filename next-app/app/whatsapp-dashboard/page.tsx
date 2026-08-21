'use client';

import { useState, useEffect } from 'react';

export default function WhatsAppDashboard() {
  const [stats, setStats] = useState({
    totalDoctors: 0,
    messagesToday: 0,
    scheduledMessages: 0,
    deliveryRate: 0
  });
  const [recentActivity, setRecentActivity] = useState<Array<{ description: string; timestamp: string }>>([]);
  const [testMessage, setTestMessage] = useState({
    doctorName: '',
    phoneNumber: ''
  });
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    // Fetch dashboard statistics
    fetchDashboardStats();
  }, []);

  async function fetchDashboardStats() {
    try {
      const response = await fetch('/api/hopetech/whatsapp/analytics/dashboard');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  async function sendTestMessage() {
    try {
      const response = await fetch('/api/hopetech/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorName: testMessage.doctorName,
          phoneNumber: testMessage.phoneNumber
        })
      });

      const result = await response.json();
      setTestResult(result);

      if (result.success) {
        alert(`✓ Test message sent successfully to ${testMessage.doctorName}!`);
      } else {
        alert(`✗ Failed to send test message: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">WhatsApp Dashboard - Hope Hospital</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-gray-600 text-sm font-medium">Total Doctors</h3>
          <p className="text-3xl font-bold text-gray-800">{stats.totalDoctors}</p>
          <p className="text-xs text-gray-500 mt-2">With WhatsApp enabled</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-gray-600 text-sm font-medium">Messages Today</h3>
          <p className="text-3xl font-bold text-green-600">{stats.messagesToday}</p>
          <p className="text-xs text-gray-500 mt-2">Successfully delivered</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-gray-600 text-sm font-medium">Scheduled</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.scheduledMessages}</p>
          <p className="text-xs text-gray-500 mt-2">Pending messages</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <h3 className="text-gray-600 text-sm font-medium">Delivery Rate</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.deliveryRate}%</p>
          <p className="text-xs text-gray-500 mt-2">Success rate</p>
        </div>
      </div>

      {/* Test Message Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">🌅 Send Test Good Morning Message</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Doctor Name (e.g., Dr. Sharma)"
            value={testMessage.doctorName}
            onChange={(e) => setTestMessage({...testMessage, doctorName: e.target.value})}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
          />
          <input
            type="text"
            placeholder="Phone Number (e.g., +917030974619)"
            value={testMessage.phoneNumber}
            onChange={(e) => setTestMessage({...testMessage, phoneNumber: e.target.value})}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
          />
          <button
            onClick={sendTestMessage}
            className="bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 font-medium"
          >
            Send Test Message
          </button>
        </div>
        {testResult && (
          <div className={`mt-4 p-3 rounded ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {testResult.message}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg hover:from-green-600 hover:to-green-700 font-medium shadow-md transition-all">
          🌅 Manage Good Morning Campaign
        </button>
        <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg hover:from-blue-600 hover:to-blue-700 font-medium shadow-md transition-all">
          👨‍⚕️ Manage Doctor Registry
        </button>
        <button className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg hover:from-purple-600 hover:to-purple-700 font-medium shadow-md transition-all">
          📊 View Analytics & Reports
        </button>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <div className="space-y-2">
          {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
            <div key={index} className="border-b pb-3">
              <p className="text-sm text-gray-700">{activity.description}</p>
              <p className="text-xs text-gray-400">{activity.timestamp}</p>
            </div>
          )) : (
            <p className="text-gray-500 text-center py-4">No recent activity to display</p>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-200">
        <h3 className="font-bold text-gray-800 mb-2">🤖 System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Doubletick API:</span>
            <span className="text-green-600 ml-2">✓ Connected</span>
          </div>
          <div>
            <span className="font-medium">Good Morning Template:</span>
            <span className="text-green-600 ml-2">✓ Ready to use</span>
          </div>
          <div>
            <span className="font-medium">WhatsApp Database:</span>
            <span className="text-blue-600 ml-2">• Setup required</span>
          </div>
          <div>
            <span className="font-medium">Doctor Registry:</span>
            <span className="text-blue-600 ml-2">• Ready for registration</span>
          </div>
        </div>
      </div>
    </div>
  );
}