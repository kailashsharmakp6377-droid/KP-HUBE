import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AdminPortalApp } from './AdminPortalApp.tsx';

createRoot(document.getElementById('admin-root')!).render(
  <StrictMode>
    <AdminPortalApp />
  </StrictMode>
);
