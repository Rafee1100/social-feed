import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  isAxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

const HTTP_DEFAULTS: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  
  
  
  withCredentials: true,
  timeout: 15000,
});


const REFRESH_CLIENT: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  timeout: 15000,
});

const unwrap = async <T>(promise: Promise<AxiosResponse<T>>) => {
  const { data } = await promise;
  return data;
};

HTTP_DEFAULTS.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!isAxiosError(error)) return Promise.reject(error);

    const status = error.response?.status;
    const originalConfig = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    
    if (typeof window === "undefined") {
      return Promise.reject(error);
    }

    const requestUrl: string = originalConfig?.url ?? "";
    const isAuthRoute =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/logout") ||
      requestUrl.includes("/auth/refresh");

    if (status === 401 && originalConfig && !isAuthRoute && !originalConfig._retry) {
      originalConfig._retry = true;
      try {
        await REFRESH_CLIENT.post("/auth/refresh");
        return HTTP_DEFAULTS(originalConfig);
      } catch (refreshErr) {
        
        window.location.href = "/auth/login";
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

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
