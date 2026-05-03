import client from './client';
import type { LoginRequest, RegisterRequest, AuthResponse, User, ApiResponse } from '../types';

export const authApi = {
  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const res = await client.post('/auth/login', data);
    return res.data;
  },

  register: async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
    const res = await client.post('/auth/register', data);
    return res.data;
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    const res = await client.get('/auth/profile');
    return res.data;
  },
};
