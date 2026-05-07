import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Flex, Spinner } from '@chakra-ui/react';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CaseDetails from './pages/CaseDetails';
import Profile from './pages/Profile';
import EvidenceVault from './pages/EvidenceVault';
import EntityGraph from './pages/EntityGraph';
import Sidebar from './components/Sidebar';

function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth();
  if (loading) return <Flex h="100vh" align="center" justify="center"><Spinner size="xl" /></Flex>;
  return currentUser ? <Sidebar>{children}</Sidebar> : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { currentUser, loading } = useAuth();
  if (loading) return <Flex h="100vh" align="center" justify="center"><Spinner size="xl" /></Flex>;
  return currentUser ? <Navigate to="/" /> : children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/case/:caseId" element={<PrivateRoute><CaseDetails /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/vault" element={<PrivateRoute><EvidenceVault /></PrivateRoute>} />
          <Route path="/network" element={<PrivateRoute><EntityGraph /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
export default App;