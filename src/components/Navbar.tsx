/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingBag, Key, LogOut, CheckCircle, PlusCircle, ClipboardList, AppWindow, User, ShoppingCart } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, currentScreen, navigateTo, logoutUser } = useApp();

  return (
    <nav id="navbar_container" className="glass sticky top-4 z-50 shadow-xs mx-4 sm:mx-6 lg:mx-8 my-4 rounded-2xl border-white/50 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <button
              id="brand_logo_btn"
              onClick={() => navigateTo('home')}
              className="flex items-center gap-2 cursor-pointer group focus:outline-none"
            >
              <div className="bg-emerald-600 group-hover:bg-emerald-500 transition-colors text-white p-2 rounded-xl shadow-xs">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="font-extrabold text-xl tracking-tight text-gray-900 group-hover:text-emerald-600 transition-colors">
                  Valida<span className="text-emerald-600">Mais</span>
                </span>
                <span className="text-[9px] font-medium tracking-wide text-gray-400 font-mono">SALVE MAIS, PAGUE MENOS</span>
              </div>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <button
              id="nav_btn_home"
              onClick={() => navigateTo('home')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                currentScreen === 'home'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              Vitrine
            </button>
            <button
              id="nav_btn_produtos"
              onClick={() => navigateTo('produtos')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                currentScreen === 'produtos' || currentScreen === 'produto-detalhe'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              Produtos
            </button>

            {user && user.role === 'user' && (
              <button
                id="nav_btn_reservas"
                onClick={() => navigateTo('minhas-reservas')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentScreen === 'minhas-reservas'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                Minhas Reservas
              </button>
            )}

            {user && user.role === 'admin' && (
              <div id="admin_nav_group" className="flex items-center space-x-1 border-l pl-3 ml-2 border-gray-200">
                <button
                  id="nav_btn_admin_db"
                  onClick={() => navigateTo('admin-dashboard')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    currentScreen === 'admin-dashboard'
                      ? 'bg-amber-50 text-amber-800'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <AppWindow className="w-4 h-4" />
                  Painel Admin
                </button>
                <button
                  id="nav_btn_admin_prods"
                  onClick={() => navigateTo('admin-produtos')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    currentScreen === 'admin-produtos' || currentScreen === 'admin-produtos-novo' || currentScreen === 'admin-produtos-editar'
                      ? 'bg-amber-50 text-amber-800'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  Gerenciar Produtos
                </button>
                <button
                  id="nav_btn_admin_res"
                  onClick={() => navigateTo('admin-reservas')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    currentScreen === 'admin-reservas'
                      ? 'bg-amber-50 text-amber-800'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <ClipboardList className="w-4 h-4 text-emerald-600" />
                  Reservas Recebidas
                </button>
              </div>
            )}
          </div>

          {/* User Account Controls */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden md:flex flex-col items-end text-right">
                  <span className="text-xs font-semibold text-gray-800">{user.nome}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full leading-none mt-0.5 text-center ${
                    user.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {user.role === 'admin' ? 'LOGISTA' : 'CLIENTE'}
                  </span>
                </div>

                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shadow-xs border border-emerald-200">
                  {user.nome.charAt(0).toUpperCase()}
                </div>

                <button
                  id="navbar_logout_btn"
                  onClick={logoutUser}
                  className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Sair"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="navbar_login_btn"
                  onClick={() => navigateTo('login')}
                  className="px-4 py-2 text-sm font-medium text-emerald-700 hover:text-emerald-800 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                >
                  Login
                </button>
                <button
                  id="navbar_signup_btn"
                  onClick={() => navigateTo('cadastro')}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-all cursor-pointer hover:shadow-md"
                >
                  Cadastrar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Routing Menu (Bottom Nav Bar for high responsiveness on mobile viewport) */}
      <div className="md:hidden border-t border-gray-100 bg-white fixed bottom-0 left-0 right-0 z-50 flex justify-around py-2.5 px-4 shadow-lg">
        <button
          onClick={() => navigateTo('home')}
          className={`flex flex-col items-center justify-center text-center gap-1 flex-1 ${
            currentScreen === 'home' ? 'text-emerald-600' : 'text-gray-400'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button
          onClick={() => navigateTo('produtos')}
          className={`flex flex-col items-center justify-center text-center gap-1 flex-1 ${
            currentScreen === 'produtos' || currentScreen === 'produto-detalhe' ? 'text-emerald-600' : 'text-gray-400'
          }`}
        >
          <ShoppingBag className="w-5 h-5 text-amber-500" />
          <span className="text-[10px] font-medium">Produtos</span>
        </button>

        {user && user.role === 'user' && (
          <button
            onClick={() => navigateTo('minhas-reservas')}
            className={`flex flex-col items-center justify-center text-center gap-1 flex-1 ${
              currentScreen === 'minhas-reservas' ? 'text-emerald-600' : 'text-gray-400'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-[10px] font-medium">Reservas</span>
          </button>
        )}

        {user && user.role === 'admin' && (
          <>
            <button
              onClick={() => navigateTo('admin-dashboard')}
              className={`flex flex-col items-center justify-center text-center gap-1 flex-1 ${
                currentScreen === 'admin-dashboard' ? 'text-amber-600' : 'text-gray-400'
              }`}
            >
              <AppWindow className="w-5 h-5" />
              <span className="text-[10px] font-medium">Painel</span>
            </button>
            <button
              onClick={() => navigateTo('admin-reservas')}
              className={`flex flex-col items-center justify-center text-center gap-1 flex-1 ${
                currentScreen === 'admin-reservas' ? 'text-amber-600' : 'text-gray-400'
              }`}
            >
              <ClipboardList className="w-5 h-5" />
              <span className="text-[10px] font-medium">Reservas</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
};
