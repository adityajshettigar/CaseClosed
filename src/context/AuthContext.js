import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Create a context to hold user info
const AuthContext = createContext();

// Create a simple "hook" to use the context
export function useAuth() {
  return useContext(AuthContext);
}

// Create a "provider" component to wrap our app
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This function listens for changes in login state
    // when the app first loads
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });
    
    // Cleanup the listener when the component unmounts
    return unsubscribe;
  }, []);

  const value = { currentUser };

  // Don't render the app until we know if a user is logged in or not
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

