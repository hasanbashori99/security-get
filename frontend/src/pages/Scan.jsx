import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import { 
  ScanLine, LogIn, LogOut, Loader2, ShieldCheck, 
  AlertTriangle, CheckCircle, Keyboard, X, Volume2, 
  Sun, Moon, LayoutDashboard, Zap 
} from 'lucide-react';

export default function Scan() {
  const [status, setStatus] = useState('OUT');
  const [notification, setNotification] = useState(null); 
  const [needPin, setNeedPin] = useState(false);
  const [manualPin, setManualPin] = useState('');
  const [isPaused, setIsPaused] = useState(false); 
  const [loading, setLoading] = useState(false); // Tambahkan Loading State
  const [darkMode, setDarkMode] = useState(true);
  // --- STATE BARU UNTUK DURASI ISTIRAHAT ---
  const [breakType, setBreakType] = useState(60); // '30', '60', '90', 'custom'
  const [customBreakTime, setCustomBreakTime] = useState(120);
  
  const lastScanned = useRef({ code: '', time: 0 });
  const pendingCode = useRef(''); 

  const navigate = useNavigate();

  // --- 1. SETUP ---
  useEffect(() => {
    const user = localStorage.getItem('username');
    if (!user) navigate('/');

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        setDarkMode(false);
        document.documentElement.classList.remove('dark');
    } else {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
    }
  }, [navigate]);

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

  // --- 2. AUDIO SYSTEM ---
  const playBeep = (type = 'success') => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        if (type === 'success') {
            osc.frequency.value = 1200; 
            gain.gain.value = 0.1;
            osc.start();
            setTimeout(() => {
                osc.frequency.value = 1800; 
                setTimeout(() => osc.stop(), 100);
            }, 100);
        } else {
            osc.frequency.value = 300; 
            osc.type = 'sawtooth';
            gain.gain.value = 0.2;
            osc.start();
            setTimeout(() => osc.stop(), 300);
        }
    } catch (e) { }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); 
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID'; 
        utterance.rate = 1.1; 
        window.speechSynthesis.speak(utterance);
    }
  };

  // --- 3. LOGIC SCANNING (DIPERBAIKI) ---
  const handleScan = (results) => {
    if (results && results.length > 0) {
      const code = results[0].rawValue.trim();
      
      // FIX 1: Jangan proses jika sedang Loading, Paused, atau kode kosong
      if (!code || isPaused || loading) return;

      const now = Date.now();
      if (code === lastScanned.current.code && (now - lastScanned.current.time) < 3000) {
        return; 
      }

      lastScanned.current = { code: code, time: now };
      processToBackend(code);
    }
  };

  const processToBackend = async (qrCode, pinInput = null) => {
    setLoading(true); // Mulai Loading
    try {
      // Siapkan payload
      const payload = {
        qr_code: qrCode,
        status: status,
        verification_pin: pinInput
      };
      // Jika scan KELUAR, tambahkan durasi istirahat
      if (status === 'OUT') {
        payload.break_duration = breakType === 'custom' ? customBreakTime : breakType;
      }

      const res = await axios.post('http://10.163.3.52:5000/api/scan', payload);

      // Selesai Loading
      setLoading(false);

      if (res.data.require_pin) {
        // --- KASUS TELAT ---
        playBeep('error');
        setIsPaused(true); 
        setNeedPin(true);
        pendingCode.current = qrCode; 
        speakText("Terlambat. Masukkan Pin.");
        setNotification({ text: res.data.msg, type: 'warning' });
      } else {
        // --- KASUS SUKSES ---
        playBeep('success');
        setNotification({ text: `${res.data.msg} (${qrCode})`, type: 'success' });
        speakText(status === 'IN' ? "Masuk." : "Keluar.");

        // Jika sebelumnya ada modal PIN terbuka, tutup sekarang
        setNeedPin(false);
        setManualPin('');
        setIsPaused(false); // Pastikan kamera jalan lagi
        
        setTimeout(() => setNotification(null), 2000);
      }
    } catch (err) {
      setLoading(false);
      playBeep('error');
      
      const errorMsg = err.response?.data?.msg || 'Gagal';
      setNotification({ text: errorMsg, type: 'error' });
      speakText("Gagal.");
      
      // Jangan tutup modal PIN jika error (mungkin PIN salah)
      // Hanya reset notifikasi
      setTimeout(() => {
          // Jika sedang tidak input PIN, hilangkan notifikasi
          if(!needPin) setNotification(null);
      }, 2000);
    }
  };

  // FIX 2: Submit PIN tidak boleh langsung reset state UI
  const submitPin = (e) => {
    e.preventDefault();
    if(!manualPin) return;
    
    // Panggil backend, biarkan processToBackend yang mengatur reset UI jika sukses
    processToBackend(pendingCode.current, manualPin);
  };

  const cancelPin = () => {
    setIsPaused(false);
    setNeedPin(false);
    setManualPin('');
    setNotification(null);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden bg-gray-100 dark:bg-zinc-950 text-gray-900 dark:text-zinc-50 transition-colors duration-300">
      
      {/* NAVBAR */}
      <div className="absolute top-4 right-4 z-50"><button onClick={toggleDarkMode} className="p-3 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-sm border border-gray-200 dark:border-zinc-800 text-orange-500 dark:text-yellow-400">{darkMode ? <Sun size={20}/> : <Moon size={20}/>}</button></div>

      {/* HEADER */}
      <div className="z-10 w-full max-w-sm mb-6 animate-fade-in-up mt-16 sm:mt-0">
        <div className="flex items-center justify-center gap-2 mb-4">
            <ScanLine className="text-blue-600 dark:text-blue-500" size={28}/>
            <h1 className="text-3xl font-extrabold tracking-tight">Gate<span className="text-blue-600 dark:text-blue-500">Access</span></h1>
            <span className="bg-green-500/20 text-green-600 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded border border-green-500/30 flex items-center gap-1"><Zap size={10} fill="currentColor"/> TURBO</span>
        </div>

        {/* STATUS TOGGLE */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-lg p-2 space-y-2">
            <div className="grid grid-cols-2 p-1 bg-gray-100 dark:bg-zinc-800 rounded-lg relative">
                <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md shadow-md transition-all duration-300 ease-out ${status === 'OUT' ? 'left-1 bg-orange-600' : 'left-[calc(50%+2px)] bg-blue-600'}`}></div>
                <button onClick={() => setStatus('OUT')} className={`relative z-10 flex items-center justify-center gap-2 py-2 text-xs font-bold transition-colors ${status === 'OUT' ? 'text-white' : 'text-gray-500 dark:text-zinc-400'}`}><LogOut size={16}/> Keluar</button>
                <button onClick={() => setStatus('IN')} className={`relative z-10 flex items-center justify-center gap-2 py-2 text-xs font-bold transition-colors ${status === 'IN' ? 'text-white' : 'text-gray-500 dark:text-zinc-400'}`}><LogIn size={16}/> Masuk</button>
            </div>
            {status === 'OUT' && (
                <div className="animate-in fade-in duration-300">
                    <p className="text-center text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Pilih Durasi Istirahat</p>
                    <div className="grid grid-cols-4 gap-1.5">
                        {[30, 60, 90, 'custom'].map(type => (
                            <button key={type} onClick={() => setBreakType(type)} className={`px-2 py-1.5 text-xs font-bold rounded-md transition-colors ${breakType === type ? 'bg-orange-500/20 text-orange-700 dark:text-orange-400' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'}`}>
                                {type === 'custom' ? 'Lainnya' : `${type}m`}
                            </button>
                        ))}
                    </div>
                    {breakType === 'custom' && (
                        <div className="mt-2 relative animate-in fade-in duration-300">
                            <input 
                                type="number"
                                value={customBreakTime}
                                onChange={(e) => setCustomBreakTime(parseInt(e.target.value) || 0)}
                                className="w-full bg-gray-100 dark:bg-zinc-800 text-center font-bold text-lg p-2 rounded-md border border-gray-200 dark:border-zinc-700 focus:border-orange-500 focus:ring-orange-500 outline-none"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-zinc-500 font-bold">menit</span>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* MAIN SCANNER CARD */}
      <div className="w-full max-w-sm aspect-square bg-black rounded-[2.5rem] border-4 border-white dark:border-zinc-900 shadow-2xl relative overflow-hidden group animate-fade-in-up transition-all duration-500 ring-1 ring-gray-200 dark:ring-zinc-800">
        
        {/* --- CAMERA --- */}
        {!isPaused && (
            <div className="relative w-full h-full">
                <Scanner 
                    onScan={handleScan} 
                    allowMultiple={true} 
                    scanDelay={500} 
                    constraints={{ facingMode: 'environment', width: { min: 640, ideal: 1280 }, height: { min: 480, ideal: 720 } }}
                    styles={{ container: { width: '100%', height: '100%' }, video: { objectFit: 'cover' } }} 
                />
                
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.7)_100%)]"></div>
                    <div className={`absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-transparent border-b-2 animate-scan-line shadow-[0_0_30px_rgba(0,0,0,0.5)] ${status === 'IN' ? 'to-blue-500/20 border-blue-500' : 'to-orange-500/20 border-orange-500'}`}></div>
                    
                    <div className={`absolute top-8 left-8 w-12 h-12 border-l-4 border-t-4 rounded-tl-3xl ${status==='IN'?'border-blue-500':'border-orange-500'}`}></div>
                    <div className={`absolute top-8 right-8 w-12 h-12 border-r-4 border-t-4 rounded-tr-3xl ${status==='IN'?'border-blue-500':'border-orange-500'}`}></div>
                    <div className={`absolute bottom-8 left-8 w-12 h-12 border-l-4 border-b-4 rounded-bl-3xl ${status==='IN'?'border-blue-500':'border-orange-500'}`}></div>
                    <div className={`absolute bottom-8 right-8 w-12 h-12 border-r-4 border-b-4 rounded-br-3xl ${status==='IN'?'border-blue-500':'border-orange-500'}`}></div>

                    {/* READY STATE */}
                    {!notification && !loading && (
                        <div className="absolute bottom-10 left-0 right-0 text-center">
                            <span className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full border border-white/10 animate-pulse">
                                READY TO SCAN
                            </span>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* --- LOADING OVERLAY --- */}
        {loading && (
            <div className="absolute inset-0 z-50 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm">
                <Loader2 className="w-12 h-12 text-white animate-spin mb-4"/>
                <p className="text-white font-bold text-xs uppercase tracking-widest animate-pulse">Memproses...</p>
            </div>
        )}

        {/* --- NOTIFIKASI SUKSES/GAGAL --- */}
        {notification && !needPin && !loading && (
            <div className={`absolute inset-0 z-30 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-200 bg-black/40 backdrop-blur-[2px]`}>
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 shadow-2xl scale-110 ${notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {notification.type === 'success' ? <CheckCircle size={50} /> : <AlertTriangle size={50} />}
                </div>
                <h2 className="text-3xl font-extrabold text-white mb-1 drop-shadow-md">{notification.type === 'success' ? 'OK' : 'ERROR'}</h2>
                <div className="bg-black/80 px-4 py-2 rounded-lg backdrop-blur-md">
                    <p className="text-sm font-bold text-white">{notification.text}</p>
                </div>
            </div>
        )}

        {/* --- FORM INPUT PIN --- */}
        {needPin && !loading && (
            <div className="absolute inset-0 z-40 bg-zinc-900 flex flex-col p-6 animate-in slide-in-from-bottom-20 duration-300">
                <div className="flex justify-between items-start mb-6">
                    <button onClick={cancelPin} className="p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white"><X size={20}/></button>
                    <div className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-[10px] font-bold border border-amber-500/20 uppercase tracking-wider flex items-center gap-2"><Volume2 size={12} className="animate-pulse"/> TELAT</div>
                </div>
                <div className="text-center mb-6">
                    <ShieldCheck className="w-16 h-16 text-zinc-700 mx-auto mb-2"/>
                    <h3 className="text-xl font-bold text-white">Masukan Pin Telat</h3>
                    <p className="text-xs text-zinc-400 font-medium">{notification?.text}</p>
                </div>
                <form onSubmit={submitPin} className="mt-auto space-y-3">
                    <div className="relative group">
                        <Keyboard className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20}/>
                        <input autoFocus type="text" value={manualPin} onChange={(e) => setManualPin(e.target.value.toUpperCase())} className="w-full bg-black text-white pl-12 pr-4 py-4 rounded-xl border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-bold tracking-widest placeholder:text-zinc-700 uppercase" placeholder="Pin..." />
                    </div>
                    <button type="submit" className="w-full bg-white text-black font-extrabold py-4 rounded-xl hover:bg-zinc-200 active:scale-95 transition-all">KIRIM</button>
                </form>
            </div>
        )}
      </div>

      <p className="mt-6 text-gray-400 dark:text-zinc-600 text-[10px] uppercase tracking-[0.3em] font-bold">Turbo Mode Active</p>
      
      <style>{`
        @keyframes scanLine {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
        .animate-scan-line {
            animation: scanLine 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}