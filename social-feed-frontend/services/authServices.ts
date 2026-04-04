import http from "./httpServices";

const API_ENDPOINT = "/auth";

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export const registerUser = (userData: RegisterPayload) => {
  return http.post(`${API_ENDPOINT}/register`, userData);
};

export const login = (loginData: LoginPayload) => {
  return http.post(`${API_ENDPOINT}/login`, loginData);
};

export const logout = () => {
  return http.post(`${API_ENDPOINT}/logout`);
};

export const refreshSession = () => {
  return http.post(`${API_ENDPOINT}/refresh`);
};

export const getMe = () => {
  return http.get(`${API_ENDPOINT}/me`);
};
