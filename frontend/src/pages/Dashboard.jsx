import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import QRCode from 'react-qr-code';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileSpreadsheet, Moon, Sun, 
  PanelRightOpen, Calendar, Filter, Printer, Search, ClipboardList,
  CheckCircle, AlertTriangle, ChevronDown, ChevronRight, Clock, ShieldCheck,
  Settings, X, ArrowLeft, FolderOpen, Save, LogOut, Trash2, Zap, ChevronUp, AlertCircle, Pencil, Sparkles, MessageCircle, Send,
  TrendingUp, BarChart3, PieChart as PieChartIcon, Activity, ChevronLeft, Coffee
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, LineChart, Line, Legend
} from 'recharts';
import logoImg from '../assets/logo3.png';
import QRCodeLib from 'qrcode';

// --- THEME SYSTEM ---
const THEMES = {
  default: {
    name: 'Default',
    primary: 'blue',
    sidebar: 'bg-white dark:bg-zinc-950',
    sidebarBorder: 'border-zinc-200 dark:border-zinc-800',
    topbar: 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800',
    card: 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800',
    activeNav: 'bg-blue-500/10 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    button: 'bg-black dark:bg-white text-white dark:text-black',
  },
  supabase: {
    name: 'Supabase',
    primary: 'emerald',
    sidebar: 'bg-slate-50 dark:bg-slate-900',
    sidebarBorder: 'border-slate-200 dark:border-slate-700',
    topbar: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    card: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm',
    activeNav: 'bg-emerald-500/10 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    button: 'bg-emerald-600 dark:bg-emerald-500 text-white',
  },
  vercel: {
    name: 'Vercel',
    primary: 'black',
    sidebar: 'bg-white dark:bg-black',
    sidebarBorder: 'border-gray-200 dark:border-gray-800',
    topbar: 'bg-white dark:bg-black border-gray-200 dark:border-gray-800',
    card: 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800',
    activeNav: 'bg-gray-100 dark:bg-gray-900 text-black dark:text-white font-semibold',
    button: 'bg-black dark:bg-white text-white dark:text-black',
  },
  claude: {
    name: 'Claude',
    primary: 'orange',
    sidebar: 'bg-gray-50 dark:bg-gray-900',
    sidebarBorder: 'border-gray-200 dark:border-gray-700',
    topbar: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    card: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    activeNav: 'bg-orange-500/10 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
    button: 'bg-orange-600 dark:bg-orange-500 text-white',
  },
  github: {
    name: 'GitHub',
    primary: 'violet',
    sidebar: 'bg-white dark:bg-gray-900',
    sidebarBorder: 'border-gray-300 dark:border-gray-700',
    topbar: 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700',
    card: 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700',
    activeNav: 'bg-violet-500/10 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
    button: 'bg-violet-600 dark:bg-violet-500 text-white',
  },
  notion: {
    name: 'Notion',
    primary: 'gray',
    sidebar: 'bg-white dark:bg-gray-800',
    sidebarBorder: 'border-gray-200 dark:border-gray-700',
    topbar: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    card: 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600',
    activeNav: 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100',
    button: 'bg-gray-600 dark:bg-gray-400 text-white dark:text-black',
  },
};


const parseDate = (dateInput) => {
    try {
        if (!dateInput) return null;
        // Konversi format SQL "YYYY-MM-DD HH:MM:SS" ke ISO "YYYY-MM-DDTHH:MM:SS"
        const dateStr = String(dateInput).replace(' ', 'T');
        const d = new Date(dateStr);
        // Jika tanggal tidak valid, return null (jangan crash)
        return isNaN(d.getTime()) ? null : d;
    } catch (e) {
        return null;
    }
};

// Fungsi format jam aman
const formatTime = (dateInput) => {
    const d = parseDate(dateInput);
    if (!d) return '-';
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

// Fungsi format tanggal saja
const formatDate = (dateInput) => {
    const d = parseDate(dateInput);
    if (!d) return '-';
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// --- ANIMATED NUMBER COMPONENT ---
const AnimatedNumber = ({ value, duration = 1000 }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const startRef = useRef(0);
    const rafRef = useRef(null);

    useEffect(() => {
        const finalValue = parseInt(value) || 0;
        const startTime = Date.now();
        startRef.current = 0;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const currentValue = Math.floor(startRef.current + (finalValue - startRef.current) * progress);
            setDisplayValue(currentValue);
            
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate);
            }
        };

        rafRef.current = requestAnimationFrame(animate);
        return () => rafRef.current && cancelAnimationFrame(rafRef.current);
    }, [value, duration]);

    return <span>{displayValue}</span>;
};

// --- PAGE HEADER COMPONENT ---
const getHeaderIconColor = (themeKey) => {
  const colors = {
    default: 'text-blue-600 dark:text-blue-400',
    supabase: 'text-emerald-600 dark:text-emerald-400',
    vercel: 'text-gray-900 dark:text-gray-100',
    claude: 'text-orange-600 dark:text-orange-400',
    github: 'text-violet-600 dark:text-violet-400',
    notion: 'text-amber-600 dark:text-amber-400'
  };
  return colors[themeKey] || colors.default;
};

const PageHeader = ({ title, subtitle, icon: Icon, theme = 'default' }) => (
    <div className="mb-8 space-y-2">
        <div className="flex items-center gap-3">
            {Icon && <Icon className={`w-8 h-8 ${getHeaderIconColor(theme)}`} />}
            <div>
                <h1 className="text-3xl font-extrabold text-black dark:text-white">{title}</h1>
                {subtitle && <p className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
            </div>
        </div>
    </div>
);

// --- TOGGLE SWITCH SHADCN STYLE ---
const ToggleSwitch = ({ checked, onChange }) => (
    <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
            checked 
                ? 'bg-blue-600 shadow-lg shadow-blue-500/30' 
                : 'bg-zinc-300 dark:bg-zinc-600'
        }`}
    >
        <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                checked ? 'translate-x-6' : 'translate-x-1'
            }`}
        />
    </button>
);

// --- MODERN SIDEBAR COMPONENT ---
const Sidebar = ({ 
  isOpen, 
  onToggle, 
  activeTab, 
  onTabChange, 
  darkMode, 
  onLogout, 
  isMobileOpen, 
  onMobileToggle,
  karyawanMenuOpen,
  onKaryawanMenuToggle,
  currentTheme,
  profileMenuOpen, // Tambahkan currentTheme
  onProfileMenuToggle
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview', Icon: LayoutDashboard },
    { id: 'report', label: 'Rekap Data', Icon: ClipboardList },
  ];

  const karyawanItems = [
    { id: 'database', label: 'Database QR' },
    { id: 'departments', label: 'Kelola Dept' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm" 
          onClick={onMobileToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed z-50 inset-y-0 left-0 ${THEMES[currentTheme].sidebar} border-r ${THEMES[currentTheme].sidebarBorder}
        transition-all duration-300 flex flex-col
        ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
        ${isOpen ? 'lg:w-64' : 'lg:w-20'}
      `}>
        {/* Logo Section */}
        <div className={`
          h-20 flex items-center justify-center px-4 transition-all duration-300 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950
        `}>
          <div className="flex items-center justify-center">
            <img 
              src={logoImg} 
              alt="Logo" 
              className="h-12 w-auto object-contain transition-transform hover:scale-110"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
          {/* Main Items */}
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => {
                onTabChange(id);
                onMobileToggle(false);
                onProfileMenuToggle(false);
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium 
                transition-all duration-200
                ${activeTab === id
                  ? 'bg-blue-500/10 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm'
                  : 'text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                }
              `}
            >
              <Icon size={20} className="shrink-0" />
              {isOpen && <span className="truncate">{label}</span>}
            </button>
          ))}

          {/* Karyawan Menu */}
          <div className="pt-2 mt-2">
            <button
              onClick={() => {
                onKaryawanMenuToggle(!karyawanMenuOpen);
                if (!isOpen) onToggle(true);
              }}
              className={`
                w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium 
                transition-all duration-200
                ${['database', 'departments'].includes(activeTab)
                  ? 'bg-blue-500/10 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm'
                  : 'text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                }
              `}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Users size={20} className="shrink-0" />
                {isOpen && <span className="truncate">Karyawan</span>}
              </div>
              {(isOpen || isMobileOpen) && (
                karyawanMenuOpen ? <ChevronDown size={16} className="shrink-0" /> : <ChevronRight size={16} className="shrink-0" />
              )}
            </button>

            {/* Karyawan Submenu */}
            {(isOpen || isMobileOpen) && karyawanMenuOpen && (
              <div className="ml-2 mt-1 space-y-1 border-l-2 border-zinc-200 dark:border-zinc-700 pl-2">
                {karyawanItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      onMobileToggle(false);
                      onProfileMenuToggle(false);
                    }}
                    className={`
                      w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-all
                      ${activeTab === item.id
                        ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20'
                        : 'text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                      }
                    `}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Profile Section */}
        <div className="p-3 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950 profile-menu-container">
          {(isOpen || isMobileOpen) && (
            <div className="relative">
              <button
                onClick={onProfileMenuToggle}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium 
                  text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {localStorage.getItem('username')?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="truncate text-xs">{localStorage.getItem('username') || 'User'}</span>
                </div>
                <ChevronDown size={16} className={`shrink-0 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {profileMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  <button
                    onClick={() => {
                      onLogout();
                      onProfileMenuToggle();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium 
                      text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  >
                    <LogOut size={16} className="shrink-0" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

// --- MODERN TOP NAVBAR COMPONENT ---
const TopNav = ({ 
  sidebarOpen, 
  onSidebarToggle, 
  onMobileMenuToggle, 
  darkMode, 
  onDarkModeToggle,
  currentTheme,
  onThemeChange,
  showThemeMenu,
  onThemeMenuToggle
}) => {
  return (
    <header className={`sticky top-0 z-40 flex items-center justify-between h-16 px-6 ${THEMES[currentTheme].topbar} shadow-sm`}>
      <div className="flex items-center gap-2">
        <button
          onClick={onSidebarToggle}
          className="hidden lg:flex p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors group"
          title="Toggle sidebar"
        >
          <PanelRightOpen size={20} className="text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white" />
        </button>
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors group"
        >
          <PanelRightOpen size={20} className="text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme Switcher Dropdown */}
        <div className="relative theme-menu-container">
          <button
            onClick={onThemeMenuToggle}
            className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors group text-sm font-medium text-zinc-700 dark:text-zinc-300"
            title="Switch Theme"
          >
            <div className={`w-5 h-5 rounded-full group-hover:shadow-lg transition-all ${
              currentTheme === 'default' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
              currentTheme === 'supabase' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' :
              currentTheme === 'vercel' ? 'bg-gradient-to-br from-gray-700 to-gray-900' :
              currentTheme === 'claude' ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
              currentTheme === 'github' ? 'bg-gradient-to-br from-violet-500 to-violet-700' :
              'bg-gradient-to-br from-amber-400 to-amber-600'
            }`} />
            <span className="hidden sm:inline text-xs">{THEMES[currentTheme]?.name}</span>
            <ChevronDown size={16} className={`transition-transform ${showThemeMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showThemeMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-2 z-50">
              {Object.entries(THEMES).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => {
                    onThemeChange(key);
                    onThemeMenuToggle(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-3 ${
                    currentTheme === key
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full ${
                    key === 'default' ? 'bg-blue-500' :
                    key === 'supabase' ? 'bg-emerald-500' :
                    key === 'vercel' ? 'bg-gray-900 dark:bg-gray-100' :
                    key === 'claude' ? 'bg-orange-500' :
                    key === 'github' ? 'bg-violet-600' :
                    'bg-gray-500'
                  }`} />
                  {theme.name}
                  {currentTheme === key && <CheckCircle size={16} className="ml-auto" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={onDarkModeToggle}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors group"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? (
            <Sun size={20} className="text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white" />
          ) : (
            <Moon size={20} className="text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white" />
          )}
        </button>
      </div>
    </header>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const deptInputRef = useRef(null); 
  
  // --- STATE ---
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [depts, setDepts] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('default');
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); 
  const [activeTab, setActiveTab] = useState('dashboard');
  const [karyawanMenuOpen, setKaryawanMenuOpen] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false); 
  const [viewQr, setViewQr] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [toast, setToast] = useState({ show: false, title: '', message: '', type: 'success' }); 
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, isLoading: false });
// --- STATE TAMBAHAN UNTUK FITUR BARU ---
  const [generateCount, setGenerateCount] = useState(1); // Jumlah ID yang mau digenerate
  const [filterStartID, setFilterStartID] = useState(''); // Filter Awal (contoh: 0001)
  const [filterEndID, setFilterEndID] = useState('');   // Filter Akhir (contoh: 0100)
  const [isGenerating, setIsGenerating] = useState(false);

  // --- STATE UNTUK EDIT ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({ id: null, employee_code: '', department_id: '' });

  // --- LOGIC SORTING (PENTING AGAR URUT) ---
  const getSortedEmployees = () => {
    let data = getFilteredEmployees(); // Ambil data yg sudah difilter range/dept
    
    // Sortir secara natural (agar GDG-10 tidak muncul sebelum GDG-2)
    return data.sort((a, b) => {
      return a.employee_code.localeCompare(b.employee_code, undefined, { numeric: true, sensitivity: 'base' });
    });
  };

  // --- FUNCTION HAPUS SATUAN ---
  const handleDeleteEmployee = (id, code) => {
    openConfirm("Hapus ID", `Yakin ingin menghapus ID ${code}?`, async () => {
      try {
        await axios.delete(`http://localhost:5000/api/employees/${id}`);
        showToast('Sukses', 'Data berhasil dihapus');
        loadData();
      } catch (e) {
        showToast('Gagal', 'Gagal menghapus data', 'error');
      }
    });
  };

  // --- FUNCTION BUKA MODAL EDIT ---
  const handleOpenEdit = (employee) => {
    setEditData({
      id: employee.id,
      employee_code: employee.employee_code,
      department_id: employee.department_id
    });
    setIsEditModalOpen(true);
  };

  // --- FUNCTION SIMPAN EDIT ---
  const handleSaveEdit = async () => {
    if (!editData.employee_code) return showToast('Error', 'ID tidak boleh kosong', 'error');
    
    try {
      // Pastikan backend Anda mendukung endpoint PUT /api/employees/:id
      await axios.put(`http://localhost:5000/api/employees/${editData.id}`, {
        employee_code: editData.employee_code,
        department_id: editData.department_id
      });
      
      showToast('Sukses', 'Data berhasil diubah');
      setIsEditModalOpen(false);
      loadData();
    } catch (e) {
      showToast('Gagal', 'ID mungkin sudah ada atau error server', 'error');
    }
  };

  // --- 1. FUNCTION GENERATE MASSAL ---
  const handleGenerateID = async () => {
    if (!selectedDept) return showToast('Error', 'Pilih Departemen', 'error');
    if (generateCount < 1) return showToast('Error', 'Minimal 1 ID', 'error');

    setIsGenerating(true);
    let successCount = 0;

    try {
      // Loop sebanyak jumlah yang diinginkan
      for (let i = 0; i < generateCount; i++) { // Menggunakan IP konsisten
        await axios.post('http://10.163.3.52:5000/api/employees', { department_id: selectedDept });
        successCount++;
      }
      showToast('Sukses', `Berhasil membuat ${successCount} ID baru`);
      loadData();
      setGenerateCount(1); // Reset
    } catch (e) {
      showToast('Gagal', 'Terjadi kesalahan saat generate', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // --- FILTER LOGIC (Untuk Excel & PDF) ---
  const getFilteredEmployees = () => {
    let deptEmployees = employees.filter(e => e.department_id === parseInt(selectedFolderId));
    
    // Filter berdasarkan Range ID (jika diisi) - LOGIKA DIPERBAIKI
    if (filterStartID && filterEndID) {
        const startNum = parseInt(filterStartID, 10);
        const endNum = parseInt(filterEndID, 10);
        if (!isNaN(startNum) && !isNaN(endNum)) {
            deptEmployees = deptEmployees.filter(e => {
                const parts = e.employee_code.split('-');
                if (parts.length < 2) return false;
                const codeNum = parseInt(parts[1], 10);
                return !isNaN(codeNum) && codeNum >= startNum && codeNum <= endNum;
            });
        }
    }
    return deptEmployees;
  };

  // --- 2. FUNCTION EXPORT EXCEL (FILTERED) ---
  const handleExportDeptExcel = () => {
    const data = getFilteredEmployees().map(e => ({
      'ID Karyawan': e.employee_code,
      'Departemen': e.dept_name || ''
    }));

    if (data.length === 0) return showToast('Info', 'Tidak ada data untuk diexport', 'error');

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Database Karyawan");
    XLSX.writeFile(wb, `Data_Karyawan_${depts.find(d=>d.id===selectedFolderId)?.name}.xlsx`);
  };

  // --- 3. FUNCTION CETAK PDF QR GRID (TANPA NAMA) ---
// --- 3. FUNCTION CETAK PDF QR GRID (6 KOLOM) ---
  const handlePrintQR = async () => {
    const data = getFilteredEmployees();
    if (data.length === 0) return showToast('Info', 'Tidak ada data untuk dicetak', 'error');

    const doc = new jsPDF();
    
    // --- KONFIGURASI GRID (6 KOLOM) ---
    const cols = 6;            // Target: 6 Kolom
    const boxWidth = 30;       // Lebar kotak diperkecil (30mm)
    const boxHeight = 40;      // Tinggi kotak (QR + Text)
    const marginX = 10;        // Margin Kiri
    const marginY = 20;        // Margin Atas
    const gap = 2;             // Jarak antar kotak
    const qrSize = 22;         // Ukuran QR Code di dalam kotak
    
    let x = marginX;
    let y = marginY;
    
    // Judul Dokumen
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    const title = depts.find(d => d.id === selectedFolderId)?.name || 'Database QR';
    doc.text(`QR Code: ${title}`, 105, 12, { align: 'center' });
    
    doc.setFontSize(8); // Font ID diperkecil agar muat
    doc.setLineWidth(0.1);
    doc.setDrawColor(200); // Warna garis abu-abu muda (untuk panduan potong)

    for (let i = 0; i < data.length; i++) {
      const emp = data[i];

      // Cek Halaman Penuh
      if (y + boxHeight > doc.internal.pageSize.getHeight() - 10) {
        doc.addPage();
        y = marginY; // Reset Y
        x = marginX; // Reset X
      }

      // 1. Gambar Garis Potong (Putus-putus Halus)
      doc.setLineDash([1, 1], 0); 
      doc.rect(x, y, boxWidth, boxHeight);
      doc.setLineDash([]); 

      // 2. Generate QR Image
      try {
        const qrDataUrl = await QRCodeLib.toDataURL(emp.employee_code, { margin: 0, width: 100 });
        
        // Posisi QR Code (Centered horizontal, padding top sedikit)
        // x + (boxWidth - qrSize) / 2 -> Rumus centering
        doc.addImage(qrDataUrl, 'PNG', x + (boxWidth - qrSize) / 2, y + 5, qrSize, qrSize);
      } catch (err) {
        console.error(err);
      }

      // 3. Teks ID & Dept (Kecil di bawah QR)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(emp.employee_code, x + (boxWidth / 2), y + boxHeight - 8, { align: 'center' });
      
      // Opsional: Tambah Dept kecil di bawah ID
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(100);
      doc.text(emp.dept_name || '', x + (boxWidth / 2), y + boxHeight - 4, { align: 'center' });
      doc.setTextColor(0); // Reset warna hitam

      // --- LOGIKA LOOPING GRID ---
      x += boxWidth + gap; // Geser ke kanan
      
      // Jika sudah mencapai kolom ke-6, pindah baris
      if ((i + 1) % cols === 0) {
        x = marginX;       // Balik ke kiri
        y += boxHeight + gap; // Turun ke bawah
      }
    }

    // Simpan File
    doc.save(`QR_Codes_6Col_${title}.pdf`);
  };

  // Filters & Forms
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // 'all', 'tepat', 'telat'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [delStartDate, setDelStartDate] = useState('');
  const [delEndDate, setDelEndDate] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptPrefix, setDeptPrefix] = useState('');
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [timeLimitInput, setTimeLimitInput] = useState(60);
  const [isLoadingData, setIsLoadingData] = useState(true); // Indikator Loading

  // --- STATE PAGINASI ---
  const [isExporting, setIsExporting] = useState(false); // State untuk trigger export
  const [exportType, setExportType] = useState('ALL'); // 'ALL' atau 'LATE_ONLY'

  const [reportPage, setReportPage] = useState(1);
  const [dbPage, setDbPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // --- STATE UNTUK AI CHAT ---
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  // --- LOAD DATA FUNCTION (Harus di luar useEffect) ---
  const loadData = async () => {
    try {
      const res = await axios.get('http://10.163.3.52:5000/api/dashboard');
      console.log("📊 API Response:", res.data); // Cek data yang diterima
      console.log("📋 Logs count:", Array.isArray(res.data.logs) ? res.data.logs.length : 0);
      console.log("📋 Full logs:", res.data.logs);
      console.log("🔍 verification_pin values:", res.data.logs?.map(l => ({ code: l.employee_code, status: l.status, is_late: l.is_late, verification_pin: l.verification_pin })) || []);
      setLogs(Array.isArray(res.data.logs) ? res.data.logs : []);
      setEmployees(res.data.allEmployees || []);
      setDepts(res.data.departments || []);
      setIsLoadingData(false);
    } catch (err) { 
        console.error("❌ Gagal load data:", err); 
        setIsLoadingData(false);
    }
  };

  // --- INIT ---
  useEffect(() => {
    const user = localStorage.getItem('username');
    if (!user) { navigate('/'); return; }

    if (localStorage.getItem('theme') === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    
    const savedTheme = localStorage.getItem('currentTheme');
    if (savedTheme && THEMES[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
    
    if (window.innerWidth < 1024) setSidebarOpen(false);

    console.log('🚀 Dashboard Initialized - Loading data...');
    loadData();

    const interval = setInterval(loadData, 5000); 
    return () => clearInterval(interval);
  }, [navigate]);

  // --- HELPER UI ---
  const showToast = (title, message, type = 'success') => {
    setToast({ show: true, title, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };
  const closeToast = () => setToast((prev) => ({ ...prev, show: false }));

  const openConfirm = (title, message, action) => { setConfirmModal({ isOpen: true, title, message, onConfirm: action, isLoading: false }); };
  const closeConfirm = () => { setConfirmModal({ ...confirmModal, isOpen: false }); };
  const handleConfirmAction = async () => { if (confirmModal.onConfirm) { setConfirmModal(prev => ({ ...prev, isLoading: true })); await confirmModal.onConfirm(); setConfirmModal(prev => ({ ...prev, isLoading: false, isOpen: false })); } };

  const handleLogout = () => {
      openConfirm("Konfirmasi Logout", "Yakin ingin keluar?", () => { localStorage.removeItem('username'); window.location.href = '/'; });
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); } 
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  };

  const handleThemeChange = (themeName) => {
    setCurrentTheme(themeName);
    localStorage.setItem('currentTheme', themeName);
  };

  const toggleThemeMenu = (newState) => {
    if (typeof newState === 'boolean') {
      setShowThemeMenu(newState);
    } else {
      setShowThemeMenu(!showThemeMenu);
    }
  };

  // Close theme menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showThemeMenu && !e.target.closest('.theme-menu-container')) {
        setShowThemeMenu(false);
      }
    };
    
    if (showThemeMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showThemeMenu]);

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuOpen && !e.target.closest('.profile-menu-container')) {
        setProfileMenuOpen(false);
      }
    };
    
    if (profileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [profileMenuOpen]);

  // --- LOGIC UTAMA: MERGE ROW (SAFE MODE) ---
  // Logika: IN (Selesai Istirahat) dipasangkan dengan OUT (Mulai Istirahat) sebelumnya
  const processedLogs = useMemo(() => {
    try {
      if (!logs || logs.length === 0) return [];

      // 1. SORTING ASCENDING (Lama ke Baru)
      // Kita urutkan kejadian dari awal waktu
      const sortedLogs = [...logs].sort((a, b) => {
          const dateA = new Date(a.scan_time);
          const dateB = new Date(b.scan_time);
          return dateA - dateB; 
      });
      
      const sessions = [];
      const pendingBreak = {}; // Menyimpan data orang yang sedang "OUT" (Istirahat)

      sortedLogs.forEach(log => {
          const empCode = log.employee_code;
          
          if (log.status === 'OUT') {
              // --- MULAI ISTIRAHAT ---
              // Simpan data OUT, menunggu pasangannya (IN) nanti
              
              // Cek: Apakah dia double OUT? (Misal tekan OUT 2x)
              if (pendingBreak[empCode]) {
                  // Jika ada OUT sebelumnya yg belum IN, anggap itu sesi menggantung/selesai
                  sessions.push({
                      ...pendingBreak[empCode],
                      time_in: null, // Belum masuk lagi
                      status_display: 'Sedang Istirahat'
                  });
              }

              // Set status sekarang: Sedang diluar
              pendingBreak[empCode] = {
                  ...log,
                  time_out: log.scan_time, // Ini jam Mulai Istirahat
                  time_in: null,
                  status_display: 'Sedang Istirahat'
              };

          } else if (log.status === 'IN') {
              // --- SELESAI ISTIRAHAT ---
              // Cek apakah dia punya data OUT sebelumnya?
              
              if (pendingBreak[empCode]) {
                  // BERHASIL MATCHING!
                  // Kita pasangkan IN ini dengan OUT yang tadi disimpan
                  sessions.push({
                      ...pendingBreak[empCode], // Ambil data OUT tadi
                      time_in: log.scan_time,   // Masukkan jam IN sekarang
                      status_display: 'Selesai Istirahat',
                      
                      // Update status telat sesuai data saat scan IN
                      is_late: log.is_late,
                      late_duration: log.late_duration,
                      verification_pin: log.verification_pin
                  });
                  
                  // Hapus dari pending karena sudah kembali masuk
                  delete pendingBreak[empCode];

              } else {
                  // Scan IN tapi tidak ada data OUT sebelumnya (Mungkin Masuk Kerja Pertama)
                  sessions.push({
                      ...log,
                      time_in: log.scan_time,
                      time_out: null, // Tidak ada data istirahat
                      status_display: 'Masuk Kerja (Awal)'
                  });
              }
          }
      });

      // Masukkan sisa orang yang masih di luar (Belum scan IN balik)
      Object.values(pendingBreak).forEach(item => {
          sessions.push(item);
      });

      // 4. SORTING TAMPILAN (Baru ke Lama)
      return sessions
          .filter(item => {
             // ... (Filter logic tetap sama, copy paste saja filter sebelumnya) ...
              const d = parseDate(item.time_in || item.time_out);
              if (!d) return false;
              
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              const logDateStr = `${year}-${month}-${day}`;
              
              const isDeptMatch = filterDept ? item.dept_name === filterDept : true;
              const isStartMatch = startDate ? logDateStr >= startDate : true;
              const isEndMatch = endDate ? logDateStr <= endDate : true;
              const isStatusMatch = filterStatus === 'telat' ? item.is_late : (filterStatus === 'tepat' ? !item.is_late : true);
              const searchLower = searchTerm.toLowerCase();
              const isSearchMatch = searchTerm 
                ? ((item.employee_code || '').toLowerCase().includes(searchLower) || (item.emp_name || '').toLowerCase().includes(searchLower)) 
                : true;
              
              return isDeptMatch && isStartMatch && isEndMatch && isSearchMatch && isStatusMatch;
          })
          .sort((a, b) => {
              // Descending agar yang barusan scan ada di paling atas
              const dateA = parseDate(a.time_in || a.time_out) || new Date(0);
              const dateB = parseDate(b.time_in || b.time_out) || new Date(0);
              return dateB - dateA;
          });

    } catch (err) {
      console.error('💥 ERROR in processedLogs:', err);
      return [];
    }
  }, [logs, filterDept, filterStatus, startDate, endDate, searchTerm]);

  // Data Grafik (Safe Calculation)
  const chartData = useMemo(() => {
      if (!processedLogs) return [];
      return processedLogs.slice(0, 100).reduce((acc, curr) => {
        const d = parseDate(curr.time_in || curr.time_out);
        if(!d) return acc;
        
        const dateKey = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        const existing = acc.find(item => item.name === dateKey);
        
        if (existing) { 
            existing.Total += 1; 
            if (curr.is_late) existing.Telat += 1; 
        } else { 
            acc.push({ name: dateKey, Total: 1, Telat: curr.is_late ? 1 : 0 }); 
        }
        return acc;
      }, []).slice(0, 7).reverse();
  }, [processedLogs]);

  // Actions
  const handleBulkDelete = () => {
    if (!delStartDate || !delEndDate) return showToast('Error', 'Pilih tanggal!', 'error');
    openConfirm("Hapus Data", `Hapus data dari ${delStartDate} s/d ${delEndDate}?`, async () => { // Menggunakan IP konsisten
        try { await axios.delete('http://10.163.3.52:5000/api/logs/range', { data: { startDate: delStartDate, endDate: delEndDate } }); showToast('Berhasil', 'Data dihapus.'); setDelStartDate(''); setDelEndDate(''); loadData(); } 
        catch (err) { showToast('Gagal', 'Server Error', 'error'); }
    });
  };
  const handleDeptSubmit = async (e) => { e.preventDefault(); if(!deptName || !deptPrefix) return showToast('Error', 'Lengkapi Data', 'error'); try { if (editingDeptId) await axios.put(`http://10.163.3.52:5000/api/departments/${editingDeptId}`, { name: deptName, prefix: deptPrefix }); else await axios.post('http://10.163.3.52:5000/api/departments', { name: deptName, prefix: deptPrefix }); showToast('Sukses', 'Disimpan'); setDeptName(''); setDeptPrefix(''); setEditingDeptId(null); loadData(); } catch (err) { showToast('Gagal', 'Error', 'error'); } };
  const deleteDept = (id) => { openConfirm("Hapus Dept", "Hapus departemen ini?", async () => { try { await axios.delete(`http://10.163.3.52:5000/api/departments/${id}`); loadData(); showToast('Sukses', 'Terhapus'); } catch (e) { showToast('Gagal', 'Masih ada karyawan', 'error'); } }); };
  const saveQrAsImage = () => { const svg = document.getElementById("qr-code-svg"); if (!svg) return; const s = new XMLSerializer().serializeToString(svg); const c = document.createElement("canvas"); const ctx = c.getContext("2d"); const i = new Image(); c.width=300; c.height=300; i.onload = () => { ctx.fillStyle="#FFF"; ctx.fillRect(0,0,300,300); ctx.drawImage(i,25,25,250,250); const a=document.createElement("a"); a.download=`QR_${viewQr}.png`; a.href=c.toDataURL("image/png"); a.click(); }; i.src = "data:image/svg+xml;base64," + btoa(s); };
  
 
// --- 3. FUNCTION CETAK PDF REKAP DATA (MODERN + LOGO + VERIFIKASI) ---
const exportPDF = () => {
  const doc = new jsPDF();

  // ===== KONFIGURASI =====
  const primaryColor = [37, 99, 235];
  const textDark = [30, 41, 59]; // Warna teks gelap
  const title = "REKAPITULASI ABSENSI"; // Judul utama

  // --- JUDUL DINAMIS BERDASARKAN FILTER ---
  let subTitle = `Periode: ${formatDate(startDate) || 'Semua'} - ${formatDate(endDate) || 'Semua'}`;
  if (filterStatus === 'telat') {
    subTitle += " (Hanya Terlambat)";
  }

  // ===== HEADER PUTIH MODERN =====
  doc.setFillColor(255, 255, 255); // Latar belakang putih
  doc.rect(0, 0, 210, 40, 'F');

  // Garis bawah header (modern corporate)
  doc.setDrawColor(30, 30, 30); // Hitam elegan
  doc.setLineWidth(0.5);
  doc.line(14, 38, 196, 38);

  // Logo
  try {
    doc.addImage(logoImg, 'PNG', 14, 8, 24, 24);
  } catch (err) {
    console.warn("Logo gagal load", err);
  }

  // Title
  doc.setTextColor(...textDark);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, 196, 20, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(subTitle, 196, 28, { align: 'right' });

  // ===== DATA =====
  const tableColumn = [
    "Tanggal",
    "Out",
    "In",
    "ID",
    "Verifikasi",
    "Dept",
    "Durasi",
    "Status"
  ];

  const tableRows = [];

  processedLogs.forEach(log => {
    tableRows.push([
      formatDate(log.time_in || log.time_out),
      formatTime(log.time_out),
      formatTime(log.time_in),
      log.employee_code,
      log.verification_pin || '-',
      log.dept_name || '-',
      log.break_duration ? `${log.break_duration}m` : '-',
      log.is_late
        ? `TELAT (${log.late_duration}m)`
        : 'Tepat Waktu'
    ]);
  });

  // ===== TABEL =====
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,

    startY: 42,
    margin: { left: 15, right: 15 },

    theme: 'grid',

    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3,
      textColor: [51, 65, 85],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },

    headStyles: {
      fillColor: [255, 255, 255],
      textColor: textDark,
      fontStyle: 'bold',
      borderBottomWidth: 1.5,
      borderColor: primaryColor
    },

    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },

    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 15, halign: 'center' },
      4: { fontStyle: 'bold', halign: 'center' }, // Verifikasi
      7: { fontStyle: 'bold' }
    },

    // ===== CUSTOM WARNA KOLOM =====
    didParseCell: function (data) {

      // 🔥 Kolom Verifikasi Merah
      if (data.section === 'body' && data.column.index === 4) {
        data.cell.styles.textColor = [220, 38, 38];
      }

      // Status warna
      if (data.section === 'body' && data.column.index === 7) {

        if (data.cell.raw.toString().includes('TELAT')) {
          data.cell.styles.textColor = [220, 38, 38];
        }

        if (data.cell.raw === 'Tepat Waktu') {
          data.cell.styles.textColor = [22, 163, 74];
        }
      }
    },

    // Footer halaman
    didDrawPage: function (data) {
      const pageCount = doc.internal.getNumberOfPages();

      doc.setFontSize(8);
      doc.setTextColor(150);

      doc.text(
        `Halaman ${pageCount}`,
        data.settings.margin.left,
        doc.internal.pageSize.height - 10
      );
    }
  });

  // ===== SIMPAN FILE =====
  doc.save(`Rekap_Absensi_${new Date().toISOString().slice(0, 10)}.pdf`);
};

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(processedLogs.map(l => ({
        'Tanggal': formatDate(l.time_in || l.time_out),
        'Keluar': formatTime(l.time_out),
        'Masuk': formatTime(l.time_in),
        'ID': l.employee_code,
        'Verifikasi': l.verification_pin || '-',
        'Dept': l.dept_name || '-',
        'Durasi Istirahat': l.break_duration ? `${l.break_duration}m` : '-',
        'Status': l.is_late ? `TELAT (${l.late_duration} mnt)` : 'OK'
    })));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Rekap"); XLSX.writeFile(wb, 'Laporan.xlsx');
  };

  // Helper: Map theme color to Tailwind gradient
  const getThemeGradient = (themeKey) => {
    const gradients = {
      default: 'from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-950/50 border-blue-200 dark:border-blue-800/30',
      supabase: 'from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-950/50 border-emerald-200 dark:border-emerald-800/30',
      vercel: 'from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-black/50 border-gray-200 dark:border-gray-800/30',
      claude: 'from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-950/50 border-orange-200 dark:border-orange-800/30',
      github: 'from-violet-50 to-violet-100 dark:from-violet-900/10 dark:to-violet-900/20 border-violet-200 dark:border-violet-800',
      notion: 'from-amber-50 to-amber-100 dark:from-amber-900/10 dark:to-amber-900/20 border-amber-200 dark:border-amber-800'
    };
    return gradients[themeKey] || gradients.default;
  };

  const getThemeIconBg = (themeKey) => {
    const icons = {
      default: 'bg-blue-500',
      supabase: 'bg-emerald-500',
      vercel: 'bg-gray-900 dark:bg-gray-100',
      claude: 'bg-orange-500',
      github: 'bg-violet-600',
      notion: 'bg-amber-500'
    };
    return icons[themeKey] || icons.default;
  };

  // Helper: Get chart colors based on theme
  const getChartColors = (themeKey) => {
    const colors = {
      default: { primary: '#3b82f6', secondary: '#ef4444', success: '#10b981', accent: '#f97316' },
      supabase: { primary: '#10b981', secondary: '#ef4444', success: '#059669', accent: '#f97316' },
      vercel: { primary: '#000000', secondary: '#ef4444', success: '#10b981', accent: '#7c3aed' },
      claude: { primary: '#f97316', secondary: '#ef4444', success: '#10b981', accent: '#8b5cf6' },
      github: { primary: '#7c3aed', secondary: '#ef4444', success: '#10b981', accent: '#06b6d4' },
      notion: { primary: '#fbbf24', secondary: '#ef4444', success: '#10b981', accent: '#8b5cf6' }
    };
    return colors[themeKey] || colors.default;
  };

  // Helper: Get main background color based on theme
  const getThemeBg = (themeKey, darkMode) => {
    const colors = {
      default: darkMode ? '#020617' : '#f0f9ff', // blue-950, blue-50
      supabase: darkMode ? '#022c22' : '#ecfdf5', // emerald-950, emerald-50
      vercel: darkMode ? '#000000' : '#fafafa', // black, gray-50
      claude: darkMode ? '#431407' : '#fff7ed', // orange-950, orange-50
      github: darkMode ? '#1e1b4b' : '#eef2ff', // indigo-950, indigo-50
      notion: darkMode ? '#1f2937' : '#f9fafb', // gray-800, gray-50
    };
    return colors[themeKey] || colors.default;
  }
// --- UPDATED STATCARD COMPONENT ---
const StatCard = ({ title, value, icon, color, suffix = '', theme = 'default' }) => (
  // 1. Padding diubah jadi p-4 (sebelumnya p-6) agar box tidak terlalu gemuk
  <div className={`p-4 rounded-2xl border bg-gradient-to-br ${getThemeGradient(theme)} shadow-sm hover:shadow-lg transition-all group hover:scale-105`}>
    <div className="flex items-center justify-between gap-3 h-full">
       <div className="flex-1 flex flex-col justify-center min-w-0">
         {/* 2. PERUBAHAN UTAMA: 
            - text-[10px]: Ukuran font jadi 10px (lebih kecil dari text-xs)
            - tracking-widest: Jarak antar huruf diperlebar sedikit agar tetap terbaca jelas
            - text-zinc-500: Warna sedikit diredam agar fokus ke Angka
         */}
         <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-widest truncate mb-1">{title}</p>
         
         <div className="flex items-baseline gap-1">
           {/* 3. Ukuran angka disesuaikan sedikit (text-2xl di mobile, text-3xl di laptop) */}
           <h3 className="text-2xl lg:text-3xl font-black text-zinc-900 dark:text-zinc-50 leading-none">
             <AnimatedNumber value={value} duration={1000} />
           </h3>
           {suffix && <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 self-end mb-1">{suffix}</span>}
         </div>
       </div>
       
       {/* 4. Ukuran Icon Wrapper diperkecil sedikit (w-10 h-10) agar proporsional */}
       <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${getThemeIconBg(theme)} text-white shadow-md transform group-hover:rotate-12 transition-transform shrink-0`}>
          {/* Kita clone element icon agar bisa mengatur ukurannya juga jika perlu */}
          {React.cloneElement(icon, { size: 18 })} 
       </div>
    </div>
  </div>
);

  // --- PAGINATION COMPONENT ---
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
  
    const pageNumbers = [];
    // Logic to show limited page numbers (e.g., 1 ... 4 5 6 ... 10)
    const maxPagesToShow = 5;
    let startPage, endPage;
    if (totalPages <= maxPagesToShow) {
      startPage = 1;
      endPage = totalPages;
    } else {
      const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2);
      const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1;
      if (currentPage <= maxPagesBeforeCurrent) {
        startPage = 1;
        endPage = maxPagesToShow;
      } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
        startPage = totalPages - maxPagesToShow + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - maxPagesBeforeCurrent;
        endPage = currentPage + maxPagesAfterCurrent;
      }
    }
  
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
  
    return (
      <div className="flex items-center justify-center gap-2 mt-4">
        <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className="px-3 py-1 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 rounded-md disabled:opacity-50">« First</button>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 rounded-md disabled:opacity-50">‹ Prev</button>
        {startPage > 1 && <span className="px-3 py-1 text-xs">...</span>}
        {pageNumbers.map(number => (
          <button key={number} onClick={() => onPageChange(number)} className={`px-3 py-1 text-xs font-bold rounded-md ${currentPage === number ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
            {number}
          </button>
        ))}
        {endPage < totalPages && <span className="px-3 py-1 text-xs">...</span>}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 rounded-md disabled:opacity-50">Next ›</button>
        <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className="px-3 py-1 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 rounded-md disabled:opacity-50">Last »</button>
      </div>
    );
  };

  // --- AI CHAT LOGIC ---
  const handleAiSubmit = async (e) => {
    e.preventDefault();
    const userInput = e.target.elements.prompt.value.trim().toLowerCase();
    if (!userInput) return;

    const newMessages = [...aiMessages, { role: 'user', content: userInput }];
    setAiMessages(newMessages);
    e.target.reset();
    
    // Menambahkan pesan "..." sementara AI berpikir
    setAiMessages(prev => [...prev, { role: 'ai', content: '...' }]);

    try {
      const res = await axios.post('http://10.163.3.52:5000/api/ask-ai', {
        prompt: userInput,
        contextData: processedLogs // Kirim data log sebagai konteks
      });
      
      // Ganti pesan "..." dengan jawaban asli dari AI
      setAiMessages(prev => {
        const updatedMessages = [...prev];
        updatedMessages[updatedMessages.length - 1] = { role: 'ai', content: res.data.reply };
        return updatedMessages;
      });
    } catch (error) {
      const errorMessage = "Waduh, sepertinya saya sedang tidak bisa berpikir. Coba lagi nanti ya.";
      setAiMessages(prev => {
        const updatedMessages = [...prev];
        updatedMessages[updatedMessages.length - 1] = { role: 'ai', content: errorMessage };
        return updatedMessages;
      });
    }
  };

  useEffect(() => {
    if (isAiChatOpen && aiMessages.length === 0) {
      setTimeout(() => {
        setAiMessages([{
          role: 'ai',
          content: "Halo! Saya Asisten AI. Tanyakan pada saya tentang data di halaman ini. Contoh: 'Berapa yang telat?'"
        }]);
      }, 300);
    }
  }, [isAiChatOpen]);

  // Auto-scroll chat
  const aiChatEndRef = useRef(null);
  useEffect(() => {
    aiChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  // --- EFEK UNTUK EKSPOR DARI AI ---
  // Ini akan "mendengarkan" perubahan pada state isExporting
  useEffect(() => {
    if (isExporting) {
      // Setelah state filter (misal: filterStatus) di-set,
      // kita tunggu sebentar agar React sempat me-render ulang data `processedLogs`.
      // Kemudian, baru panggil fungsi exportPDF.
      const exportTimeout = setTimeout(() => {
        exportPDF();
        setIsExporting(false); // Reset state setelah selesai
      }, 200); // Jeda 200ms sudah cukup aman
      return () => clearTimeout(exportTimeout);
    }
  }, [isExporting, processedLogs]); // Dijalankan ulang jika isExporting atau processedLogs berubah

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 selection:bg-indigo-500/30">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        darkMode={darkMode}
        onLogout={handleLogout}
        isMobileOpen={mobileMenuOpen}
        onMobileToggle={() => setMobileMenuOpen(false)}
        karyawanMenuOpen={karyawanMenuOpen}
        onKaryawanMenuToggle={setKaryawanMenuOpen}
        currentTheme={currentTheme}
        profileMenuOpen={profileMenuOpen}
        onProfileMenuToggle={() => setProfileMenuOpen(!profileMenuOpen)}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Top Navigation */}
        <TopNav
          sidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
          darkMode={darkMode}
          onDarkModeToggle={toggleDarkMode}
          currentTheme={currentTheme}
          onThemeChange={handleThemeChange}
          showThemeMenu={showThemeMenu}
          onThemeMenuToggle={toggleThemeMenu}
        />

        {/* Page Content */}
        <main 
          className="flex-1 overflow-y-auto p-6 lg:p-8 transition-colors duration-300"
          style={{ backgroundColor: getThemeBg(currentTheme, darkMode) }}
        >
          {/* TOAST & MODAL */}
          <div className={`fixed top-6 right-6 z-[100] transition-all duration-500 ${toast.show ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0 pointer-events-none'}`}>
              <div className={`flex items-start gap-4 p-4 rounded-2xl shadow-xl backdrop-blur-xl border w-80 overflow-hidden ${toast.type === 'success' ? 'bg-white/90 border-green-200' : 'bg-white/90 border-red-200'}`}>
                  <div className={`p-2 rounded-full ${toast.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{toast.type === 'success' ? <CheckCircle size={20}/> : <AlertTriangle size={20}/>}</div>
                  <div className="flex-1"><h4 className="font-bold text-sm text-black">{toast.title}</h4><p className="text-xs text-gray-500">{toast.message}</p></div>
                  <button onClick={closeToast}><X size={16} className="text-gray-400"/></button>
                  {toast.show && <div className={`absolute bottom-0 left-0 h-1 ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-[progressBar_3s_linear_forwards]`}></div>}
              </div>
          </div>

          {confirmModal.isOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-sm w-full border border-zinc-200 dark:border-zinc-800 p-6 animate-scale-up">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4"><AlertTriangle size={24}/></div>
                        <h3 className="text-lg font-bold mb-2 text-black dark:text-white">{confirmModal.title}</h3><p className="text-sm text-gray-500 mb-6">{confirmModal.message}</p>
                        <div className="flex gap-3 w-full"><button onClick={closeConfirm} className="flex-1 px-4 py-2 bg-gray-100 dark:bg-zinc-800 rounded-lg font-bold text-black dark:text-white">Batal</button><button onClick={handleConfirmAction} disabled={confirmModal.isLoading} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold">{confirmModal.isLoading ? '...' : 'Ya'}</button></div>
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in-up">
              <PageHeader title="Dashboard" subtitle="Pantau aktivitas karyawan secara real-time" icon={Activity} theme={currentTheme} />
              
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">                  
                  <StatCard title="Total Aktivitas" value={processedLogs.length} icon={<FileSpreadsheet size={20}/>} color="bg-blue-500" theme={currentTheme}/>
                  <StatCard title="Terlambat" value={processedLogs.filter(l=>l.is_late).length} icon={<AlertCircle size={20}/>} color="bg-red-500" theme={currentTheme}/>
                  <StatCard title="Sedang Istirahat" // Logika: Cari data yang statusnya 'Sedang Istirahat'
                      value={processedLogs.filter(l => l.status_display === 'Sedang Istirahat').length} 
                      icon={<Coffee size={20}/>}
                      color="bg-orange-500"
                      theme={currentTheme}
                  />
                  <StatCard title="Selesai" value={processedLogs.filter(l=>l.time_out).length} icon={<Clock size={20}/>} color="bg-orange-500" theme={currentTheme}/>
                  <StatCard 
                    title="Total Terlambat" 
                    value={Math.round(processedLogs.filter(l=>l.is_late).reduce((sum, l) => sum + (parseInt(l.late_duration) || 0), 0))} 
                    icon={<Zap size={20}/>} 
                    color="bg-amber-500"
                    suffix="m"
                    theme={currentTheme}
                  />
              </div>
              
              {/* CHARTS GRID - 4 Simple Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Chart 1: Tepat Waktu vs Terlambat */}
                <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <h3 className="text-xs font-bold mb-4">Status Hari Ini</h3>
                  <div className="h-40">
                    {processedLogs.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Tepat', value: processedLogs.filter(l => !l.is_late).length },
                              { name: 'Telat', value: processedLogs.filter(l => l.is_late).length }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            <Cell fill={getChartColors(currentTheme).success} />
                            <Cell fill={getChartColors(currentTheme).secondary} />
                          </Pie>
                          <Tooltip formatter={(value) => `${value}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-zinc-400 text-xs">Belum ada data</div>
                    )}
                  </div>
                </div>

                {/* Chart 2: Aktivitas Harian */}
                <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <h3 className="text-xs font-bold mb-4">Tren Harian</h3>
                  <div className="h-40">
                    {chartData && chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="0" vertical={false} stroke={darkMode ? '#27272a' : '#e4e4e7'} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '10px', fill: darkMode ? '#a1a1aa' : '#71717a' }} />
                          <YAxis axisLine={false} tickLine={false} width={30} style={{ fontSize: '10px', fill: darkMode ? '#a1a1aa' : '#71717a' }} />
                          <Line type="monotone" dataKey="Total" stroke={getChartColors(currentTheme).primary} strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-zinc-400 text-xs">Belum ada data</div>
                    )}
                  </div>
                </div>

                {/* Chart 3: Per Departemen */}
                <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <h3 className="text-xs font-bold mb-4">Per Departemen</h3>
                  <div className="h-40">
                    {depts.length > 0 && processedLogs.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={depts.slice(0, 5).map(d => ({
                            name: d.name.substring(0, 8),
                            value: processedLogs.filter(l => l.dept_name === d.name).length
                          }))}
                        >
                          <CartesianGrid strokeDasharray="0" vertical={false} stroke={darkMode ? '#27272a' : '#e4e4e7'} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '10px', fill: darkMode ? '#a1a1aa' : '#71717a' }} />
                          <YAxis axisLine={false} tickLine={false} width={30} style={{ fontSize: '10px', fill: darkMode ? '#a1a1aa' : '#71717a' }} />
                          <Bar dataKey="value" fill={getChartColors(currentTheme).primary} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-zinc-400 text-xs">Belum ada data</div>
                    )}
                  </div>
                </div>

                {/* Chart 4: Keterlambatan Trend */}
                <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <h3 className="text-xs font-bold mb-4">Keterlambatan</h3>
                  <div className="h-40">
                    {chartData && chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="grad4" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={getChartColors(currentTheme).secondary} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={getChartColors(currentTheme).secondary} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="0" vertical={false} stroke={darkMode ? '#27272a' : '#e4e4e7'} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '10px', fill: darkMode ? '#a1a1aa' : '#71717a' }} />
                          <YAxis axisLine={false} tickLine={false} width={30} style={{ fontSize: '10px', fill: darkMode ? '#a1a1aa' : '#71717a' }} />
                          <Area type="monotone" dataKey="Telat" stroke={getChartColors(currentTheme).secondary} strokeWidth={1.5} fill="url(#grad4)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-zinc-400 text-xs">Belum ada data</div>
                    )}
                  </div>
                </div>
              </div>

            {/* Aktivitas Terakhir */}
            <div className="rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                <div className="p-4 flex justify-between items-center">
                    <h3 className="text-sm font-bold">Aktivitas Terakhir</h3>
                    <button onClick={()=>setActiveTab('report')} className="text-xs text-blue-600 hover:underline">Lihat Semua ({processedLogs.length})</button>
                </div>
                <div className="p-4">
                    <ul className="space-y-3">
                        {processedLogs.filter(l => l.is_late).slice(0, 5).map((log, i) => (
                            <li key={i} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="text-red-500" size={16} />
                                    <div>
                                        <p className="font-bold text-black dark:text-white">{log.employee_code}</p>
                                        <p className="text-zinc-500">PIN: {log.verification_pin || '-'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-red-500">{log.late_duration} menit</p>
                                    <p className="text-zinc-500">{log.dept_name}</p>
                                </div>
                            </li>
                        ))}
                        {processedLogs.filter(l => l.is_late).length === 0 && <p className="text-center text-zinc-400 text-xs py-4">Tidak ada karyawan yang terlambat.</p>}
                    </ul>
                </div>
            </div>

            </div>
        )}

        {/* --- REKAP DATA --- */}
        {activeTab === 'report' && (
            <div className="space-y-6 animate-fade-in-up">
                <PageHeader title="Rekap Data" subtitle="Analisis dan kelola laporan aktivitas karyawan" icon={ClipboardList} theme={currentTheme} />
                
                <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="flex items-center border rounded-lg px-3 py-2 bg-zinc-50 dark:bg-zinc-800 text-sm h-10 sm:col-span-1">
                            <input type="date" onChange={e=>setStartDate(e.target.value)} className="bg-transparent outline-none w-full text-xs font-bold"/>
                        </div>
                        <div className="flex items-center border rounded-lg px-3 py-2 bg-zinc-50 dark:bg-zinc-800 text-sm h-10 sm:col-span-1">
                            <input type="date" onChange={e=>setEndDate(e.target.value)} className="bg-transparent outline-none w-full text-xs font-bold"/>
                        </div>
                        <div className="relative h-10 sm:col-span-1"><select onChange={e=>setFilterDept(e.target.value)} className="h-full w-full pl-3 pr-8 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 text-xs outline-none appearance-none font-medium cursor-pointer"><option value="">Semua Dept</option>{depts.map(d=><option key={d.id} value={d.name}>{d.name}</option>)}</select><ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"/></div>
                        <div className="relative h-10 sm:col-span-1"><select onChange={e=>setFilterStatus(e.target.value)} className="h-full w-full pl-3 pr-8 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 text-xs outline-none appearance-none font-medium cursor-pointer"><option value="">Semua Status</option><option value="tepat">✓ Tepat Waktu</option><option value="telat">⚠ Telat</option></select><ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"/></div>
                        <div className="flex items-center border rounded-lg px-3 py-2 bg-zinc-50 dark:bg-zinc-800 text-sm h-10 sm:col-span-2 lg:col-span-2"><Search size={14} className="mr-2 text-zinc-400"/><input placeholder="Cari Nama / ID..." onChange={e=>setSearchTerm(e.target.value)} className="bg-transparent outline-none w-full text-xs font-bold"/></div>
                    </div>
<div className="flex items-center gap-2">
  {/* Tombol PDF */}
  <button 
    onClick={exportPDF} 
    className="h-8 px-3 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm"
    title="Export ke PDF"
  >
    <Printer size={14} strokeWidth={2.5} />
    <span className="hidden sm:inline">PDF</span>
  </button>

  {/* Tombol Excel */}
  <button 
    onClick={exportExcel} 
    className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm"
    title="Export ke Excel"
  >
    <FileSpreadsheet size={14} strokeWidth={2.5} />
    <span className="hidden sm:inline">Excel</span>
  </button>
</div>
                </div>
                <div className="p-4 sm:p-5 rounded-xl border border-red-200 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/50 space-y-3 sm:space-y-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 sm:justify-between">
                        <div className="flex items-center gap-3"><div className="p-2 bg-red-100 text-red-600 rounded-lg shrink-0"><Trash2 size={18}/></div><div><h4 className="font-bold text-red-700 dark:text-red-400 text-xs sm:text-sm">Hapus Data Massal</h4><p className="text-xs text-red-500">Menghapus data scan secara permanen.</p></div></div>
                        <div className="flex flex-col sm:flex-row items-center gap-2 bg-white dark:bg-black p-2 rounded-lg border border-red-200 dark:border-red-900/50 w-full sm:w-auto"><div className="flex items-center w-full sm:w-auto gap-2"><input type="date" onChange={e=>setDelStartDate(e.target.value)} className="bg-transparent text-xs font-bold p-1 outline-none w-full sm:flex-1"/><span className="text-zinc-400 hidden sm:inline">-</span><input type="date" onChange={e=>setDelEndDate(e.target.value)} className="bg-transparent text-xs font-bold p-1 outline-none w-full sm:flex-1"/></div><button onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-md text-xs font-bold transition-colors w-full sm:w-auto shrink-0">HAPUS</button></div>
                    </div>
                </div>
                
                <div className="rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                                <tr className="text-xs sm:text-sm"><th className="px-2 sm:px-4 py-2 sm:py-3">Tanggal</th><th className="px-2 sm:px-4 py-2 sm:py-3">Keluar & Masuk</th><th className="px-2 sm:px-4 py-2 sm:py-3">ID</th><th className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">Verifikasi</th><th className="px-2 sm:px-4 py-2 sm:py-3">Dept</th><th className="px-2 sm:px-4 py-2 sm:py-3">Durasi Istirahat</th><th className="px-2 sm:px-4 py-2 sm:py-3">Status</th></tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {processedLogs.slice((reportPage - 1) * ITEMS_PER_PAGE, reportPage * ITEMS_PER_PAGE).map((log,i)=>(<tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-xs sm:text-sm">
                                    <td className="px-2 sm:px-4 py-2 sm:py-3 font-bold text-zinc-700 dark:text-zinc-300">{formatDate(log.time_in || log.time_out)}</td>
                                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-orange-600">{formatTime(log.time_out)}</span>
                                            <span>→</span>
                                            <span className="font-bold text-emerald-600">{formatTime(log.time_in)}</span>
                                        </div>
                                    </td>
                                    <td className="px-2 sm:px-4 py-2 sm:py-3 font-mono text-blue-600 text-xs">{log.employee_code}</td>
                                    <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell text-xs">{log.is_late ? (log.verification_pin ? <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">{log.verification_pin}</span> : <span className="text-zinc-500 italic">-</span>) : <span className="text-zinc-500 italic">-</span>}</td>
                                    <td className="px-2 sm:px-4 py-2 sm:py-3"><span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs">{log.dept_name || '-'}</span></td>
                                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs">{log.break_duration ? `${log.break_duration}m` : '-'}</td>
                                    <td className="px-2 sm:px-4 py-2 sm:py-3">{log.is_late ? <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">TELAT ({log.late_duration} mnt)</span> : (log.time_in ? <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">OK</span> : <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">ISTIRAHAT</span>)}</td>
                                </tr>))}
                                {processedLogs.length === 0 && (<tr><td colSpan="7" className="p-4 sm:p-8 text-center text-zinc-400 text-xs sm:text-sm">{isLoadingData ? 'Memuat Data...' : 'Belum ada aktivitas.'}</td></tr>)}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 border-t dark:border-zinc-800">
                        <Pagination currentPage={reportPage} totalPages={Math.ceil(processedLogs.length / ITEMS_PER_PAGE)} onPageChange={setReportPage} />
                    </div>
                </div>
            </div>
        )}

        {/* Database, Departments, Settings */}
        {activeTab === 'database' && (
  <div className="space-y-6 animate-fade-in-up">
    <PageHeader title="Database QR" subtitle="Kelola, generate massal, dan cetak QR Code" icon={Users} theme={currentTheme} />
    
    {!selectedFolderId ? (
      <>
        {/* --- SECTION 1: GENERATE MASSAL --- */}
        <div className="p-6 rounded-2xl border bg-white dark:bg-zinc-900 shadow-sm">
           <h3 className="font-bold text-lg mb-4">Generate ID Massal</h3>
           <div className="flex flex-col md:flex-row gap-4 items-end">
             {/* Pilih Dept */}
             <div className="flex-1 w-full space-y-2">
                <label className="text-sm font-medium text-zinc-500">Departemen</label>
                <select value={selectedDept} onChange={e=>setSelectedDept(e.target.value)} className="w-full p-2.5 rounded-md border text-sm bg-transparent dark:border-zinc-700">
                  <option value="">Pilih Departemen</option>
                  {depts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
             </div>
             
             {/* Input Jumlah */}
             <div className="w-full md:w-32 space-y-2">
                <label className="text-sm font-medium text-zinc-500">Jumlah ID</label>
                <input 
                  type="number" 
                  min="1" 
                  max="500"
                  value={generateCount} 
                  onChange={(e) => setGenerateCount(parseInt(e.target.value) || 1)}
                  className="w-full p-2.5 rounded-md border text-sm bg-transparent text-center font-bold dark:border-zinc-700" 
                />
             </div>

             {/* Tombol Eksekusi */}
             <button 
               onClick={handleGenerateID} 
               disabled={isGenerating}
               className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-bold shadow-lg shadow-blue-500/30 w-full md:w-auto flex items-center justify-center gap-2 transition-all"
             >
               {isGenerating ? <Activity className="animate-spin" size={18}/> : <Zap size={18}/>}
               {isGenerating ? 'Memproses...' : 'Generate ID'}
             </button>
           </div>
           <p className="text-xs text-zinc-400 mt-2">*Tips: Masukkan jumlah (misal: 100) untuk membuat 100 ID sekaligus secara otomatis.</p>
        </div>

        {/* --- LIST FOLDER DEPARTEMEN --- */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {depts.map(d => (
              <div key={d.id} onClick={()=>{setSelectedFolderId(d.id); setFilterStartID(''); setFilterEndID(''); setDbPage(1);}} className="p-5 rounded-2xl border bg-white dark:bg-zinc-900 hover:border-blue-500 dark:hover:border-blue-600 cursor-pointer transition-all group hover:shadow-lg hover:-translate-y-1 relative overflow-hidden flex flex-col">
                  <div className={`absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br ${getThemeGradient(currentTheme)} opacity-20 rounded-full group-hover:scale-150 transition-transform duration-500`}></div>
                  <div className="flex items-start justify-between">
                      <FolderOpen className="text-zinc-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" size={32}/>
                      <span className="text-xs font-bold text-zinc-500 font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">{d.prefix}</span>
                  </div>
                  <div className="mt-4 flex-1">
                      <h4 className="font-bold text-lg text-black dark:text-white">{d.name}</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{employees.filter(e=>e.department_id===d.id).length} Karyawan</p>
                  </div>
              </div>
            ))}
        </div>
      </>
    ) : (
      // --- VIEW DALAM FOLDER ---
      <div className="rounded-2xl border bg-white dark:bg-zinc-900 shadow-sm animate-fade-in">
          {/* Header Folder */}
          <div className="p-4 border-b dark:border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-50/50 dark:bg-zinc-900/50">
             <div className="flex items-center gap-3">
               <button onClick={()=>setSelectedFolderId(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><ArrowLeft size={20}/></button>
               <div>
                 <h3 className="font-bold text-lg">{depts.find(d=>d.id===selectedFolderId)?.name}</h3>
                 <p className="text-xs text-zinc-500">Total: {getFilteredEmployees().length} Karyawan Terfilter</p>
               </div>
             </div>

             {/* TOOLBAR FILTER & EXPORT */}
             <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 p-1 rounded-lg border dark:border-zinc-700"> 
                  <input placeholder="Mulai (1)" value={filterStartID} onChange={e=>setFilterStartID(e.target.value)} className="w-24 bg-transparent text-xs p-1.5 outline-none text-center font-mono"/>
                  <span className="text-zinc-400">-</span>
                  <input placeholder="Akhir (100)" value={filterEndID} onChange={e=>setFilterEndID(e.target.value)} className="w-24 bg-transparent text-xs p-1.5 outline-none text-center font-mono"/>
                </div>
                
                <button onClick={handleExportDeptExcel} className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors">
                  <FileSpreadsheet size={16}/> Excel
                </button>
                <button onClick={handlePrintQR} className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors">
                  <Printer size={16}/> PDF QR
                </button>
             </div>
          </div>

          {/* Table Data dengan Sortir & Aksi Lengkap */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 border-b dark:border-zinc-700">
                <tr>
                  <th className="px-4 py-3 w-16">No</th>
                  <th className="px-4 py-3">ID Karyawan</th>
                  <th className="px-4 py-3">Dept</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-zinc-800">
                {getSortedEmployees().slice((dbPage - 1) * ITEMS_PER_PAGE, dbPage * ITEMS_PER_PAGE).map((e, index)=>(
                  <tr key={e.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 group transition-colors">
                    {/* Kolom No: Murni Index Urutan (1, 2, 3...) */}
                    <td className="px-4 py-3 text-zinc-400 text-xs">{(dbPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                    
                    {/* Kolom ID */}
                    <td className="px-4 py-3 font-mono font-bold text-blue-600 text-base">
                      {e.employee_code}
                    </td>

                    {/* Kolom Dept */}
                    <td className="px-4 py-3">
                      <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-xs font-medium text-zinc-600 dark:text-zinc-300">
                        {e.dept_name}
                      </span>
                    </td>

                    {/* Kolom Aksi (Preview, Edit, Hapus) */}
                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                       {/* Tombol Preview QR */}
                      <button 
                        onClick={()=>setViewQr(e.employee_code)} 
                        className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded transition-colors"
                        title="Lihat QR"
                      >
                        <Search size={14}/>
                      </button>

                      {/* Tombol Edit */}
                      <button 
                        onClick={()=>handleOpenEdit(e)} 
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded transition-colors"
                        title="Edit ID/Dept"
                      >
                        <Pencil size={14}/>
                      </button>

                      {/* Tombol Hapus */}
                      <button 
                        onClick={()=>handleDeleteEmployee(e.id, e.employee_code)} 
                        className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded transition-colors"
                        title="Hapus Permanen"
                      >
                        <Trash2 size={14}/>
                      </button>
                    </td>
                  </tr>
                ))}
                
                {getSortedEmployees().length === 0 && (
                   <tr>
                     <td colSpan="4" className="p-8 text-center text-zinc-400">
                       Tidak ada data.
                     </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t dark:border-zinc-800">
              <Pagination currentPage={dbPage} totalPages={Math.ceil(getSortedEmployees().length / ITEMS_PER_PAGE)} onPageChange={setDbPage} />
          </div>
      </div>
    )}
  </div>
)}

        {activeTab === 'departments' && (
            <div className="space-y-6 animate-fade-in-up">
                <PageHeader title="Kelola Departemen" subtitle="Tambah, edit, dan hapus departemen perusahaan" icon={FolderOpen} theme={currentTheme} />
                <div ref={deptInputRef} className="p-6 rounded-2xl border bg-white dark:bg-zinc-900 shadow-sm">
                    <h3 className="text-lg font-bold mb-4">{editingDeptId?'Edit':'Tambah'} Departemen</h3>
                    <div className="flex flex-col md:flex-row gap-4 items-end"><div className="flex-1 w-full space-y-1"><label className="text-xs uppercase font-bold text-zinc-500">Nama Departemen</label><input value={deptName} onChange={e=>setDeptName(e.target.value)} className="w-full p-2.5 rounded-lg border bg-zinc-50 dark:bg-zinc-800 text-sm" placeholder="Contoh: Gudang Jadi"/></div><div className="w-full md:w-40 space-y-1"><label className="text-xs uppercase font-bold text-zinc-500">Kode (3 Huruf)</label><input value={deptPrefix} onChange={e=>setDeptPrefix(e.target.value.toUpperCase())} className="w-full p-2.5 rounded-lg border bg-zinc-50 dark:bg-zinc-800 text-sm text-center font-mono font-bold" maxLength={3} placeholder="GDJ"/></div><button onClick={handleDeptSubmit} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold w-full md:w-auto flex items-center justify-center gap-2"><Save size={16}/> {editingDeptId ? 'Update' : 'Simpan'}</button></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {depts.map(d=>(
                        <div key={d.id} className="p-4 rounded-xl border bg-white dark:bg-zinc-900 shadow-sm group hover:border-blue-400 dark:hover:border-blue-600 transition-all hover:shadow-md">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-base text-black dark:text-white">{d.name}</h4>
                                    <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-500">{d.prefix}</span>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={()=>{setDeptName(d.name);setDeptPrefix(d.prefix);setEditingDeptId(d.id);deptInputRef.current?.scrollIntoView({ behavior: 'smooth' });}} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-blue-600 dark:text-blue-400"><Pencil size={14}/></button>
                                    <button onClick={()=>deleteDept(d.id)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-red-600 dark:text-red-400"><Trash2 size={14}/></button>
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-dashed dark:border-zinc-800 flex items-center gap-2 text-xs text-zinc-500">
                                <Users size={14} />
                                <span>{employees.filter(e=>e.department_id===d.id).length} Karyawan</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- MODAL EDIT DATA --- */}
          {isEditModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-800 p-6 animate-scale-up">
                    <h3 className="text-lg font-bold mb-4 text-black dark:text-white">Edit Data Karyawan</h3>
                    
                    <div className="space-y-4">
                        {/* Input ID */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase">ID Karyawan</label>
                            <input 
                              type="text" 
                              value={editData.employee_code} 
                              onChange={(e)=>setEditData({...editData, employee_code: e.target.value})}
                              className="w-full p-2 rounded-lg border bg-transparent dark:border-zinc-700 font-mono font-bold"
                            />
                        </div>

                        {/* Input Dept */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Departemen</label>
                            <select 
                              value={editData.department_id}
                              onChange={(e)=>setEditData({...editData, department_id: e.target.value})}
                              className="w-full p-2 rounded-lg border bg-transparent dark:border-zinc-700"
                            >
                                {depts.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button 
                          onClick={()=>setIsEditModalOpen(false)} 
                          className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
                        >
                          Batal
                        </button>
                        <button 
                          onClick={handleSaveEdit} 
                          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                        >
                          Simpan
                        </button>
                    </div>
                </div>
            </div>
          )}

        {viewQr && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl w-full max-w-sm text-center relative border border-zinc-800">
                    <button onClick={()=>setViewQr(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"><X size={20}/></button>
                    <h3 className="text-xl font-bold mb-6 text-black dark:text-white">{viewQr}</h3>
                    <div id="qr-container" className="p-4 bg-white rounded-xl inline-block mb-6"><QRCode id="qr-code-svg" value={viewQr} size={180}/></div>
                    <button onClick={saveQrAsImage} className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black rounded-lg font-medium text-sm hover:opacity-90 flex items-center justify-center gap-2"><Save size={16}/> Download PNG</button>
                </div>
            </div>
        )}

        <style>{` @keyframes progressBar { from { width: 100%; } to { width: 0%; } } `}</style>

        {/* AI CHAT BUTTON & WINDOW */}
        <div className="fixed bottom-6 right-6 z-50">
            <button 
              onClick={() => setIsAiChatOpen(!isAiChatOpen)}
              className={`p-4 rounded-full text-white shadow-lg hover:scale-110 active:scale-100 transition-all duration-300 flex items-center justify-center gap-2
              bg-gradient-to-br ${getThemeGradient(currentTheme)} border-2 border-white/50
              ${isAiChatOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
            >
              <Sparkles className={`${getHeaderIconColor(currentTheme)}`} size={24} />
            </button>

            {isAiChatOpen && (
                <div className="w-[calc(100vw-2rem)] sm:w-96 h-[70vh] max-h-[500px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="p-4 border-b dark:border-zinc-800 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Sparkles className={`${getHeaderIconColor(currentTheme)}`} size={18} />
                            <h3 className="font-bold text-sm text-black dark:text-white">Asisten AI</h3>
                        </div>
                        <button onClick={() => setIsAiChatOpen(false)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><X size={16} /></button>
                    </div>
                    {/* Chat Area */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                        {aiMessages.map((msg, i) => (
                            <div key={i} className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'ai' && <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br ${getThemeGradient(currentTheme)}`}><Sparkles className={`${getHeaderIconColor(currentTheme)}`} size={14} /></div>}
                                <div className={`p-3 rounded-xl max-w-[80%] text-xs leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-zinc-100 dark:bg-zinc-800 rounded-bl-none'}`}>
                                    {/* --- LOGIKA BARU: RENDER KONTEN AI --- */}
                                    {(() => {
                                        if (msg.content.includes('[ACTION:')) {
                                            const parts = msg.content.split('[ACTION:');
                                            const text = parts[0];
                                            const action = parts[1].replace(']', ''); // e.g., "EXPORT_PDF:LATE_ONLY"

                                            const handleActionClick = () => {
                                                if (action.startsWith('EXPORT_PDF_DATERANGE:')) {
                                                    const [, type, start, end] = action.split(':');
                                                    setStartDate(start);
                                                    setEndDate(end);
                                                    if (type === 'LATE_ONLY') {
                                                        setFilterStatus('telat');
                                                    } else {
                                                        setFilterStatus('');
                                                    }
                                                    setIsExporting(true);
                                                } else if (action === 'EXPORT_PDF:LATE_ONLY') {
                                                    setFilterStatus('telat'); // 1. Set filter
                                                    setIsExporting(true);     // 2. Trigger export
                                                } else if (action === 'EXPORT_PDF:ALL') {
                                                    setFilterStatus('');      // 1. Hapus filter
                                                    setIsExporting(true);     // 2. Trigger export
                                                }
                                            };

                                            return <>{text}<button onClick={handleActionClick} className="mt-2 w-full text-left p-2 bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-2"><Printer size={14}/> Klik untuk Ekspor PDF</button></>;
                                        }
                                        return msg.content;
                                    })()}
                                </div>
                            </div>
                        ))}
                        <div ref={aiChatEndRef} />
                    </div>
                    {/* Input */}
                    <div className="p-3 border-t dark:border-zinc-800">
                        <form onSubmit={handleAiSubmit} className="relative">
                            <input 
                                name="prompt"
                                autoComplete="off"
                                className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-lg pl-4 pr-10 py-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500" 
                                placeholder="Tanya sesuatu..."
                            />
                            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"><Send size={14} /></button>
                        </form>
                    </div>
                </div>
            )}
        </div>
        </main>
      </div>
    </div>
  );
}