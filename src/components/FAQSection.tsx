import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, MessageSquarePlus, HelpCircle, Search, Send } from 'lucide-react';
import { api } from '../services/api';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
}

interface FAQSectionProps {
  isAdmin?: boolean;
  isTech?: boolean;
}

const FAQSection: React.FC<FAQSectionProps> = ({ isAdmin, isTech }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState('');
  const [suggestionSent, setSuggestionSent] = useState(false);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  // New FAQ State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '', category: 'Geral' });

  useEffect(() => {
    loadFaqs();
  }, []);

  const loadFaqs = async () => {
    try {
      const data = await api.getFaqs();
      console.log("FAQ Data received:", data);

      if (!Array.isArray(data)) {
        console.error("FAQ Data is not an array:", data);
        setFaqs([]);
        return;
      }

      // Map database fields to component fields if necessary
      const mappedFaqs = data.map((f: any) => ({
        id: String(f.id),
        question: f.question || f.pergunta || '', // Handle potentially different field names
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

  const handleSuggest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestion.trim()) return;

    // Simulação de envio
    setSuggestionSent(true);
    setSuggestion('');
    setTimeout(() => setSuggestionSent(false), 3000);
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Perguntas Frequentes</h1>
          <p className="text-slate-500 dark:text-slate-400">Encontre respostas rápidas ou sugira novas questões.</p>
        </div>
      </div>
      {(isAdmin || isTech) && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center gap-2"
        >
          <MessageSquarePlus size={20} />
          <span>Adicionar FAQ</span>
        </button>
      )}


      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Pesquisar perguntas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all dark:placeholder-slate-500"
        />
      </div>

      {/* FAQ List */}
      <div className="space-y-4 mb-12">
        {loading ? (
          <div className="text-center py-8 text-slate-400">Carregando FAQs...</div>
        ) : (
          filteredFaqs.map((faq) => (
            <div key={faq.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
              <button
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                className="w-full px-6 py-4 flex items-center justify-between text-left bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-3">
                  <HelpCircle size={18} className="text-blue-500" />
                  {faq.question}
                </span>
                {openId === faq.id ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
              </button>

              {openId === faq.id && (
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 leading-relaxed animate-in slide-in-from-top-2 duration-200">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2 block">{faq.category}</span>
                  {faq.answer}
                </div>
              )}
            </div>
          ))
        )}

        {!loading && filteredFaqs.length === 0 && (
          <div className="text-center py-8 text-slate-400 dark:text-slate-500">
            Nenhuma pergunta encontrada para a sua pesquisa.
          </div>
        )}
      </div>

      {/* Suggestion Form */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-lg text-blue-600 dark:text-blue-200">
            <MessageSquarePlus size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-200">Não encontrou o que procurava?</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">Sugira uma nova pergunta para adicionarmos à FAQ.</p>
          </div>
        </div>

        <form onSubmit={handleSuggest} className="flex gap-2">
          <input
            type="text"
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            placeholder="Ex: Como configurar a VPN da empresa?"
            className="flex-1 border-0 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={!suggestion.trim()}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 rounded-xl font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 flex items-center gap-2"
          >
            <Send size={18} />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </form>
        {suggestionSent && (
          <p className="mt-3 text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-2">
            ✓ Sugestão enviada com sucesso! Obrigado.
          </p>
        )}
      </div>

      {/* Add FAQ Modal */}
      {
        isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Nova Pergunta Frequente</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await api.addFaq(newFaq.question, newFaq.answer, newFaq.category);
                  setIsModalOpen(false);
                  setNewFaq({ question: '', answer: '', category: 'Geral' });
                  loadFaqs();
                } catch (error) {
                  alert("Erro ao adicionar FAQ");
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Pergunta</label>
                  <input required type="text" className="w-full border rounded p-2 dark:bg-slate-700 dark:text-white" value={newFaq.question} onChange={e => setNewFaq({ ...newFaq, question: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Resposta</label>
                  <textarea required rows={4} className="w-full border rounded p-2 dark:bg-slate-700 dark:text-white" value={newFaq.answer} onChange={e => setNewFaq({ ...newFaq, answer: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Categoria</label>
                  <select className="w-full border rounded p-2 dark:bg-slate-700 dark:text-white" value={newFaq.category} onChange={e => setNewFaq({ ...newFaq, category: e.target.value })}>
                    <option value="Geral">Geral</option>
                    <option value="Técnico">Técnico</option>
                    <option value="Financeiro">Financeiro</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all"
                  >
                    Adicionar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default FAQSection;