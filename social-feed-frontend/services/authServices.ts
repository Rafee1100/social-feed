import http from "./httpServices";
import type { AuthResponse, LoginPayload, RegisterUserPayload } from "../types";
import { mapToUserModel, type ApiUser } from "./normalizers";

const API_ENDPOINT = "/auth";

type AuthApiResponse = { message: string; user: ApiUser };
type MessageResponse = { message: string };

export const registerUser = async (payload: RegisterUserPayload): Promise<AuthResponse> => {
  const data = await http.post<AuthApiResponse, RegisterUserPayload>(
    `${API_ENDPOINT}/register`,
    payload
  );
  return { message: data.message, user: mapToUserModel(data.user) };
};

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const data = await http.post<AuthApiResponse, LoginPayload>(`${API_ENDPOINT}/login`, payload);
  return { message: data.message, user: mapToUserModel(data.user) };
};

export const logout = () => http.post<MessageResponse>(`${API_ENDPOINT}/logout`);

export const refreshSession = () => http.post<MessageResponse>(`${API_ENDPOINT}/refresh`);

export const getMe = async (): Promise<{ user: AuthResponse["user"] }> => {
  const data = await http.get<{ user: ApiUser }>(`${API_ENDPOINT}/me`);
  return { user: mapToUserModel(data.user) };
};
