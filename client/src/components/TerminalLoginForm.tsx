"use client";
import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import api from "../lib/api";
import { useRouter } from "next/navigation";
import { Terminal, Loader2 } from "lucide-react";

interface TerminalLoginFormProps {
  portal: "admin" | "teacher" | "student" | "parent";
  title: string;
  showDevLogin?: boolean;
}

export default function TerminalLoginForm({
  portal,
  title,
  showDevLogin = false,
}: TerminalLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  const getSecurityLevel = () => {
    switch (portal) {
      case "admin":
        return "LEVEL-10 ADMIN";
      case "teacher":
        return "LEVEL-5 EDUCATOR";
      case "parent":
        return "LEVEL-3 GUARDIAN";
      case "student":
        return "LEVEL-2 STUDENT";
      default:
        return "LEVEL-1 PUBLIC";
    }
  };

  const getShortPortalName = () => {
    switch (portal) {
      case "admin":
        return "SYSADMIN";
      case "teacher":
        return "EDUCATOR";
      case "parent":
        return "GUARDIAN";
      case "student":
        return "LEARNER";
      default:
        return "USER";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, accessToken, user } = res.data as {
        token?: string;
        accessToken?: string;
        user: any;
      };

      // Handle both token naming conventions
      const authToken = token || accessToken;

      if (!authToken) {
        throw new Error("No token received from server");
      }

      setAuth(authToken, user);
      setNavigating(true);
      router.push(`/${portal}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || "ACCESS DENIED - LOGIN FAILED");
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/dev-super-admin-login");
      const { accessToken, user } = res.data as {
        accessToken: string;
        user: any;
      };
      setAuth(accessToken, user);
      setNavigating(true);
      router.push("/admin");
    } catch (err: any) {
      setError(err?.response?.data?.message || "DEV ACCESS DENIED");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
      {/* Retro CRT scanlines effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(75, 85, 99, 0.1) 2px,
            rgba(75, 85, 99, 0.1) 4px
          )`,
        }}
      />

      {/* Main Terminal Container */}
      <div className="w-full max-w-2xl bg-white border-4 border-gray-600 font-mono text-gray-800 shadow-2xl relative overflow-hidden">
        {/* Terminal Header */}
        <div className="border-b-2 border-gray-600 p-3 md:p-4 bg-gray-100/20">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 md:gap-4">
              <Terminal className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
              <span className="text-sm md:text-lg font-bold">
                TREASURELAND INTERNATIONAL SCHOOLS
              </span>
            </div>
            <div className="text-xs">SECURE LOGIN PORTAL </div>
          </div>
        </div>

        {/* Sub Header */}
        <div className="border-b border-gray-600 p-3 bg-gray-100/10 text-xs">
          <div className="flex items-center justify-between">
            <span>[{title.toUpperCase()} ACCESS TERMINAL...]</span>
            {/* <span>CONNECTION: SECURE | MODE: LOGIN</span> */}
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 md:p-8">
          {/* Error Display */}
          {error && (
            <div className="border-2 border-red-500 p-4 mb-6 bg-red-50 text-xs">
              <div className="text-red-600 border-b border-red-500 pb-1 mb-2 font-bold">
                SYSTEM ERROR - UNAUTHORIZED ACCESS
              </div>
              <div className="text-red-800">{error}</div>
              <div className="mt-2 text-red-600">
                [PLEASE VERIFY CREDENTIALS AND TRY AGAIN]
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <div className="text-xs font-bold border-b border-gray-600/20 pb-1">
                EMAIL:
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border border-gray-600/30 px-3 py-2 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono text-sm"
                placeholder="ENTER YOUR EMAIL ADDRESS..."
                required
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="text-xs font-bold border-b border-gray-600/20 pb-1">
                PASSWORD:
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border border-gray-600/30 px-3 py-2 text-gray-800 placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono text-sm"
                placeholder="ENTER YOUR PASSWORD..."
                required
                disabled={loading}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <button
                type="submit"
                disabled={loading || navigating}
                className="px-6 py-3 border-2 border-gray-600 bg-gray-50 hover:bg-gray-600 hover:text-white transition-all duration-200 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    [AUTHENTICATING...]
                  </div>
                ) : navigating ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    [NAVIGATING...]
                  </div>
                ) : (
                  `[LOGIN TO ${getShortPortalName()} PORTAL]`
                )}
              </button>

              {/* Dev Login Button */}
              {showDevLogin && (
                <button
                  type="button"
                  onClick={handleDevLogin}
                  disabled={loading || navigating}
                  className="px-6 py-2 border border-gray-500 bg-gray-50 hover:bg-gray-500 hover:text-white transition-all duration-200 text-xs font-bold disabled:opacity-50"
                >
                  {loading
                    ? "[AUTHENTICATING...]"
                    : navigating
                    ? "[NAVIGATING...]"
                    : "[DEV SUPER ADMIN ACCESS]"}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Bottom Status Bar */}
        <div className="border-t-2 border-gray-600 p-3 md:p-4 bg-gray-100/20 text-xs">
          <div className="flex items-center justify-between">
            <div>
              [SESSION: NOT STARTED] | [STATUS: AWAITING AUTHENTICATION]
            </div>
            <div className="text-green-600 animate-pulse">
              ● SYSTEM 100% OPERATIONAL
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
