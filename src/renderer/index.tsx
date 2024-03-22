import App from './router';
import { RecoilRoot } from 'recoil';
import log from 'electron-log';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from '@/components/ErrorFallback';

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <ErrorBoundary
    fallback={<ErrorFallback />}
    onError={(error, info) => {
      log.error('react error boundary', { error, info });
    }}
  >
    <RecoilRoot>
      <App />
    </RecoilRoot>
  </ErrorBoundary>
);
