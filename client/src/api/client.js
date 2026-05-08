import axios from "axios";

const rawBase = import.meta.env.VITE_API_BASE || "http://localhost:5000";
export const API_BASE = String(rawBase).replace(/\/$/, "");
export const api = axios.create({ baseURL: `${API_BASE}/api` });
