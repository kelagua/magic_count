import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { authApi } from '../api/auth';
import type { User, LoginRequest, RegisterRequest } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = useCallback(
    async (data: LoginRequest) => {
      setLoading(true);
      try {
        const res = await authApi.login(data);
        if (res.success && res.data) {
          localStorage.setItem('token', res.data.access_token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
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
          localStorage.setItem('token', res.data.access_token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
    message.success('已退出登录');
  }, [navigate]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await authApi.getProfile();
      if (res.success && res.data) {
        localStorage.setItem('user', JSON.stringify(res.data));
        setUser(res.data);
      }
    } catch {
      // 静默处理
    }
  }, []);

  const isAuthenticated = !!localStorage.getItem('token');

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
