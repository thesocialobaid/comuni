import { useState } from "react";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import VideoBackground from "../components/VideoBackground";
import { authAPI } from "@/api/auth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      navigate("/jobs");
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <VideoBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[460px] bg-white/80 backdrop-blur-xl rounded-3xl p-10 shadow-[0px_20px_60px_rgba(0,0,0,0.08)] border border-gray-200 relative z-10"
      >
        <div className="mb-8">
          <h1 className="text-4xl mb-2" style={{ fontFamily: 'Geist', fontWeight: 600 }}>
            Welcome back
          </h1>
          <p className="text-gray-600" style={{ fontFamily: 'Geist', fontSize: '15px' }}>
            Sign in to your comuni account
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm" style={{ fontFamily: 'Geist' }}>
              {error}
            </div>
          )}

          <div>
            <label className="block mb-2 text-sm" style={{ fontFamily: 'Geist', fontWeight: 500 }}>
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="your.name@student.fast.edu.pk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-400 transition-colors"
                style={{ fontFamily: 'Geist', fontSize: '15px' }}
                required
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm" style={{ fontFamily: 'Geist', fontWeight: 500 }}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-400 transition-colors"
                style={{ fontFamily: 'Geist', fontSize: '15px' }}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
              <span style={{ fontFamily: 'Geist', color: '#666' }}>Remember me</span>
            </label>
            <a href="#" className="text-gray-900 hover:underline" style={{ fontFamily: 'Geist', fontWeight: 500 }}>
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] text-white rounded-xl transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              fontFamily: 'Geist',
              fontSize: '15px',
              fontWeight: 500,
              boxShadow: 'inset -4px -6px 25px 0px rgba(201,201,201,0.08), inset 4px 4px 10px 0px rgba(29,29,29,0.24)',
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span style={{ fontFamily: 'Geist', fontSize: '14px', color: '#666' }}>
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#2a2a2a] font-medium hover:underline">
              Create account
            </Link>
          </span>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            style={{ fontFamily: 'Geist' }}
          >
            ← Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}