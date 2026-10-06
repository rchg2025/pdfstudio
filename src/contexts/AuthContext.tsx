import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  subscriptionPlan?: string;
  subscriptionExpiresAt?: string | null;
  isLifetime?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isExpired: boolean;
  remainingDays: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role === 'DISABLED') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
          alert('Tài khoản của bạn đang bị khóa, vui lòng liên hệ quản trị viên để được hỗ trợ.');
          return;
        }
        setToken(storedToken);
        setUser(parsedUser);

        // Proactively verify token & account state with backend
        fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` }
        }).then(async (res) => {
          if (res.status === 403) {
            const data = await res.json().catch(() => ({}));
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
            alert(data.message || 'Tài khoản của bạn đang bị khóa, vui lòng liên hệ quản trị viên để được hỗ trợ.');
            window.location.href = '/login';
          } else if (res.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          } else if (res.ok) {
            const data = await res.json().catch(() => ({}));
            if (data?.user) {
              if (data.user.role === 'DISABLED') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setToken(null);
                setUser(null);
                alert('Tài khoản của bạn đang bị khóa, vui lòng liên hệ quản trị viên để được hỗ trợ.');
                window.location.href = '/login';
              } else {
                setUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
              }
            }
          }
        }).catch(() => {});
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const refreshUser = async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.user) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const login = (newToken: string, newUser: User) => {
    if (newUser.role === 'DISABLED') {
      alert('Tài khoản của bạn đang bị khóa, vui lòng liên hệ quản trị viên để được hỗ trợ.');
      return;
    }
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    window.location.href = '/';
  };

  // Tính số ngày sử dụng còn lại & trạng thái hết hạn
  let remainingDays = 0;
  let isExpired = false;

  if (user) {
    if (user.role === 'ADMIN' || user.isLifetime) {
      remainingDays = 99999;
      isExpired = false;
    } else if (user.subscriptionExpiresAt) {
      const diffMs = new Date(user.subscriptionExpiresAt).getTime() - Date.now();
      remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (remainingDays <= 0) {
        remainingDays = 0;
        isExpired = true;
      }
    } else {
      isExpired = true;
      remainingDays = 0;
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshUser, isExpired, remainingDays }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
