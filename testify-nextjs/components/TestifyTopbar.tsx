'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';

export default function TestifyTopbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems = [
    { label: 'Lobby', path: '/lobby', icon: '🏠' },
    { label: 'Sessions', path: '/sessions', icon: '📝' },
    { label: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group transition-transform hover:scale-105"
            onClick={() => router.push('/lobby')}
          >
            <div className="w-10 h-10 bg-brand-navy-900 rounded-lg overflow-hidden shadow-md transition-transform group-hover:rotate-6">
              <Image
                src="/logo.png"
                alt="Testify Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-brand-navy-900 tracking-tight">Testify</h1>
              <p className="text-xs text-gray-500 font-medium">AI Interview Training</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-brand-navy-900 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-brand-navy-900'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden sm:block text-right">
                <div className="text-sm font-semibold text-brand-navy-900">
                  {user.name}
                </div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all duration-200 hover:shadow-md text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center gap-2 pb-3 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap text-sm ${
                isActive(item.path)
                  ? 'bg-brand-navy-900 text-white shadow-md'
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

