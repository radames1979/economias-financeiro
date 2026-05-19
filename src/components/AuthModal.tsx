import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  ChevronLeft
} from 'lucide-react';
import { 
  auth, 
  signInWithGoogle, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from '../firebase';
import { cn } from '../lib/utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot-password';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setError('Erro ao entrar com Google. Tente novamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        onClose();
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('As senhas não coincidem.');
        }
        await createUserWithEmailAndPassword(auth, email, password);
        onClose();
      } else if (mode === 'forgot-password') {
        await sendPasswordResetEmail(auth, email);
        setSuccessMessage('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      }
    } catch (err: any) {
      let message = 'Ocorreu um erro. Verifique seus dados.';
      if (err.code === 'auth/user-not-found') message = 'Usuário não encontrado.';
      if (err.code === 'auth/wrong-password') message = 'Senha incorreta.';
      if (err.code === 'auth/email-already-in-use') message = 'Este e-mail já está sendo usado.';
      if (err.code === 'auth/weak-password') message = 'A senha deve ter pelo menos 6 caracteres.';
      if (err.code === 'auth/invalid-email') message = 'E-mail inválido.';
      
      setError(err.message || message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 pb-0 flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Mail size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {mode === 'login' ? 'Acessar Conta' : mode === 'register' ? 'Criar Conta' : 'Recuperar Senha'}
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {mode === 'login' ? 'Bem-vindo de volta' : mode === 'register' ? 'Comece sua jornada' : 'Não se preocupe'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-8">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400"
              >
                <AlertCircle size={18} className="shrink-0" />
                <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
              </motion.div>
            )}

            {successMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400"
              >
                <CheckCircle2 size={18} className="shrink-0" />
                <p className="text-xs font-bold uppercase tracking-tight">{successMessage}</p>
              </motion.div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              {mode !== 'forgot-password' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Confirmar Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              {mode === 'login' && (
                <div className="flex justify-end">
                  <button 
                    type="button"
                    onClick={() => setMode('forgot-password')}
                    className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    {mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar Conta' : 'Enviar Link'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ou continue com</span>
              <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Google
            </button>

            <div className="mt-8 text-center">
              {mode === 'login' ? (
                <p className="text-xs font-bold text-slate-500">
                  Não tem uma conta?{' '}
                  <button onClick={() => setMode('register')} className="text-blue-600 hover:underline">
                    Cadastre-se grátis
                  </button>
                </p>
              ) : (
                <button 
                  onClick={() => setMode('login')}
                  className="flex items-center gap-2 mx-auto text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
                >
                  <ChevronLeft size={16} />
                  Voltar para o Login
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
