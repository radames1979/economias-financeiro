import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  BarChart, 
  AreaChart, 
  LineChart, 
  Bar, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  Calendar, 
  Eye, 
  DollarSign, 
  PieChart as PieIcon, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Wallet
} from 'lucide-react';

interface MonthlyDataItem {
  month: string;
  fullMonth: string;
  income: number;
  expense: number;
  startDate: string;
  endDate: string;
  [key: string]: any;
}

interface LongTermTrendChartProps {
  monthlyData: MonthlyDataItem[];
  isDarkMode: boolean;
  formatCurrency: (value: number) => string;
  density?: any;
}

type ChartType = 'composed' | 'area' | 'savings';

export const LongTermTrendChart: React.FC<LongTermTrendChartProps> = ({
  monthlyData,
  isDarkMode,
  formatCurrency,
  density = 'normal'
}) => {
  const [chartType, setChartType] = useState<ChartType>('composed');
  const [showAverages, setShowAverages] = useState<boolean>(true);

  // Compute stats for the current year based on the 12 months data
  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let greenMonthsCount = 0;
    let redMonthsCount = 0;
    let maxIncome = 0;
    let maxIncomeMonth = '';
    let maxExpense = 0;
    let maxExpenseMonth = '';

    // Calculate accumulation list
    let cumulative = 0;
    const transformedData = monthlyData.map(d => {
      const net = d.income - d.expense;
      cumulative += net;
      totalIncome += d.income;
      totalExpense += d.expense;
      
      if (d.income > 0 || d.expense > 0) {
        if (net >= 0) greenMonthsCount++;
        else redMonthsCount++;
      }

      if (d.income > maxIncome) {
        maxIncome = d.income;
        maxIncomeMonth = d.fullMonth;
      }
      if (d.expense > maxExpense) {
        maxExpense = d.expense;
        maxExpenseMonth = d.fullMonth;
      }

      const savingsRate = d.income > 0 ? (net / d.income) * 100 : 0;

      return {
        ...d,
        net,
        cumulative,
        savingsRate: parseFloat(savingsRate.toFixed(1))
      };
    });

    const averageIncome = totalIncome / 12;
    const averageExpense = totalExpense / 12;
    const totalNet = totalIncome - totalExpense;
    const averageNet = totalNet / 12;
    const annualSavingsRate = totalIncome > 0 ? (totalNet / totalIncome) * 100 : 0;

    return {
      transformedData,
      totalIncome,
      totalExpense,
      totalNet,
      averageIncome,
      averageExpense,
      averageNet,
      annualSavingsRate,
      greenMonthsCount,
      redMonthsCount,
      maxIncome,
      maxIncomeMonth,
      maxExpense,
      maxExpenseMonth
    };
  }, [monthlyData]);

  const paddingClass = (density === 'super-compact' || density === 'compact') ? 'p-4' : density === 'spacious' ? 'p-8' : 'p-6';

  return (
    <div id="long-term-trend-section" className={`bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800/80 shadow-sm ${paddingClass} transition-colors flex flex-col gap-6`}>
      {/* Header with selector controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
            Tendências Anuais
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1.5 tracking-tight">O Ano em Perspectiva</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Fluxo de receita, custo de vida e saldo acumulado mês a mês</p>
        </div>

        {/* Chart View Selector Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Legend helper indicator toggles */}
          <button 
            onClick={() => setShowAverages(!showAverages)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
              showAverages 
                ? 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700' 
                : 'text-slate-400 dark:text-slate-500 border-transparent hover:text-slate-600 dark:hover:text-slate-400'
            }`}
          >
            {showAverages ? 'Mídias Ativas' : 'Mostrar Médias'}
          </button>

          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex items-center md:gap-1 shadow-inner">
            <button
              onClick={() => setChartType('composed')}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                chartType === 'composed'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Colunas
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                chartType === 'area'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Áreas
            </button>
            <button
              onClick={() => setChartType('savings')}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                chartType === 'savings'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Acumulado
            </button>
          </div>
        </div>
      </div>

      {/* Main Graph Area */}
      <div className="h-96 min-h-0 min-w-0 bg-slate-50/[0.3] dark:bg-slate-950/[0.1] rounded-2xl p-4 border border-slate-500/5">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'composed' ? (
            <ComposedChart data={stats.transformedData} margin={{ top: 15, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "rgba(255,255,255,0.04)" : "#ebd5e1 opacity-30"} />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
                tickFormatter={(val) => `R$ ${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
              />
              <Tooltip 
                cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)' }}
                contentStyle={{ 
                  borderRadius: '20px', 
                  border: 'none', 
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                  background: isDarkMode ? '#1e293b' : '#ffffff',
                  color: isDarkMode ? '#fff' : '#0f172a',
                  padding: '14px'
                }}
                labelStyle={{ fontWeight: 'black', textTransform: 'uppercase', fontSize: '10px', marginBottom: '8px', color: isDarkMode ? '#fff' : '#0f172a' }}
                formatter={(value: number, name: any) => {
                  if (name === 'income') return [formatCurrency(value), 'Receitas (Entradas)'];
                  if (name === 'expense') return [formatCurrency(value), 'Despesas (Saídas)'];
                  if (name === 'net') return [formatCurrency(value), 'Resultado Líquido'];
                  return [value, name];
                }}
              />
              <Legend 
                verticalAlign="top" 
                align="right" 
                height={35}
                iconType="circle"
                wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              />

              {showAverages && (
                <ReferenceLine 
                  y={stats.averageIncome} 
                  stroke="#10b981" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.5}
                  label={{ value: 'Média de Receitas', position: 'insideRight', fill: '#10b981', fontSize: 8, fontWeight: 'bold' }} 
                />
              )}
              {showAverages && (
                <ReferenceLine 
                  y={stats.averageExpense} 
                  stroke="#f43f5e" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.5}
                  label={{ value: 'Média de Despesas', position: 'insideRight', fill: '#f43f5e', fontSize: 8, fontWeight: 'bold' }} 
                />
              )}

              <Bar dataKey="income" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="expense" name="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
              <Line 
                type="monotone" 
                dataKey="net" 
                name="Resultado Líquido" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 1.5, stroke: isDarkMode ? '#1e293b' : '#fff' }} 
                activeDot={{ r: 6 }} 
              />
            </ComposedChart>
          ) : chartType === 'area' ? (
            <AreaChart data={stats.transformedData} margin={{ top: 15, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="gradientIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                </linearGradient>
                <linearGradient id="gradientExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.01}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "rgba(255,255,255,0.04)" : "#ebd5e1 opacity-30"} />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
                tickFormatter={(val) => `R$ ${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '20px', 
                  border: 'none', 
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                  background: isDarkMode ? '#1e293b' : '#ffffff',
                  color: isDarkMode ? '#fff' : '#0f172a',
                  padding: '14px'
                }}
                labelStyle={{ fontWeight: 'black', textTransform: 'uppercase', fontSize: '10px', marginBottom: '8px', color: isDarkMode ? '#fff' : '#0f172a' }}
                formatter={(value: number, name: any) => [formatCurrency(value), name === 'income' ? 'Receita' : 'Despesa']}
              />
              <Legend 
                verticalAlign="top" 
                align="right" 
                height={35}
                iconType="circle"
                wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              />
              
              <Area type="monotone" dataKey="income" name="Receita" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#gradientIncome)" />
              <Area type="monotone" dataKey="expense" name="Despesa" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#gradientExpense)" />
            </AreaChart>
          ) : (
            <AreaChart data={stats.transformedData} margin={{ top: 15, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="gradientCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "rgba(255,255,255,0.04)" : "#ebd5e1 opacity-30"} />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
                tickFormatter={(val) => `R$ ${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '20px', 
                  border: 'none', 
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                  background: isDarkMode ? '#1e293b' : '#ffffff',
                  color: isDarkMode ? '#fff' : '#0f172a',
                  padding: '14px'
                }}
                labelStyle={{ fontWeight: 'black', textTransform: 'uppercase', fontSize: '10px', marginBottom: '8px', color: isDarkMode ? '#fff' : '#0f172a' }}
                formatter={(value: number, name: any) => {
                  if (name === 'cumulative') return [formatCurrency(value), 'Saldo Acumulado'];
                  if (name === 'savingsRate') return [`${value}%`, 'Taxa de Poupança'];
                  return [value, name];
                }}
              />
              <Legend 
                verticalAlign="top" 
                align="right" 
                height={35}
                iconType="circle"
                wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              />
              
              <ReferenceLine y={0} stroke={isDarkMode ? "rgba(255,255,255,0.15)" : "#cbd5e1"} strokeDasharray="3 3" />
              <Area type="monotone" dataKey="cumulative" name="Saldo Acumulado" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#gradientCumulative)" />
              <Line type="monotone" dataKey="savingsRate" name="Taxa de Poupança" stroke="#8b5cf6" strokeWidth={1.5} dot={{ r: 3 }} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Structured Yearly Meta-Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
        {/* Metric 1 */}
        <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Poupança Anual</span>
            <span className={`text-base font-black tracking-tight block ${stats.totalNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(stats.totalNet)}
            </span>
            <span className="text-[9px] font-bold text-slate-400 block leading-tight">Ano Completo</span>
          </div>
          <div className={`p-2.5 rounded-xl shrink-0 ${stats.totalNet >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
            <Wallet size={18} />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Índice Poupança</span>
            <span className="text-base font-black text-blue-600 dark:text-blue-400 tracking-tight block">
              {stats.annualSavingsRate.toFixed(1)}%
            </span>
            <span className="text-[9px] font-bold text-slate-400 block leading-tight">Média do total faturado</span>
          </div>
          <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
            <Percent size={18} />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Consistência Mensal</span>
            <span className="text-base font-black text-slate-800 dark:text-slate-200 tracking-tight block">
              {stats.greenMonthsCount} / 12
            </span>
            <span className="text-[9px] font-bold text-slate-400 block leading-tight">Meses com saldo positivo</span>
          </div>
          <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
            <Calendar size={18} />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Dinâmica de Gastos</span>
            <span className="text-base font-black text-slate-800 dark:text-slate-200 tracking-tight block">
              {stats.totalExpense > 0 ? ((stats.totalExpense / stats.totalIncome) * 100).toFixed(0) : 0}%
            </span>
            <span className="text-[9px] font-bold text-slate-400 block leading-tight">Consumo vs Receitas</span>
          </div>
          <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
            <Activity size={18} />
          </div>
        </div>
      </div>

      {/* Trend Insights summary card */}
      <div className="p-4 rounded-2xl border border-blue-500/10 bg-blue-500/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg shrink-0">
            <TrendingUp size={16} />
          </div>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
            {stats.totalNet >= 0 ? (
              <span>Tendência Geral: <strong>Saudável</strong>. Suas receitas anuais superaram as despesas em <strong>{formatCurrency(stats.totalNet)}</strong>, com uma taxa de poupança acumulada estável de <strong>{stats.annualSavingsRate.toFixed(1)}%</strong>. Seu mês de maior faturamento foi <strong>{stats.maxIncomeMonth}</strong> ({formatCurrency(stats.maxIncome)}).</span>
            ) : (
              <span>Alerta de Tendência: <strong>Déficit Acumulado</strong>. No agregado anual, você gastou <strong>{formatCurrency(Math.abs(stats.totalNet))}</strong> a mais do que faturou. É recomendável revisar despesas de pico, sendo seu maior pico em <strong>{stats.maxExpenseMonth}</strong> ({formatCurrency(stats.maxExpense)}).</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
