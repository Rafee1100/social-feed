import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";

const HTTP_DEFAULTS: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

const unwrap = async <T>(promise: Promise<AxiosResponse<T>>) => {
  const { data } = await promise;
  return data;
};

const http = {
  instance: HTTP_DEFAULTS,
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    unwrap<T>(HTTP_DEFAULTS.get(url, config)),
  post: <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig) =>
    unwrap<T>(HTTP_DEFAULTS.post(url, data, config)),
  patch: <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig) =>
    unwrap<T>(HTTP_DEFAULTS.patch(url, data, config)),
  put: <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig) =>
    unwrap<T>(HTTP_DEFAULTS.put(url, data, config)),
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    unwrap<T>(HTTP_DEFAULTS.delete(url, config)),
};

export default http;
