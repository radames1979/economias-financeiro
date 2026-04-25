import React from 'react';
import { motion } from 'motion/react';
import { 
  Wallet, 
  TrendingUp, 
  PieChart, 
  ShieldCheck, 
  Smartphone, 
  Zap,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Plus
} from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
}

const FeatureCard = ({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 group"
  >
    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform">
      <Icon size={28} />
    </div>
    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{title}</h3>
    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
  </motion.div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 overflow-x-hidden selection:bg-blue-100">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Wallet size={22} className="text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Economias</span>
          </div>
          <button 
            onClick={onSignIn}
            className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-full font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all text-sm"
          >
            Acessar Conta
            <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold text-sm mb-6 uppercase tracking-wider"
            >
              <Zap size={14} />
              Controle Financeiro Inteligente
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl lg:text-7xl font-extrabold text-slate-900 dark:text-white leading-[1.1] mb-8"
            >
              Organize sua vida financeira <span className="text-blue-600 italic">sem esforço.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
            >
              Domine seus gastos, planeje seu futuro e alcance a liberdade financeira com a plataforma de gestão mais intuitiva e poderosa do mercado.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            >
              <button 
                onClick={onSignIn}
                className="w-full sm:w-auto px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95"
              >
                Começar Grátis agora
                <ChevronRight size={20} />
              </button>
              <div className="flex items-center gap-2 text-slate-500 font-medium">
                <CheckCircle2 className="text-emerald-500" size={20} />
                Nenhum cartão necessário
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12 flex items-center gap-8 justify-center lg:justify-start grayscale opacity-50 overflow-x-auto whitespace-nowrap"
            >
              <span className="font-bold text-lg">Trusted by thousands of users</span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="flex-1 relative"
          >
            <div className="relative z-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1551288049-bbbda536339a?q=80&w=1470&auto=format&fit=crop" 
                alt="Dashboard Preview" 
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 via-transparent opacity-10"></div>
            </div>
            
            {/* Decors */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-600/10 rounded-full blur-3xl"></div>
            
            {/* Floating Widget 1 */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -left-8 top-1/4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xl border border-slate-50 dark:border-slate-800 z-20 hidden md:block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg flex items-center justify-center">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Economizado</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">R$ 2.450,00</p>
                </div>
              </div>
            </motion.div>

            {/* Floating Widget 2 */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute -right-6 bottom-1/4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xl border border-slate-50 dark:border-slate-800 z-20 hidden md:block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg flex items-center justify-center">
                  <PieChart size={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Metas</p>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="w-3/4 h-full bg-blue-600 rounded-full"></div>
                    </div>
                    <span className="text-xs font-bold">75%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-6">Tudo o que você precisa em um só lugar.</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">Pare de usar planilhas complicadas. Tenha o controle total das suas finanças com ferramentas feitas para humanos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            <FeatureCard 
              icon={TrendingUp}
              title="Dashboard em Tempo Real"
              description="Visualize o status das suas contas, despesas recentes e metas em um painel intuitivo e bonito."
              delay={0.1}
            />
            <FeatureCard 
              icon={PieChart}
              title="Relatórios Detalhados"
              description="Gráficos inteligentes que categorizam seus gastos e mostram exatamente para onde seu dinheiro está indo."
              delay={0.2}
            />
            <FeatureCard 
              icon={ShieldCheck}
              title="Dados Criptografados"
              description="Utilizamos tecnologia de ponta para garantir que suas informações financeiras estejam sempre seguras e privadas."
              delay={0.3}
            />
            <FeatureCard 
              icon={Smartphone}
              title="PWA - Mobile First"
              description="Instale o aplicativo no seu celular direto do navegador e tenha acesso instantâneo em qualquer lugar."
              delay={0.4}
            />
            <FeatureCard 
              icon={Plus}
              title="Lançamentos Rápidos"
              description="Adicione despesas ou receitas em segundos através da nossa interface de lançamento inteligente."
              delay={0.5}
            />
            <FeatureCard 
              icon={Zap}
              title="Gestão de Recorrência"
              description="Automatize o controle de assinaturas e contas fixas para nunca mais esquecer uma data de vencimento."
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-6 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-6">Planos que cabem no seu bolso.</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">Comece grátis ou desbloqueie todo o poder da sua gestão financeira.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col">
              <h3 className="text-xl font-bold mb-2">Free</h3>
              <div className="text-4xl font-black mb-6">R$ 0<span className="text-lg font-normal text-slate-500">/sempre</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Controle de Contas', 'Lançamentos Manuais', 'Categorias Básicas', 'Dashboard Mensal'].map(feature => (
                  <li key={feature} className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <CheckCircle2 size={18} className="text-slate-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button 
                onClick={onSignIn}
                className="w-full py-4 rounded-xl font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Começar Agora
              </button>
            </div>

            {/* Pro Plan */}
            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border-2 border-blue-600 shadow-2xl shadow-blue-500/10 flex flex-col relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">Recomendado</div>
              <h3 className="text-xl font-bold mb-2">Premium Pro</h3>
              <div className="text-4xl font-black mb-6">R$ 49,90<span className="text-lg font-normal text-slate-500">/pagamento único</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Tudo do plano Free', 'Relatórios Avançados', 'Importação Excel/PDF', 'Suporte Prioritário', 'Sem Anúncios', 'Acesso Vitalício'].map(feature => (
                  <li key={feature} className="flex items-center gap-3 text-slate-900 dark:text-white">
                    <CheckCircle2 size={18} className="text-blue-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl mb-6">
                <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 mb-2 tracking-widest">Pagamento via PIX</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Para ativar o Pro, realize o PIX e envie o comprovante para o suporte. Ativação manual pelo administrador.
                </p>
              </div>
              <button 
                onClick={onSignIn}
                className="w-full py-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all"
              >
                Seja Premium agora
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Placeholder Section */}
      <section className="py-24 px-6 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex-1">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-6 max-w-md">Pronto para dar o próximo passo financeiro?</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-lg">Junte-se a centenas de usuários que já transformaram sua relação com o dinheiro através do Economias.</p>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3 overflow-hidden">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-200 dark:bg-slate-700"></div>
                ))}
              </div>
              <span className="text-sm font-medium text-slate-500">Avaliado com 4.9 estrelas por nossos usuários</span>
            </div>
          </div>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex-1 bg-blue-600 rounded-[2.5rem] p-12 text-white shadow-2xl shadow-blue-500/30"
          >
            <blockquote className="text-2xl font-medium mb-8 italic">
              "Mudou completamente a forma como cuido do meu dinheiro. O visual é incrível e as ferramentas são muito fáceis de usar."
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl"></div>
              <div>
                <p className="font-bold">Ricardo Silva</p>
                <p className="text-blue-100 text-sm">Usuário Premium</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Wallet size={18} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white">Economias</span>
          </div>
          <div className="flex items-center gap-8 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-blue-600 transition-colors">Termos</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Privacidade</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Suporte</a>
          </div>
          <p className="text-sm text-slate-400">© 2026 Economias. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};
