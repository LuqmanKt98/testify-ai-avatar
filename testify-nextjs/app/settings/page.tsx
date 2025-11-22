'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [uniqueCode, setUniqueCode] = useState('');
  const [defaultQuality, setDefaultQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [defaultAvatar, setDefaultAvatar] = useState('Dexter_Lawyer_Sitting_public');
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user) {
      setName(user.name);
      setEmail(user.email);
      setUniqueCode(user.uniqueCode);
    }
  }, [isAuthenticated, user, router]);

  const handleSave = () => {
    // In a real app, this would save to backend
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-brand-navy-900 tracking-tight">Settings</h1>
          <button
            onClick={() => router.push('/lobby')}
            className="px-4 py-2 text-sm font-semibold text-brand-navy-900 hover:text-brand-gold-500 transition-colors rounded-xl hover:bg-gray-100"
          >
            ← Back to Lobby
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-brand-navy-900 mb-6 flex items-center gap-3">
              <span className="text-3xl">👤</span>
              Profile Information
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-navy-900 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-navy-900 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Unique Code
                </label>
                <input
                  type="text"
                  value={uniqueCode}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-600 cursor-not-allowed font-mono"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Your unique code cannot be changed
                </p>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-brand-navy-900 mb-6 flex items-center gap-3">
              <span className="text-3xl">⚙️</span>
              Preferences
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Default Avatar
                </label>
                <select
                  value={defaultAvatar}
                  onChange={(e) => setDefaultAvatar(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-navy-900 focus:border-transparent transition-all duration-200"
                >
                  <option value="Dexter_Lawyer_Sitting_public">Dexter (Lawyer)</option>
                  <option value="Angela_Sitting_public">Angela</option>
                  <option value="Tyler_Sitting_public">Tyler</option>
                  <option value="Monica_Sitting_public">Monica</option>
                  <option value="Josh_Sitting_public">Josh</option>
                  <option value="Anna_Sitting_public">Anna</option>
                  <option value="Eric_Sitting_public">Eric</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Default Quality
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      value="low"
                      checked={defaultQuality === 'low'}
                      onChange={(e) => setDefaultQuality(e.target.value as 'low')}
                      className="w-4 h-4 text-brand-navy-900 border-gray-300 focus:ring-brand-navy-900 focus:ring-2"
                    />
                    <span className="ml-2 text-gray-700 group-hover:text-brand-navy-900 transition-colors font-medium">Low</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      value="medium"
                      checked={defaultQuality === 'medium'}
                      onChange={(e) => setDefaultQuality(e.target.value as 'medium')}
                      className="w-4 h-4 text-brand-navy-900 border-gray-300 focus:ring-brand-navy-900 focus:ring-2"
                    />
                    <span className="ml-2 text-gray-700 group-hover:text-brand-navy-900 transition-colors font-medium">Medium</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      value="high"
                      checked={defaultQuality === 'high'}
                      onChange={(e) => setDefaultQuality(e.target.value as 'high')}
                      className="w-4 h-4 text-brand-navy-900 border-gray-300 focus:ring-brand-navy-900 focus:ring-2"
                    />
                    <span className="ml-2 text-gray-700 group-hover:text-brand-navy-900 transition-colors font-medium">High</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border-t border-gray-200 mt-4">
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Enable Notifications</div>
                  <div className="text-sm text-gray-600">
                    Receive notifications about session updates
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-navy-900/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-navy-900 shadow-sm"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Auto-save Transcripts</div>
                  <div className="text-sm text-gray-600">
                    Automatically save session transcripts
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSave}
                    onChange={(e) => setAutoSave(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-navy-900/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-navy-900 shadow-sm"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-4 bg-brand-navy-900 text-white rounded-xl font-semibold hover:bg-brand-navy-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {saved ? '✓ Saved!' : 'Save Changes'}
            </button>
            <button
              onClick={handleLogout}
              className="px-8 py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Logout
            </button>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-2xl border-2 border-red-300 p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-red-600 mb-4 flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              Danger Zone
            </h2>
            <p className="text-gray-600 mb-5 leading-relaxed">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg">
              Delete Account
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

