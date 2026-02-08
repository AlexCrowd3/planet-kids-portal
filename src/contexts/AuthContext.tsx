import React, { createContext, useContext, useState } from "react";

export interface UserData {
  name: string;
  firstName: string;
  children: string[];
  points: number;
  subscriptionActive: boolean;
  subscriptionDate: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserData;
  login: () => void;
  logout: () => void;
}

const defaultUser: UserData = {
  name: "Владимир Иванов",
  firstName: "Владимир",
  children: ["Даня", "Вика"],
  points: 540,
  subscriptionActive: true,
  subscriptionDate: "18.02",
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = () => setIsAuthenticated(true);
  const logout = () => setIsAuthenticated(false);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user: defaultUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
