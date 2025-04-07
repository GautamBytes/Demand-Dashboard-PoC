// src/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import './index.css';
import App from './App';
import { ThemeProvider } from '@mui/material/styles';
import { customTheme } from './theme';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={customTheme}>
      <App />
    </ThemeProvider>
  </StrictMode>,
);



