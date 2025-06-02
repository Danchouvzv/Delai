import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../firebase';
import { UserData } from '../types';

interface UserContextType {
  user: User | null;
  loading: boolean;
  userData?: UserData;
  setUserData: (data: UserData) => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  setUserData: () => {},
});

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, userData, setUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
export { UserContext }; 