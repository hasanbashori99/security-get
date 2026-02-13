import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  User, Lock, ArrowRight, Loader2, 
  AlertCircle, Moon, Sun, Eye, EyeOff, ShieldCheck
} from 'lucide-react';

// --- IMPORT LOGO ---
import logoImage from '../assets/logo3.png'; 

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({ field: '', msg: '' });
  
  // UBAH 1: Default state langsung TRUE (Dark Mode)
  const [darkMode, setDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  // UBAH 2: Logika pengecekan saat pertama kali load
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');

    // Jika user PERNAH memilih 'light', maka pakai light.
    // Jika TIDAK ADA (null) atau 'dark', maka otomatis DARK MODE.
    if (savedTheme === 'light') {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark'); // Set default ke storage juga
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError({ field: '', msg: '' });
    if (!form.username) return setError({ field: 'username', msg: 'Username wajib diisi' });
    if (!form.password) return setError({ field: 'password', msg: 'Password wajib diisi' });

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      // Pastikan IP ini sesuai dengan IP Laptop Anda
      const res = await axios.post('http://10.163.3.52:5000/api/login', form);
      
      if (res.data.success) {
        localStorage.setItem('username', form.username);
        
        const btn = document.getElementById('login-btn');
        if(btn) {
            btn.innerHTML = `<span class="flex items-center gap-2">BERHASIL <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>`;
            btn.classList.remove('bg-zinc-900', 'dark:bg-white');
            btn.classList.add('bg-green-600', 'text-white', 'border-green-600');
        }
        
        setTimeout(() => {
            if (res.data.role === 'security') {
                window.location.href = '/scan'; 
            } else {
                window.location.href = '/dashboard'; 
            }
        }, 800);

      }
    } catch (err) {
      setError({ field: 'all', msg: 'Akun tidak ditemukan atau password salah' });
    } finally {
      if(error.msg) setLoading(false);
      else setTimeout(() => setLoading(false), 800);
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col lg:flex-row overflow-x-hidden transition-colors duration-500 font-sans relative ${darkMode ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'}`}>
      
      {/* --- TOMBOL DARK MODE (Pojok Kanan Atas) --- */}
      <button 
        onClick={toggleDarkMode} 
        className="absolute top-4 right-4 z-50 p-3 rounded-full bg-zinc-100/50 dark:bg-zinc-800/50 backdrop-blur-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-sm"
      >
        {darkMode ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20} className="text-zinc-600"/>}
      </button>

      {/* --- BAGIAN LOGO --- */}
      <div className={`w-full lg:w-1/2 flex-shrink-0 relative overflow-hidden transition-all duration-1000 border-none lg:border-r
        ${darkMode ? 'lg:bg-zinc-900 lg:border-zinc-800' : 'lg:bg-zinc-100 lg:border-zinc-200'} 
        ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 lg:-translate-x-20 -translate-y-10'}`}>
        
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className={`absolute top-[-20%] left-[-20%] w-[400px] lg:w-[800px] h-[400px] lg:h-[800px] rounded-full blur-[80px] lg:blur-[120px] animate-pulse-slow ${darkMode ? 'bg-indigo-500/10' : 'bg-indigo-300/30'}`}></div>
            <div className={`absolute bottom-[-20%] right-[-20%] w-[400px] lg:w-[800px] h-[400px] lg:h-[800px] rounded-full blur-[80px] lg:blur-[120px] animate-pulse-slow ${darkMode ? 'bg-blue-500/10' : 'bg-blue-300/30'}`} style={{animationDelay: '2s'}}></div>
        </div>

        <div className="hidden lg:flex absolute top-10 left-10 items-center gap-3 z-20 opacity-70 hover:opacity-100 transition-opacity">
            <ShieldCheck className={darkMode ? 'text-zinc-400' : 'text-zinc-600'} size={24} />
            <span className={`text-lg font-bold tracking-tight ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>SecurityPortal</span>
        </div>

        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center pt-20 pb-2 lg:p-0">
            <div className="relative animate-float mb-0 lg:mb-8">
                <img 
                    src={logoImage} 
                    alt="Logo" 
                    className="w-28 h-28 lg:w-72 lg:h-72 object-contain drop-shadow-2xl" 
                />
                <div className={`absolute -bottom-4 lg:-bottom-8 left-1/2 -translate-x-1/2 w-16 lg:w-40 h-2 lg:h-6 blur-lg lg:blur-2xl rounded-[100%] ${darkMode ? 'bg-black/60' : 'bg-zinc-400/50'}`}></div>
            </div>

            <div className="hidden lg:block text-center space-y-4">
                <h2 className={`text-3xl font-black tracking-[0.15em] bg-clip-text text-transparent bg-gradient-to-r animate-gradient-x ${darkMode ? 'from-white via-zinc-400 to-white' : 'from-zinc-900 via-zinc-500 to-zinc-900'}`}>
                    PT. PRADHA KARYA PERKASA
                </h2>
                <div className="flex justify-center items-center gap-2">
                    <div className="h-[2px] w-12 bg-indigo-500 rounded-full"></div>
                    <p className={`text-sm font-medium tracking-widest uppercase ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Professional Security System</p>
                    <div className="h-[2px] w-12 bg-indigo-500 rounded-full"></div>
                </div>
            </div>
        </div>
      </div>

      {/* --- BAGIAN FORM --- */}
      <div className={`w-full lg:w-1/2 flex flex-col justify-start lg:justify-center items-center px-6 pt-2 pb-10 lg:p-24 relative ${darkMode ? 'lg:bg-zinc-950' : 'lg:bg-white'}`}>
        
        <div className={`w-full max-w-md space-y-6 lg:space-y-8 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            
            <div className="text-center lg:text-left space-y-2">
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Selamat Datang</h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm lg:text-lg">Silakan login untuk melanjutkan.</p>
            </div>

            {error.msg && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm font-medium animate-shake">
                    <AlertCircle size={20}/> {error.msg}
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5 lg:space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Username</label>
                    <div className={`group relative flex items-center px-4 py-3.5 rounded-2xl border-2 transition-all ${error.field.includes('username') ? 'border-red-500 bg-red-50/50' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-black'}`}>
                        <User className={`w-5 h-5 transition-colors ${error.field.includes('username') ? 'text-red-500' : 'text-zinc-400 group-focus-within:text-indigo-500'}`}/>
                        <input 
                            type="text" 
                            className="flex-1 bg-transparent border-none outline-none ml-3 text-sm font-semibold placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-zinc-900 dark:text-white"
                            placeholder="ID Pengguna"
                            value={form.username}
                            onChange={e => setForm({...form, username: e.target.value})}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Kata Sandi</label>
                    </div>
                    <div className={`group relative flex items-center px-4 py-3.5 rounded-2xl border-2 transition-all ${error.field.includes('password') ? 'border-red-500 bg-red-50/50' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-black'}`}>
                        <Lock className={`w-5 h-5 transition-colors ${error.field.includes('password') ? 'text-red-500' : 'text-zinc-400 group-focus-within:text-indigo-500'}`}/>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            className="flex-1 bg-transparent border-none outline-none ml-3 text-sm font-semibold placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-zinc-900 dark:text-white"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={e => setForm({...form, password: e.target.value})}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                            {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                        </button>
                    </div>
                </div>

                <button 
                    id="login-btn"
                    disabled={loading}
                    className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black font-bold text-sm py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed border-2 border-transparent"
                >
                    {loading ? <Loader2 className="animate-spin" size={20}/> : <>Masuk Sekarang <ArrowRight size={18}/></>}
                </button>
            </form>

            <p className="text-center text-xs text-zinc-400 mt-8">
                &copy; 2026 PT. Pradha Karya Perkasa
            </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
            100% { transform: translateY(0px); }
        }
        @keyframes pulseSlow {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.15; transform: scale(1.1); }
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
            20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        @keyframes gradientX {
            background-size: 200% 200%;
            animation: gradientX 3s ease infinite;
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulseSlow 8s ease-in-out infinite; }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        .animate-gradient-x {
            background-size: 200% 200%;
            animation: gradientX 3s ease infinite;
        }
      `}</style>
    </div>
  );
}