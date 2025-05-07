
import React, { useState } from 'react';
import { toast } from 'sonner';

const Settings = () => {
  const [username, setUsername] = useState('Player1234');
  const [darkMode, setDarkMode] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Settings saved successfully', { position: 'top-center' });
  };
  
  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="card-glass p-6">
            <h2 className="text-xl font-medium mb-4">Profile Settings</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm text-gray-400 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  className="bet-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={20}
                />
              </div>
              
              <div className="pt-2">
                <button type="submit" className="primary-button px-6 py-2">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
          
          <div className="card-glass p-6 mt-6">
            <h2 className="text-xl font-medium mb-4">Preferences</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Dark Mode</h3>
                  <p className="text-sm text-gray-400">Switch between light and dark themes</p>
                </div>
                <div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={darkMode}
                      onChange={() => setDarkMode(!darkMode)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-luckpier-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-luckpier-blue"></div>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Sound Effects</h3>
                  <p className="text-sm text-gray-400">Enable or disable game sounds</p>
                </div>
                <div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={soundEnabled}
                      onChange={() => setSoundEnabled(!soundEnabled)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-luckpier-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-luckpier-blue"></div>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Notifications</h3>
                  <p className="text-sm text-gray-400">Get notified about important events</p>
                </div>
                <div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={notificationsEnabled}
                      onChange={() => setNotificationsEnabled(!notificationsEnabled)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-luckpier-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-luckpier-blue"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-1">
          <div className="card-glass p-6">
            <h2 className="text-xl font-medium mb-4">Support</h2>
            <p className="text-gray-400 mb-4">Need help with something? Our support team is here for you.</p>
            <button className="primary-button w-full py-2">Contact Support</button>
          </div>
          
          <div className="card-glass p-6 mt-6">
            <h2 className="text-xl font-medium mb-4">About</h2>
            <div className="space-y-2">
              <p className="text-gray-400">App Version: 1.0.0</p>
              <p className="text-gray-400">Terms of Service</p>
              <p className="text-gray-400">Privacy Policy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
