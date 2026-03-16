/**
 * User settings/preferences page with clean, professional design.
 */

import { useState, useEffect } from 'react';
import { Moon, Sun, Bell, Loader2, Check, Globe, ShieldAlert, Laptop, Mail } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useProfile, useUpdateProfile } from '../../hooks/useAccount';
import { useTheme } from '../../contexts/ThemeContext';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

const ToggleSwitch = ({ enabled, onChange, disabled }: ToggleSwitchProps) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!enabled)}
    disabled={disabled}
    className={`
      relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-quantum-500
      ${enabled ? 'bg-quantum-600' : 'bg-gray-200'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}
    aria-label={enabled ? 'Disable' : 'Enable'}
  >
    <span
      className={`
        inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out
        ${enabled ? 'translate-x-6' : 'translate-x-1'}
      `}
    />
  </button>
);

interface SettingsRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  isLast?: boolean;
}

const SettingsRow = ({ icon, title, description, children, isLast }: SettingsRowProps) => (
  <div className={`flex items-center justify-between py-5 ${!isLast ? 'border-b border-gray-100' : ''}`}>
    <div className="flex items-start gap-4 pr-4">
      <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-900 leading-tight">{title}</h4>
        <p className="text-sm text-gray-500 mt-1 leading-snug">{description}</p>
      </div>
    </div>
    <div className="shrink-0 pl-4">{children}</div>
  </div>
);

export const UserSettings = () => {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { theme: currentTheme, setTheme: setThemeContext } = useTheme();

  // Local state for preferences
  const [emailNotifications, setEmailNotifications] = useState(
    (profile?.preferences?.email_notifications as boolean) ?? true
  );
  const [jobNotifications, setJobNotifications] = useState(
    (profile?.preferences?.job_notifications as boolean) ?? true
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync theme with context
  useEffect(() => {
    if (profile?.preferences?.theme) {
      const prefTheme = profile.preferences.theme as 'light' | 'dark';
      if (prefTheme !== currentTheme) {
        setThemeContext(prefTheme);
      }
    }
  }, [profile, currentTheme, setThemeContext]);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setThemeContext(newTheme);
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        preferences: {
          theme: currentTheme,
          email_notifications: emailNotifications,
          job_notifications: jobNotifications,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-[60vh]">
          <LoadingSpinner />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto py-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Preferences</h1>
            <p className="text-gray-500 mt-1">Customize your workspace experience</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={updateProfile.isPending}
            leftIcon={updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <Check className="w-4 h-4" /> : undefined}
            variant={saveSuccess ? 'primary' : 'primary'}
            className="min-w-[120px] shadow-sm"
          >
            {updateProfile.isPending ? 'Saving...' : saveSuccess ? 'Saved' : 'Save Changes'}
          </Button>
        </div>

        <div className="space-y-8">
          {/* Appearance Section */}
          <section>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 px-1">Appearance</h3>
            <Card className="px-6 py-2 border-gray-200 shadow-sm rounded-2xl">
              <SettingsRow
                icon={<Laptop className="w-5 h-5" />}
                title="Theme Mode"
                description="Select your preferred interface appearance"
                isLast
              >
                <div className="flex p-1 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${currentTheme === 'light'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                      }`}
                  >
                    <Sun className="w-4 h-4" />
                    Light
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${currentTheme === 'dark'
                      ? 'bg-navy-800 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                      }`}
                  >
                    <Moon className="w-4 h-4" />
                    Dark
                  </button>
                </div>
              </SettingsRow>
            </Card>
          </section>

          {/* Notifications Section */}
          <section>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 px-1">Notifications</h3>
            <Card className="px-6 py-2 border-gray-200 shadow-sm rounded-2xl">
              <SettingsRow
                icon={<Mail className="w-5 h-5" />}
                title="Email Updates"
                description="Receive important updates about your account via email"
              >
                <ToggleSwitch
                  enabled={emailNotifications}
                  onChange={setEmailNotifications}
                />
              </SettingsRow>

              <SettingsRow
                icon={<Bell className="w-5 h-5" />}
                title="Job Alerts"
                description="Get notified immediately when your jobs complete or fail"
                isLast
              >
                <ToggleSwitch
                  enabled={jobNotifications}
                  onChange={setJobNotifications}
                />
              </SettingsRow>
            </Card>
          </section>

          {/* Localization Section */}
          <section>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 px-1">Localization</h3>
            <Card className="px-6 py-2 border-gray-200 shadow-sm rounded-2xl">
              <SettingsRow
                icon={<Globe className="w-5 h-5" />}
                title="Language"
                description="Select your preferred display language"
                isLast
              >
                <select
                  className="pl-3 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-quantum-500/20 focus:border-quantum-500 transition-colors cursor-pointer"
                  defaultValue="en"
                >
                  <option value="en">English (US)</option>
                  <option value="en-gb" disabled>English (UK)</option>
                  <option value="es" disabled>Spanish</option>
                  <option value="fr" disabled>French</option>
                  <option value="de" disabled>German</option>
                </select>
              </SettingsRow>
            </Card>
          </section>

          {/* Danger Zone */}
          <section>
            <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-4 px-1">Danger Zone</h3>
            <Card className="px-6 py-2 border-red-100 bg-red-50/10 shadow-sm rounded-2xl">
              <SettingsRow
                icon={<ShieldAlert className="w-5 h-5 text-red-500" />}
                title="Delete Account"
                description="Permanently delete your account and all associated data"
                isLast
              >
                <Button variant="danger" size="sm" disabled className="bg-red-50 text-red-600 hover:bg-red-100 border-red-100">
                  Delete Account
                </Button>
              </SettingsRow>
            </Card>
          </section>
        </div>
      </div>
    </PageContainer>
  );
};

export default UserSettings;
