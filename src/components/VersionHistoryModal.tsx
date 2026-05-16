import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, History, ChevronRight } from 'lucide-react';
import { VERSION_HISTORY, APP_VERSION } from '../version';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[1000]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl z-[1001] flex flex-col overflow-hidden border border-slate-100 dark:border-white/5"
          >
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Registro de Versões</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Histórico de evoluções do sistema</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
              {VERSION_HISTORY.map((item, idx) => (
                <div key={item.version} className="relative pl-8">
                  {/* Timeline line */}
                  {idx !== VERSION_HISTORY.length - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-[-32px] w-0.5 bg-slate-100 dark:bg-white/5" />
                  )}
                  
                  {/* Timeline dot */}
                  <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-2 bg-white dark:bg-slate-900 flex items-center justify-center z-10 ${
                    item.version === APP_VERSION ? 'border-cyan-500 shadow-lg shadow-cyan-500/20' : 'border-slate-200 dark:border-slate-800'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${item.version === APP_VERSION ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                  </div>

                  <div className="flex flex-col gap-1 mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-black px-2.5 py-0.5 rounded-lg uppercase tracking-wider ${
                        item.version === APP_VERSION ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        v{item.version}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">{item.date}</span>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {item.changes.map((change, cIdx) => (
                      <li key={cIdx} className="flex gap-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        <ChevronRight size={14} className="shrink-0 mt-1 text-slate-300 dark:text-slate-600" />
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="p-6 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Ambiente de Produção • v{APP_VERSION}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
