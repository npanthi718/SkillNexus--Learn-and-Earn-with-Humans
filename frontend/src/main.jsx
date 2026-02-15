import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import axios from "axios";
import { API_BASE } from "./config/constants.js";

const base = String(API_BASE || "").replace(/\/+$/, "");
axios.defaults.baseURL = base === "/api" ? "" : base;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);

