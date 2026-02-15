import React, { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/shared/Navbar.jsx";
import HomePage from "./pages/HomePage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import TeachersPage from "./pages/TeachersPage.jsx";
import RequestBoardPage from "./pages/RequestBoardPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import WalletPage from "./pages/WalletPage.jsx";
import TeachOffersPage from "./pages/TeachOffersPage.jsx";
import LearnerRequestPage from "./pages/LearnerRequestPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import ProfileEditPage from "./pages/ProfileEditPage.jsx";
import ConversationsPage from "./pages/ConversationsPage.jsx";
import GroupChatPage from "./pages/GroupChatPage.jsx";
import LegalPage from "./pages/LegalPage.jsx";
import Footer from "./components/shared/Footer.jsx";
import AuthModal from "./components/shared/AuthModal.jsx";
import { ToastProvider } from "./components/shared/Toast.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { API_BASE } from "./config/constants.js";

const AppContent = ({ requireAuth }) => {
  const location = useLocation();
  const isProfilePage = location.pathname.startsWith("/profile/");
  
  return (
    <>
      {!isProfilePage && <Navbar onRequireAuth={requireAuth} />}
      <Routes>
        <Route path="/" element={<HomePage onRequireAuth={requireAuth} />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/teachers" element={<TeachersPage onRequireAuth={requireAuth} />} />
        <Route path="/users" element={<UsersPage />} />
        <Route
          path="/requests"
          element={<RequestBoardPage onRequireAuth={requireAuth} />}
        />
        <Route path="/teach-board" element={<TeachOffersPage onRequireAuth={requireAuth} />} />
        <Route path="/learner/request" element={<LearnerRequestPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/me/profile" element={<ProfileEditPage />} />
        <Route path="/legal/:type" element={<LegalPage />} />
        <Route path="/messages" element={<ConversationsPage />} />
        <Route path="/chat/:otherUserId" element={<ChatPage />} />
        <Route path="/group/:groupId" element={<GroupChatPage />} />
      </Routes>
    </>
  );
};

const App = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    const ensureGoogleMeta = () => {
      const envClientId =
        (typeof import.meta !== "undefined" &&
          import.meta.env &&
          import.meta.env.VITE_GOOGLE_CLIENT_ID) ||
        "";
      const clientId = envClientId;
      const meta = document.querySelector('meta[name="google-client-id"]');
      if (meta && clientId && !clientId.includes("YOUR_GOOGLE_CLIENT_ID")) {
        meta.setAttribute("content", clientId);
      }
    };
    ensureGoogleMeta();
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith("/auth")) {
      setAuthModalOpen(false);
    }
  }, [location.pathname]);

  const requireAuth = (targetPath = "/dashboard") => {
    const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;
    if (!token) {
      try {
        const safe = typeof targetPath === "string" ? targetPath : "/dashboard";
        localStorage.setItem("sn_redirect", safe);
      } catch {}
      setAuthModalOpen(true);
      return false;
    }
    return true;
  };

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="flex min-h-screen flex-col">
        <Routes>
          <Route path="/admin/*" element={<AdminPage />} />
          <Route path="/*" element={<AppContent requireAuth={requireAuth} />} />
        </Routes>
        <Footer />
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;

