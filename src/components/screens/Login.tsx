/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShoppingBag, Mail, Lock, LogIn, Sparkles, HelpCircle } from 'lucide-react';

export const LoginValida: React.FC = () => {
  const { loginUser, navigateTo } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfigTip, setShowConfigTip] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      await loginUser(email.trim(), password);
    } catch {
      // Error handles inside context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login_screen_container" className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md glass rounded-3xl border-white/45 p-8 shadow-sm">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex bg-emerald-600 text-white p-3.5 rounded-2xl shadow-md mb-3.5">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 leading-tight">Acesse o ValidaMais</h1>
          <p className="text-xs font-semibold text-gray-500 mt-1 font-mono tracking-wide uppercase">Economia e sustentabilidade combinadas</p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-400 font-mono uppercase mb-1.5">Endereço de E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                id="login_email_input"
                type="email"
                required
                placeholder="Ex: cliente@validamais.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm ps-10 pe-4 py-2.5 border border-gray-200 bg-white/40 focus:bg-white rounded-xl focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 font-mono uppercase mb-1.5 font-sans">Sua Senha</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                id="login_password_input"
                type="password"
                required
                placeholder="Abaixo de 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm ps-10 pe-4 py-2.5 border border-gray-200 bg-white/40 focus:bg-white rounded-xl focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            id="login_submit_btn"
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="font-mono">Carregando...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Acessar Plataforma
              </>
            )}
          </button>
        </form>

        {/* Quick Access Buttons */}
        <div className="mt-5 p-4 rounded-2xl bg-white/40 border border-white/40 space-y-2">
          <p className="text-[10px] text-center font-bold text-gray-500 font-mono uppercase tracking-wider">Acesso Rápido de Teste (Sem digitação)</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setEmail('cliente@validamais.com');
                setPassword('123456');
                loginUser('cliente@validamais.com', '123456');
              }}
              className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-[10.5px] font-bold text-emerald-800 rounded-lg border border-emerald-200 transition-colors cursor-pointer text-center"
            >
              Consumidor
            </button>
            <button
              onClick={() => {
                setEmail('admin@validamais.com');
                setPassword('123456');
                loginUser('admin@validamais.com', '123456');
              }}
              className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-[10.5px] font-bold text-amber-805 text-amber-800 rounded-lg border border-amber-200 transition-colors cursor-pointer text-center"
            >
              Lojista (Admin)
            </button>
          </div>
        </div>

        {/* Navigation back and registration links */}
        <div className="mt-6 pt-5 border-t border-white/60 flex flex-col items-center gap-3">
          <button
            onClick={() => navigateTo('cadastro')}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-bold transition-colors cursor-pointer"
          >
            Primeira vez por aqui? Crie uma conta grátis
          </button>
          
          <button
            onClick={() => navigateTo('home')}
            className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors cursor-pointer font-sans"
          >
            Voltar para a vitrine pública
          </button>
        </div>

        {/* Configuration Advice Help Box */}
        <div className="mt-8 pt-4 border-t border-dashed border-white/60 text-center">
          <button
            type="button"
            onClick={() => setShowConfigTip(!showConfigTip)}
            className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-emerald-600 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Problemas ao conectar no Firebase? Veja esta dica.
          </button>
          {showConfigTip && (
            <div className="mt-3 p-3 bg-white/50 border border-white/30 text-left rounded-xl text-[10px] text-slate-600 leading-relaxed space-y-1.5 backdrop-blur-sm shadow-xs">
              <span className="font-bold text-slate-800 block">Dica para o Desenvolvedor:</span>
              <p>Certifique-se de ativar o provedor de login com <strong>E-mail/Senha</strong> no Firebase Console:</p>
              <ol className="list-decimal pl-4 space-y-0.5 font-sans">
                <li>Acesse o Firebase Console</li>
                <li>Vá até <strong>Authentication &gt; Sign-in method</strong></li>
                <li>Clique em <strong>Adicionar novo provedor</strong>, escolha <strong>E-mail/Senha</strong>, ligue a chavinha e salve.</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
