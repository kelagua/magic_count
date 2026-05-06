import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { authApi } from '../api/auth';
import type { User, LoginRequest, RegisterRequest } from '../types';

/**
 * 安全存储工具
 * TODO: 后续迭代应迁移为 HttpOnly Cookie（需后端配合）
 * 当前使用 sessionStorage 降低 XSS 持久化攻击风险（关闭标签页即清除）
 */
const secureStorage = {
  getToken: (): string | null => sessionStorage.getItem('auth_token'),
  setToken: (token: string) => sessionStorage.setItem('auth_token', token),
  removeToken: () => sessionStorage.removeItem('auth_token'),
  getUser: (): User | null => {
    const stored = sessionStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  },
  setUser: (user: User) => sessionStorage.setItem('auth_user', JSON.stringify(user)),
  removeUser: () => sessionStorage.removeItem('auth_user'),
  clear: () => {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
  },
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => secureStorage.getUser());
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = useCallback(
    async (data: LoginRequest) => {
      setLoading(true);
      try {
        const res = await authApi.login(data);
        if (res.success && res.data) {
          const token = res.data.token || res.data.access_token || '';
          secureStorage.setToken(token);
          secureStorage.setUser(res.data.user);
          setUser(res.data.user);
          message.success('登录成功');
          navigate('/');
        } else {
          message.error(res.message || '登录失败');
        }
      } catch (error: any) {
        message.error(error.response?.data?.message || '登录失败，请检查用户名和密码');
      } finally {
        setLoading(false);
      }
    },
    [navigate],
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      setLoading(true);
      try {
        const res = await authApi.register(data);
        if (res.success && res.data) {
          const token = res.data.token || res.data.access_token || '';
          secureStorage.setToken(token);
          secureStorage.setUser(res.data.user);
          setUser(res.data.user);
          message.success('注册成功');
          navigate('/');
        } else {
          message.error(res.message || '注册失败');
        }
      } catch (error: any) {
        message.error(error.response?.data?.message || '注册失败');
      } finally {
        setLoading(false);
      }
    },
    [navigate],
  );

  const logout = useCallback(() => {
    secureStorage.clear();
    setUser(null);
    navigate('/login');
    message.success('已退出登录');
  }, [navigate]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await authApi.getProfile();
      if (res.success && res.data) {
        secureStorage.setUser(res.data);
        setUser(res.data);
      }
    } catch {
      // 静默处理
    }
  }, []);

  const isAuthenticated = !!secureStorage.getToken();

  return {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    fetchProfile,
  };
}
