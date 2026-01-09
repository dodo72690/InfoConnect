import React from 'react';
import {
  Ticket, Shield, Zap, BarChart3, Users, ArrowRight,
  Server, CheckCircle, Sun, Moon, Laptop, MessageSquare
} from 'lucide-react';
import logoImg from '../src/assets/logo.png';
// import logoNomeImg from '../src/assets/logonome.png';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  theme: string;
  toggleTheme: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin, theme, toggleTheme }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors font-sans selection:bg-blue-500 selection:text-white">

      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500 font-bold text-xl">
              <img src={logoImg} alt="Logo" className="w-16 h-16 object-contain" />
              <span>InfoConnect</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <button
                onClick={onNavigateToLogin}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
              >
                Entrar na Plataforma
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-6">
            Solução Profissional de TI
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight">
            Gestão de Suporte <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Simples e Inteligente</span>
          </h1>
          <p className="mt-4 text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10">
            Conectamos empresas a técnicos especializados. Centralize pedidos, orçamentos e comunicação numa única plataforma intuitiva.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={onNavigateToLogin}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all hover:-translate-y-1"
            >
              Começar Agora <ArrowRight size={20} />
            </button>
            <button className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
              Saber Mais
            </button>
          </div>
        </div>

        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 opacity-30 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-20 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-32 left-1/2 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-20 bg-white dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Tudo o que precisa para gerir TI</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Ferramentas completas para Clientes e Equipas Técnicas, desenhadas para eficiência.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Server}
              title="Gestão de Tickets"
              desc="Submissão e acompanhamento em tempo real. Histórico completo de intervenções."
            />
            <FeatureCard
              icon={Zap}
              title="Orçamentos Online"
              desc="Crie, envie e aprove orçamentos diretamente na plataforma com um clique."
            />
            <FeatureCard
              icon={BarChart3}
              title="Relatórios Detalhados"
              desc="Métricas de performance, logs de auditoria e estatísticas de atendimento."
            />
            <FeatureCard
              icon={MessageSquare}
              title="Chat Integrado"
              desc="Comunicação direta entre cliente e técnico contextualizada em cada pedido."
            />
            <FeatureCard
              icon={Shield}
              title="Segurança Total"
              desc="Controlo de acessos baseado em papéis (RBAC) e logs de sistema imutáveis."
            />
            <FeatureCard
              icon={Laptop}
              title="Multi-dispositivo"
              desc="Aceda em qualquer lugar. Interface responsiva para Desktop e Mobile."
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-white text-xl">
            <img src={logoImg} alt="Logo" className="w-12 h-12 object-contain" />
            <span>InfoConnect</span>
          </div>
          <div className="text-sm">
            &copy; {new Date().getFullYear()} InfoConnect Plataforma Digital. Todos os direitos reservados.
          </div>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">Termos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Contacto</a>
          </div>
        </div>
      </footer>

    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc }: any) => (
  <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-all hover:-translate-y-1">
    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4">
      <Icon size={24} />
    </div>
    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{title}</h3>
    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
  </div>
);

export default LandingPage;