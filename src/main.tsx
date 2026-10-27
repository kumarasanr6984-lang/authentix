import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { ThemeLanguageProvider } from './context/ThemeLanguageContext.tsx';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ThemeLanguageProvider>
      <App />
    </ThemeLanguageProvider>
  </BrowserRouter>
);
