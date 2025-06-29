'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Bell,
  Shield,
  Globe,
  Palette,
  Volume2,
  Gamepad2,
  Save,
  RotateCcw,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  description: string;
}

const settingsSections: SettingsSection[] = [
  {
    id: 'profile',
    title: 'Profile Settings',
    icon: User,
    description: 'Manage your character and account information'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    description: 'Control how you receive updates and alerts'
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    icon: Shield,
    description: 'Manage your privacy and security preferences'
  },
  {
    id: 'language',
    title: 'Language & Region',
    icon: Globe,
    description: 'Set your language and regional preferences'
  },
  {
    id: 'appearance',
    title: 'Appearance',
    icon: Palette,
    description: 'Customize the look and feel of your interface'
  },
  {
    id: 'audio',
    title: 'Audio Settings',
    icon: Volume2,
    description: 'Adjust volume levels and audio preferences'
  },
  {
    id: 'gameplay',
    title: 'Gameplay',
    icon: Gamepad2,
    description: 'Configure gameplay mechanics and controls'
  }
];

interface ProfileSettings {
  displayName: string;
  bio: string;
  profileVisibility: 'public' | 'friends' | 'private';
  showOnlineStatus: boolean;
}

interface NotificationSettings {
  factionUpdates: boolean;
  missionAlerts: boolean;
  friendRequests: boolean;
  systemMessages: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  activityVisibility: 'public' | 'friends' | 'private';
  allowDirectMessages: boolean;
  allowFriendRequests: boolean;
  twoFactorEnabled: boolean;
}

interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  effectsVolume: number;
  voiceVolume: number;
  muteOnBackground: boolean;
}

interface GameplaySettings {
  autoAcceptMissions: boolean;
  showPlayerNames: boolean;
  enableCrosshair: boolean;
  showMinimap: boolean;
  autoSave: boolean;
  difficulty: 'easy' | 'normal' | 'hard' | 'hardcore';
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [hasChanges, setHasChanges] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { theme, setTheme } = useTheme();

  // Mock settings state - in real app this would come from an API
  const [profileSettings, setProfileSettings] = useState<ProfileSettings>({
    displayName: 'Ghost Rider',
    bio: 'Los Santos veteran with a passion for high-speed chases and faction warfare.',
    profileVisibility: 'friends',
    showOnlineStatus: true
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    factionUpdates: true,
    missionAlerts: true,
    friendRequests: true,
    systemMessages: true,
    emailNotifications: false,
    pushNotifications: true
  });

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: 'friends',
    activityVisibility: 'friends',
    allowDirectMessages: true,
    allowFriendRequests: true,
    twoFactorEnabled: false
  });

  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    masterVolume: 75,
    musicVolume: 60,
    effectsVolume: 80,
    voiceVolume: 70,
    muteOnBackground: true
  });

  const [gameplaySettings, setGameplaySettings] = useState<GameplaySettings>({
    autoAcceptMissions: false,
    showPlayerNames: true,
    enableCrosshair: true,
    showMinimap: true,
    autoSave: true,
    difficulty: 'normal'
  });
  const handleSaveSettings = () => {
    // Mock save functionality - in production this would call the backend API
    console.log('Saving settings...', {
      profileSettings,
      audioSettings,
      gameplaySettings
    });
    setHasChanges(false);
    // You could add a toast notification here for user feedback
  }; const handleResetSettings = () => {
    // Reset all settings to default values
    setProfileSettings({
      displayName: '',
      bio: '',
      profileVisibility: 'public',
      showOnlineStatus: true
    });

    setNotificationSettings({
      factionUpdates: true,
      missionAlerts: true,
      friendRequests: true,
      systemMessages: true,
      emailNotifications: false,
      pushNotifications: true
    });

    setPrivacySettings({
      profileVisibility: 'public',
      activityVisibility: 'public',
      allowDirectMessages: true,
      allowFriendRequests: true,
      twoFactorEnabled: false
    });

    setAudioSettings({
      masterVolume: 100,
      musicVolume: 80,
      effectsVolume: 80,
      voiceVolume: 100,
      muteOnBackground: false
    });

    setGameplaySettings({
      autoAcceptMissions: false,
      showPlayerNames: true,
      enableCrosshair: true,
      showMinimap: true,
      autoSave: true,
      difficulty: 'normal'
    });

    setHasChanges(false);
    console.log('Settings reset to defaults');
  };

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Display Name
        </label>        <input
          type="text"
          value={profileSettings.displayName}
          onChange={(e) => {
            setProfileSettings(prev => ({ ...prev, displayName: e.target.value }));
            setHasChanges(true);
          }}
          aria-label="Display Name"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gang-blue"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Bio
        </label>        <textarea
          value={profileSettings.bio}
          onChange={(e) => {
            setProfileSettings(prev => ({ ...prev, bio: e.target.value }));
            setHasChanges(true);
          }}
          rows={3}
          aria-label="Bio"
          placeholder="Tell others about yourself..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gang-blue"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Profile Visibility
        </label>        <select
          value={profileSettings.profileVisibility}
          onChange={(e) => {
            setProfileSettings(prev => ({ ...prev, profileVisibility: e.target.value as any }));
            setHasChanges(true);
          }}
          aria-label="Profile Visibility"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gang-blue"
        >
          <option value="public">Public</option>
          <option value="friends">Friends Only</option>
          <option value="private">Private</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Show Online Status</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">Let others see when you're online</p>
        </div>        <button
          onClick={() => {
            setProfileSettings(prev => ({ ...prev, showOnlineStatus: !prev.showOnlineStatus }));
            setHasChanges(true);
          }}
          aria-label={`Show online status: ${profileSettings.showOnlineStatus ? 'enabled' : 'disabled'}`}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${profileSettings.showOnlineStatus ? 'bg-gang-blue' : 'bg-gray-300 dark:bg-gray-600'
            }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profileSettings.showOnlineStatus ? 'translate-x-6' : 'translate-x-1'
              }`}
          />
        </button>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      {Object.entries(notificationSettings).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Receive notifications for {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
            </p>
          </div>          <button
            onClick={() => {
              setNotificationSettings(prev => ({ ...prev, [key]: !value }));
              setHasChanges(true);
            }}
            aria-label={`${key.replace(/([A-Z])/g, ' $1').trim()}: ${value ? 'enabled' : 'disabled'}`}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-gang-blue' : 'bg-gray-300 dark:bg-gray-600'
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
          </button>
        </div>
      ))}
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Profile Visibility
        </label>        <select
          value={privacySettings.profileVisibility}
          onChange={(e) => {
            setPrivacySettings(prev => ({ ...prev, profileVisibility: e.target.value as any }));
            setHasChanges(true);
          }}
          aria-label="Profile Visibility"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gang-blue"
        >
          <option value="public">Public</option>
          <option value="friends">Friends Only</option>
          <option value="private">Private</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Activity Visibility
        </label>        <select
          value={privacySettings.activityVisibility}
          onChange={(e) => {
            setPrivacySettings(prev => ({ ...prev, activityVisibility: e.target.value as any }));
            setHasChanges(true);
          }}
          aria-label="Activity Visibility"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gang-blue"
        >
          <option value="public">Public</option>
          <option value="friends">Friends Only</option>
          <option value="private">Private</option>
        </select>
      </div>

      {['allowDirectMessages', 'allowFriendRequests', 'twoFactorEnabled'].map((key) => (
        <div key={key} className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {key === 'twoFactorEnabled' ? 'Add an extra layer of security to your account' :
                `Allow ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
            </p>
          </div>          <button
            onClick={() => {
              setPrivacySettings(prev => ({ ...prev, [key]: !prev[key as keyof PrivacySettings] }));
              setHasChanges(true);
            }}
            aria-label={`${key.replace(/([A-Z])/g, ' $1').trim()}: ${privacySettings[key as keyof PrivacySettings] ? 'enabled' : 'disabled'}`}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${privacySettings[key as keyof PrivacySettings] ? 'bg-gang-blue' : 'bg-gray-300 dark:bg-gray-600'
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${privacySettings[key as keyof PrivacySettings] ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
          </button>
        </div>
      ))}

      <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
        <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Change Password</h4>
        <div className="mt-3 space-y-3">
          <div className="relative">            <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Current password"
            aria-label="Current password"
            className="w-full px-3 py-2 pr-10 border border-yellow-300 dark:border-yellow-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500"
          />            <button
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-2.5 text-gray-500 dark:text-gray-400"
          >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="New password"
            aria-label="New password"
            className="w-full px-3 py-2 border border-yellow-300 dark:border-yellow-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500"
          />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Confirm new password"
            aria-label="Confirm new password"
            className="w-full px-3 py-2 border border-yellow-300 dark:border-yellow-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500"
          />
          <Button variant="outline" size="sm" className="text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-800">
            Update Password
          </Button>
        </div>
      </div>
    </div>
  );

  const renderLanguageSettings = () => (
    <div className="space-y-6">      <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Language
      </label>
      <select
        aria-label="Language"
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gang-blue"
      >
        <option value="en">English</option>
        <option value="ro">Română</option>
      </select>
    </div>      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Region
        </label>
        <select
          aria-label="Region"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gang-blue"
        >
          <option value="us">United States</option>
          <option value="ro">Romania</option>
          <option value="eu">Europe</option>
        </select>
      </div>      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Time Zone
        </label>
        <select
          aria-label="Time Zone"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gang-blue"
        >
          <option value="UTC-8">Pacific Time (UTC-8)</option>
          <option value="UTC-5">Eastern Time (UTC-5)</option>
          <option value="UTC+2">Eastern European Time (UTC+2)</option>
          <option value="UTC+1">Central European Time (UTC+1)</option>
        </select>
      </div>      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Date Format
        </label>
        <select
          aria-label="Date Format"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gang-blue"
        >
          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
        </select>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Theme
        </label>
        <div className="grid grid-cols-3 gap-3">
          {['light', 'dark', 'system'].map((themeOption) => (
            <button
              key={themeOption}
              onClick={() => setTheme(themeOption)}
              className={`p-3 border-2 rounded-md text-center capitalize transition-colors ${theme === themeOption
                ? 'border-gang-blue bg-gang-blue/10 text-gang-blue'
                : 'border-gray-300 dark:border-gray-600 hover:border-gang-blue/50'
                }`}
            >
              {themeOption}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Interface Size
        </label>
        <div className="grid grid-cols-3 gap-3">
          {['small', 'medium', 'large'].map((size) => (
            <button
              key={size}
              className="p-3 border-2 border-gray-300 dark:border-gray-600 rounded-md text-center capitalize hover:border-gang-blue/50 transition-colors"
            >
              {size}
            </button>
          ))}
        </div>
      </div>      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Reduce Motion</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">Minimize animations and transitions</p>
        </div>
        <button
          aria-label="Reduce Motion toggle"
          className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 dark:bg-gray-600 transition-colors"
        >
          <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
        </button>
      </div>      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">High Contrast</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">Increase contrast for better visibility</p>
        </div>
        <button
          aria-label="High Contrast toggle"
          className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 dark:bg-gray-600 transition-colors"
        >
          <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
        </button>
      </div>
    </div>
  );

  const renderAudioSettings = () => (
    <div className="space-y-6">
      {Object.entries(audioSettings).filter(([key]) => key.includes('Volume')).map(([key, value]) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </label>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">0</span>            <input
              type="range"
              min="0"
              max="100"
              value={value}
              onChange={(e) => {
                setAudioSettings(prev => ({ ...prev, [key]: parseInt(e.target.value) }));
                setHasChanges(true);
              }}
              aria-label={`${key.replace(/([A-Z])/g, ' $1').trim()} level`}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">100</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-8 text-right">
              {value}
            </span>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Mute on Background</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">Mute audio when window is not focused</p>
        </div>        <button
          onClick={() => {
            setAudioSettings(prev => ({ ...prev, muteOnBackground: !prev.muteOnBackground }));
            setHasChanges(true);
          }}
          aria-label={`Mute on background: ${audioSettings.muteOnBackground ? 'enabled' : 'disabled'}`}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${audioSettings.muteOnBackground ? 'bg-gang-blue' : 'bg-gray-300 dark:bg-gray-600'
            }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${audioSettings.muteOnBackground ? 'translate-x-6' : 'translate-x-1'
              }`}
          />
        </button>
      </div>
    </div>
  );

  const renderGameplaySettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Difficulty
        </label>        <select
          value={gameplaySettings.difficulty}
          onChange={(e) => {
            setGameplaySettings(prev => ({ ...prev, difficulty: e.target.value as any }));
            setHasChanges(true);
          }}
          aria-label="Difficulty"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gang-blue"
        >
          <option value="easy">Easy</option>
          <option value="normal">Normal</option>
          <option value="hard">Hard</option>
          <option value="hardcore">Hardcore</option>
        </select>
      </div>

      {Object.entries(gameplaySettings).filter(([key]) => key !== 'difficulty').map(([key, value]) => (
        <div key={key} className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {key === 'autoAcceptMissions' ? 'Automatically accept available missions' :
                key === 'showPlayerNames' ? 'Display player names above characters' :
                  key === 'enableCrosshair' ? 'Show targeting crosshair' :
                    key === 'showMinimap' ? 'Display minimap on screen' :
                      'Automatically save game progress'}
            </p>
          </div>          <button
            onClick={() => {
              setGameplaySettings(prev => ({ ...prev, [key]: !value }));
              setHasChanges(true);
            }}
            aria-label={`${key.replace(/([A-Z])/g, ' $1').trim()}: ${value ? 'enabled' : 'disabled'}`}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-gang-blue' : 'bg-gray-300 dark:bg-gray-600'
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
          </button>
        </div>
      ))}
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'privacy':
        return renderPrivacySettings();
      case 'language':
        return renderLanguageSettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'audio':
        return renderAudioSettings();
      case 'gameplay':
        return renderGameplaySettings();
      default:
        return <div>Settings section not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
              {hasChanges && (
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetSettings}
                    className="text-gray-600 dark:text-gray-400"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveSettings}
                    className="bg-gang-blue hover:bg-gang-blue/90"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex">
            {/* Settings Navigation */}
            <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850">
              <nav className="p-4 space-y-2">
                {settingsSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center px-3 py-2 text-left rounded-md transition-colors ${activeSection === section.id
                        ? 'bg-gang-blue text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <div>
                        <div className="font-medium">{section.title}</div>
                        <div className={`text-xs ${activeSection === section.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-500'}`}>
                          {section.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Settings Content */}
            <div className="flex-1 p-6">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {settingsSections.find(s => s.id === activeSection)?.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {settingsSections.find(s => s.id === activeSection)?.description}
                  </p>
                </div>

                {renderActiveSection()}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
