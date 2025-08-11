import React from 'react';
import { Navigate } from 'react-router-dom';

// Usage: <PrivateRoute><Component /></PrivateRoute>
export default function PrivateRoute({ children }) {
  const user = localStorage.getItem('user');
  if (!user) {
    // Not authenticated, redirect to login
    return <Navigate to="/login" replace />;
  }
  // Authenticated, render the children
  return children;
}
