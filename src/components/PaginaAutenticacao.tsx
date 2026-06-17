import React, { useState } from 'react';
import { Ticket as TicketIcon, User as UserIcon, Lock, Mail, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { User, UserRole } from '../types';
import { api } from '../services/api';
import logoImg from '../assets/logo.png';

interface AuthPageProps {
  onLogin: (user: User) => void;
  onBack?: () => void; // Optional prop for navigation back
}

import ModalRecuperarSenha from './ModalRecuperarSenha';

const PaginaAutenticacao: React.FC<AuthPageProps> = ({ onLogin, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // Verification State
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  // Handler para verificar o código
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await api.verifyEmail(email, verificationCode);
      setSuccessMessage("Conta verificada com sucesso! Pode agora fazer login.");
      setShowVerificationInput(false);
      setIsLogin(true); // Vai para login
      setVerificationCode('');
      // Limpar form de registro
      setPassword('');
      setConfirmPassword('');
      setName('');
    } catch (err: any) {
      setError(err.message || 'Código inválido.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    if (isLogin) {
      try {
        const user = await api.login(email, password);
        onLogin(user);
      } catch (err: any) {
        if (err.message && (err.message.includes('verifique') || err.message.includes('email'))) {
          setError(err.message);
        } else {
          setError(err.message || 'Email ou palavra-passe incorretos.');
        }
      }
    } else {
      if (password !== confirmPassword) {
        setError('As palavras-passe não coincidem.');
        setIsLoading(false);
        return;
      }
      try {
        const response = await api.register(name, email, password);

        if (response && response.requireVerification) {
          setSuccessMessage("Registo efetuado! Um código de verificação foi enviado para o seu email.");
          setShowVerificationInput(true); // Mostrar input de código
        } else {
          onLogin(response);
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao criar conta.');
      }
    }
    setIsLoading(false);
  };

  if (showVerificationInput) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center mb-4"><img src={logoImg} alt="Logo" className="w-24 h-24 object-contain" /></div>
          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Verificar Conta</h2>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">Insira o código enviado para {email}</p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-slate-100 dark:border-slate-700">
            <form className="space-y-5" onSubmit={handleVerify}>
              {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center">{error}</div>}
              {successMessage && <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-lg text-sm text-center">{successMessage}</div>}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Código de Verificação</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  className="mt-1 block w-full text-center text-2xl tracking-widest border border-slate-300 dark:border-slate-600 rounded-lg py-3 dark:bg-slate-700 dark:text-white uppercase"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>

              <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
                {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Verificar e Entrar"}
              </button>

              <button type="button" onClick={() => setShowVerificationInput(false)} className="w-full text-center text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mt-4">
                Voltar
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <ModalRecuperarSenha isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} />

      {/* Buttons (Absolute top) */}
      <div className="absolute top-4 right-4 flex gap-2">
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

            {successMessage && (
              <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-lg text-sm text-center font-medium">
                {successMessage}
              </div>
            )}

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
                    className="block w-full pl-10 pr-3 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base sm:text-sm"
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
                  className="block w-full pl-10 pr-3 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base sm:text-sm"
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
                  className="block w-full pl-10 pr-3 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base sm:text-sm"
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
                    className="block w-full pl-10 pr-3 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-base sm:text-sm"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            {isLogin && (
              <div className="flex justify-center">
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
                  setSuccessMessage('');
                  setShowVerificationInput(false);
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

export default PaginaAutenticacao;