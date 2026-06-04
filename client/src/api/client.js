import axios from "axios";

const rawBase = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5001";
export const API_BASE = String(rawBase).replace(/\/$/, "");
export const api = axios.create({ baseURL: `${API_BASE}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
