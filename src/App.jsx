// Version: rollback to 3dcb083
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider } from './context/UserContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import Toast from './components/ui/Toast';
import ChatRequestsNotifier from './components/auth/ChatRequestsNotifier';
import { useUser } from './context/UserContext';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/ChatPage';
import SecretLinkPage from './pages/SecretLinkPage';

// Global chat request listener — renders on every page for authenticated users
function GlobalNotifiers() {
  const { userId, isAuthenticated } = useUser();
  if (!isAuthenticated || !userId) return null;
  return <ChatRequestsNotifier userId={userId} />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <UserProvider>
            <ToastProvider>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/room/:roomCode" element={<ChatPage />} />
                <Route path="/s/:token" element={<SecretLinkPage />} />
              </Routes>
              <Toast />
              {/* Global: chat request floater visible on all pages */}
              <GlobalNotifiers />
            </ToastProvider>
          </UserProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
