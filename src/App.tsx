import React, { useState, useEffect } from "react";
import ClassicUserPlayground from "./components/ClassicUserPlayground";
import AdminPage from "./app/admin/page";
import LoginModal from "./components/LoginModal";
import Link from "./components/Link";
import { ShieldCheck } from "lucide-react";

export default function App() {
  const [currentPath, setCurrentPath] = useState(
    typeof window !== "undefined" ? window.location.pathname : "/"
  );
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email: string;
    name: string;
    role: "USER" | "ADMIN";
    balance?: number;
    status?: string;
  } | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalType, setLoginModalType] = useState<"user" | "admin">("user");

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        } else if (data.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      }
    } catch {
      setCurrentUser(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setCurrentUser(null);
  };

  const handleOpenLogin = (type: "user" | "admin" = "user") => {
    if (type === "admin") {
      window.history.pushState({}, "", "/admin");
      setCurrentPath("/admin");
      return;
    }
    setLoginModalType(type);
    setShowLoginModal(true);
  };

  const handleAuthSuccess = (user: {
    id: string;
    email: string;
    name: string;
    role: "USER" | "ADMIN";
  }) => {
    setCurrentUser(user);
    setShowLoginModal(false);
    if (user.role === "ADMIN") {
      window.history.pushState({}, "", "/admin");
      setCurrentPath("/admin");
    }
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-[#0A0B0E] text-[#EDEDED] relative">
      {currentPath.startsWith("/admin") ? (
        <AdminPage />
      ) : (
        <>
          <ClassicUserPlayground
            currentUser={currentUser}
            onLogout={handleLogout}
            onOpenLogin={handleOpenLogin}
          />

          {currentUser?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="hidden md:flex fixed bottom-4 right-4 z-50 px-3.5 py-2 rounded-xl bg-[#141824] border border-cyan-500/30 text-xs font-sans text-cyan-400 hover:border-cyan-400 hover:text-cyan-300 transition shadow-2xl items-center gap-2 active:scale-[0.96]"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Harness Operator</span>
            </Link>
          )}

          <LoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            onSuccess={handleAuthSuccess}
            initialType={loginModalType}
          />
        </>
      )}
    </div>
  );
}
