/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  setDoc,
  serverTimestamp,
  getDocFromServer,
  runTransaction,
  deleteField
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  ArrowRightLeft,
  RefreshCw,
  CreditCard, 
  Tags, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit2,
  Wallet,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  PieChart as PieChartIcon,
  FileDown,
  Calendar,
  CalendarDays,
  Filter,
  Download,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Search,
  Calculator,
  Paperclip,
  Image as ImageIcon,
  XCircle,
  Bell,
  AlertCircle,
  Zap,
  Check,
  Clock
} from 'lucide-react';
import { ptBR } from 'date-fns/locale';
import { GroupedVirtuoso } from 'react-virtuoso';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend,
  AreaChart,
  Area,
  ReferenceLine,
  Label
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, isWithinInterval, parseISO, addWeeks, addMonths, subMonths, addDays, isSameMonth, isBefore, isAfter, startOfDay, isToday, isYesterday, compareDesc } from 'date-fns';
import { 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { auth, db, storage, signInWithGoogle, logout } from './firebase';
import { cn, formatCurrency, formatDate } from './lib/utils';
import { PDF_IMPORT_DATA, ImportTransaction } from './services/pdfImportData';
import { parseExcelFile, downloadExcelTemplate } from './services/excelImportService';
import { ACCOUNT_IMPORT_DATA, ImportAccount } from './services/accountImportData';
import { Transaction, Account, Category, TransactionType, AccountType, RecurringTransaction, Frequency } from './types';

import { LandingPage } from './components/LandingPage';

// --- Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: any[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || '',
      email: auth.currentUser?.email || '',
      emailVerified: auth.currentUser?.emailVerified || false,
      isAnonymous: auth.currentUser?.isAnonymous || false,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName || '',
        email: provider.email || '',
        photoUrl: provider.photoURL || ''
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed }: { icon: any, label: string, active: boolean, onClick: () => void, collapsed?: boolean }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center justify-center lg:justify-start gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative",
      active 
        ? "bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20" 
        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
    )}
    title={collapsed ? label : undefined}
  >
    <Icon size={22} className={cn("transition-transform group-active:scale-90", active && "animate-pulse")} />
    <span className={cn(
      "text-sm font-bold transition-all duration-300 truncate",
      collapsed ? "lg:hidden opacity-0 w-0" : "opacity-100 w-auto"
    )}>
      {label}
    </span>
  </button>
);

const MobileNavItem = ({ icon: Icon, active, label, onClick }: { icon: any, active: boolean, label: string, onClick: () => void }) => (
  <motion.button
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all duration-300 relative",
      active 
        ? "text-blue-600 dark:text-blue-400" 
        : "text-slate-400 dark:text-slate-500"
    )}
  >
    <div className={cn(
      "p-1.5 rounded-2xl transition-all duration-300",
      active && "bg-blue-50/50 dark:bg-blue-900/20 scale-110"
    )}>
      <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    </div>
    <span className={cn(
      "text-[10px] font-black uppercase tracking-tighter transition-all",
      active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 h-0 overflow-hidden"
    )}>
      {label}
    </span>
    {active && (
      <motion.div
        layoutId="mobileActive"
        className="absolute -bottom-1 w-1 h-1 bg-blue-600 rounded-full"
      />
    )}
  </motion.button>
);

const TransactionCard = ({ t, accounts, categories, onEdit, onDelete, onToggleConsolidation, formatCurrency }: { t: Transaction, accounts: Account[], categories: Category[], onEdit: (t: Transaction) => void, onDelete: (t: Transaction) => void, onToggleConsolidation: (t: Transaction) => void, formatCurrency: (v: number) => string }) => {
  const category = categories.find(c => c.id === (t.categoryId || t.costCenterId));
  const account = accounts.find(a => a.id === t.accountId);
  
  return (
    <motion.div 
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.99 }}
      className="group flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className={cn(
          "w-10 h-10 min-w-10 rounded-xl flex items-center justify-center transition-colors",
          t.type === 'income' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : 
          t.type === 'expense' ? "bg-rose-50 text-rose-600 dark:bg-rose-900/20" : 
          "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
        )}>
          {t.type === 'income' ? <TrendingUp size={20} /> : t.type === 'expense' ? <TrendingDown size={20} /> : <ArrowRightLeft size={20} />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{t.description}</p>
            {t.attachmentUrl && <Paperclip size={12} className="text-slate-300" />}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{account?.name}</span>
            <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{category?.name}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className={cn(
            "text-sm font-black tracking-tight",
            t.type === 'income' ? "text-emerald-600" : 
            t.type === 'expense' ? "text-rose-600" : 
            "text-blue-600"
          )}>
            {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}{formatCurrency(t.amount)}
          </p>
          <button 
            onClick={() => onToggleConsolidation(t)}
            className={cn(
              "text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md transition-colors",
              t.consolidated 
                ? "text-emerald-500/50" 
                : "bg-amber-50 text-amber-600 dark:bg-amber-900/20"
            )}
          >
            {t.consolidated ? <Check size={10} className="inline mr-1" /> : <Clock size={10} className="inline mr-1" />}
            {t.consolidated ? 'Confirmado' : 'Pendente'}
          </button>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(t)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
            <Edit2 size={14} />
          </button>
          <button onClick={() => onDelete(t)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const SummaryHero = ({ balance, income, expense, projected, formatCurrencyWithPrivacy, onStatClick }: { balance: number, income: number, expense: number, projected: number, formatCurrencyWithPrivacy: (v: number) => string, onStatClick: () => void }) => (
  <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative">
    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
    <div className="relative z-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Saldo Total</p>
          <h2 className={cn(
            "text-4xl lg:text-5xl font-black tracking-tighter mb-2",
            balance < 0 ? "text-rose-600" : "text-slate-900 dark:text-white"
          )}>
            {formatCurrencyWithPrivacy(balance)}
          </h2>
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
              projected >= balance ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : "bg-rose-50 text-rose-600 dark:bg-rose-900/20"
            )}>
              {projected >= balance ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              Projetado: {formatCurrencyWithPrivacy(projected)}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 lg:gap-8 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 pt-6 lg:pt-0 lg:pl-8">
          <button onClick={onStatClick} className="text-left group">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Receitas
            </p>
            <p className="text-xl lg:text-2xl font-black text-emerald-600 tracking-tight group-active:scale-95 transition-transform">
              {formatCurrencyWithPrivacy(income)}
            </p>
          </button>
          <button onClick={onStatClick} className="text-left group">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Despesas
            </p>
            <p className="text-xl lg:text-2xl font-black text-rose-600 tracking-tight group-active:scale-95 transition-transform">
              {formatCurrencyWithPrivacy(expense)}
            </p>
          </button>
        </div>
      </div>
    </div>
  </div>
);

const Card = ({ children, className, title, onClick }: { children: React.ReactNode, className?: string, title?: string, onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={cn(
      "bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm",
      onClick && "cursor-pointer active:scale-[0.98] transition-transform",
      className
    )}
  >
    {title && (
      <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-6">
        {title}
      </h3>
    )}
    {children}
  </div>
);

const StatCard = ({ title, value, icon: Icon, color, trend, valueColor, onClick }: { title: string, value: string, icon: any, color: string, trend?: string, valueColor?: string, onClick?: () => void }) => (
  <Card 
    className={cn(
      "flex flex-col gap-2 transition-all duration-300 group", 
      onClick && "cursor-pointer hover:shadow-md active:scale-95"
    )}
    onClick={onClick}
  >
    <div className="flex justify-between items-start">
      <div className={cn("p-2 rounded-lg", color)}>
        <Icon size={20} className="text-white" />
      </div>
      {trend && (
        <span className={cn("text-xs font-medium px-2 py-1 rounded-full", trend.startsWith('+') ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400")}>
          {trend}
        </span>
      )}
    </div>
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
      <p className={cn("text-2xl font-bold", valueColor || "text-slate-900 dark:text-white")}>{value}</p>
    </div>
  </Card>
);

const CalculatorComponent = ({ value, onValueChange, onClose }: { value: string, onValueChange: (val: string) => void, onClose: () => void }) => {
  const [display, setDisplay] = useState(value || '0');
  
  const handleDigit = (digit: string) => {
    if (display === '0') setDisplay(digit);
    else setDisplay(display + digit);
  };

  const handleOperator = (op: string) => {
    setDisplay(display + op);
  };

  const handleClear = () => {
    setDisplay('0');
  };

  const handleEqual = () => {
    try {
      // Basic evaluation (safe for simple math)
      // Replace comma with dot for calculation
      const expression = display.replace(/,/g, '.');
      const result = eval(expression);
      const formattedResult = typeof result === 'number' ? Number(result.toFixed(2)).toString() : result.toString();
      setDisplay(formattedResult.replace(/\./g, ','));
    } catch (e) {
      setDisplay('Erro');
    }
  };

  const handleApply = () => {
    try {
      const expression = display.replace(/,/g, '.');
      const result = eval(expression);
      if (isNaN(result)) throw new Error();
      onValueChange(Number(result.toFixed(2)).toString());
      onClose();
    } catch (e) {
      handleEqual();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-2xl w-64">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold text-slate-700 dark:text-slate-200">Calculadora</h4>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <X size={18} />
        </button>
      </div>
      <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-xl mb-4 text-right overflow-hidden">
        <span className="text-2xl font-mono text-slate-800 dark:text-white truncate block">{display}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {['7', '8', '9', '/'].map(btn => (
          <button key={btn} onClick={() => isNaN(Number(btn)) ? handleOperator(btn) : handleDigit(btn)} className="p-3 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg font-bold text-slate-700 dark:text-slate-200">{btn}</button>
        ))}
        {['4', '5', '6', '*'].map(btn => (
          <button key={btn} onClick={() => isNaN(Number(btn)) ? handleOperator(btn) : handleDigit(btn)} className="p-3 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg font-bold text-slate-700 dark:text-slate-200">{btn}</button>
        ))}
        {['1', '2', '3', '-'].map(btn => (
          <button key={btn} onClick={() => isNaN(Number(btn)) ? handleOperator(btn) : handleDigit(btn)} className="p-3 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg font-bold text-slate-700 dark:text-slate-200">{btn}</button>
        ))}
        {['0', ',', 'C', '+'].map(btn => (
          <button key={btn} onClick={() => btn === 'C' ? handleClear() : btn === ',' ? handleDigit(',') : isNaN(Number(btn)) ? handleOperator(btn) : handleDigit(btn)} className="p-3 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg font-bold text-slate-700 dark:text-slate-200">{btn}</button>
        ))}
        <button onClick={handleEqual} className="col-span-2 p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg font-bold">=</button>
        <button onClick={handleApply} className="col-span-2 p-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-bold">Aplicar</button>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedAccountForDetails, setSelectedAccountForDetails] = useState<Account | null>(null);
  const [isAccountDetailsVisible, setIsAccountDetailsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ isPremium?: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'accounts' | 'categories' | 'reports' | 'recurring'>('dashboard');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [amountValue, setAmountValue] = useState('');
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [calcValue, setCalcValue] = useState('');
  const [activeCalcField, setActiveCalcField] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>('all');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [transactionsToImport, setTransactionsToImport] = useState<ImportTransaction[]>([]);
  const [importSource, setImportSource] = useState<'pdf' | 'excel'>('pdf');
  const [isAccountImportModalOpen, setIsAccountImportModalOpen] = useState(false);
  const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [isQuickAddCategoryModalOpen, setIsQuickAddCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [selectedCostCenterId, setSelectedCostCenterId] = useState<string>('');
  const [selectedRecurringCostCenterId, setSelectedRecurringCostCenterId] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [isEditTransactionModalOpen, setIsEditTransactionModalOpen] = useState(false);
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [shouldRemoveAttachment, setShouldRemoveAttachment] = useState(false);
  const [visibleTransactionsCount, setVisibleTransactionsCount] = useState(20);
  const [selectedAccountForProjection, setSelectedAccountForProjection] = useState<string | null>(null);

  // Dashboard Date State
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [dashboardDate, setDashboardDate] = useState(new Date());
  const [dashboardFilterMode, setDashboardFilterMode] = useState<'to-today' | 'full-month' | 'tomorrow'>('to-today');

  const currentMonth = startOfMonth(dashboardDate);

  // Filter transactions for selected account in current month
  const accountTransactions = useMemo(() => {
    if (!selectedAccountForDetails) return [];
    
    return transactions
      .filter(t => t.accountId === selectedAccountForDetails.id)
      .filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === currentMonth.getMonth() && 
               tDate.getFullYear() === currentMonth.getFullYear();
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedAccountForDetails, transactions, currentMonth]);

  // Reports State
  const [reportStartDate, setReportStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [reportEndDate, setReportEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [reportYear, setReportYear] = useState(new Date().getFullYear().toString());
  const [reportFilterCategory, setReportFilterCategory] = useState('');
  const [reportFilterAccount, setReportFilterAccount] = useState('');
  const [reportFilterType, setReportFilterType] = useState('all');
  const [reportFilterSearch, setReportFilterSearch] = useState('');
  const [reportFilterStatus, setReportFilterStatus] = useState('all');

  // Connection Test
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  const formatCurrencyWithPrivacy = (amount: number) => {
    if (isPrivacyMode) return 'R$ ••••';
    return formatCurrency(amount);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Sync user profile
        const userRef = doc(db, 'users', user.uid);
        const snapshot = await getDocFromServer(userRef).catch(() => null);
        if (!snapshot?.exists()) {
          // Initialize profile
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            isPremium: false
          }).catch((error) => {
            handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
          });
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        setProfile(snapshot.data() as any);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsQuickAddModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!user) return;

    const qTransactions = query(
      collection(db, `users/${user.uid}/transactions`),
      orderBy('date', 'asc')
    );
    const unsubTransactions = onSnapshot(qTransactions, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/transactions`));

    const unsubAccounts = onSnapshot(collection(db, `users/${user.uid}/accounts`), (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/accounts`));

    const unsubCategories = onSnapshot(collection(db, `users/${user.uid}/categories`), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/categories`));

    const unsubRecurring = onSnapshot(collection(db, `users/${user.uid}/recurring_transactions`), (snapshot) => {
      setRecurringTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecurringTransaction)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/recurring_transactions`));

    return () => {
      unsubTransactions();
      unsubAccounts();
      unsubCategories();
      unsubRecurring();
    };
  }, [user]);

  const totalBalance = useMemo(() => accounts.reduce((acc, curr) => acc + curr.balance, 0), [accounts]);
  
  const filteredTransactionsByDashboard = useMemo(() => {
    return transactions.filter(t => {
      const tDate = parseISO(t.date);
      const isInInterval = isWithinInterval(tDate, { 
        start: startOfMonth(dashboardDate), 
        end: endOfMonth(dashboardDate) 
      });

      if (!isInInterval) return false;

      if (selectedAccountFilter !== 'all' && t.accountId !== selectedAccountFilter) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const categoryName = categories.find(c => c.id === t.categoryId)?.name?.toLowerCase() || '';
        const accountName = accounts.find(a => a.id === t.accountId)?.name?.toLowerCase() || '';
        
        return (
          t.description.toLowerCase().includes(query) ||
          t.amount.toString().includes(query) ||
          (t.notes || '').toLowerCase().includes(query) ||
          categoryName.includes(query) ||
          accountName.includes(query)
        );
      }

      return true;
    });
  }, [transactions, dashboardDate, searchQuery, categories, accounts]);

  const groupedTransactionsByMonth = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactionsByDashboard.forEach(t => {
      const month = t.date.substring(0, 7); // yyyy-MM
      if (!groups[month]) groups[month] = [];
      groups[month].push(t);
    });
    return groups;
  }, [filteredTransactionsByDashboard]);

  const sortedMonths = useMemo(() => {
    return Object.keys(groupedTransactionsByMonth).sort();
  }, [groupedTransactionsByMonth]);

  const groupCounts = useMemo(() => {
    return sortedMonths.map(month => groupedTransactionsByMonth[month].length);
  }, [sortedMonths, groupedTransactionsByMonth]);

  const dashboardRange = useMemo(() => {
    const start = startOfMonth(dashboardDate);
    const endOfMonthDate = endOfMonth(dashboardDate);
    const today = new Date();
    const tomorrow = addDays(today, 1);

    if (dashboardFilterMode === 'to-today') {
      // Se for o mês atual, vai até hoje. Se for outro mês, vai até o fim do mês.
      const end = isSameMonth(dashboardDate, today) ? today : endOfMonthDate;
      return { 
        start: format(start, 'yyyy-MM-dd'), 
        end: format(end, 'yyyy-MM-dd') 
      };
    } else if (dashboardFilterMode === 'full-month') {
      return { 
        start: format(start, 'yyyy-MM-dd'), 
        end: format(endOfMonthDate, 'yyyy-MM-dd') 
      };
    } else { // tomorrow
      return { 
        start: format(tomorrow, 'yyyy-MM-dd'), 
        end: format(tomorrow, 'yyyy-MM-dd') 
      };
    }
  }, [dashboardDate, dashboardFilterMode]);

  const futureRecurringImpact = useMemo(() => {
    const impact: Record<string, number> = {};
    const today = startOfDay(new Date());
    const limitDate = parseISO(dashboardRange.end);

    if (isBefore(limitDate, today)) return impact;

    recurringTransactions.forEach(rt => {
      if (!rt.active) return;

      let lastDate = rt.lastProcessedDate ? parseISO(rt.lastProcessedDate) : parseISO(rt.startDate);
      let nextDate = rt.frequency === 'weekly' ? addWeeks(lastDate, 1) : addMonths(lastDate, 1);

      while (nextDate <= limitDate) {
        if (nextDate > today) {
          const amount = rt.type === 'income' ? rt.amount : -rt.amount;
          impact[rt.accountId] = (impact[rt.accountId] || 0) + amount;
        }
        nextDate = rt.frequency === 'weekly' ? addWeeks(nextDate, 1) : addMonths(nextDate, 1);
      }
    });

    return impact;
  }, [recurringTransactions, dashboardRange.end]);

  const futureRecurringDetails = useMemo(() => {
    const details: Array<{ accountId: string; description: string; date: string; amount: number; type: TransactionType }> = [];
    const today = startOfDay(new Date());
    const limitDate = parseISO(dashboardRange.end);

    if (isBefore(limitDate, today)) return details;

    recurringTransactions.forEach(rt => {
      if (!rt.active) return;

      let lastDate = rt.lastProcessedDate ? parseISO(rt.lastProcessedDate) : parseISO(rt.startDate);
      let nextDate = rt.frequency === 'weekly' ? addWeeks(lastDate, 1) : addMonths(lastDate, 1);

      while (nextDate <= limitDate) {
        if (nextDate > today) {
          details.push({
            accountId: rt.accountId,
            description: rt.description,
            date: format(nextDate, 'yyyy-MM-dd'),
            amount: rt.amount,
            type: rt.type
          });
        }
        nextDate = rt.frequency === 'weekly' ? addWeeks(nextDate, 1) : addMonths(nextDate, 1);
      }
    });

    return details.sort((a, b) => a.date.localeCompare(b.date));
  }, [recurringTransactions, dashboardRange.end]);

  const projectedBalance = useMemo(() => {
    const pendingTransactions = transactions.filter(t => !t.consolidated);
    const pendingIncomes = pendingTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const pendingExpenses = pendingTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    
    // Add future recurring transactions within the period
    const futureImpact = Object.values(futureRecurringImpact).reduce((acc, curr) => acc + curr, 0);
    
    return totalBalance + pendingIncomes - pendingExpenses + futureImpact;
  }, [totalBalance, transactions, futureRecurringImpact]);

  const projectedBalancesByAccount = useMemo(() => {
    return accounts.map(account => {
      const accountTransactions = transactions.filter(t => t.accountId === account.id || t.toAccountId === account.id);
      const pending = accountTransactions.filter(t => !t.consolidated);
      
      let projected = account.balance;
      
      pending.forEach(t => {
        if (t.type === 'income') {
          projected += t.amount;
        } else if (t.type === 'expense') {
          projected -= t.amount;
        } else if (t.type === 'transfer') {
          if (t.accountId === account.id) {
            projected -= t.amount;
          } else if (t.toAccountId === account.id) {
            projected += t.amount;
          }
        }
      });

      // Add future recurring impact
      projected += (futureRecurringImpact[account.id] || 0);
      
      return {
        ...account,
        projectedBalance: projected
      };
    });
  }, [accounts, transactions, futureRecurringImpact]);

  const dashboardTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = parseISO(t.date);
      return isWithinInterval(date, {
        start: parseISO(dashboardRange.start),
        end: parseISO(dashboardRange.end)
      });
    });
  }, [transactions, dashboardRange]);

  const dashboardTransactionsByDate = useMemo(() => {
    const grouped: Record<string, Transaction[]> = {};
    dashboardTransactions.forEach(t => {
      if (!grouped[t.date]) grouped[t.date] = [];
      grouped[t.date].push(t);
    });
    return Object.entries(grouped)
      .sort((a, b) => compareDesc(parseISO(a[0]), parseISO(b[0])));
  }, [dashboardTransactions]);

  const dailySummary = useMemo(() => {
    const summary: Record<string, { income: number; expense: number }> = {};
    
    dashboardTransactions.forEach(t => {
      const dateKey = t.date.substring(0, 10);
      if (!summary[dateKey]) {
        summary[dateKey] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        summary[dateKey].income += t.amount;
      } else if (t.type === 'expense') {
        summary[dateKey].expense += t.amount;
      }
    });

    return Object.entries(summary)
      .map(([date, totals]) => ({ date, ...totals }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [dashboardTransactions]);

  useEffect(() => {
    if (!user || recurringTransactions.length === 0) return;

    const checkReminders = () => {
      const today = startOfDay(new Date());
      const next3Days = addDays(today, 3);
      const newNotifications: any[] = [];

      recurringTransactions.forEach(rt => {
        if (!rt.active) return;

        const nextDate = rt.lastProcessedDate ? addMonths(parseISO(rt.lastProcessedDate), rt.frequency === 'monthly' ? 1 : 0) : parseISO(rt.startDate);
        if (isBefore(nextDate, next3Days)) {
          newNotifications.push({
            id: `notif-reminder-${rt.id}-${nextDate.getTime()}`,
            title: 'Lembrete de Transação',
            message: `A transação "${rt.description}" está próxima do vencimento (${formatDate(nextDate.toISOString())})`,
            type: 'reminder',
            date: nextDate.toISOString()
          });
        }
      });

      // Check budgets
      const expenseByCategory = categories
        .filter(c => c.type === 'expense' && !c.parentId)
        .map(c => {
          const total = dashboardTransactions
            .filter(t => t.costCenterId === c.id)
            .reduce((acc, curr) => acc + curr.amount, 0);
          return { id: c.id, name: c.name, total };
        });

      // Simple alert if any category is high (mocking budget logic since we don't have explicit budgets yet)
      expenseByCategory.forEach(cat => {
        if (cat.total > 1000) { // Arbitrary threshold for demo
          newNotifications.push({
            id: `notif-budget-${cat.id}-${new Date().toDateString()}`,
            title: 'Alerta de Orçamento',
            message: `Gastos em ${cat.name} ultrapassaram R$ 1.000,00`,
            type: 'alert',
            date: new Date().toISOString()
          });
        }
      });

      setNotifications(newNotifications);
    };

    checkReminders();
  }, [user, recurringTransactions, dashboardTransactions, categories]);

  const totalIncome = useMemo(() => dashboardTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0), [dashboardTransactions]);
  const totalExpense = useMemo(() => dashboardTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0), [dashboardTransactions]);

  const chartData = useMemo(() => {
    // Show the last 7 days of the selected period
    const endDate = parseISO(dashboardRange.end);
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      return format(d, 'yyyy-MM-dd');
    }).reverse();

    return last7Days.map(date => {
      const dayTransactions = dashboardTransactions.filter(t => t.date.startsWith(date));
      return {
        name: format(parseISO(date), 'eee', { locale: undefined }),
        income: dayTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0),
        expense: dayTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0),
      };
    });
  }, [dashboardTransactions, dashboardRange]);

  const pieData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    dashboardTransactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = categories.find(c => c.id === t.categoryId)?.name || 'Outros';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
    });
    return Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));
  }, [dashboardTransactions, categories]);

  const handleImportTransactions = async () => {
    if (!user || transactionsToImport.length === 0) return;
    setIsImporting(true);
    
    try {
      // 1. Ensure we have an account
      let accountId = accounts[0]?.id;
      if (!accountId) {
        const accountRef = await addDoc(collection(db, `users/${user.uid}/accounts`), {
          name: 'Conta Principal (Importada)',
          type: 'checking',
          balance: 0,
          userId: user.uid
        });
        accountId = accountRef.id;
      }

      // 2. Process transactions
      const newCategories = [...categories];
      for (const item of transactionsToImport) {
        // Use subcategory if available, otherwise category, otherwise 'Outros'
        const categoryName = item.subcategory || item.category || 'Outros';
        
        // Find or create category
        let category = newCategories.find(c => c.name === categoryName && c.type === item.type);
        let catId = category?.id;

        if (!catId) {
          try {
            const catRef = await addDoc(collection(db, `users/${user.uid}/categories`), {
              name: categoryName,
              type: item.type,
              icon: item.type === 'income' ? 'TrendingUp' : item.type === 'expense' ? 'TrendingDown' : 'ArrowRightLeft',
              color: item.type === 'income' ? '#10b981' : item.type === 'expense' ? '#f43f5e' : '#3b82f6',
              userId: user.uid
            });
            catId = catRef.id;
            // Update local categories to avoid duplicates in the same loop
            newCategories.push({ id: catId, name: categoryName, type: item.type, icon: '', color: '', userId: user.uid });
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/categories`);
          }
        }

        // Add transaction
        await runTransaction(db, async (transaction) => {
          const transRef = doc(collection(db, `users/${user.uid}/transactions`));
          const accountRef = doc(db, `users/${user.uid}/accounts`, accountId!);
          
          const accountSnap = await transaction.get(accountRef);
          if (!accountSnap.exists()) return;

          const newBalance = item.type === 'income' 
            ? accountSnap.data().balance + item.amount 
            : accountSnap.data().balance - item.amount;

          transaction.set(transRef, {
            id: transRef.id,
            type: item.type,
            amount: item.amount,
            description: item.description,
            date: item.date,
            accountId: accountId,
            categoryId: catId,
            userId: user.uid,
            createdAt: serverTimestamp(),
            consolidated: true
          });

          transaction.update(accountRef, { balance: newBalance });
        }).catch(error => {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/transactions`);
        });
      }

      setCategories(newCategories);
      setIsImportModalOpen(false);
      setTransactionsToImport([]);
      alert('Importação concluída com sucesso!');
    } catch (error) {
      console.error('Erro na importação:', error);
      if (error instanceof Error && error.message.startsWith('{')) {
        const errInfo = JSON.parse(error.message);
        alert(`Erro de permissão ao ${errInfo.operationType} em ${errInfo.path}. Verifique as regras de segurança.`);
      } else {
        alert('Ocorreu um erro ao importar os dados.');
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const data = await parseExcelFile(file);
      setTransactionsToImport(data);
      setImportSource('excel');
      setIsImportModalOpen(true);
      // Reset input
      e.target.value = '';
    } catch (error) {
      console.error("Erro ao ler Excel:", error);
      alert("Erro ao ler o arquivo Excel. Verifique se o formato está correto.");
    }
  };

  const handleImportAccounts = async () => {
    if (!user) return;
    setIsImporting(true);
    try {
      for (const acc of ACCOUNT_IMPORT_DATA) {
        // Check if account already exists to avoid duplicates
        const existing = accounts.find(a => a.name === acc.name);
        if (!existing) {
          await addDoc(collection(db, `users/${user.uid}/accounts`), {
            name: acc.name,
            type: acc.type,
            balance: acc.balance,
            userId: user.uid
          });
        }
      }
      setIsAccountImportModalOpen(false);
      alert('Contas importadas com sucesso!');
    } catch (error) {
      console.error('Erro ao importar contas:', error);
      alert('Erro ao importar contas.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleEditTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !transactionToEdit) return;
    const formData = new FormData(e.currentTarget);
    const type = formData.get('type') as TransactionType;
    const amount = Number(formData.get('amount'));
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const categoryId = formData.get('categoryId') as string;
    const costCenterId = formData.get('costCenterId') as string;
    const accountId = formData.get('accountId') as string;
    const toAccountId = formData.get('toAccountId') as string;
    const notes = formData.get('notes') as string;
    const consolidated = formData.get('consolidated') === 'on';

    if (type === 'transfer' && accountId === toAccountId) {
      alert('A conta de origem e destino não podem ser a mesma.');
      return;
    }

    let attachment = transactionToEdit.attachmentUrl && !shouldRemoveAttachment ? { url: transactionToEdit.attachmentUrl, name: transactionToEdit.attachmentName } : null;
    if (selectedFile) {
      attachment = await handleFileUpload(selectedFile);
    }

    try {
      await runTransaction(db, async (transaction) => {
        const transRef = doc(db, `users/${user.uid}/transactions`, transactionToEdit.id);
        
        // Get all necessary account references
        const oldFromAccountRef = doc(db, `users/${user.uid}/accounts`, transactionToEdit.accountId);
        const oldToAccountRef = transactionToEdit.type === 'transfer' && transactionToEdit.toAccountId 
          ? doc(db, `users/${user.uid}/accounts`, transactionToEdit.toAccountId) 
          : null;
        
        const newFromAccountRef = doc(db, `users/${user.uid}/accounts`, accountId);
        const newToAccountRef = type === 'transfer' && toAccountId 
          ? doc(db, `users/${user.uid}/accounts`, toAccountId) 
          : null;

        // Collect all unique account references to fetch
        const accountRefsToFetch = new Set<string>();
        accountRefsToFetch.add(oldFromAccountRef.path);
        if (oldToAccountRef) accountRefsToFetch.add(oldToAccountRef.path);
        accountRefsToFetch.add(newFromAccountRef.path);
        if (newToAccountRef) accountRefsToFetch.add(newToAccountRef.path);

        const accountSnaps: Record<string, any> = {};
        for (const path of accountRefsToFetch) {
          const snap = await transaction.get(doc(db, path));
          if (snap.exists()) {
            accountSnaps[path] = snap.data();
          }
        }

        let oldFromBalance = accountSnaps[oldFromAccountRef.path]?.balance || 0;
        let oldToBalance = oldToAccountRef ? (accountSnaps[oldToAccountRef.path]?.balance || 0) : 0;
        let newFromBalance = accountSnaps[newFromAccountRef.path]?.balance || 0;
        let newToBalance = newToAccountRef ? (accountSnaps[newToAccountRef.path]?.balance || 0) : 0;

        // 1. REVERT OLD TRANSACTION IMPACT (if it was consolidated)
        if (transactionToEdit.consolidated) {
          if (transactionToEdit.type === 'transfer' && transactionToEdit.toAccountId) {
            oldFromBalance += transactionToEdit.amount;
            oldToBalance -= transactionToEdit.amount;
            
            // Update local balances for step 2 if accounts are the same
            if (oldFromAccountRef.path === newFromAccountRef.path) newFromBalance += transactionToEdit.amount;
            if (oldFromAccountRef.path === (newToAccountRef?.path)) newToBalance += transactionToEdit.amount;
            if (oldToAccountRef?.path === newFromAccountRef.path) newFromBalance -= transactionToEdit.amount;
            if (oldToAccountRef?.path === (newToAccountRef?.path)) newToBalance -= transactionToEdit.amount;
          } else {
            const revertAmount = transactionToEdit.type === 'income' ? -transactionToEdit.amount : transactionToEdit.amount;
            oldFromBalance += revertAmount;
            
            // Update local balances for step 2 if accounts are the same
            if (oldFromAccountRef.path === newFromAccountRef.path) newFromBalance += revertAmount;
            if (oldFromAccountRef.path === (newToAccountRef?.path)) newToBalance += revertAmount;
          }
        }

        // 2. APPLY NEW TRANSACTION IMPACT (if it is consolidated)
        if (consolidated) {
          if (type === 'transfer') {
            newFromBalance -= amount;
            newToBalance += amount;
            
            // Update old balances if accounts are the same (for final updates)
            if (newFromAccountRef.path === oldFromAccountRef.path) oldFromBalance -= amount;
            if (newFromAccountRef.path === (oldToAccountRef?.path)) oldToBalance -= amount;
            if (newToAccountRef?.path === oldFromAccountRef.path) oldFromBalance += amount;
            if (newToAccountRef?.path === (oldToAccountRef?.path)) oldToBalance += amount;
          } else {
            const applyAmount = type === 'income' ? amount : -amount;
            newFromBalance += applyAmount;
            
            // Update old balances if accounts are the same (for final updates)
            if (newFromAccountRef.path === oldFromAccountRef.path) oldFromBalance += applyAmount;
            if (newFromAccountRef.path === (oldToAccountRef?.path)) oldToBalance += applyAmount;
          }
        }

        // 3. COMMIT BALANCE UPDATES
        transaction.update(oldFromAccountRef, { balance: oldFromBalance });
        if (oldToAccountRef) transaction.update(oldToAccountRef, { balance: oldToBalance });
        transaction.update(newFromAccountRef, { balance: newFromBalance });
        if (newToAccountRef) transaction.update(newToAccountRef, { balance: newToBalance });

        // 4. UPDATE TRANSACTION RECORD
        const updatedData: any = {
          type,
          amount,
          description,
          notes,
          date,
          accountId,
          consolidated,
          updatedAt: serverTimestamp()
        };

        if (attachment) {
          updatedData.attachmentUrl = attachment.url;
          updatedData.attachmentName = attachment.name;
        } else {
          updatedData.attachmentUrl = deleteField();
          updatedData.attachmentName = deleteField();
        }

        if (type !== 'transfer') {
          updatedData.categoryId = categoryId;
          updatedData.costCenterId = costCenterId;
          updatedData.toAccountId = null; // Clear if it was a transfer before
        } else {
          updatedData.toAccountId = toAccountId;
          updatedData.categoryId = null;
          updatedData.costCenterId = null;
        }

        transaction.update(transRef, updatedData);
      });
      
      setIsEditTransactionModalOpen(false);
      setTransactionToEdit(null);
      setSelectedFile(null);
      setShouldRemoveAttachment(false);
      alert('Transação atualizada com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/transactions/${transactionToEdit.id}`);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return null;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const fileRef = storageRef(storage, `users/${user.uid}/attachments/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setIsUploading(false);
      return { url, name: file.name };
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      setIsUploading(false);
      return null;
    }
  };

  const handleAddTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const type = formData.get('type') as TransactionType;
    const amount = Number(formData.get('amount'));
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const categoryId = formData.get('categoryId') as string;
    const costCenterId = formData.get('costCenterId') as string;
    const accountId = formData.get('accountId') as string;
    const toAccountId = formData.get('toAccountId') as string;
    const notes = formData.get('notes') as string;
    const consolidated = formData.get('consolidated') === 'on';

    if (type === 'transfer' && accountId === toAccountId) {
      alert('A conta de origem e destino não podem ser a mesma.');
      return;
    }

    let attachment = null;
    if (selectedFile) {
      attachment = await handleFileUpload(selectedFile);
    }

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Prepare references
        const transRef = doc(collection(db, `users/${user.uid}/transactions`));
        const fromAccountRef = doc(db, `users/${user.uid}/accounts`, accountId);
        const toAccountRef = type === 'transfer' ? doc(db, `users/${user.uid}/accounts`, toAccountId) : null;

        // 2. Perform all READS first
        const fromAccountSnap = await transaction.get(fromAccountRef);
        const toAccountSnap = toAccountRef ? await transaction.get(toAccountRef) : null;

        // 3. Logic and WRITES
        const data: any = {
          id: transRef.id,
          type,
          amount,
          description,
          notes,
          date,
          accountId,
          userId: user.uid,
          createdAt: serverTimestamp(),
          consolidated
        };

        if (attachment) {
          data.attachmentUrl = attachment.url;
          data.attachmentName = attachment.name;
        }

        if (type !== 'transfer') {
          data.categoryId = categoryId;
          data.costCenterId = costCenterId;
        } else {
          data.toAccountId = toAccountId;
        }

        // Set the transaction record
        transaction.set(transRef, data);

        if (consolidated) {
          if (type === 'transfer') {
            if (fromAccountSnap.exists()) {
              transaction.update(fromAccountRef, { balance: fromAccountSnap.data().balance - amount });
            }
            if (toAccountSnap && toAccountSnap.exists()) {
              transaction.update(toAccountRef!, { balance: toAccountSnap.data().balance + amount });
            }
          } else {
            if (fromAccountSnap.exists()) {
              const newBalance = type === 'income' ? fromAccountSnap.data().balance + amount : fromAccountSnap.data().balance - amount;
              transaction.update(fromAccountRef, { balance: newBalance });
            }
          }
        }
      });
      
      (e.target as HTMLFormElement).reset();
      setTransactionType('expense');
      setAmountValue('');
      setSelectedFile(null);
      setAttachmentUrl(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/transactions`);
    }
  };

  const handleDeleteTransaction = async (t: Transaction) => {
    if (!user) return;
    try {
      await runTransaction(db, async (transaction) => {
        // 1. Prepare references
        const transRef = doc(db, `users/${user.uid}/transactions`, t.id);
        const fromAccountRef = doc(db, `users/${user.uid}/accounts`, t.accountId);
        const toAccountRef = (t.type === 'transfer' && t.toAccountId) ? doc(db, `users/${user.uid}/accounts`, t.toAccountId) : null;

        // 2. Perform all READS first
        const fromAccountSnap = await transaction.get(fromAccountRef);
        const toAccountSnap = toAccountRef ? await transaction.get(toAccountRef) : null;

        // 3. Logic and WRITES
        if (t.consolidated) {
          if (t.type === 'transfer') {
            if (fromAccountSnap.exists()) {
              transaction.update(fromAccountRef, { balance: fromAccountSnap.data().balance + t.amount });
            }
            if (toAccountSnap && toAccountSnap.exists()) {
              transaction.update(toAccountRef!, { balance: toAccountSnap.data().balance - t.amount });
            }
          } else {
            if (fromAccountSnap.exists()) {
              const newBalance = t.type === 'income' ? fromAccountSnap.data().balance - t.amount : fromAccountSnap.data().balance + t.amount;
              transaction.update(fromAccountRef, { balance: newBalance });
            }
          }
        }

        transaction.delete(transRef);
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/transactions/${t.id}`);
    }
  };

  const handleToggleConsolidation = async (t: Transaction) => {
    if (!user) return;
    try {
      await runTransaction(db, async (transaction) => {
        const transRef = doc(db, `users/${user.uid}/transactions`, t.id);
        
        if (!t.accountId) {
          throw new Error("ID da conta de origem ausente na transação.");
        }
        
        const fromAccountRef = doc(db, `users/${user.uid}/accounts`, t.accountId);
        const toAccountRef = (t.type === 'transfer' && t.toAccountId) 
          ? doc(db, `users/${user.uid}/accounts`, t.toAccountId) 
          : null;

        if (t.type === 'transfer' && !t.toAccountId) {
          // If destination is missing, we treat it as an expense to allow consolidation
          // but we log a warning.
          console.warn(`Transferência ${t.id} sem conta de destino. Tratando como despesa para consolidação.`);
        }

        const fromAccountSnap = await transaction.get(fromAccountRef);
        const toAccountSnap = toAccountRef ? await transaction.get(toAccountRef) : null;

        const newConsolidated = !t.consolidated;

        if (newConsolidated) {
          // Becoming consolidated: Apply changes to balance
          if (t.type === 'transfer') {
            if (fromAccountSnap.exists()) {
              transaction.update(fromAccountRef, { balance: fromAccountSnap.data().balance - t.amount });
            }
            if (toAccountSnap && toAccountSnap.exists()) {
              transaction.update(toAccountRef!, { balance: toAccountSnap.data().balance + t.amount });
            }
          } else {
            if (fromAccountSnap.exists()) {
              const newBalance = t.type === 'income' ? fromAccountSnap.data().balance + t.amount : fromAccountSnap.data().balance - t.amount;
              transaction.update(fromAccountRef, { balance: newBalance });
            }
          }
        } else {
          // Becoming non-consolidated: Revert changes to balance
          if (t.type === 'transfer') {
            if (fromAccountSnap.exists()) {
              transaction.update(fromAccountRef, { balance: fromAccountSnap.data().balance + t.amount });
            }
            if (toAccountSnap && toAccountSnap.exists()) {
              transaction.update(toAccountRef!, { balance: toAccountSnap.data().balance - t.amount });
            }
          } else {
            if (fromAccountSnap.exists()) {
              const newBalance = t.type === 'income' ? fromAccountSnap.data().balance - t.amount : fromAccountSnap.data().balance + t.amount;
              transaction.update(fromAccountRef, { balance: newBalance });
            }
          }
        }

        transaction.update(transRef, { consolidated: newConsolidated, updatedAt: serverTimestamp() });
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/transactions/${t.id}`);
    }
  };

  const handleConsolidatePastPending = async () => {
    if (!user) return;
    const yesterday = format(addDays(new Date(), -1), 'yyyy-MM-dd');
    const pastPending = transactions.filter(t => !t.consolidated && t.date <= yesterday);
    
    if (pastPending.length === 0) {
      alert('Nenhuma transação pendente encontrada até a data de ontem.');
      return;
    }

    if (!window.confirm(`Deseja consolidar ${pastPending.length} transações pendentes até ${formatDate(yesterday)}?`)) {
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    for (const t of pastPending) {
      try {
        await runTransaction(db, async (transaction) => {
          const transRef = doc(db, `users/${user.uid}/transactions`, t.id);
          if (!t.accountId) return;
          
          const fromAccountRef = doc(db, `users/${user.uid}/accounts`, t.accountId);
          const toAccountRef = (t.type === 'transfer' && t.toAccountId) 
            ? doc(db, `users/${user.uid}/accounts`, t.toAccountId) 
            : null;

          const fromAccountSnap = await transaction.get(fromAccountRef);
          const toAccountSnap = toAccountRef ? await transaction.get(toAccountRef) : null;

          if (t.type === 'transfer') {
            if (fromAccountSnap.exists()) {
              transaction.update(fromAccountRef, { balance: fromAccountSnap.data().balance - t.amount });
            }
            if (toAccountSnap && toAccountSnap.exists()) {
              transaction.update(toAccountRef!, { balance: toAccountSnap.data().balance + t.amount });
            }
          } else {
            if (fromAccountSnap.exists()) {
              const newBalance = t.type === 'income' ? fromAccountSnap.data().balance + t.amount : fromAccountSnap.data().balance - t.amount;
              transaction.update(fromAccountRef, { balance: newBalance });
            }
          }
          transaction.update(transRef, { consolidated: true, updatedAt: serverTimestamp() });
        });
        successCount++;
      } catch (error) {
        console.error(`Erro ao consolidar transação ${t.id}:`, error);
        errorCount++;
      }
    }
    alert(`${successCount} transações consolidadas com sucesso!${errorCount > 0 ? ` ${errorCount} falharam.` : ''}`);
  };

  // Automation: Process Recurring Transactions
  useEffect(() => {
    if (!user || recurringTransactions.length === 0 || accounts.length === 0) return;

    const processRecurring = async () => {
      const today = startOfDay(new Date());
      
      for (const rt of recurringTransactions) {
        if (!rt.active) continue;

        let lastDate = rt.lastProcessedDate ? parseISO(rt.lastProcessedDate) : parseISO(rt.startDate);
        let nextDate = rt.frequency === 'weekly' ? addWeeks(lastDate, 1) : addMonths(lastDate, 1);

        while (isBefore(nextDate, today) || nextDate.getTime() === today.getTime()) {
          const dateStr = format(nextDate, 'yyyy-MM-dd');
          
          try {
            await runTransaction(db, async (transaction) => {
              const transRef = doc(collection(db, `users/${user.uid}/transactions`));
              const rtRef = doc(db, `users/${user.uid}/recurring_transactions`, rt.id);
              const accountRef = doc(db, `users/${user.uid}/accounts`, rt.accountId);
              
              const accountSnap = await transaction.get(accountRef);
              if (!accountSnap.exists()) return;

              const amount = rt.amount;
              const newBalance = rt.type === 'income' ? accountSnap.data().balance + amount : accountSnap.data().balance - amount;

              transaction.set(transRef, {
                id: transRef.id,
                type: rt.type,
                amount: rt.amount,
                description: `[Recorrente] ${rt.description}`,
                date: dateStr,
                accountId: rt.accountId,
                categoryId: rt.categoryId,
                costCenterId: rt.costCenterId,
                userId: user.uid,
                createdAt: serverTimestamp(),
                consolidated: true
              });

              transaction.update(accountRef, { balance: newBalance });
              transaction.update(rtRef, { 
                lastProcessedDate: dateStr,
                updatedAt: serverTimestamp()
              });
            });
          } catch (error) {
            console.error('Error processing recurring transaction:', error);
          }

          nextDate = rt.frequency === 'weekly' ? addWeeks(nextDate, 1) : addMonths(nextDate, 1);
        }
      }
    };

    processRecurring();
  }, [user, recurringTransactions, accounts]);

  const handleAddAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      type: formData.get('type') as AccountType,
      balance: Number(formData.get('balance')),
      userId: user.uid
    };

    try {
      await addDoc(collection(db, `users/${user.uid}/accounts`), data);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/accounts`);
    }
  };

  const handleUpdateAccountBalance = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !accountToEdit) return;
    const formData = new FormData(e.currentTarget);
    const newBalance = Number(formData.get('balance'));

    try {
      await updateDoc(doc(db, `users/${user.uid}/accounts`, accountToEdit.id), {
        balance: newBalance,
        updatedAt: serverTimestamp()
      });
      setIsEditAccountModalOpen(false);
      setAccountToEdit(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/accounts/${accountToEdit.id}`);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = parseISO(t.date);
      const withinInterval = isWithinInterval(date, {
        start: parseISO(reportStartDate),
        end: parseISO(reportEndDate)
      });

      if (!withinInterval) return false;

      if (reportFilterType !== 'all' && t.type !== reportFilterType) return false;
      if (reportFilterAccount && t.accountId !== reportFilterAccount) return false;
      if (reportFilterCategory && t.categoryId !== reportFilterCategory && t.costCenterId !== reportFilterCategory) return false;
      if (reportFilterStatus === 'consolidated' && !t.consolidated) return false;
      if (reportFilterStatus === 'pending' && t.consolidated) return false;
      
      if (reportFilterSearch) {
        const search = reportFilterSearch.toLowerCase();
        return t.description.toLowerCase().includes(search) || 
               (t.notes && t.notes.toLowerCase().includes(search));
      }

      return true;
    });
  }, [transactions, reportStartDate, reportEndDate, reportFilterType, reportFilterAccount, reportFilterCategory, reportFilterStatus, reportFilterSearch]);

  const filteredTransactionsByDate = useMemo(() => {
    const grouped: Record<string, Transaction[]> = {};
    filteredTransactions.forEach(t => {
      if (!grouped[t.date]) grouped[t.date] = [];
      grouped[t.date].push(t);
    });
    return Object.entries(grouped)
      .sort((a, b) => compareDesc(parseISO(a[0]), parseISO(b[0])));
  }, [filteredTransactions]);

  const categorySummary = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const summary: Record<string, { id: string, name: string, value: number, color: string }> = {};
    
    expenses.forEach(t => {
      const category = categories.find(c => c.id === t.categoryId) || categories.find(c => c.id === t.costCenterId);
      const categoryId = category?.id || 'none';
      const categoryName = category?.name || 'Sem Categoria';
      const categoryColor = category?.color || '#94a3b8';
      
      if (!summary[categoryId]) {
        summary[categoryId] = { id: categoryId, name: categoryName, value: 0, color: categoryColor };
      }
      summary[categoryId].value += t.amount;
    });
    
    return Object.values(summary).sort((a, b) => b.value - a.value);
  }, [filteredTransactions, categories]);

  const trendSummary = useMemo(() => {
    const sortedTransactions = [...filteredTransactions].sort((a, b) => a.date.localeCompare(b.date));
    const data: { date: string, balance: number, income: number, expense: number }[] = [];
    let runningBalance = 0;

    // To show a trend, we might want to group by day
    const groupedByDay: Record<string, { income: number, expense: number }> = {};
    
    sortedTransactions.forEach(t => {
      if (!groupedByDay[t.date]) {
        groupedByDay[t.date] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') groupedByDay[t.date].income += t.amount;
      if (t.type === 'expense') groupedByDay[t.date].expense += t.amount;
    });

    Object.keys(groupedByDay).sort().forEach(date => {
      runningBalance += groupedByDay[date].income - groupedByDay[date].expense;
      data.push({
        date: format(parseISO(date), 'dd/MM'),
        balance: runningBalance,
        income: groupedByDay[date].income,
        expense: groupedByDay[date].expense
      });
    });

    return data;
  }, [filteredTransactions]);

  const annualSummary = useMemo(() => {
    const yearTransactions = transactions.filter(t => t.date.startsWith(reportYear));
    const income = yearTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const expense = yearTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = (i + 1).toString().padStart(2, '0');
      const monthPrefix = `${reportYear}-${month}`;
      const monthTransactions = yearTransactions.filter(t => t.date.startsWith(monthPrefix));
      const monthDate = new Date(Number(reportYear), i, 1);
      return {
        month: format(monthDate, 'MMM', { locale: undefined }),
        fullMonth: format(monthDate, 'MMMM', { locale: undefined }),
        startDate: format(startOfMonth(monthDate), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(monthDate), 'yyyy-MM-dd'),
        income: monthTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0),
        expense: monthTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0),
      };
    });

    return { income, expense, monthlyData };
  }, [transactions, reportYear]);

  const comparisonStats = useMemo(() => {
    const start = parseISO(reportStartDate);
    const end = parseISO(reportEndDate);
    const diff = end.getTime() - start.getTime();
    
    const prevStart = new Date(start.getTime() - diff - 86400000);
    const prevEnd = new Date(start.getTime() - 86400000);
    
    const prevTransactions = transactions.filter(t => {
      const date = parseISO(t.date);
      return isWithinInterval(date, { start: prevStart, end: prevEnd });
    });
    
    const currentIncome = filteredTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const currentExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    
    const prevIncome = prevTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const prevExpense = prevTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    
    const incomeDiff = prevIncome === 0 ? (currentIncome > 0 ? 100 : 0) : ((currentIncome - prevIncome) / prevIncome) * 100;
    const expenseDiff = prevExpense === 0 ? (currentExpense > 0 ? 100 : 0) : ((currentExpense - prevExpense) / prevExpense) * 100;
    
    return { incomeDiff, expenseDiff, prevIncome, prevExpense };
  }, [transactions, filteredTransactions, reportStartDate, reportEndDate]);

  const expenseAnalysis = useMemo(() => {
    const expenses = annualSummary.monthlyData.map(d => d.expense);
    const total = expenses.reduce((acc, curr) => acc + curr, 0);
    const average = total / 12;
    const max = Math.max(...expenses);
    const peakMonth = annualSummary.monthlyData.find(d => d.expense === max)?.fullMonth || '';
    
    return { average, max, peakMonth, total };
  }, [annualSummary]);

  const exportToCSV = () => {
    const headers = ['Data', 'Descrição', 'Tipo', 'Valor', 'Conta', 'Categoria'];
    const rows = filteredTransactions.map(t => [
      formatDate(t.date),
      t.description,
      t.type === 'income' ? 'Receita' : t.type === 'expense' ? 'Despesa' : 'Transferência',
      t.amount.toString(),
      accounts.find(a => a.id === t.accountId)?.name || '',
      categories.find(c => c.id === t.categoryId)?.name || ''
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_${reportStartDate}_${reportEndDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Relatório Financeiro', 14, 15);
    doc.setFontSize(10);
    doc.text(`Período: ${formatDate(reportStartDate)} até ${formatDate(reportEndDate)}`, 14, 22);

    const tableData = filteredTransactions.map(t => [
      formatDate(t.date),
      t.description,
      t.type === 'income' ? 'Receita' : t.type === 'expense' ? 'Despesa' : 'Transferência',
      formatCurrency(t.amount),
      accounts.find(a => a.id === t.accountId)?.name || '',
      categories.find(c => c.id === t.categoryId)?.name || ''
    ]);

    autoTable(doc, {
      head: [['Data', 'Descrição', 'Tipo', 'Valor', 'Conta', 'Categoria']],
      body: tableData,
      startY: 30,
    });

    doc.save(`relatorio_${reportStartDate}_${reportEndDate}.pdf`);
  };

  const handleAddRecurring = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const data = {
      type: formData.get('type') as 'income' | 'expense',
      amount: Number(formData.get('amount')),
      description: formData.get('description') as string,
      frequency: formData.get('frequency') as Frequency,
      startDate: formData.get('startDate') as string,
      accountId: formData.get('accountId') as string,
      categoryId: formData.get('categoryId') as string,
      costCenterId: formData.get('costCenterId') as string,
      userId: user.uid,
      active: true
    };

    try {
      await addDoc(collection(db, `users/${user.uid}/recurring_transactions`), data);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/recurring_transactions`);
    }
  };

  const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const parentId = formData.get('parentId') as string;
    const data = {
      name: formData.get('name') as string,
      type: formData.get('type') as TransactionType,
      icon: 'Tag',
      color: '#3b82f6',
      userId: user.uid,
      parentId: parentId || null
    };

    try {
      await addDoc(collection(db, `users/${user.uid}/categories`), data);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/categories`);
    }
  };

  const handleQuickAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const parentId = formData.get('parentId') as string;
    const data = {
      name: formData.get('name') as string,
      type: formData.get('type') as TransactionType,
      icon: 'Tag',
      color: '#3b82f6',
      userId: user.uid,
      parentId: parentId || null
    };

    try {
      await addDoc(collection(db, `users/${user.uid}/categories`), data);
      setIsQuickAddCategoryModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/categories`);
    }
  };

  const handleStatCardClick = () => {
    setReportStartDate(dashboardRange.start);
    setReportEndDate(dashboardRange.end);
    setActiveTab('transactions');
  };

  const handleSeedCategories = async () => {
    if (!user) return;
    
    const structure = [
      {
        name: "1. Centro de Receitas (O que entra)",
        type: "income",
        subcategories: [
          "Renda Principal: Salário líquido, Pro-labore ou faturamento MEI",
          "Renda Extra: Vendas de desapegos (Enjoei/OLX), freelas, cashback de cartões/apps",
          "Renda Passiva: Dividendos, rendimentos de CDB ou aluguel recebido",
          "Benefícios e Extras: Bônus, comissões, reembolso, 13º salário, PPR"
        ]
      },
      {
        name: "2. Centro: Habitação (O custo de morar)",
        type: "expense",
        subcategories: [
          "Fixos: Aluguel/Financiamento, Condomínio, IPTU",
          "Manutenção: Material de limpeza, reparos domésticos, diarista/faxina",
          "Contas de Consumo: Energia, Água, Gás (encanado ou botijão)"
        ]
      },
      {
        name: "3. Centro: Alimentação e Mercado",
        type: "expense",
        subcategories: [
          "Essencial: Supermercado, feira, açougue e padaria",
          "Conveniência/Lazer: Delivery (iFood/Zé Delivery) e refeições fora de casa",
          "Higiene e Pet: Produtos de cuidado pessoal e itens para animais de estimação"
        ]
      },
      {
        name: "4. Centro: Estilo de Vida Conectado (Digital)",
        type: "expense",
        subcategories: [
          "Conectividade: Plano de celular e Internet banda larga",
          "Assinaturas: Streaming (Netflix, Spotify, Youtube Premium), iCloud/Google Drive, Amazon Prime",
          "Educação: Mensalidade escolar, cursos online ou compra de livros"
        ]
      },
      {
        name: "5. Centro: Mobilidade e Transporte",
        type: "expense",
        subcategories: [
          "Veículo Próprio: Combustível, Seguro, IPVA, licenciamento e manutenção",
          "Transporte por App/Público: Uber, 99, passagens de ônibus ou metrô"
        ]
      },
      {
        name: "6. Centro: Saúde e Bem-Estar",
        type: "expense",
        subcategories: [
          "Proteção: Plano de saúde e seguro de vida",
          "Cuidados: Farmácia (uso contínuo e eventual) e consultas/exames",
          "Fitness: Academia, Crossfit ou esportes"
        ]
      },
      {
        name: "7. Centro: Qualidade de Vida (Lazer e Desejos)",
        type: "expense",
        subcategories: [
          "Social: Barzinhos, cinema, presentes para terceiros",
          "Cuidados Pessoais: Cabeleireiro, manicure, barbearia",
          "Shopping: Roupas, calçados e eletrônicos de desejo"
        ]
      },
      {
        name: "8. Centro: Futuro e Proteção (O \"Eu de Amanhã\")",
        type: "expense",
        subcategories: [
          "Reserva de Emergência: Aporte mensal para segurança",
          "Projetos: Fundo para viagens, troca de carro ou entrada de imóvel"
        ]
      },
      {
        name: "9. Centro: Serviços Financeiros e Bancários",
        type: "expense",
        subcategories: [
          "Taxas: Tarifas bancárias, anuidade de cartão, juros",
          "Empréstimos e Financiamentos: Parcelas de empréstimos pessoais ou consignados",
          "Dívidas: Acordos de dívidas e renegociações",
          "Cartões de Crédito: Pagamento de faturas (quando não detalhado por categoria)"
        ]
      }
    ];

    try {
      for (const item of structure) {
        const rootRef = await addDoc(collection(db, `users/${user.uid}/categories`), {
          name: item.name,
          type: item.type,
          userId: user.uid,
          icon: 'Tag',
          color: '#3b82f6'
        });

        for (const sub of item.subcategories) {
          await addDoc(collection(db, `users/${user.uid}/categories`), {
            name: sub,
            type: item.type,
            userId: user.uid,
            parentId: rootRef.id,
            icon: 'Tag',
            color: '#3b82f6'
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/categories`);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !categoryToEdit) return;
    const formData = new FormData(e.currentTarget);
    const parentId = formData.get('parentId') as string;
    
    try {
      await updateDoc(doc(db, `users/${user.uid}/categories`, categoryToEdit.id), {
        name: formData.get('name') as string,
        type: formData.get('type') as TransactionType,
        parentId: parentId || null,
        updatedAt: serverTimestamp()
      });
      setIsEditCategoryModalOpen(false);
      setCategoryToEdit(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/categories/${categoryToEdit.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage onSignIn={signInWithGoogle} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-[60] w-20 lg:w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-all duration-300 ease-in-out lg:translate-x-0 lg:static",
        isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-4 lg:p-6 flex flex-col h-full items-center lg:items-stretch">
          <div className="flex items-center gap-3 mb-10 overflow-hidden">
            <div className="w-10 h-10 min-w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-blue-900/20">
              <Wallet size={24} className="text-white" />
            </div>
            <span className={cn("text-xl font-black text-slate-900 dark:text-white transition-opacity", !isSidebarOpen && "lg:hidden")}>Money</span>
          </div>

          <nav className="flex-1 flex flex-col gap-2 w-full">
            <SidebarItem icon={LayoutDashboard} label="Resumo" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} collapsed={!isSidebarOpen} />
            <SidebarItem icon={ArrowUpCircle} label="Atividade" active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} collapsed={!isSidebarOpen} />
            <SidebarItem icon={CreditCard} label="Contas" active={activeTab === 'accounts'} onClick={() => setActiveTab('accounts')} collapsed={!isSidebarOpen} />
            <SidebarItem icon={Tags} label="Categorias" active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} collapsed={!isSidebarOpen} />
            <SidebarItem icon={RefreshCw} label="Recorrência" active={activeTab === 'recurring'} onClick={() => setActiveTab('recurring')} collapsed={!isSidebarOpen} />
            <SidebarItem icon={PieChartIcon} label="Análise" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} collapsed={!isSidebarOpen} />
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 w-full space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="relative shrink-0">
                <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700" />
                {profile?.isPremium && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border border-white dark:border-slate-900 flex items-center justify-center">
                    <Zap size={6} className="text-white" fill="currentColor" />
                  </div>
                )}
              </div>
              <div className={cn("min-w-0 transition-opacity", !isSidebarOpen && "lg:hidden")}>
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.displayName}</p>
                {profile?.isPremium && <span className="text-[10px] text-amber-500 font-black uppercase tracking-tighter">PRO Plan</span>}
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center justify-center lg:justify-start gap-3 w-full px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all duration-200 font-medium group"
            >
              <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className={cn("lg:inline", !isSidebarOpen && "lg:hidden")}>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-10 pb-24 lg:pb-10">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              {isSidebarOpen ? <X /> : <Menu />}
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">
                {activeTab === 'dashboard' ? 'Dashboard' : 
                 activeTab === 'transactions' ? 'Transações' : 
                 activeTab === 'accounts' ? 'Minhas Contas' : 
                 activeTab === 'categories' ? 'Categorias' : 
                 activeTab === 'recurring' ? 'Recorrência' : 
                 'Relatórios'}
              </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </p>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full animate-pulse",
                      isOnline ? "bg-emerald-500" : "bg-rose-500"
                    )} />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
                      {isOnline ? "Real-time" : "Offline"}
                    </span>
                  </div>
                </div>
            </div>
          </div>
          <div className="flex gap-2 items-center w-full sm:w-auto justify-end">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
              title={isDarkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm relative"
                title="Notificações"
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-[60] overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                      <h3 className="font-bold text-slate-900 dark:text-white">Notificações</h3>
                      <span className="text-xs font-medium px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full">
                        {notifications.length} novas
                      </span>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div key={n.id} className="p-4 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <div className="flex gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                n.type === 'reminder' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                              )}>
                                {n.type === 'reminder' ? <Bell size={16} /> : <AlertCircle size={16} />}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{n.title}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">{formatDate(n.date)}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <Bell className="mx-auto text-slate-200 dark:text-slate-700 mb-2" size={32} />
                          <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma notificação por enquanto.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setIsPrivacyMode(!isPrivacyMode)}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
              title={isPrivacyMode ? "Desativar Modo Privacidade" : "Ativar Modo Privacidade"}
            >
              {isPrivacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
              title={isDarkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Dashboard Date Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between lg:justify-start gap-4 w-full lg:w-auto">
                  <button 
                    onClick={() => setDashboardDate(subMonths(dashboardDate, 1))}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex flex-col items-center lg:items-start">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Período</span>
                    <span className="text-base md:text-lg font-bold text-slate-900 dark:text-white capitalize">
                      {dashboardDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <button 
                    onClick={() => setDashboardDate(addMonths(dashboardDate, 1))}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar w-full lg:w-auto">
                  <button
                    onClick={() => setDashboardFilterMode('to-today')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                      dashboardFilterMode === 'to-today' 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-blue-900/20" 
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                  >
                    1º até Hoje
                  </button>
                  <button
                    onClick={() => setDashboardFilterMode('full-month')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                      dashboardFilterMode === 'full-month' 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-blue-900/20" 
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                  >
                    Mês Inteiro
                  </button>
                  <button
                    onClick={() => setDashboardFilterMode('tomorrow')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                      dashboardFilterMode === 'tomorrow' 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-blue-900/20" 
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                  >
                    Até Amanhã
                  </button>
                </div>
              </div>

              <SummaryHero 
                balance={totalBalance}
                projected={projectedBalance}
                income={totalIncome}
                expense={totalExpense}
                formatCurrencyWithPrivacy={formatCurrencyWithPrivacy}
                onStatClick={handleStatCardClick}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Atividade Recente" className="lg:col-span-2">
                  <div className="space-y-6 max-h-[600px] overflow-y-auto no-scrollbar pr-1">
                    {dashboardTransactionsByDate.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <Calendar size={48} className="mb-4 opacity-10" />
                        <p className="font-bold">Sem movimentações no período</p>
                      </div>
                    ) : (
                      dashboardTransactionsByDate.map(([date, dateItems]) => (
                        <div key={date}>
                          <div className="flex items-center gap-2 mb-3 sticky top-0 bg-white dark:bg-slate-900 z-20 py-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                              {isToday(parseISO(date)) ? 'Hoje' : isYesterday(parseISO(date)) ? 'Ontem' : format(parseISO(date), "dd 'de' MMMM", { locale: ptBR })}
                            </span>
                            <div className="h-[1px] flex-1 bg-slate-50 dark:bg-slate-800" />
                          </div>
                          <div className="space-y-1">
                            {dateItems.map(t => (
                              <TransactionCard 
                                key={t.id}
                                t={t}
                                accounts={accounts}
                                categories={categories}
                                onEdit={(trans) => { setTransactionToEdit(trans); setIsEditTransactionModalOpen(true); }}
                                onDelete={handleDeleteTransaction}
                                onToggleConsolidation={handleToggleConsolidation}
                                formatCurrency={formatCurrency}
                              />
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>

                <div className="space-y-6">
                  <Card title="Saldo por Conta">
                    <div className="space-y-3">
                      {accounts.map(account => (
                        <div 
                          key={account.id} 
                          className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 cursor-pointer active:scale-95 transition-transform"
                          onClick={() => {
                            setSelectedAccountForDetails(account);
                            setIsAccountDetailsVisible(true);
                          }}
                        >
                          <div className="p-2 bg-white dark:bg-slate-700 rounded-xl shadow-sm text-blue-600">
                            <CreditCard size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{account.name}</p>
                            <p className={cn(
                              "text-xs font-black tracking-tight",
                              account.balance < 0 ? "text-rose-600" : "text-emerald-600"
                            )}>
                              {formatCurrencyWithPrivacy(account.balance)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Fluxo de Caixa (7 dias)">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card title="Despesas por Categoria">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: isDarkMode ? '#0f172a' : '#fff', border: 'none', borderRadius: '12px', color: isDarkMode ? '#fff' : '#000' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

            </motion.div>
          )}

          {activeTab === 'transactions' && (
            <motion.div
              key="transactions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card title="Nova Transação">
                <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <select 
                    name="type" 
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value as TransactionType)}
                    className="p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                    required
                  >
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                    <option value="transfer">Transferência</option>
                  </select>
                  <div className="relative flex gap-2">
                    <input 
                      name="amount" 
                      type="number" 
                      step="0.01" 
                      placeholder="Valor" 
                      value={amountValue}
                      onChange={(e) => setAmountValue(e.target.value)}
                      className="flex-1 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" 
                      required 
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        setCalcValue(amountValue || '0');
                        setActiveCalcField('amount');
                        setIsCalculatorOpen(true);
                      }}
                      className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                      title="Abrir Calculadora"
                    >
                      <Calculator size={20} />
                    </button>
                  </div>
                  <input name="description" type="text" placeholder="Descrição" className="p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" required />
                  <input name="date" type="date" className="p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" required />
                  <textarea 
                    name="notes" 
                    placeholder="Observações (Opcional)" 
                    className="p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 min-h-[46px] resize-none"
                    rows={1}
                  ></textarea>
                  
                  <div className="flex flex-col gap-2 p-1">
                    <label className="text-xs font-bold text-slate-500 ml-1 dark:text-slate-400">Anexo (Recibo/Nota)</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        id="receipt-upload" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setSelectedFile(file);
                        }}
                        accept="image/*,.pdf"
                      />
                      <label 
                        htmlFor="receipt-upload"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                      >
                        <Paperclip size={18} />
                        <span className="text-sm">{selectedFile ? selectedFile.name : 'Anexar Arquivo'}</span>
                      </label>
                      {selectedFile && (
                        <button 
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <XCircle size={20} />
                        </button>
                      )}
                    </div>
                  </div>                  
                  {transactionType !== 'transfer' ? (
                    <div className="flex flex-col gap-4 md:col-span-2 lg:col-span-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-slate-500 ml-1">Centro de Custo</label>
                          <div className="flex gap-2">
                            <select 
                              name="costCenterId" 
                              value={selectedCostCenterId}
                              onChange={(e) => setSelectedCostCenterId(e.target.value)}
                              className="flex-1 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                              required
                            >
                              <option value="">Selecione o Centro de Custo</option>
                              {categories
                                .filter(c => !c.parentId && c.type === transactionType)
                                .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                              }
                            </select>
                            <button 
                              type="button"
                              onClick={() => setIsQuickAddCategoryModalOpen(true)}
                              className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                              title="Novo Centro de Custo"
                            >
                              <Plus size={20} />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-slate-500 ml-1">Categoria</label>
                          <div className="flex gap-2">
                            <select 
                              name="categoryId" 
                              className="flex-1 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                              required
                              disabled={!selectedCostCenterId}
                            >
                              <option value="">Selecione a Categoria</option>
                              {categories
                                .filter(c => c.parentId === selectedCostCenterId)
                                .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                              }
                            </select>
                            <button 
                              type="button"
                              onClick={() => setIsQuickAddCategoryModalOpen(true)}
                              className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                              title="Nova Categoria"
                              disabled={!selectedCostCenterId}
                            >
                              <Plus size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="hidden"></div>
                  )}

                  <select name="accountId" className="p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" required>
                    <option value="">{transactionType === 'transfer' ? 'Conta de Origem' : 'Conta'}</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>

                  {transactionType === 'transfer' && (
                    <select name="toAccountId" className="p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" required>
                      <option value="">Conta de Destino</option>
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  )}

                  <div className="flex items-center gap-2 p-3">
                    <input 
                      name="consolidated" 
                      type="checkbox" 
                      id="consolidated" 
                      className="w-5 h-5 rounded border-slate-200 text-blue-600 focus:ring-blue-500"
                      defaultChecked
                    />
                    <label htmlFor="consolidated" className="text-sm font-bold text-slate-600 cursor-pointer">
                      Consolidado (Afeta saldo atual)
                    </label>
                  </div>

                  <button type="submit" className="md:col-span-2 lg:col-span-3 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors">
                    Adicionar {transactionType === 'transfer' ? 'Transferência' : transactionType === 'income' ? 'Receita' : 'Despesa'}
                  </button>
                </form>
              </Card>

              <Card title="Histórico">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex-1 flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Buscar por descrição, valor, categoria..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                      />
                    </div>
                    <select
                      value={selectedAccountFilter}
                      onChange={(e) => setSelectedAccountFilter(e.target.value)}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold shadow-sm min-w-[200px]"
                    >
                      <option value="all">🏦 Todas as Contas</option>
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>{account.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => {
                        setTransactionsToImport(PDF_IMPORT_DATA);
                        setImportSource('pdf');
                        setIsImportModalOpen(true);
                      }}
                      className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold px-4 py-2 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm"
                    >
                      <FileDown size={18} />
                      Importar PDF
                    </button>
                    <label className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold px-4 py-2 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-sm cursor-pointer">
                      <Download size={18} />
                      Importar Excel
                      <input 
                        type="file" 
                        accept=".xlsx, .xls, .csv" 
                        className="hidden" 
                        onChange={handleExcelFileChange}
                      />
                    </label>
                    <button 
                      onClick={downloadExcelTemplate}
                      className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-4 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm"
                      title="Baixar Modelo de Excel"
                    >
                      <Download size={18} />
                      Modelo
                    </button>
                    <button 
                      onClick={handleConsolidatePastPending}
                      className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-bold px-4 py-2 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors text-sm"
                      title="Consolidar Pendentes até Ontem"
                    >
                      <RefreshCw size={18} />
                      Consolidar Pendentes (até Ontem)
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  {/* Desktop Table View */}
                  <div className="hidden md:block" style={{ height: '600px' }}>
                    <GroupedVirtuoso
                      groupCounts={groupCounts}
                      groupContent={(index) => {
                        const month = sortedMonths[index];
                        return (
                          <div key={`group-${month}`} className="bg-white dark:bg-slate-900 py-4">
                            <div className="flex items-center gap-4 px-2">
                              <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                {format(parseISO(`${month}-01`), 'MMMM yyyy', { locale: ptBR })}
                              </h4>
                              <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                            </div>
                            <div className="flex items-center px-4 mt-4 border-b border-slate-100 dark:border-slate-800 text-slate-500 text-sm font-medium pb-2">
                              <div className="w-16">Dia</div>
                              <div className="flex-1">Descrição</div>
                              <div className="w-32">Categoria</div>
                              <div className="w-32">Status</div>
                              <div className="w-32 text-right">Valor</div>
                              <div className="w-24 text-right">Ações</div>
                            </div>
                          </div>
                        );
                      }}
                      itemContent={(index, groupIndex) => {
                        const month = sortedMonths[groupIndex];
                        const groupStart = groupCounts.slice(0, groupIndex).reduce((a, b) => a + b, 0);
                        const itemInGroupIndex = index - groupStart;
                        const t = groupedTransactionsByMonth[month][itemInGroupIndex];
                        
                        if (!t) return null;

                        return (
                          <div key={`virtuoso-item-${t.id}`} className="flex items-center px-4 group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800/50 h-[72px]">
                            <div className="w-16 text-sm text-slate-400 font-mono">{t.date.substring(8, 10)}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-slate-800 truncate max-w-[200px] dark:text-slate-200">{t.description}</p>
                                {t.attachmentUrl && (
                                  <a 
                                    href={t.attachmentUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-600 transition-colors"
                                    title={`Ver anexo: ${t.attachmentName || 'Arquivo'}`}
                                  >
                                    <Paperclip size={14} />
                                  </a>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 truncate max-w-[200px] dark:text-slate-400">
                                {t.type === 'transfer' 
                                  ? `${accounts.find(a => a.id === t.accountId)?.name} → ${accounts.find(a => a.id === t.toAccountId)?.name}`
                                  : accounts.find(a => a.id === t.accountId)?.name
                                }
                              </p>
                            </div>
                            <div className="w-32">
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                                  {t.type === 'transfer' ? 'Transferência' : categories.find(c => c.id === t.costCenterId)?.name}
                                </span>
                                <span className="text-xs font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 w-fit truncate">
                                  {t.type === 'transfer' ? 'Transferência' : categories.find(c => c.id === t.categoryId)?.name}
                                </span>
                              </div>
                            </div>
                            <div className="w-32">
                              <button 
                                onClick={() => handleToggleConsolidation(t)}
                                className={cn(
                                  "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full transition-colors",
                                  t.consolidated 
                                    ? "bg-emerald-100 text-emerald-700" 
                                    : "bg-amber-100 text-amber-700"
                                )}
                                title={t.consolidated ? "Consolidado" : "Pendente"}
                              >
                                {t.consolidated ? <RefreshCw size={10} /> : <Calendar size={10} />}
                                {t.consolidated ? "CONSOLIDADO" : "PENDENTE"}
                              </button>
                            </div>
                            <div className={cn(
                              "w-32 text-right font-bold", 
                              t.type === 'income' ? "text-emerald-600" : 
                              t.type === 'expense' ? "text-rose-600" : 
                              "text-blue-600"
                            )}>
                              {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}{formatCurrencyWithPrivacy(t.amount)}
                            </div>
                            <div className="w-24 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => {
                                    setTransactionToEdit(t);
                                    setSelectedCostCenterId(t.costCenterId || '');
                                    setTransactionType(t.type);
                                    setSelectedFile(null);
                                    setShouldRemoveAttachment(false);
                                    setIsEditTransactionModalOpen(true);
                                  }}
                                  className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                                  title="Editar"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteTransaction(t)}
                                  className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-4">
                    {sortedMonths.map(month => (
                      <div key={`mobile-group-${month}`} className="space-y-3">
                        <div className="flex items-center gap-4 py-2">
                          <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {format(parseISO(`${month}-01`), 'MMMM yyyy', { locale: ptBR })}
                          </h4>
                          <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                        </div>
                        {groupedTransactionsByMonth[month].map(t => (
                          <TransactionCard 
                            key={`mobile-list-${t.id}`}
                            t={t}
                            accounts={accounts}
                            categories={categories}
                            onEdit={(t) => {
                              setTransactionToEdit(t);
                              setSelectedCostCenterId(t.costCenterId || '');
                              setTransactionType(t.type);
                              setSelectedFile(null);
                              setShouldRemoveAttachment(false);
                              setIsEditTransactionModalOpen(true);
                            }}
                            onDelete={handleDeleteTransaction}
                            onToggleConsolidation={handleToggleConsolidation}
                            formatCurrency={formatCurrencyWithPrivacy}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                {filteredTransactionsByDashboard.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-slate-400 font-medium">Nenhuma transação encontrada para este período.</p>
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {activeTab === 'accounts' && (
            <motion.div
              key="accounts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Gerenciar Contas</h2>
                <button 
                  onClick={() => setIsAccountImportModalOpen(true)}
                  className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold px-4 py-2 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm"
                >
                  <Download size={18} />
                  Importar do Print
                </button>
              </div>

              <Card title="Nova Conta">
                <form onSubmit={handleAddAccount} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input name="name" type="text" placeholder="Nome da Conta" className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" required />
                  <select name="type" className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" required>
                    <option value="checking">Corrente</option>
                    <option value="savings">Poupança</option>
                    <option value="credit_card">Cartão de Crédito</option>
                    <option value="cash">Dinheiro</option>
                  </select>
                  <input name="balance" type="number" step="0.01" placeholder="Saldo Inicial" className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" required />
                  <button type="submit" className="md:col-span-3 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors">
                    Adicionar Conta
                  </button>
                </form>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map((a) => (
                  <Card 
                    key={a.id} 
                    className="relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow active:scale-98"
                    onClick={() => {
                      setSelectedAccountForDetails(a);
                      setIsAccountDetailsVisible(true);
                    }}
                  >
                    <div className="absolute top-0 right-0 p-4 flex gap-2 z-10">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setAccountToEdit(a);
                          setIsEditAccountModalOpen(true);
                        }}
                        className="text-slate-300 hover:text-blue-500 transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm(`Deseja realmente excluir a conta ${a.name}? Todas as transações associadas serão órfãs.`)) return;
                          try {
                            await deleteDoc(doc(db, `users/${user.uid}/accounts`, a.id));
                          } catch (error) {
                            handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/accounts/${a.id}`);
                          }
                        }}
                        className="text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                        <CreditCard size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100">{a.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">{a.type}</p>
                      </div>
                    </div>
                    <p className={cn(
                      "text-2xl font-bold",
                      a.balance < 0 ? "text-rose-600" : a.balance > 0 ? "text-emerald-600" : "text-slate-900 dark:text-slate-100"
                    )}>
                      {formatCurrencyWithPrivacy(a.balance)}
                    </p>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'categories' && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Centros de Custo e Categorias</h2>
                <button 
                  onClick={handleSeedCategories}
                  className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold px-4 py-2 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-sm"
                >
                  <Download size={18} />
                  Importar Estrutura Sugerida
                </button>
              </div>

              <Card title="Novo Centro de Custo ou Categoria">
                <form onSubmit={handleAddCategory} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Nome</label>
                    <input name="name" type="text" placeholder="Ex: Casa, Alimentação..." className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Tipo</label>
                    <select name="type" className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" required>
                      <option value="expense">Despesa</option>
                      <option value="income">Receita</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Centro de Custo (Pai)</label>
                    <select name="parentId" className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Nenhum (Será um Centro de Custo)</option>
                      {categories.filter(c => !c.parentId).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors">
                      Adicionar
                    </button>
                  </div>
                </form>
              </Card>

              <div className="space-y-6">
                {categories.filter(c => !c.parentId).map((root) => (
                  <div key={root.id} className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider rounded">Centro de Custo</div>
                    </div>
                    <Card className="flex items-center justify-between p-4 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow group">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-xl text-white", root.type === 'income' ? "bg-emerald-500" : "bg-blue-500")}>
                          <Tags size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100">{root.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{root.type === 'income' ? 'Receitas' : 'Despesas'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setCategoryToEdit(root);
                            setIsEditCategoryModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={async () => {
                            try {
                              await deleteDoc(doc(db, `users/${user.uid}/categories`, root.id));
                            } catch (error) {
                              handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/categories/${root.id}`);
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </Card>
                    
                    {/* Subcategories */}
                    <div className="ml-8 space-y-2 border-l-2 border-slate-100 dark:border-slate-800 pl-4">
                      {categories.filter(c => c.parentId === root.id).length > 0 ? (
                        categories.filter(c => c.parentId === root.id).map((child) => (
                          <Card key={child.id} className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-800/50 border-dashed hover:shadow-sm transition-shadow group">
                            <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{child.name}</p>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => {
                                  setCategoryToEdit(child);
                                  setIsEditCategoryModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={async () => {
                                  try {
                                    await deleteDoc(doc(db, `users/${user.uid}/categories`, child.id));
                                  } catch (error) {
                                    handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/categories/${child.id}`);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </Card>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic py-1">Nenhuma categoria vinculada</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Filtros Avançados */}
              <Card title="Filtros Avançados">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500 ml-1">Início</label>
                      <div className="relative">
                        <input 
                          type="date" 
                          value={reportStartDate}
                          onChange={(e) => setReportStartDate(e.target.value)}
                          className="w-full p-3 pl-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Calendar className="absolute left-3 top-3.5 text-slate-400" size={18} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500 ml-1">Fim</label>
                      <div className="relative">
                        <input 
                          type="date" 
                          value={reportEndDate}
                          onChange={(e) => setReportEndDate(e.target.value)}
                          className="w-full p-3 pl-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Calendar className="absolute left-3 top-3.5 text-slate-400" size={18} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500 ml-1">Tipo</label>
                      <select 
                        value={reportFilterType}
                        onChange={(e) => setReportFilterType(e.target.value)}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">Todos os Tipos</option>
                        <option value="income">Receitas</option>
                        <option value="expense">Despesas</option>
                        <option value="transfer">Transferências</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500 ml-1">Status</label>
                      <select 
                        value={reportFilterStatus}
                        onChange={(e) => setReportFilterStatus(e.target.value)}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">Todos os Status</option>
                        <option value="consolidated">Consolidados</option>
                        <option value="pending">Pendentes</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500 ml-1">Conta</label>
                      <select 
                        value={reportFilterAccount}
                        onChange={(e) => setReportFilterAccount(e.target.value)}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Todas as Contas</option>
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500 ml-1">Categoria / Centro de Custo</label>
                      <select 
                        value={reportFilterCategory}
                        onChange={(e) => setReportFilterCategory(e.target.value)}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Todas as Categorias</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1 lg:col-span-2">
                      <label className="text-xs font-bold text-slate-500 ml-1">Pesquisar</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="Pesquisar por descrição ou notas..."
                          value={reportFilterSearch}
                          onChange={(e) => setReportFilterSearch(e.target.value)}
                          className="w-full p-3 pl-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      onClick={() => {
                        setReportFilterCategory('');
                        setReportFilterAccount('');
                        setReportFilterType('all');
                        setReportFilterSearch('');
                        setReportFilterStatus('all');
                      }}
                      className="text-slate-500 hover:text-slate-700 font-bold px-4 py-2 text-sm"
                    >
                      Limpar Filtros
                    </button>
                    <button 
                      onClick={exportToCSV}
                      className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-4 py-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
                    >
                      <FileDown size={18} />
                      CSV
                    </button>
                    <button 
                      onClick={exportToPDF}
                      className="flex items-center gap-2 bg-blue-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Download size={18} />
                      PDF
                    </button>
                  </div>
                </div>
              </Card>

              {/* Estatísticas Rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                        <TrendingUp size={20} />
                      </div>
                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Receitas</span>
                    </div>
                    {comparisonStats.incomeDiff !== 0 && (
                      <div className={cn("text-xs font-bold flex items-center gap-0.5", comparisonStats.incomeDiff > 0 ? "text-emerald-600" : "text-rose-600")}>
                        {comparisonStats.incomeDiff > 0 ? <Plus size={10}/> : ''}
                        {comparisonStats.incomeDiff.toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(filteredTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0))}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">vs. período anterior: {formatCurrency(comparisonStats.prevIncome)}</p>
                </Card>

                <Card className="bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                        <TrendingDown size={20} />
                      </div>
                      <span className="text-sm font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Despesas</span>
                    </div>
                    {comparisonStats.expenseDiff !== 0 && (
                      <div className={cn("text-xs font-bold flex items-center gap-0.5", comparisonStats.expenseDiff > 0 ? "text-rose-600" : "text-emerald-600")}>
                        {comparisonStats.expenseDiff > 0 ? <Plus size={10}/> : ''}
                        {comparisonStats.expenseDiff.toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(filteredTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0))}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">vs. período anterior: {formatCurrency(comparisonStats.prevExpense)}</p>
                </Card>

                <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                      <Calculator size={20} />
                    </div>
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Balanço</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(
                      filteredTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0) -
                      filteredTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0)
                    )}
                  </p>
                </Card>

                <Card className="bg-slate-50 dark:bg-slate-900/10 border-slate-100 dark:border-slate-900/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400 rounded-lg">
                      <RefreshCw size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Transações</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{filteredTransactions.length}</p>
                </Card>
              </div>

              {/* Gráficos Principais */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Tendência de Saldo (Período)">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendSummary}>
                        <defs>
                          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: number) => [formatCurrency(value), 'Saldo']}
                        />
                        <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card title="Despesas por Categoria">
                  <p className="text-[10px] text-slate-400 -mt-2 mb-4">Clique em uma fatia para filtrar a tabela</p>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categorySummary}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          onClick={(data: any) => {
                            if (data && data.id) {
                              setReportFilterCategory(data.id === reportFilterCategory ? '' : data.id);
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          {categorySummary.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color} 
                              stroke={reportFilterCategory === entry.id ? '#000' : 'none'}
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: number) => [formatCurrency(value), 'Valor']}
                        />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Desempenho Mensal (Ano)" className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-slate-500">Clique em uma barra para filtrar o período</p>
                    <select 
                      value={reportYear}
                      onChange={(e) => setReportYear(e.target.value)}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={annualSummary.monthlyData}
                        onClick={(data: any) => {
                          if (data && data.activePayload) {
                            const { startDate, endDate } = data.activePayload[0].payload;
                            setReportStartDate(startDate);
                            setReportEndDate(endDate);
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="income" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" name="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        <Legend />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card title="Resumo do Período">
                  <div className="space-y-6">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl">
                      <p className="text-sm text-slate-500 mb-1">Média por Transação</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {formatCurrency(filteredTransactions.length > 0 ? filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0) / filteredTransactions.length : 0)}
                      </p>
                    </div>
                    <div className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-2xl">
                      <p className="text-sm text-rose-600 dark:text-rose-400 mb-1 font-bold uppercase tracking-wider">Maior Despesa</p>
                      <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(Math.max(...filteredTransactions.filter(t => t.type === 'expense').map(t => t.amount), 0))}
                      </p>
                    </div>
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl">
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1 font-bold uppercase tracking-wider">Maior Receita</p>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(Math.max(...filteredTransactions.filter(t => t.type === 'income').map(t => t.amount), 0))}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Análise de Picos de Despesas" className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-slate-500">
                      Média mensal: <span className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(expenseAnalysis.average)}</span>
                    </p>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Pico de Gastos</p>
                      <p className="text-sm font-bold text-rose-600">{expenseAnalysis.peakMonth} ({formatCurrency(expenseAnalysis.max)})</p>
                    </div>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={annualSummary.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: number) => [formatCurrency(value), 'Despesa']}
                        />
                        <ReferenceLine y={expenseAnalysis.average} stroke="#94a3b8" strokeDasharray="3 3">
                          <Label value="Média" position="right" fill="#94a3b8" fontSize={10} />
                        </ReferenceLine>
                        <Bar dataKey="expense" name="Despesas" radius={[4, 4, 0, 0]}>
                          {annualSummary.monthlyData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.expense === expenseAnalysis.max ? '#f43f5e' : '#fda4af'} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card title="Distribuição de Gastos">
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500">O gráfico ao lado destaca os meses com gastos acima da média anual, permitindo identificar sazonalidade e picos atípicos.</p>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-xs text-slate-400 uppercase font-bold mb-1">Total Anual ({reportYear})</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(expenseAnalysis.total)}</p>
                    </div>
                    <div className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/20">
                      <p className="text-xs text-rose-600 dark:text-rose-400 uppercase font-bold mb-1">Variação de Pico</p>
                      <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
                        {expenseAnalysis.average > 0 ? (
                          `+${((expenseAnalysis.max - expenseAnalysis.average) / expenseAnalysis.average * 100).toFixed(1)}% acima da média`
                        ) : (
                          'Sem dados para média'
                        )}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              <Card title="Transações Detalhadas">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-slate-500 text-sm border-b border-slate-100 dark:border-slate-800">
                        <th className="pb-4 font-medium">Data</th>
                        <th className="pb-4 font-medium">Descrição</th>
                        <th className="pb-4 font-medium">Categoria</th>
                        <th className="pb-4 font-medium">Conta</th>
                        <th className="pb-4 font-medium text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            Nenhuma transação encontrada com os filtros selecionados.
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map((t) => (
                          <tr key={`report-row-${t.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-4 text-sm text-slate-600 dark:text-slate-400">{formatDate(t.date)}</td>
                            <td className="py-4">
                              <div className="font-medium text-slate-800 dark:text-white">{t.description}</div>
                              {t.notes && <div className="text-xs text-slate-400 truncate max-w-[200px]">{t.notes}</div>}
                            </td>
                            <td className="py-4">
                              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                {categories.find(c => c.id === t.categoryId)?.name || categories.find(c => c.id === t.costCenterId)?.name || 'Sem Categoria'}
                              </span>
                            </td>
                            <td className="py-4 text-sm text-slate-600 dark:text-slate-400">
                              {accounts.find(a => a.id === t.accountId)?.name}
                            </td>
                            <td className={cn("py-4 text-right font-bold", t.type === 'income' ? "text-emerald-600" : t.type === 'expense' ? "text-rose-600" : "text-blue-600")}>
                              {formatCurrency(t.amount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'recurring' && (
            <motion.div
              key="recurring"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card title="Nova Transação Recorrente">
                <form onSubmit={handleAddRecurring} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <select name="type" className="p-3 rounded-xl border border-slate-200 outline-none" required>
                    <option value="expense">Despesa Fixa</option>
                    <option value="income">Receita Fixa</option>
                  </select>
                  <input name="amount" type="number" step="0.01" placeholder="Valor" className="p-3 rounded-xl border border-slate-200 outline-none" required />
                  <input name="description" type="text" placeholder="Descrição (ex: Aluguel)" className="p-3 rounded-xl border border-slate-200 outline-none" required />
                  <select name="frequency" className="p-3 rounded-xl border border-slate-200 outline-none" required>
                    <option value="monthly">Mensal</option>
                    <option value="weekly">Semanal</option>
                  </select>
                  <input name="startDate" type="date" className="p-3 rounded-xl border border-slate-200 outline-none" required />
                  <select name="accountId" className="p-3 rounded-xl border border-slate-200 outline-none" required>
                    <option value="">Conta</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <div className="flex flex-col gap-4 md:col-span-2 lg:col-span-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500 ml-1">Centro de Custo</label>
                        <div className="flex gap-2">
                          <select 
                            name="costCenterId" 
                            value={selectedRecurringCostCenterId}
                            onChange={(e) => setSelectedRecurringCostCenterId(e.target.value)}
                            className="flex-1 p-3 rounded-xl border border-slate-200 outline-none" 
                            required
                          >
                            <option value="">Selecione o Centro de Custo</option>
                            {categories
                              .filter(c => !c.parentId)
                              .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                            }
                          </select>
                          <button 
                            type="button"
                            onClick={() => setIsQuickAddCategoryModalOpen(true)}
                            className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                            title="Novo Centro de Custo"
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500 ml-1">Categoria</label>
                        <div className="flex gap-2">
                          <select 
                            name="categoryId" 
                            className="flex-1 p-3 rounded-xl border border-slate-200 outline-none" 
                            required
                            disabled={!selectedRecurringCostCenterId}
                          >
                            <option value="">Selecione a Categoria</option>
                            {categories
                              .filter(c => c.parentId === selectedRecurringCostCenterId)
                              .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                            }
                          </select>
                          <button 
                            type="button"
                            onClick={() => setIsQuickAddCategoryModalOpen(true)}
                            className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                            title="Nova Categoria"
                            disabled={!selectedRecurringCostCenterId}
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="md:col-span-2 lg:col-span-3 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors">
                    Configurar Recorrência
                  </button>
                </form>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recurringTransactions.map((rt) => (
                  <Card key={rt.id} className="relative">
                    <div className="flex justify-between items-start mb-4">
                      <div className={cn("p-2 rounded-lg", rt.type === 'income' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600")}>
                        <RefreshCw size={20} />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={async () => {
                            try {
                              await updateDoc(doc(db, `users/${user.uid}/recurring_transactions`, rt.id), { 
                                active: !rt.active,
                                updatedAt: serverTimestamp()
                              });
                            } catch (error) {
                              handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/recurring_transactions/${rt.id}`);
                            }
                          }}
                          className={cn("text-xs font-bold px-2 py-1 rounded-full", rt.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}
                        >
                          {rt.active ? 'Ativo' : 'Pausado'}
                        </button>
                        <button 
                          onClick={async () => {
                            try {
                              await deleteDoc(doc(db, `users/${user.uid}/recurring_transactions`, rt.id));
                            } catch (error) {
                              handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/recurring_transactions/${rt.id}`);
                            }
                          }}
                          className="text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-800 mb-1">{rt.description}</h4>
                    <p className="text-2xl font-bold text-slate-900 mb-2">{formatCurrency(rt.amount)}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-3">
                      <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                        {categories.find(c => c.id === rt.costCenterId)?.name}
                      </span>
                      <span className="bg-slate-100 px-2 py-1 rounded-md">
                        {categories.find(c => c.id === rt.categoryId)?.name}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="bg-slate-100 px-2 py-1 rounded-md capitalize">{rt.frequency}</span>
                      <span className="bg-slate-100 px-2 py-1 rounded-md">Início: {formatDate(rt.startDate)}</span>
                      {rt.lastProcessedDate && (
                        <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-medium">
                          Último: {formatDate(rt.lastProcessedDate)}
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Transaction Modal */}
        <AnimatePresence>
          {isAddTransactionModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Nova Transação</h2>
                  <button onClick={() => setIsAddTransactionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto mb-6 pr-2">
                  <form 
                    onSubmit={async (e) => {
                      await handleAddTransaction(e);
                      setIsAddTransactionModalOpen(false);
                    }} 
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500 ml-1">Tipo</label>
                      <select 
                        name="type" 
                        value={transactionType}
                        onChange={(e) => setTransactionType(e.target.value as TransactionType)}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
                        required
                      >
                        <option value="expense">Despesa</option>
                        <option value="income">Receita</option>
                        <option value="transfer">Transferência</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500 ml-1">Valor</label>
                      <div className="relative flex gap-2">
                        <input 
                          name="amount" 
                          type="number" 
                          step="0.01" 
                          placeholder="Valor" 
                          value={amountValue}
                          onChange={(e) => setAmountValue(e.target.value)}
                          className="flex-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
                          required 
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            setCalcValue(amountValue || '0');
                            setActiveCalcField('amount');
                            setIsCalculatorOpen(true);
                          }}
                          className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Calculator size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500 ml-1">Descrição</label>
                      <input name="description" type="text" placeholder="Descrição" className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500 ml-1">Data</label>
                      <input name="date" type="date" className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>

                    {transactionType !== 'transfer' && (
                      <>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-slate-500 ml-1">Centro de Custo</label>
                          <select 
                            name="costCenterId" 
                            value={selectedCostCenterId}
                            onChange={(e) => setSelectedCostCenterId(e.target.value)}
                            className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
                            required
                          >
                            <option value="">Selecione o Centro de Custo</option>
                            {categories
                              .filter(c => !c.parentId && c.type === transactionType)
                              .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                            }
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-slate-500 ml-1">Categoria</label>
                          <select 
                            name="categoryId" 
                            className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
                            required
                            disabled={!selectedCostCenterId}
                          >
                            <option value="">Selecione a Categoria</option>
                            {categories
                              .filter(c => c.parentId === selectedCostCenterId)
                              .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                            }
                          </select>
                        </div>
                      </>
                    )}

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500 ml-1">{transactionType === 'transfer' ? 'Conta de Origem' : 'Conta'}</label>
                      <select name="accountId" className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" required>
                        <option value="">Selecione a Conta</option>
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>

                    {transactionType === 'transfer' && (
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500 ml-1">Conta de Destino</label>
                        <select name="toAccountId" className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" required>
                          <option value="">Selecione a Conta</option>
                          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      </div>
                    )}

                    <div className="flex items-center gap-2 p-3 md:col-span-2">
                      <input 
                        name="consolidated" 
                        type="checkbox" 
                        id="modal-consolidated" 
                        className="w-5 h-5 rounded border-slate-200 text-blue-600 focus:ring-blue-500"
                        defaultChecked
                      />
                      <label htmlFor="modal-consolidated" className="text-sm font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
                        Consolidado (Afeta saldo atual)
                      </label>
                    </div>

                    <div className="flex gap-3 md:col-span-2 mt-4">
                      <button 
                        type="button"
                        onClick={() => setIsAddTransactionModalOpen(false)}
                        className="flex-1 px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
                      >
                        Adicionar
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Account Import Modal */}
        <AnimatePresence>
          {isAccountImportModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Importar Contas</h2>
                  <button onClick={() => setIsAccountImportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto mb-6 pr-2">
                  <p className="text-slate-600 mb-4">
                    Identificamos {ACCOUNT_IMPORT_DATA.length} contas no seu print. 
                    Deseja importar estas contas com seus respectivos saldos?
                  </p>
                  
                  <div className="space-y-2">
                    {ACCOUNT_IMPORT_DATA.map((item, i) => (
                      <div key={`import-acc-${item.name}-${i}`} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl text-sm">
                        <span className="font-medium text-slate-800">{item.name}</span>
                        <span className={cn("font-bold", item.balance >= 0 ? "text-slate-900" : "text-rose-600")}>
                          {formatCurrency(item.balance)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setIsAccountImportModalOpen(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleImportAccounts}
                    disabled={isImporting}
                    className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isImporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Importando...
                      </>
                    ) : (
                      'Confirmar Importação'
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Import Modal */}
        <AnimatePresence>
          {isImportModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Importar Dados do {importSource === 'pdf' ? 'PDF' : 'Excel'}
                  </h2>
                  <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto mb-6 pr-2">
                  <p className="text-slate-600 mb-4">
                    Identificamos {transactionsToImport.length} lançamentos no seu {importSource === 'pdf' ? 'relatório "Minhas Economias"' : 'arquivo Excel'}. 
                    Deseja importar estes dados para sua conta?
                  </p>
                  
                  <div className="space-y-2">
                    {transactionsToImport.slice(0, 10).map((item, i) => (
                      <div key={`import-tx-${item.description}-${i}`} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl text-sm">
                        <div>
                          <p className="font-bold text-slate-800">{item.description}</p>
                          <p className="text-slate-500">{formatDate(item.date)} • {item.subcategory}</p>
                        </div>
                        <p className={cn("font-bold", item.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                          {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                        </p>
                      </div>
                    ))}
                    {transactionsToImport.length > 10 && (
                      <p className="text-center text-slate-400 text-xs py-2">... e mais {transactionsToImport.length - 10} itens</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setIsImportModalOpen(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleImportTransactions}
                    disabled={isImporting}
                    className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isImporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Importando...
                      </>
                    ) : (
                      'Confirmar Importação'
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {isEditAccountModalOpen && accountToEdit && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Editar Saldo</h2>
                  <button onClick={() => setIsEditAccountModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleUpdateAccountBalance} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Conta</label>
                    <input 
                      type="text" 
                      value={accountToEdit.name} 
                      disabled 
                      className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Novo Saldo</label>
                    <input 
                      name="balance" 
                      type="number" 
                      step="0.01" 
                      defaultValue={accountToEdit.balance} 
                      placeholder="Valor do Saldo" 
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                      required 
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditAccountModalOpen(false)}
                      className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
                    >
                      Salvar Alteração
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
          {isEditCategoryModalOpen && categoryToEdit && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Editar Centro de Custo / Categoria</h2>
                  <button onClick={() => setIsEditCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleUpdateCategory} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                    <input 
                      name="name"
                      type="text" 
                      defaultValue={categoryToEdit.name} 
                      className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                    <select 
                      name="type" 
                      defaultValue={categoryToEdit.type}
                      className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="expense">Despesa</option>
                      <option value="income">Receita</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Centro de Custo (Pai)</label>
                    <select 
                      name="parentId" 
                      defaultValue={categoryToEdit.parentId || ""}
                      className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Nenhum (Será um Centro de Custo)</option>
                      {categories.filter(c => !c.parentId && c.id !== categoryToEdit.id).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditCategoryModalOpen(false)}
                      className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
          {isQuickAddCategoryModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Novo Centro de Custo / Categoria</h2>
                  <button onClick={() => setIsQuickAddCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleQuickAddCategory} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                    <input 
                      name="name"
                      type="text" 
                      placeholder="Ex: Casa, Alimentação..."
                      className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                    <select 
                      name="type" 
                      defaultValue={transactionType}
                      className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="expense">Despesa</option>
                      <option value="income">Receita</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Centro de Custo (Pai)</label>
                    <select 
                      name="parentId" 
                      className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Nenhum (Será um Centro de Custo)</option>
                      {categories.filter(c => !c.parentId && c.type === transactionType).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsQuickAddCategoryModalOpen(false)}
                      className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
                    >
                      Criar
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {isEditTransactionModalOpen && transactionToEdit && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Editar Transação</h2>
                  <button onClick={() => setIsEditTransactionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleEditTransaction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Tipo</label>
                    <select 
                      name="type" 
                      value={transactionType}
                      onChange={(e) => setTransactionType(e.target.value as TransactionType)}
                      className="p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                      required
                    >
                      <option value="expense">Despesa</option>
                      <option value="income">Receita</option>
                      <option value="transfer">Transferência</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Valor</label>
                    <input name="amount" type="number" step="0.01" defaultValue={transactionToEdit.amount} className="p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 ml-1">Descrição</label>
                    <input name="description" type="text" defaultValue={transactionToEdit.description} className="p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 ml-1">Observações (Opcional)</label>
                    <textarea 
                      name="notes" 
                      defaultValue={transactionToEdit.notes || ''} 
                      className="p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] resize-none"
                      placeholder="Adicione informações adicionais..."
                    ></textarea>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Data</label>
                    <input name="date" type="date" defaultValue={transactionToEdit.date} className="p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Conta {transactionType === 'transfer' ? 'Origem' : ''}</label>
                    <select name="accountId" defaultValue={transactionToEdit.accountId} className="p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" required>
                      <option value="">Selecione a Conta</option>
                      {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
                  </div>

                  {transactionType === 'transfer' && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500 ml-1">Conta Destino</label>
                      <select name="toAccountId" defaultValue={transactionToEdit.toAccountId || ''} className="p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" required>
                        <option value="">Selecione a Conta Destino</option>
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                      </select>
                    </div>
                  )}

                  {transactionType !== 'transfer' && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500 ml-1">Centro de Custo</label>
                        <select 
                          name="costCenterId" 
                          value={selectedCostCenterId}
                          onChange={(e) => setSelectedCostCenterId(e.target.value)}
                          className="p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                          required
                        >
                          <option value="">Selecione o Centro de Custo</option>
                          {categories
                            .filter(c => !c.parentId && c.type === transactionType)
                            .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                          }
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500 ml-1">Categoria</label>
                        <select 
                          name="categoryId" 
                          defaultValue={transactionToEdit.categoryId || ''}
                          className="p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                          required
                          disabled={!selectedCostCenterId}
                        >
                          <option value="">Selecione a Categoria</option>
                          {categories
                            .filter(c => c.parentId === selectedCostCenterId)
                            .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                          }
                        </select>
                      </div>
                    </>
                  )}

                  <div className="flex items-center gap-2 md:col-span-2 py-2">
                    <input 
                      name="consolidated" 
                      type="checkbox" 
                      id="edit-consolidated" 
                      defaultChecked={transactionToEdit.consolidated}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                    />
                    <label htmlFor="edit-consolidated" className="text-sm font-medium text-slate-700">Consolidado (Afeta o saldo da conta)</label>
                  </div>

                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 ml-1">Comprovante (Opcional)</label>
                    <div className="flex items-center gap-4 p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                      <input 
                        type="file" 
                        accept="image/*,application/pdf"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="edit-file-upload"
                      />
                      <label 
                        htmlFor="edit-file-upload"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-bold"
                      >
                        <Paperclip size={16} />
                        {selectedFile || transactionToEdit.attachmentUrl ? 'Alterar Arquivo' : 'Anexar Comprovante'}
                      </label>
                      {(selectedFile || (transactionToEdit.attachmentUrl && !shouldRemoveAttachment)) && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 truncate max-w-[200px]">
                            {selectedFile ? selectedFile.name : transactionToEdit.attachmentName}
                          </span>
                          {transactionToEdit.attachmentUrl && !selectedFile && !shouldRemoveAttachment && (
                            <a 
                              href={transactionToEdit.attachmentUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-blue-500 hover:text-blue-600"
                            >
                              <ImageIcon size={14} />
                            </a>
                          )}
                          <button 
                            type="button"
                            onClick={() => {
                              if (selectedFile) {
                                setSelectedFile(null);
                              } else {
                                setShouldRemoveAttachment(true);
                              }
                            }}
                            className="text-rose-500 hover:text-rose-600 p-1"
                            title="Remover anexo"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 md:col-span-2">
                    <button
                      type="button"
                      onClick={() => setIsEditTransactionModalOpen(false)}
                      className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {selectedAccountForProjection && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[80vh] flex flex-col"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Detalhamento da Projeção</h2>
                    <p className="text-sm text-slate-500 font-medium">
                      {accounts.find(a => a.id === selectedAccountForProjection)?.name}
                    </p>
                  </div>
                  <button onClick={() => setSelectedAccountForProjection(null)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                  {/* Summary Section */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Saldo Atual</p>
                      <p className="text-lg font-bold text-slate-700">
                        {formatCurrency(accounts.find(a => a.id === selectedAccountForProjection)?.balance || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Saldo Projetado</p>
                      <p className={cn(
                        "text-lg font-bold",
                        (projectedBalancesByAccount.find(a => a.id === selectedAccountForProjection)?.projectedBalance || 0) < 0 ? "text-rose-600" : "text-emerald-600"
                      )}>
                        {formatCurrency(projectedBalancesByAccount.find(a => a.id === selectedAccountForProjection)?.projectedBalance || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Pending Transactions */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <Calendar size={16} className="text-amber-500" />
                      Lançamentos Pendentes
                    </h3>
                    <div className="space-y-2">
                      {transactions
                        .filter(t => !t.consolidated && (t.accountId === selectedAccountForProjection || t.toAccountId === selectedAccountForProjection))
                        .map(t => (
                          <div key={t.id} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                            <div className="flex-1 pr-4">
                              <p className="text-sm font-bold text-slate-700 truncate">{t.description}</p>
                              <p className="text-[10px] text-slate-400">{formatDate(t.date)}</p>
                            </div>
                            <p className={cn(
                              "text-sm font-bold whitespace-nowrap",
                              t.type === 'income' || (t.type === 'transfer' && t.toAccountId === selectedAccountForProjection) ? "text-emerald-600" : "text-rose-600"
                            )}>
                              {t.type === 'income' || (t.type === 'transfer' && t.toAccountId === selectedAccountForProjection) ? '+' : '-'}{formatCurrency(t.amount)}
                            </p>
                          </div>
                        ))}
                      {transactions.filter(t => !t.consolidated && (t.accountId === selectedAccountForProjection || t.toAccountId === selectedAccountForProjection)).length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-2">Nenhum lançamento pendente encontrado.</p>
                      )}
                    </div>
                  </div>

                  {/* Future Recurring */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <RefreshCw size={16} className="text-blue-500" />
                      Projeções de Recorrência (até {format(parseISO(dashboardRange.end), 'dd/MM')})
                    </h3>
                    <div className="space-y-2">
                      {futureRecurringDetails
                        .filter(d => d.accountId === selectedAccountForProjection)
                        .map((d, index) => (
                          <div key={`future-recurring-${d.accountId}-${d.date}-${index}`} className="flex justify-between items-center p-3 bg-blue-50/30 border border-blue-100 rounded-xl">
                            <div className="flex-1 pr-4">
                              <p className="text-sm font-bold text-slate-700 truncate">{d.description}</p>
                              <p className="text-[10px] text-blue-500 font-medium">Previsão: {formatDate(d.date)}</p>
                            </div>
                            <p className={cn(
                              "text-sm font-bold whitespace-nowrap",
                              d.type === 'income' ? "text-emerald-600" : "text-rose-600"
                            )}>
                              {d.type === 'income' ? '+' : '-'}{formatCurrency(d.amount)}
                            </p>
                          </div>
                        ))}
                      {futureRecurringDetails.filter(d => d.accountId === selectedAccountForProjection).length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-2">Nenhuma recorrência futura projetada para este período.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => setSelectedAccountForProjection(null)}
                    className="w-full py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
          {isCalculatorOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <CalculatorComponent 
                value={calcValue} 
                onValueChange={(val) => {
                  if (activeCalcField === 'amount') setAmountValue(val);
                }} 
                onClose={() => setIsCalculatorOpen(false)} 
              />
            </div>
          )}

          {/* Quick Add Modal */}
          {isQuickAddModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Lançamento Rápido</h2>
                  <button onClick={() => setIsQuickAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={async (e) => {
                  await handleAddTransaction(e);
                  setIsQuickAddModalOpen(false);
                }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Tipo</label>
                    <select 
                      name="type" 
                      value={transactionType}
                      onChange={(e) => setTransactionType(e.target.value as TransactionType)}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                      required
                    >
                      <option value="expense">Despesa</option>
                      <option value="income">Receita</option>
                      <option value="transfer">Transferência</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Valor</label>
                    <div className="relative flex gap-2">
                      <input 
                        name="amount" 
                        type="number" 
                        step="0.01" 
                        placeholder="0,00" 
                        value={amountValue}
                        onChange={(e) => setAmountValue(e.target.value)}
                        className="flex-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                        required 
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          setCalcValue(amountValue || '0');
                          setActiveCalcField('amount');
                          setIsCalculatorOpen(true);
                        }}
                        className="p-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        title="Calculadora"
                      >
                        <Calculator size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 ml-1">Descrição</label>
                    <input 
                      name="description" 
                      type="text" 
                      placeholder="Ex: Aluguel, Salário..." 
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                      required 
                    />
                  </div>

                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 ml-1">Observações (Opcional)</label>
                    <textarea 
                      name="notes" 
                      placeholder="Adicione informações adicionais..." 
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] resize-none"
                    ></textarea>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Data</label>
                    <input 
                      name="date" 
                      type="date" 
                      defaultValue={format(new Date(), 'yyyy-MM-dd')}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                      required 
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Conta {transactionType === 'transfer' ? 'Origem' : ''}</label>
                    <select 
                      name="accountId" 
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                      required
                    >
                      <option value="">Selecione a Conta</option>
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>

                  {transactionType === 'transfer' ? (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500 ml-1">Conta Destino</label>
                      <select 
                        name="toAccountId" 
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                        required
                      >
                        <option value="">Selecione a Conta Destino</option>
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500 ml-1">Centro de Custo</label>
                        <select 
                          name="costCenterId" 
                          value={selectedCostCenterId}
                          onChange={(e) => setSelectedCostCenterId(e.target.value)}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                          required
                        >
                          <option value="">Selecione o Centro de Custo</option>
                          {categories
                            .filter(c => !c.parentId && c.type === transactionType)
                            .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                          }
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500 ml-1">Categoria</label>
                        <select 
                          name="categoryId" 
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                          required
                          disabled={!selectedCostCenterId}
                        >
                          <option value="">Selecione a Categoria</option>
                          {categories
                            .filter(c => c.parentId === selectedCostCenterId)
                            .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                          }
                        </select>
                      </div>
                    </>
                  )}

                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 ml-1">Comprovante (Opcional)</label>
                    <div className="flex items-center gap-4 p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                      <input 
                        type="file" 
                        accept="image/*,application/pdf"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="quick-file-upload"
                      />
                      <label 
                        htmlFor="quick-file-upload"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-bold"
                      >
                        <Paperclip size={16} />
                        {selectedFile ? 'Alterar Arquivo' : 'Anexar Comprovante'}
                      </label>
                      {selectedFile && (
                        <span className="text-xs text-slate-500 truncate max-w-[200px]">
                          {selectedFile.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:col-span-2 py-2">
                    <input 
                      name="consolidated" 
                      type="checkbox" 
                      id="quick-consolidated" 
                      defaultChecked 
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                    />
                    <label htmlFor="quick-consolidated" className="text-sm font-medium text-slate-700 dark:text-slate-300">Consolidado (Afeta o saldo da conta)</label>
                  </div>

                  <div className="flex gap-4 pt-4 md:col-span-2">
                    <button
                      type="button"
                      onClick={() => setIsQuickAddModalOpen(false)}
                      className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
                    >
                      Lançar Transação
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Floating Action Button */}
          <button
            onClick={() => setIsQuickAddModalOpen(true)}
            className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all z-50 group"
            title="Novo Lançamento (Alt + N)"
          >
            <Plus size={32} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </AnimatePresence>
        </div>
      </main>

      {/* Account Details Modal */}
      <AnimatePresence>
        {isAccountDetailsVisible && selectedAccountForDetails && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAccountDetailsVisible(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 top-12 lg:top-20 lg:left-auto lg:right-0 lg:w-[450px] bg-white dark:bg-slate-900 rounded-t-[32px] lg:rounded-l-[32px] lg:rounded-tr-none p-6 z-[80] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 lg:hidden" />
              
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                      {selectedAccountForDetails.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                      Extrato do Mês
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAccountDetailsVisible(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-6 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Saldo Atual</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">
                    {formatCurrency(selectedAccountForDetails.balance)}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="space-y-1">
                  {accountTransactions.length > 0 ? (
                    accountTransactions.map((t) => (
                      <TransactionCard 
                        key={t.id}
                        t={t}
                        accounts={accounts}
                        categories={categories}
                        formatCurrency={formatCurrency}
                        onEdit={(trans) => {
                          setTransactionToEdit(trans);
                          setIsEditTransactionModalOpen(true);
                          setIsAccountDetailsVisible(false);
                        }}
                        onDelete={(trans) => {
                          if (confirm('Deseja realmente excluir esta transação?')) {
                            handleDeleteTransaction(trans);
                          }
                        }}
                        onToggleConsolidation={handleToggleConsolidation}
                      />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-4">
                        <ArrowUpCircle size={32} />
                      </div>
                      <p className="font-bold">Nenhuma movimentação este mês</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-6 left-6 right-6 z-50">
        <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 px-4 py-2 flex justify-around items-center rounded-[32px] shadow-2xl shadow-slate-200/50 dark:shadow-black/50">
          <MobileNavItem icon={LayoutDashboard} active={activeTab === 'dashboard'} label="Home" onClick={() => setActiveTab('dashboard')} />
          <MobileNavItem icon={ArrowUpCircle} active={activeTab === 'transactions'} label="Histórico" onClick={() => setActiveTab('transactions')} />
          
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsQuickAddModalOpen(true)}
            className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-500/40 active:scale-95 transition-transform mx-2 shrink-0"
          >
            <Plus size={32} strokeWidth={3} />
          </motion.button>

          <MobileNavItem icon={CreditCard} active={activeTab === 'accounts'} label="Contas" onClick={() => setActiveTab('accounts')} />
          <MobileNavItem 
            icon={Menu} 
            active={isMobileMenuOpen} 
            label="Mais" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          />
        </nav>
      </div>

      {/* Mobile More Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[55]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[32px] p-6 pb-24 z-[60] shadow-2xl"
            >
              <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Ações e Menus</h3>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => { setActiveTab('reports'); setIsMobileMenuOpen(false); }}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm text-blue-600 dark:text-blue-400">
                    <PieChartIcon size={24} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Relatórios</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('categories'); setIsMobileMenuOpen(false); }}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm text-blue-600 dark:text-blue-400">
                    <Tags size={24} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Categorias</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('recurring'); setIsMobileMenuOpen(false); }}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm text-blue-600 dark:text-blue-400">
                    <RefreshCw size={24} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Recorrência</span>
                </button>
                <button 
                  onClick={() => { setIsPrivacyMode(!isPrivacyMode); setIsMobileMenuOpen(false); }}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm text-blue-600 dark:text-blue-400">
                    {isPrivacyMode ? <EyeOff size={24} /> : <Eye size={24} />}
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Privacidade</span>
                </button>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={logout}
                  className="flex items-center justify-center gap-3 w-full p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 font-bold hover:bg-rose-100 transition-colors"
                >
                  <LogOut size={20} />
                  <span>Sair da Conta</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Action Button for Desktop/Tablet in Transactions Tab */}
      <AnimatePresence>
        {activeTab === 'transactions' && (
          <motion.button
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            onClick={() => setIsAddTransactionModalOpen(true)}
            className="fixed bottom-8 right-8 hidden lg:flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-blue-500/20 dark:shadow-blue-900/40 transition-all z-50 group"
          >
            <div className="bg-white/20 p-1 rounded-lg group-hover:rotate-90 transition-transform duration-300">
              <Plus size={24} />
            </div>
            <span className="font-bold tracking-tight">Adicionar Transação</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
