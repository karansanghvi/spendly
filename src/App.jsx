import React from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Footer from './components/Footer';
import SharedDashboard from './pages/SharedDashboard'; 
import Invite from './pages/Invite'; 

function App() {
  return (
    <Router>
      <Navbar />
      <main className="min-h-screen pt-20 px-4 md:px-10">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/invite" element={<Invite />} /> 
          <Route path="/shared-dashboard/:token" element={<SharedDashboard />} /> 
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;
