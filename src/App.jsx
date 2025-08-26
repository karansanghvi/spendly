// App.js
import React, { useEffect, useState } from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from "firebase/auth";

import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import SharedDashboard from './pages/SharedDashboard';
import Invite from './pages/Invite';
import LandingPage from './pages/LandingPage';
import { auth } from '../firebase';

// Layout component to hide Navbar/Footer on LandingPage
function Layout({ children }) {
  const location = useLocation();
  const hideLayout = location.pathname === "/";

  return (
    <>
      {!hideLayout && <Navbar />}
      <main className={`min-h-screen ${!hideLayout ? "pt-20 px-4 md:px-10" : "px-6"}`}>
        {children}
      </main>
    </>
  );
}

// Routes component with Firebase auth check
function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Redirect logged-in users to dashboard on initial load
      if (loading) {
        if (user && location.pathname === "/") {
          navigate("/dashboard", { replace: true });
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate, loading, location.pathname]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-700 text-xl">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/expenses" element={<Expenses />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/invite" element={<Invite />} />
      <Route path="/shared-dashboard/:token" element={<SharedDashboard />} />
    </Routes>
  );
}

// Main App
function App() {
  return (
    <Router>
      <Layout>
        <AppRoutes />
      </Layout>
    </Router>
  );
}

export default App;
