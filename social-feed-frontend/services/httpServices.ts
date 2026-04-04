import axios, { type AxiosInstance } from "axios";

const HTTP_DEFAULTS: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

const http = {
  instance: HTTP_DEFAULTS,
  get: HTTP_DEFAULTS.get,
  post: HTTP_DEFAULTS.post,
  patch: HTTP_DEFAULTS.patch,
  put: HTTP_DEFAULTS.put,
  delete: HTTP_DEFAULTS.delete,
};

export default http;
