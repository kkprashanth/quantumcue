import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { EarlyAccess } from './pages/EarlyAccess';
import { SetPassword } from './pages/SetPassword';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';
import { MainLayout } from './components/layout/MainLayout';
import { FullPageLoading } from './components/ui/LoadingSpinner';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const ProvidersList = lazy(() => import('./pages/Providers').then(m => ({ default: m.ProvidersList })));
const ProviderDetail = lazy(() => import('./pages/Providers').then(m => ({ default: m.ProviderDetail })));
const JobCreate = lazy(() => import('./pages/Jobs').then(m => ({ default: m.JobCreate })));
const JobCreateWizard = lazy(() => import('./pages/Jobs').then(m => ({ default: m.JobCreateWizard })));
const JobDetail = lazy(() => import('./pages/Jobs').then(m => ({ default: m.JobDetail })));
const JobsList = lazy(() => import('./pages/Jobs').then(m => ({ default: m.JobsList })));
const JobCompare = lazy(() => import('./pages/Jobs').then(m => ({ default: m.JobCompare })));
const ResultsView = lazy(() => import('./pages/Results').then(m => ({ default: m.ResultsView })));
const AccountSettings = lazy(() => import('./pages/Account').then(m => ({ default: m.AccountSettings })));
const Billing = lazy(() => import('./pages/Account').then(m => ({ default: m.Billing })));
const UserManagement = lazy(() => import('./pages/Account').then(m => ({ default: m.UserManagement })));
const Profile = lazy(() => import('./pages/Settings').then(m => ({ default: m.Profile })));
const UserSettings = lazy(() => import('./pages/Settings').then(m => ({ default: m.UserSettings })));
const Help = lazy(() => import('./pages/Help').then(m => ({ default: m.Help })));
const ModelsList = lazy(() => import('./pages/Models').then(m => ({ default: m.ModelsList })));
const ModelDetail = lazy(() => import('./pages/Models').then(m => ({ default: m.ModelDetail })));
const ModelApiDetails = lazy(() => import('./pages/Models').then(m => ({ default: m.ModelApiDetails })));
const DatasetsList = lazy(() => import('./pages/Datasets').then(m => ({ default: m.DatasetsList })));
const DatasetDetail = lazy(() => import('./pages/Datasets').then(m => ({ default: m.DatasetDetail })));
const DatasetUploadWizard = lazy(() => import('./pages/Datasets').then(m => ({ default: m.DatasetUploadWizard })));
const Documentation = lazy(() => import('./pages/Documentation').then(m => ({ default: m.Documentation })));
const NewProjectWizardPage = lazy(() => import('./pages/Projects/NewProjectWizard').then(m => ({ default: m.NewProjectWizardPage })));
const FullActivity = lazy(() => import('./pages/Activity/FullActivity').then(m => ({ default: m.FullActivity })));

const AdminLayout = lazy(() => import('./components/layout/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminUserManagement = lazy(() => import('./pages/admin/UserManagement').then(m => ({ default: m.UserManagement })));
const AccessCodeManagement = lazy(() => import('./pages/admin/AccessCodeManagement').then(m => ({ default: m.AccessCodeManagement })));
const LoginActivity = lazy(() => import('./pages/admin/LoginActivity').then(m => ({ default: m.LoginActivity })));
const LogoutActivity = lazy(() => import('./pages/admin/LogoutActivity').then(m => ({ default: m.LogoutActivity })));
const ProviderSettings = lazy(() => import('./pages/admin/ProviderSettings').then(m => ({ default: m.ProviderSettings })));
const ProviderConfig = lazy(() => import('./pages/admin/ProviderConfig').then(m => ({ default: m.ProviderConfig })));

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-grey-50 dark:bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-grey-400 dark:text-text-tertiary">404</h1>
        <p className="mt-4 text-grey-600 dark:text-text-secondary">Page not found</p>
        <a href="/dashboard" className="mt-4 inline-block text-navy-700 hover:text-navy-800 dark:text-navy-600 hover:underline">
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ className: 'z-[9999]' }} />
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/invite" element={<EarlyAccess />} />
            <Route path="/set-password/:token" element={<SetPassword />} />
            <Route path="/" element={<Navigate to="/invite" replace />} />

            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <Suspense fallback={<FullPageLoading label="Loading dashboard..." />}>
                    <Dashboard />
                  </Suspense>
                }
              />
              <Route
                path="/activity"
                element={
                  <Suspense fallback={<FullPageLoading label="Loading activity..." />}>
                    <FullActivity />
                  </Suspense>
                }
              />
              <Route
                path="/projects/new"
                element={
                  <Suspense fallback={<FullPageLoading label="Loading project wizard..." />}>
                    <NewProjectWizardPage />
                  </Suspense>
                }
              />
              <Route
                path="/jobs"
                element={
                  <Suspense fallback={<FullPageLoading label="Loading jobs..." />}>
                    <JobsList />
                  </Suspense>
                }
              />
              <Route
                path="/jobs/new"
                element={
                  <Suspense fallback={<FullPageLoading label="Loading job wizard..." />}>
                    <JobCreateWizard />
                  </Suspense>
                }
              />
              <Route
                path="/jobs/new/chat"
                element={
                  <Suspense fallback={<FullPageLoading label="Loading chat..." />}>
                    <JobCreate />
                  </Suspense>
                }
              />
              <Route
                path="/jobs/:jobId"
                element={
                  <Suspense fallback={<FullPageLoading label="Loading job details..." />}>
                    <JobDetail />
                  </Suspense>
                }
              />
              <Route
                path="/jobs/:jobId/compare"
                element={
                  <Suspense fallback={<FullPageLoading label="Loading job comparison..." />}>
                    <JobCompare />
                  </Suspense>
                }
              />
              <Route
                path="/jobs/:jobId/results"
                element={
                  <Suspense fallback={<FullPageLoading label="Loading results..." />}>
                    <ResultsView />
                  </Suspense>
                }
              />
              <Route
                path="/models"
                element={
                  <Suspense fallback={<FullPageLoading label="Loading models..." />}>
                    <ModelsList />
                  </Suspense>
                }
              />
              <Route
                path="/models/:id"
                element={
                  <Suspense fallback={<FullPageLoading label="Loading model details..." />}>
                    <ModelDetail />
                  </Suspense>
                }
              />

              <Route
                path="/models/:id/api-details"
                element={
                  <Suspense fallback={<FullPageLoading label="Loading API details..." />}>
                    <ModelApiDetails />
                  </Suspense>
                }
              />
              <Route
                path="/datasets"
                element={
                  <Suspense fallback={<FullPageLoading label="Loading datasets..." />}>
                    <DatasetsList />
                  </Suspense>
                }
              />
              <Route
                path="/datasets/upload"
                element={
                  <Suspense fallback={<FullPageLoading label="Loading upload wizard..." />}>
                    <DatasetUploadWizard />
                  </Suspense>
                }
              />
              <Route
                path="/datasets/:id"
                element={
                  <Suspense fallback={<FullPageLoading label="Loading dataset details..." />}>
                    <DatasetDetail />
                  </Suspense>
                }
              />
              <Route
                path="/providers"
                element={
                  <Suspense fallback={<FullPageLoading label="Loading providers..." />}>
                    <ProvidersList />
                  </Suspense>
                }
              />
              <Route
                path="/providers/:providerId"
                element={
                  <Suspense fallback={<FullPageLoading label="Loading provider details..." />}>
                    <ProviderDetail />
                  </Suspense>
                }
              />
              <Route
                path="/settings"
                element={
                  <Suspense fallback={<FullPageLoading label="Loading settings..." />}>
                    <UserSettings />
                  </Suspense>
                }
              />
              <Route
                path="/profile"
                element={
                  <Suspense fallback={<FullPageLoading label="Loading profile..." />}>
                    <Profile />
                  </Suspense>
                }
              />
              <Route
                path="/documentation"
                element={
                  <Suspense fallback={<FullPageLoading label="Loading documentation..." />}>
                    <Documentation />
                  </Suspense>
                }
              />
              <Route
                path="/help"
                element={
                  <Suspense fallback={<FullPageLoading label="Loading help..." />}>
                    <Help />
                  </Suspense>
                }
              />

              <Route
                path="/account"
                element={
                  <AdminRoute>
                    <Suspense fallback={<FullPageLoading label="Loading account settings..." />}>
                      <AccountSettings />
                    </Suspense>
                  </AdminRoute>
                }
              />
              <Route
                path="/account/users"
                element={
                  <AdminRoute>
                    <Suspense fallback={<FullPageLoading label="Loading user management..." />}>
                      <UserManagement />
                    </Suspense>
                  </AdminRoute>
                }
              />
              <Route
                path="/billing"
                element={
                  <AdminRoute>
                    <Suspense fallback={<FullPageLoading label="Loading billing..." />}>
                      <Billing />
                    </Suspense>
                  </AdminRoute>
                }
              />
            </Route>

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<Navigate to="users" replace />} />
              <Route
                path="users"
                element={
                  <Suspense fallback={<FullPageLoading label="Loading user management..." />}>
                    <AdminUserManagement />
                  </Suspense>
                }
              />
              <Route
                path="codes"
                element={
                  <Suspense fallback={<FullPageLoading label="Loading access codes..." />}>
                    <AccessCodeManagement />
                  </Suspense>
                }
              />
              <Route
                path="activity"
                element={
                  <Suspense fallback={<FullPageLoading label="Loading login activity..." />}>
                    <LoginActivity />
                  </Suspense>
                }
              />
              <Route
                path="logout-activity"
                element={
                  <Suspense fallback={<FullPageLoading label="Loading logout activity..." />}>
                    <LogoutActivity />
                  </Suspense>
                }
              />
              <Route
                path="providers"
                element={
                  <Suspense fallback={<FullPageLoading label="Loading provider settings..." />}>
                    <ProviderSettings />
                  </Suspense>
                }
              />
              <Route
                path="providers/:providerId"
                element={
                  <Suspense fallback={<FullPageLoading label="Loading provider configuration..." />}>
                    <ProviderConfig />
                  </Suspense>
                }
              />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
