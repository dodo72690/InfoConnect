import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, MessageSquarePlus, HelpCircle, Search, Send, Sparkles, Bot, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { getAIPrediagnosis } from '../services/geminiService';
import { User, LogType } from '../types';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
}

interface FAQSectionProps {
  isAdmin?: boolean;
  isTech?: boolean;
  currentUser?: User | null;
  onAddLog: (action: string, details: string, type: LogType) => void;
  onOpenTicketWithDescription?: (desc: string) => void;
}

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

const SeccaoFAQ: React.FC<FAQSectionProps> = ({ isAdmin, isTech, currentUser, onAddLog, onOpenTicketWithDescription }) => {
  const [activeTab, setActiveTab] = useState<'faqs' | 'ai'>('faqs');
  const [searchTerm, setSearchTerm] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState('');
  const [suggestionSent, setSuggestionSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Chat States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: 'Olá! Sou o Assistente Virtual da InfoConnect. Descreva o problema do seu equipamento (ex: "o meu computador não liga" ou "o ecrã ficou azul") e eu farei um pré-diagnóstico com conselhos do que pode verificar antes de abrir um pedido oficial.',
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // New FAQ State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '', category: 'Geral' });

  useEffect(() => {
    loadFaqs();
  }, []);

  useEffect(() => {
    if (activeTab === 'ai') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const loadFaqs = async () => {
    try {
      const data = await api.getFaqs();
      if (!Array.isArray(data)) {
        setFaqs([]);
        return;
      }
      const mappedFaqs = data.map((f: any) => ({
        id: String(f.id),
        question: f.question || f.pergunta || '',
        answer: f.answer || f.resposta || '',
        category: f.category || f.categoria || 'Geral'
      }));
      setFaqs(mappedFaqs);
    } catch (error) {
      console.error("Erro ao carregar FAQs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFaqs = faqs.filter(faq =>
    (faq.question?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (faq.answer?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleSuggest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestion.trim()) return;

    setIsSending(true);
    try {
      await api.suggestFaq(suggestion, currentUser?.name, currentUser?.email);
      setSuggestionSent(true);
      setSuggestion('');
      setTimeout(() => setSuggestionSent(false), 3000);
    } catch (error) {
      alert("Erro ao enviar sugestão.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessageToAI = async (textToSend?: string) => {
    const messageText = textToSend || chatInput;
    if (!messageText.trim() || isAILoading) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text: messageText,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!textToSend) setChatInput('');
    setIsAILoading(true);

    try {
      onAddLog('Consulta IA', `Cliente consultou o Assistente de IA: "${messageText.substring(0, 50)}..."`, LogType.SYSTEM);
      const aiResponse = await getAIPrediagnosis(messageText);
      
      const aiMsg: ChatMessage = {
        sender: 'ai',
        text: aiResponse,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        sender: 'ai',
        text: 'Desculpe, ocorreu um erro ao contactar o serviço de Inteligência Artificial. Por favor verifique se a sua API Key do Gemini está configurada no ficheiro .env do backend.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleQuickSuggestion = (text: string) => {
    handleSendMessageToAI(text);
  };

  const handleClearChat = () => {
    setChatMessages([
      {
        sender: 'ai',
        text: 'Chat de diagnóstico reiniciado. Descreva o problema do seu equipamento e eu ajudarei.',
        timestamp: new Date()
      }
    ]);
  };

  return (
    <div className="p-4 lg:p-8 w-full flex flex-col h-full overflow-hidden">
      
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 shrink-0">
        <button
          onClick={() => setActiveTab('faqs')}
          className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'faqs'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <HelpCircle size={18} />
          <span>Perguntas Frequentes</span>
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'ai'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Sparkles size={18} className={activeTab === 'ai' ? 'animate-pulse text-indigo-500' : ''} />
          <span>Assistente Virtual IA</span>
        </button>
      </div>

      {/* VIEW: FAQS TRADICIONAIS */}
      {activeTab === 'faqs' && (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Perguntas Frequentes</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Encontre respostas rápidas para as dúvidas mais comuns.</p>
            </div>
            {(isAdmin || isTech) && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl font-medium shadow-md flex items-center gap-2 text-sm"
              >
                <MessageSquarePlus size={16} />
                <span>Adicionar FAQ</span>
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar perguntas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
            />
          </div>

          {/* FAQ Accordion List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-slate-400 text-sm">A carregar FAQs...</div>
            ) : (
              filteredFaqs.map((faq) => (
                <div key={faq.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                    className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-3 text-sm">
                      <HelpCircle size={16} className="text-blue-500 shrink-0" />
                      {faq.question}
                    </span>
                    {openId === faq.id ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
                  </button>

                  {openId === faq.id && (
                    <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm leading-relaxed animate-in slide-in-from-top-2 duration-200">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2 block">{faq.category}</span>
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))
            )}

            {!loading && filteredFaqs.length === 0 && (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                Nenhuma pergunta encontrada para a sua pesquisa.
              </div>
            )}
          </div>

          {/* Suggestion Form - Only for Clients */}
          {(!isAdmin && !isTech) && (
            <div className="bg-blue-50/40 dark:bg-blue-950/20 rounded-2xl p-5 border border-blue-100 dark:border-blue-900/50 mt-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg text-blue-600 dark:text-blue-300">
                  <MessageSquarePlus size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-200">Não encontrou o que procurava?</h3>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Sugira uma nova pergunta para a FAQ. A sua sugestão será enviada ao administrador.</p>
                </div>
              </div>

              <form onSubmit={handleSuggest} className="flex gap-2">
                <input
                  type="text"
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  placeholder="Ex: Como posso atualizar os drivers da gráfica?"
                  className="flex-1 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500"
                />
                <button
                  type="submit"
                  disabled={!suggestion.trim() || isSending}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
                >
                  <Send size={14} />
                  <span>{isSending ? 'A enviar...' : 'Enviar'}</span>
                </button>
              </form>
              {suggestionSent && (
                <p className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">
                  ✓ Sugestão enviada com sucesso! Obrigado.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW: ASSISTENTE VIRTUAL IA */}
      {activeTab === 'ai' && (
        <div className="flex-1 flex flex-col overflow-hidden relative min-h-0 bg-slate-900/10 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4">
          
          {/* Header do Chat */}
          <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="bg-indigo-100 dark:bg-indigo-950/50 p-2 rounded-lg text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20">
                <Bot size={20} />
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  Pré-Diagnóstico Inteligente
                  <span className="text-[10px] bg-indigo-150 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Gemini</span>
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">IA treinada para diagnosticar avarias informáticas</span>
              </div>
            </div>
            <button
              onClick={handleClearChat}
              title="Limpar Conversa"
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* Mensagens do Chat */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 min-h-0">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold select-none ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                }`}>
                  {msg.sender === 'user' ? 'EU' : <Bot size={16} />}
                </div>

                {/* Bubble */}
                <div className="space-y-2">
                  <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-150 dark:border-slate-700 rounded-tl-none'
                  }`}>
                    {/* Preserve line breaks for AI answers */}
                    <div className="whitespace-pre-line">{msg.text}</div>
                  </div>

                  {/* AI Quick Button to Create Ticket (Only for client users) */}
                  {msg.sender === 'ai' && idx > 0 && onOpenTicketWithDescription && (!isAdmin && !isTech) && (
                    <button
                      onClick={() => {
                        // Prefill ticket using the user's last input message
                        const lastUserMsg = chatMessages.slice().reverse().find(m => m.sender === 'user');
                        onOpenTicketWithDescription(
                          `[PRÉ-DIAGNÓSTICO IA]\nProblema: ${lastUserMsg?.text || 'Avaria informada'}\n\nRecomendação do Assistente:\n${msg.text}`
                        );
                      }}
                      className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-150 dark:border-indigo-800/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      <span>Abrir Pedido de Assistência com este Diagnóstico</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isAILoading && (
              <div className="flex gap-3 max-w-[80%] mr-auto">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs shrink-0 animate-bounce">
                  <Bot size={16} />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-75" />
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150" />
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-300" />
                  <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">Analisando problema...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestions (Sugestões rápidas) */}
          {chatMessages.length === 1 && (
            <div className="p-3 border-t border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold mb-2">Sugestões de Avaria Comuns:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "O meu portátil não liga nem dá sinal de luz.",
                  "O computador ficou muito lento e aquece imenso.",
                  "Apareceu um ecrã azul com erro no Windows.",
                  "O Wi-Fi liga mas não tenho acesso à Internet."
                ].map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickSuggestion(s)}
                    className="bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-750 px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-350 hover:text-indigo-600 dark:hover:text-indigo-300 text-left transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessageToAI();
            }}
            className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-700 shrink-0"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Descreva o problema (ex: o rato não mexe, vírus no sistema...)"
              disabled={isAILoading}
              className="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-55 transition-all"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isAILoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition-all disabled:opacity-50 shrink-0 flex items-center justify-center shadow-lg shadow-indigo-500/20"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Add FAQ Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in-50 duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Nova Pergunta Frequente</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api.addFaq(newFaq.question, newFaq.answer, newFaq.category);
                setIsModalOpen(false);
                onAddLog('Criação de FAQ', `Nova FAQ criada: "${newFaq.question}"`, LogType.SYSTEM);
                setNewFaq({ question: '', answer: '', category: 'Geral' });
                loadFaqs();
              } catch (error) {
                alert("Erro ao adicionar FAQ");
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-350 mb-1">Pergunta</label>
                <input required type="text" className="w-full border border-slate-250 dark:border-slate-650 rounded-lg p-2 text-sm dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500" value={newFaq.question} onChange={e => setNewFaq({ ...newFaq, question: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-350 mb-1">Resposta</label>
                <textarea required rows={4} className="w-full border border-slate-250 dark:border-slate-650 rounded-lg p-2 text-sm dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500" value={newFaq.answer} onChange={e => setNewFaq({ ...newFaq, answer: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-350 mb-1">Categoria</label>
                <select className="w-full border border-slate-250 dark:border-slate-650 rounded-lg p-2 text-sm dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500" value={newFaq.category} onChange={e => setNewFaq({ ...newFaq, category: e.target.value })}>
                  <option value="Geral">Geral</option>
                  <option value="Técnico">Técnico</option>
                  <option value="Financeiro">Financeiro</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-md transition-all"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeccaoFAQ;