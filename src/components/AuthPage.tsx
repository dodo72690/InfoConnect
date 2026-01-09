import React, { useState } from 'react';
import { Ticket as TicketIcon, User as UserIcon, Lock, Mail, ArrowRight, Loader2, Sun, Moon, ArrowLeft } from 'lucide-react';
import { User, UserRole } from '../types';
import { api } from '../services/api';
import logoImg from '../assets/logo.png';

interface AuthPageProps {
  onLogin: (user: User) => void;
  theme?: string;
  toggleTheme?: () => void;
  onBack?: () => void; // Optional prop for navigation back
}

import ForgotPasswordModal from './ForgotPasswordModal';

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, theme = 'light', toggleTheme, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (isLogin) {
      try {
        const user = await api.login(email, password);
        onLogin(user);
      } catch (err) {
        setError('Email ou palavra-passe incorretos.');
      }
    } else {
      try {
        const newUser = await api.register(name, email, password);
        onLogin(newUser);
      } catch (err: any) {
        setError(err.message || 'Erro ao criar conta.');
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <ForgotPasswordModal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} />

      {/* Buttons (Absolute top) */}
      <div className="absolute top-4 right-4 flex gap-2">
        {toggleTheme && (
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        )}
      </div>

      {onBack && (
        <div className="absolute top-4 left-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium"
          >
            <ArrowLeft size={16} /> Voltar
          </button>
        </div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <img src={logoImg} alt="Logo" className="w-24 h-24 object-contain" />
        </div>
        <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {isLogin ? 'Bem-vindo de volta' : 'Criar nova conta'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          {isLogin ? 'Aceda à plataforma InfoConnect' : 'Registe-se para suporte técnico'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow-xl shadow-slate-200/50 dark:shadow-black/20 sm:rounded-xl sm:px-10 border border-slate-100 dark:border-slate-700 transition-colors">
          <form className="space-y-5" onSubmit={handleSubmit}>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nome Completo</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={!isLogin}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white sm:text-sm"
                    placeholder="João Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white sm:text-sm"
                  placeholder="nome@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Palavra-passe</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white sm:text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Confirmar Palavra-passe</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    required={!isLogin}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {isLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Esqueceu-se da palavra-passe?
                </button>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center items-center gap-2 rounded-lg border border-transparent bg-blue-600 py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    A processar...
                  </>
                ) : (
                  <>
                    {isLogin ? 'Entrar na Plataforma' : 'Criar Conta'}
                    {!isLoading && <ArrowRight className="h-4 w-4" />}
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white dark:bg-slate-800 px-2 text-slate-500 dark:text-slate-400">ou</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setEmail('');
                  setPassword('');
                  setName('');
                  setError('');
                }}
                className="flex w-full justify-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 py-2 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              >
                {isLogin ? 'Criar uma conta nova' : 'Já tenho conta (Entrar)'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthPage;