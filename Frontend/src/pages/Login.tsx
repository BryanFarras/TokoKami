import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Coffee, Loader2, ArrowRight, Mail, Lock, Eye, EyeOff, Sparkles 
} from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password }, rememberMe);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  // Handler untuk WhatsApp
  const handleBecomePartner = () => {
    // Ganti nomor ini dengan nomor WhatsApp bisnis Anda (format: kode negara + nomor)
    const phoneNumber = "6281386844039"; 
    const message = encodeURIComponent("Halo, saya tertarik untuk menggunakan sistem POS Tokokami untuk bisnis saya.");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const handleForgotPassword = () => {
    // Logika untuk lupa password (misalnya, navigasi ke halaman reset password)
    const phoneNumber = "6281386844039"; 
    const message = encodeURIComponent("Halo, saya lupa password untuk akun Tokokami saya. Bisakah Anda membantu saya?");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-white dark:bg-[#0B0F19] font-sans">
      
      {/* --- SISI KIRI: BRAND VISUAL (Desktop) --- */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=2187&auto=format&fit=crop" 
            alt="Coffee Business" 
            className="w-full h-full object-cover opacity-90 scale-105"
          />
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-blue-900/20 mix-blend-multiply"></div>
        </div>

        <div className="relative z-10 w-full h-full flex flex-col justify-between p-16">
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
             <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/10 shadow-xl">
                <Coffee className="h-6 w-6 text-white" />
             </div>
             <span className="text-2xl font-bold tracking-wide drop-shadow-md">Tokokami</span>
          </div>

          <div className="space-y-8 max-w-xl">
             <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
               Empowering <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-200">
                 Local Coffee Shops.
               </span>
             </h1>
             <p className="text-lg text-gray-200 leading-relaxed font-light border-l-4 border-blue-500 pl-6">
               "Operational excellence starts here. Manage your inventory, staff, and sales in one unified platform."
             </p>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-400 font-medium">
            <span>© 2025 Tokokami Inc.</span>
          </div>
        </div>
      </div>

      {/* --- SISI KANAN: LOGIN FORM (Clean) --- */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-white dark:bg-[#0B0F19] relative">
        
        {/* Tombol Partnership WhatsApp */}
        <div className="absolute top-10 right-10 hidden sm:flex items-center gap-3">
           <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
             Interested in using Tokokami?
           </p>
           <button 
             onClick={handleBecomePartner}
             className="px-4 py-2 rounded-lg bg-green-50 text-green-700 text-sm font-bold hover:bg-green-100 transition-colors border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50"
           >
             Chat via WhatsApp
           </button>
        </div>

        <div className="w-full max-w-[420px] mx-auto space-y-5">
          
          {/* Mobile Logo */}
          <div className="lg:hidden mb-6">
             <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-600 rounded-lg">
                   <Coffee className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">Tokokami</span>
             </div>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              Partner Login <Sparkles className="h-6 w-6 text-amber-500 animate-pulse" />
            </h2>
            <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">
              Enter your Cicoo credentials to access the dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* EMAIL */}
            <div className="space-y-2">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-300" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent rounded-xl text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:bg-white dark:focus:bg-gray-900 focus:border-blue-600 focus:ring-0 transition-all duration-300 outline-none"
                  // Placeholder disesuaikan permintaan
                  placeholder="Email Address"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-300" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent rounded-xl text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:bg-white dark:focus:bg-gray-900 focus:border-blue-600 focus:ring-0 transition-all duration-300 outline-none"                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* REMEMBER ME & FORGOT */}
            <div className="flex items-center justify-between pt-1">
               <label className="flex items-center cursor-pointer group select-none">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
                    Remember me
                  </span>
               </label>
               <a href="#" onClick={handleForgotPassword} className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all">
                 Forgot password?
               </a>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center gap-3 animate-shake">
                 <div className="h-2 w-2 rounded-full bg-red-600"></div>
                 <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition-all duration-300 transform hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Login;