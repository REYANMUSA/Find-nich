import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initAnalyticsDeferred } from './lib/analytics.ts';

initAnalyticsDeferred();

createRoot(document.getElementById('root')!).render(<App />);
