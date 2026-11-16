import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { RewardProvider } from './context/RewardContext';
import { App } from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 20_000, refetchOnWindowFocus: false, retry: 1 },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <ToastProvider>
          <AuthProvider>
            <RewardProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </RewardProvider>
          </AuthProvider>
        </ToastProvider>
      </SettingsProvider>
    </QueryClientProvider>
  </StrictMode>
);
