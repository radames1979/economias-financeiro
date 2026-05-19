import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Plus, 
  Trash2, 
  Tag, 
  Palette,
  LayoutGrid
} from 'lucide-react';
import { TransactionGroup } from '../types';
import { cn } from '../lib/utils';
import { db, auth } from '../firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

interface TransactionGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: TransactionGroup[];
}

const COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 
  'bg-purple-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-pink-500'
];

export const TransactionGroupModal: React.FC<TransactionGroupModalProps> = ({ isOpen, onClose, groups }) => {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [selectedColor, setSelectedColor] = React.useState(COLORS[0]);
  const [isLoading, setIsLoading] = React.useState(false);

  if (!isOpen) return null;

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setIsLoading(true);
    try {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/transaction_groups`), {
        name,
        description,
        color: selectedColor,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setName('');
      setDescription('');
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Erro ao criar grupo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!auth.currentUser) return;
    if (!confirm('Deseja excluir este grupo? As transações vinculadas não serão excluídas, apenas perderão o vínculo.')) return;

    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/transaction_groups`, groupId));
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Erro ao excluir grupo.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-500/20">
                <LayoutGrid size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Grupos de Transações</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Organize e agrupe seus lançamentos</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
            {/* New Group Form */}
            <form onSubmit={handleCreateGroup} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Grupo</label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Viagem de Férias, Reforma..."
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cor</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          "w-8 h-8 rounded-full transition-all flex items-center justify-center",
                          color,
                          selectedColor === color ? "ring-4 ring-indigo-500/20 scale-110 shadow-lg" : "hover:scale-105"
                        )}
                      >
                        {selectedColor === color && <Palette size={14} className="text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição (Opcional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes sobre este grupo de transações..."
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[100px] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus size={18} />
                    Criar Novo Grupo
                  </>
                )}
              </button>
            </form>

            {/* List of Groups */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-4">Grupos Ativos ({groups.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((group) => (
                  <div 
                    key={group.id}
                    className="p-5 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-3xl flex items-center justify-between group hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-2xl text-white shadow-lg", group.color)}>
                        <LayoutGrid size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{group.name}</h4>
                        {group.description && (
                          <p className="text-[10px] text-slate-400 font-bold truncate max-w-[150px]">{group.description}</p>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteGroup(group.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {groups.length === 0 && (
                  <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-white/[0.02] rounded-[2.5rem] border border-dashed border-slate-200 dark:border-white/10">
                    <LayoutGrid size={32} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhum grupo criado ainda</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
