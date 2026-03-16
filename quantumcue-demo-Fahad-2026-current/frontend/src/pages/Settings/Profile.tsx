/**
 * User profile page with cleaner, modern design.
 */

import { useState, useEffect } from 'react';
import { User, Loader2, Save, AlertCircle, Check, Camera, Shield, Calendar, Activity } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useProfile, useUpdateProfile, useChangePassword } from '../../hooks/useAccount';

export const Profile = () => {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Initialize form when profile loads
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
    }
  }, [profile]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({
        first_name: firstName,
        last_name: lastName,
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch {
      // Error handled by mutation
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      return;
    }

    try {
      await changePassword.mutateAsync({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
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

  if (!profile) {
    return (
      <PageContainer>
        <div className="max-w-3xl mx-auto mt-12">
          <Card className="p-8 text-center border-error/20 bg-error/5">
            <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
            <h2 className="text-gray-900 font-semibold text-lg mb-2">
              Unable to Load Profile
            </h2>
            <p className="text-gray-500">
              There was an error loading your profile information. Please try again later.
            </p>
          </Card>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-500 mt-1">Manage your personal information and security settings</p>
        </div>

        <div className="space-y-8">
          {/* Profile Header Card */}
          <Card className="p-6 md:p-8 border-gray-200 shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-quantum-500 to-purple-600 flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-3xl">
                    {profile.first_name?.[0] || profile.email[0].toUpperCase()}
                    {profile.last_name?.[0] || ''}
                  </span>
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 shadow-sm transition-colors text-gray-600">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center md:text-left flex-1">
                <h2 className="text-xl font-semibold text-gray-900">
                  {profile.first_name} {profile.last_name}
                </h2>
                <p className="text-gray-500 mb-3">{profile.email}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <Badge variant="quantum" className="bg-gray-100 text-gray-700 border-gray-200">
                    <Shield className="w-3 h-3 mr-1" />
                    {profile.role === 'admin' ? 'Administrator' : 'User'}
                  </Badge>
                  <Badge variant={profile.status === 'active' ? 'success' : 'error'} className="bg-green-50 text-green-700 border-green-200">
                    <Activity className="w-3 h-3 mr-1" />
                    {profile.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="quantum" className="bg-gray-100 text-gray-700 border-gray-200">
                    <Calendar className="w-3 h-3 mr-1" />
                    Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Personal Information */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 border-l-4 border-quantum-500 pl-3">
                Personal Information
              </h3>
            </div>
            <form onSubmit={handleProfileSubmit}>
              <Card className="p-6 md:p-8 border-gray-200 shadow-sm">
                {updateProfile.error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm">{(updateProfile.error as Error).message || 'Failed to update profile'}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Input
                    label="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  />
                  <Input
                    label="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  />
                </div>

                <div className="mb-6">
                  <Input
                    label="Email Address"
                    type="email"
                    value={profile.email}
                    disabled
                    helperText="Contact support to change your email"
                    className="bg-gray-100 text-gray-500 border-transparent"
                  />
                </div>

                <div className="flex items-center justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={updateProfile.isPending}
                    leftIcon={updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : profileSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    variant={profileSuccess ? 'secondary' : 'primary'}
                    className="min-w-[140px]"
                  >
                    {updateProfile.isPending ? 'Saving...' : profileSuccess ? 'Saved' : 'Save Changes'}
                  </Button>
                </div>
              </Card>
            </form>
          </section>

          {/* Security */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 border-l-4 border-purple-500 pl-3">
                Security
              </h3>
            </div>
            <form onSubmit={handlePasswordSubmit}>
              <Card className="p-6 md:p-8 border-gray-200 shadow-sm">
                {changePassword.error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm">{(changePassword.error as Error).message || 'Failed to change password'}</p>
                  </div>
                )}

                <div className="space-y-5 max-w-xl">
                  <Input
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input
                      label="New Password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      helperText="Min. 8 characters"
                      className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    />

                    <Input
                      label="Confirm Password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      error={confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match' : undefined}
                      className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end pt-6 border-t border-gray-100 mt-6">
                  <Button
                    type="submit"
                    disabled={
                      changePassword.isPending ||
                      !currentPassword ||
                      !newPassword ||
                      newPassword !== confirmPassword ||
                      newPassword.length < 8
                    }
                    leftIcon={changePassword.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : passwordSuccess ? <Check className="w-4 h-4" /> : undefined}
                    variant={passwordSuccess ? 'secondary' : 'primary'}
                    className="min-w-[160px]"
                  >
                    {changePassword.isPending ? 'Updating...' : passwordSuccess ? 'Password Updated' : 'Update Password'}
                  </Button>
                </div>
              </Card>
            </form>
          </section>
        </div>
      </div>
    </PageContainer>
  );
};

export default Profile;
