/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { ShoppingBag, Mail, Lock, User, UserPlus, HelpCircle } from 'lucide-react';

export const CadastroValida: React.FC = () => {
  const { registerUser, navigateTo } = useApp();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !email || !password) return;

    if (password.length < 6) {
      alert('A sua senha precisa ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await registerUser(email.trim(), password, nome.trim(), role);
    } catch {
      // Handled inside AppContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="signup_screen_container" className="min-h-[75vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md glass rounded-3xl border-white/45 p-8 shadow-sm">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex bg-emerald-600 text-white p-3.5 rounded-2xl shadow-md mb-3">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 leading-none">Crie sua Conta</h1>
          <p className="text-xs text-gray-500 mt-2 font-mono uppercase tracking-wider">Cadastre-se no ValidaMais</p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Full Name */}
          <div>
            <label className="block text-xs font-bold text-gray-500 font-mono uppercase mb-1">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                id="cadastro_name_input"
                type="text"
                required
                placeholder="Ex: Maria Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full text-sm px-4 py-2.5 ps-10 border border-gray-200 bg-white/40 focus:bg-white rounded-xl focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* User Email */}
          <div>
            <label className="block text-xs font-bold text-gray-500 font-mono uppercase mb-1">Endereço de E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                id="cadastro_email_input"
                type="email"
                required
                placeholder="Ex: maria.silva@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm px-4 py-2.5 ps-10 border border-gray-200 bg-white/40 focus:bg-white rounded-xl focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* User Password */}
          <div>
            <label className="block text-xs font-bold text-gray-500 font-mono uppercase mb-1">Definir Senha</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                id="cadastro_password_input"
                type="password"
                required
                placeholder="Mínimo de 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm px-4 py-2.5 ps-10 border border-gray-200 bg-white/40 focus:bg-white rounded-xl focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* User Role Selection */}
          <div className="grid grid-cols-2 gap-3.5 pt-1.5">
            <button
              type="button"
              onClick={() => setRole('user')}
              className={`p-3.5 rounded-2xl border-2 text-left cursor-pointer transition-all flex flex-col justify-between h-24 ${
                role === 'user'
                  ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/10'
                  : 'border-white/50 bg-white/30 hover:border-gray-300'
              }`}
            >
              <span className={`text-[10px] font-bold font-mono uppercase ${role === 'user' ? 'text-emerald-700' : 'text-gray-405'}`}>Consumidor</span>
              <p className="text-[10.5px] text-gray-600 font-medium leading-tight">Quero comprar produtos com desconto de validade</p>
            </button>

            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`p-3.5 rounded-2xl border-2 text-left cursor-pointer transition-all flex flex-col justify-between h-24 ${
                role === 'admin'
                  ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/10'
                  : 'border-white/50 bg-white/30 hover:border-gray-300'
              }`}
            >
              <span className={`text-[10px] font-bold font-mono uppercase ${role === 'admin' ? 'text-amber-700' : 'text-gray-405'}`}>Lojista</span>
              <p className="text-[10.5px] text-gray-600 font-medium leading-tight">Represento um mercado próximo</p>
            </button>
          </div>

          {/* Register Button */}
          <button
            id="cadastro_submit_btn"
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="font-mono">Processando...</span>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Registrar Conta
              </>
            )}
          </button>
        </form>

        {/* Back navigation options */}
        <div className="mt-5 pt-4 border-t border-white/60 flex flex-col items-center gap-2 text-center">
          <button
            onClick={() => navigateTo('login')}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-bold transition-colors cursor-pointer"
          >
            Já possui uma conta ativa? Faça o login por aqui
          </button>
          <button
            onClick={() => navigateTo('home')}
            className="text-xs text-gray-400 hover:text-gray-650 font-medium transition-colors cursor-pointer text-[10px]"
          >
            Sair e voltar para a página inicial
          </button>
        </div>
      </div>
    </div>
  );
};
