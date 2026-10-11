import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  subscriptionPlan?: string;
  subscriptionExpiresAt?: string | null;
  isLifetime?: boolean;
  sessionVersion?: number;
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

  const checkSession = async (currentToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (res.status === 403) {
        const data = await res.json().catch(() => ({}));
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        alert(data.message || 'Tài khoản của bạn đang bị khóa, vui lòng liên hệ quản trị viên để được hỗ trợ.');
        window.location.href = '/login';
      } else if (res.status === 401) {
        const data = await res.json().catch(() => ({}));
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        if (data.isConcurrentSession) {
          alert('⚠️ CẢNH BÁO: Tài khoản của bạn vừa được đăng nhập trên một thiết bị khác!\n\nĐể đảm bảo an toàn, hệ thống chỉ cho phép 1 thiết bị hoạt động tại một thời điểm.');
          window.location.href = '/login';
        }
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
    } catch {}
  };

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

        // Kiểm tra phiên đăng nhập ngay khi mở trang
        checkSession(storedToken);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    // Kiểm tra định kỳ mỗi 15 giây và khi người dùng quay lại tab trình duyệt
    const interval = setInterval(() => {
      const curToken = localStorage.getItem('token');
      if (curToken) {
        checkSession(curToken);
      }
    }, 15000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const curToken = localStorage.getItem('token');
        if (curToken) {
          checkSession(curToken);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const refreshUser = async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) return;
    await checkSession(currentToken);
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
      const expDate = new Date(user.subscriptionExpiresAt);
      const now = new Date();
      
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const endOfExpiryDay = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate(), 23, 59, 59, 999).getTime();

      if (expDate.getTime() <= now.getTime()) {
        remainingDays = 0;
        isExpired = true;
      } else {
        const diffDays = Math.ceil((endOfExpiryDay - startOfToday) / (1000 * 60 * 60 * 24)) - 1;
        remainingDays = Math.max(0, diffDays);
        isExpired = remainingDays <= 0 && expDate.getTime() <= now.getTime();
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
