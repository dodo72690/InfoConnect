import React, { useState, useEffect } from 'react';
import { Bell, Save } from 'lucide-react';
import { api } from '../services/api';

const NotificationSettings: React.FC = () => {
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await api.getSettings();
            setEmailEnabled(settings.email_notifications === 'true');
        } catch (error) {
            console.error("Erro ao carregar configurações:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.updateSetting('email_notifications', String(emailEnabled));
            alert("Configurações guardadas com sucesso!");
        } catch (error) {
            alert("Erro ao guardar configurações.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Carregando configurações...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Configuração de Notificações</h1>
                <p className="text-slate-500 dark:text-slate-400">Gerencie como e quando as notificações são enviadas.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg text-blue-600 dark:text-blue-400">
                            <Bell size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white">Notificações por Email</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Enviar emails automáticos para clientes e administradores.</p>
                        </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={emailEnabled}
                            onChange={(e) => setEmailEnabled(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-700 pt-6 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        <Save size={18} />
                        {saving ? 'A guardar...' : 'Guardar Alterações'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationSettings;
