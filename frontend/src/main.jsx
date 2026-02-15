import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import axios from "axios";
import { API_BASE } from "./config/constants.js";

const base = String(API_BASE || "").replace(/\/+$/, "");
axios.defaults.baseURL = base === "/api" ? "" : base;
try {
  const t = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;
  if (t) {
    axios.defaults.headers.common.Authorization = `Bearer ${t}`;
  }
} catch {}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <App />
    </HashRouter>
  </React.StrictMode>
);

