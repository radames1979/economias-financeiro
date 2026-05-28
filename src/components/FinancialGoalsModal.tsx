import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Target, TrendingUp, Coins, Award, Sparkles, Check } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface FinancialGoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savingsGoal: number;
  onSaveSavingsGoal: (val: number) => Promise<void>;
  formatCurrency: (amount: number, currency?: string) => string;
  formatCurrencyWithPrivacy: (amount: number, currency?: string) => string;
  netWorth: number;
  savingsAndInvestmentsSum: number;
  totalIncome: number;
  totalExpense: number;
  isDarkMode: boolean;
  isHighContrast?: boolean;
}

export const FinancialGoalsModal: React.FC<FinancialGoalsModalProps> = ({
  isOpen,
  onClose,
  savingsGoal,
  onSaveSavingsGoal,
  formatCurrency,
  formatCurrencyWithPrivacy,
  netWorth,
  savingsAndInvestmentsSum,
  totalIncome,
  totalExpense,
  isDarkMode,
  isHighContrast = false
}) => {
  const [goalInput, setGoalInput] = useState<string>(savingsGoal > 0 ? savingsGoal.toString() : '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Synchronize when the goal changes globally
  useEffect(() => {
    if (savingsGoal > 0) {
      setGoalInput(savingsGoal.toString());
    } else {
      setGoalInput('');
    }
  }, [savingsGoal, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseFloat(goalInput.replace(/[^0-9.]/g, ''));
    if (isNaN(parsed) || parsed < 0) return;

    setIsSaving(true);
    try {
      await onSaveSavingsGoal(parsed);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreset = (amount: number) => {
    setGoalInput(amount.toString());
  };

  const handleAdjust = (diff: number) => {
    const current = parseFloat(goalInput) || 0;
    const next = Math.max(0, current + diff);
    setGoalInput(next.toString());
  };

  const actualNetWorth = netWorth;
  const actualSavings = savingsAndInvestmentsSum;
  const actualMonthSavings = Math.max(0, totalIncome - totalExpense);

  const chartData = [
    {
      name: 'Patrimônio',
      'Atual': actualNetWorth,
      'Meta Alvo': savingsGoal
    },
    {
      name: 'Poupança/Invs',
      'Atual': actualSavings,
      'Meta Alvo': savingsGoal
    },
    {
      name: 'Saldo do Mês',
      'Atual': actualMonthSavings,
      'Meta Alvo': savingsGoal
    }
  ];

  const currentProgressPercent = savingsGoal > 0 ? Math.min(Math.round((netWorth / savingsGoal) * 100), 100) : 0;
  const remainingValue = Math.max(0, savingsGoal - netWorth);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[1000]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:max-w-4xl bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl z-[1001] flex flex-col overflow-hidden border border-slate-100 dark:border-white/5 max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-sm animate-pulse">
                  <Target size={22} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">Metas Financeiras</h3>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Defina seu alvo e visualize seu progresso</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Form & Configuration Panel */}
              <div className="space-y-6">
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                      Definir Alvo de Economia / Patrimônio
                    </label>
                    <div className="relative rounded-2xl bg-slate-50 dark:bg-white/5 p-4 border border-slate-100 dark:border-white/10 group focus-within:ring-2 focus-within:ring-cyan-500 transition-all">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono">
                        R$
                      </span>
                      <input
                        type="number"
                        placeholder="0,00"
                        value={goalInput}
                        onChange={(e) => setGoalInput(e.target.value)}
                        className="w-full bg-transparent border-none text-right font-mono font-black text-2xl text-slate-900 dark:text-white outline-none pl-12 focus:ring-0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Preset Quick Buttons */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Sugestões de Metas</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[10000, 50000, 100000].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handlePreset(val)}
                          className="py-2 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl text-[10px] font-black text-slate-600 dark:text-slate-300 transition-all active:scale-95 border border-transparent dark:border-white/5"
                        >
                          {formatCurrency(val)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Increment/Decrement controls */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Ajuste Rápido</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[-5000, -1000, 1000, 5000].map((diff) => (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => handleAdjust(diff)}
                          className={`py-2 px-1 text-[10px] font-black rounded-xl transition-all active:scale-95 border ${
                            diff < 0
                              ? 'bg-rose-500/10 hover:bg-rose-500/15 text-rose-500 border-rose-500/20'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-500 border-emerald-500/20'
                          }`}
                        >
                          {diff > 0 ? `+${diff / 1000}k` : `${diff / 1000}k`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Save button */}
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-black uppercase text-xs tracking-[0.2em] transition-all duration-300 shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {isSaving ? 'Salvando...' : showSuccess ? 'Meta Atualizada!' : 'Salvar Alvo'}
                    {showSuccess && <Check size={16} />}
                  </button>
                </form>

                {/* Overall status comparison panel */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-4">
                  <div className="flex items-center gap-3 text-cyan-500">
                    <Award size={18} className="shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">RESUMO DO OBJETIVO</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Meta Estabelecida</span>
                      <span className="text-sm font-mono font-black text-slate-800 dark:text-white mt-0.5 block">
                        {savingsGoal > 0 ? formatCurrencyWithPrivacy(savingsGoal) : 'Não definida'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Patrimônio Atual</span>
                      <span className="text-sm font-mono font-black text-emerald-500 mt-0.5 block">
                        {formatCurrencyWithPrivacy(netWorth)}
                      </span>
                    </div>
                  </div>

                  {savingsGoal > 0 && (
                    <div className="pt-2 border-t border-slate-200/50 dark:border-white/5">
                      {remainingValue > 0 ? (
                        <div>
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase block">Valor Restante</span>
                          <span className="text-base font-black text-amber-500 mt-0.5 block font-mono">
                            {formatCurrencyWithPrivacy(remainingValue)}
                          </span>
                          <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                            Você já conquistou <strong className="text-slate-700 dark:text-slate-200">{currentProgressPercent}%</strong> da sua meta estipulada. Continue economizando de forma planejada!
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-emerald-500 font-extrabold flex items-center gap-1.5 uppercase tracking-wide">
                            <Sparkles size={14} className="stroke-[2.5]" /> Meta Superada com Sucesso!
                          </span>
                          <p className="text-[11px] text-slate-400 leading-normal">
                            Incrível! Seu patrimônio líquido atual supera a meta de economia definida. Que tal estipular um novo objetivo financeiro para continuar expandindo seu patrimônio?
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar Chart Panel */}
              <div className="flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Gráfico de Progresso das Metas
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Visualização de progresso do seu patrimônio total, reservas acumuladas, e economia no mês comparados à sua meta de economia.
                  </p>
                </div>

                <div className="h-72 w-full mt-4 bg-slate-50 dark:bg-white/5 rounded-3xl p-4 border border-slate-100 dark:border-white/5 flex items-center justify-center relative">
                  {savingsGoal > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke={isDarkMode ? '#334155' : '#E2E8F0'}
                          opacity={0.15}
                        />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 800 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 9, fontWeight: 800 }}
                          tickFormatter={(value) => formatCurrency(value).replace(',00', '')}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '20px',
                            border: 'none',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                            background: isDarkMode ? '#0f172a' : '#ffffff',
                            padding: '12px'
                          }}
                          itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                          formatter={(value: any) => formatCurrency(Number(value))}
                        />
                        <Legend
                          iconType="circle"
                          wrapperStyle={{ fontSize: '10px', fontWeight: 700, paddingTop: '10px' }}
                        />
                        <Bar
                          dataKey="Atual"
                          fill="#10b981"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={32}
                        />
                        <Bar
                          dataKey="Meta Alvo"
                          fill="#6366f1"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center p-6 space-y-3">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto opacity-50">
                        <Target size={24} className="text-slate-400 dark:text-slate-500 stroke-[2]" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Sem Meta Definida</p>
                        <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto mt-1 leading-normal">
                          Por favor, defina um valor de meta no painel ao lado para gerar o gráfico de barras comparativo.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footnote instruction */}
                <div className="flex gap-2.5 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="font-extrabold text-cyan-500 uppercase shrink-0">Dica:</span>
                  <p className="leading-normal">
                    Filtre quais contas contam para seu patrimônio de maneira precisa acessando a seção <strong>Patrimônio</strong> e ajustando as caixas de seleção correspondentes em cada conta.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-white/5 flex justify-end bg-slate-50/50 dark:bg-slate-150/5">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-black uppercase text-[10px] text-slate-700 dark:text-slate-300 tracking-widest transition-all active:scale-95"
              >
                Concluir
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
