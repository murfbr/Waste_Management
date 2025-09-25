// src/App.jsx

import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { DashboardFilterProvider } from './context/DashboardFilterContext';
import AppRoutes from './router';
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  return (

    <AuthProvider>

      <DashboardFilterProvider>
        <AppRoutes />
      </DashboardFilterProvider>

      <Analytics />
    </AuthProvider>
  );
}