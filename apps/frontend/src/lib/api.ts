import axios from "axios";
import toast from "react-hot-toast";
import { clearToken, getResignHandler, getToken } from "./auth";

export const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/user`,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    const status = error.response?.status;
    const url = String(original?.url ?? "");

    if (status !== 401 || original?._retry || url.includes("/signin")) {
      if (status === 401) {
        clearToken();
      }
      return Promise.reject(error);
    }

    original._retry = true;
    clearToken();

    const resign = getResignHandler();
    if (!resign) {
      toast.error("Session expired, reconnect your wallet");
      return Promise.reject(new Error("Session expired, reconnect your wallet"));
    }

    try {
      await resign();
      original.headers = original.headers ?? {};
      original.headers.Authorization = getToken();
      return api.request(original);
    } catch {
      clearToken();
      toast.error("Session expired, reconnect your wallet");
      return Promise.reject(new Error("Session expired, reconnect your wallet"));
    }
  },
);
