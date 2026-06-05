/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShoppingBag, 
  LogOut, 
  ClipboardList, 
  AppWindow, 
  ShoppingCart, 
  Bell, 
  Settings, 
  Trash2, 
  BellOff, 
  MapPin, 
  Sparkles, 
  X, 
  RefreshCw 
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    user, 
    currentScreen, 
    navigateTo, 
    logoutUser,
    notificacoes,
    notificacoesPreferencias,
    notificationsPermission,
    isFCMSupported,
    requestNotificationPermissionAndToken,
    updateNotificacaoPreferencias,
    marcarNotificacaoComoLida,
    apagarNotificacao,
    testSendNotificationPreview,
    produtos
  } = useApp();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [cepInput, setCepInput] = useState('');
  const [vapidInput, setVapidInput] = useState('');

  // Sync preferences search strings on load
  useEffect(() => {
    if (notificacoesPreferencias) {
      setCepInput(notificacoesPreferencias.cepsDesejados.join(', '));
    }
  }, [notificacoesPreferencias]);

  const activePromoProducts = produtos.filter(p => p.precoPromocional < p.precoOriginal && p.status === 'disponivel');
  const unreadCount = notificacoes.filter(n => !n.lido).length;

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    const ceps = cepInput
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);
    await updateNotificacaoPreferencias(ceps, notificacoesPreferencias?.notificarNovosDescontos ?? true);
    setShowPrefs(false);
  };

  const triggerTestPush = async () => {
    if (activePromoProducts.length === 0) {
      const dummyProduct = {
        id: 'simulated_dummy_discount_001',
        adminId: 'admin_test',
        nomeLoja: 'Supermercado Nova Aliança',
        nomeProduto: 'Pizza Calabreza Congelada Seara',
        categoria: 'Congelados',
        precoOriginal: 24.90,
        precoPromocional: 11.90,
        dataValidade: new Date().toISOString(),
        quantidadeDisponivel: 6,
        quantidadeReservada: 0,
        status: 'disponivel' as const,
        endereco: 'Rua Bela Cintra, 230 - São Paulo, SP, 01415-000',
        criadoEm: new Date().toISOString()
      };
      await testSendNotificationPreview(dummyProduct);
    } else {
      await testSendNotificationPreview(activePromoProducts[0]);
    }
  };

  return (
    <nav id="navbar_container" className="glass sticky top-4 z-50 shadow-xs mx-4 sm:mx-6 lg:mx-8 my-4 rounded-2xl border border-gray-100 bg-white/80 backdrop-blur-md transition-all">
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
              <div className="flex items-center gap-3 relative">
                
                {/* Real-time Notification Bell container */}
                {user.role === 'user' && (
                  <div className="relative">
                    <button
                      id="navbar_notif_bell"
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="p-2 relative rounded-xl text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer focus:outline-none"
                      title="Notificações de Alertas"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-650 text-[9px] font-bold text-white items-center justify-center font-mono">
                            {unreadCount}
                          </span>
                        </span>
                      )}
                    </button>

                    {showDropdown && (
                      <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden text-left origin-top-right animate-in fade-in slide-in-from-top-3 duration-200">
                        {/* Dropdown Header */}
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/55">
                          <span className="font-bold text-xs text-gray-900 flex items-center gap-1.5 font-sans tracking-tight">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-605" />
                            Ofertas Próximas Ativas
                          </span>
                          <button
                            onClick={() => {
                              setShowPrefs(true);
                              setShowDropdown(false);
                            }}
                            className="p-1 rounded-lg text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer border border-transparent"
                            title="Configurar Notificações"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* List Feed */}
                        <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                          {notificacoes.length === 0 ? (
                            <div className="p-6 text-center text-gray-400 flex flex-col items-center gap-2">
                              <BellOff className="w-8 h-8 text-gray-300" />
                              <p className="text-xs font-semibold">Nenhuma oferta recebida</p>
                              <span className="text-[10px] text-gray-400 max-w-[210px] leading-relaxed">
                                Cadastre seus CEPs de interesse clicando na engrenagem acima para interceptar descontos!
                              </span>
                            </div>
                          ) : (
                            notificacoes.map((item) => (
                              <div
                                key={item.id}
                                className={`p-3.5 transition-all hover:bg-emerald-50/20 flex flex-col gap-1 cursor-pointer relative ${
                                  !item.lido ? 'bg-emerald-50/10' : ''
                                }`}
                                onClick={() => {
                                  if (item.produtoId) {
                                    navigateTo('produto-detalhe', item.produtoId);
                                  }
                                  if (!item.lido && item.id) {
                                    marcarNotificacaoComoLida(item.id);
                                  }
                                  setShowDropdown(false);
                                }}
                              >
                                {!item.lido && (
                                  <span className="absolute top-4 left-2.5 w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                                )}
                                <div className="pl-2 flex justify-between items-start gap-1">
                                  <h4 className="font-bold text-xs text-gray-900 leading-tight">
                                    {item.titulo}
                                  </h4>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (item.id) apagarNotificacao(item.id);
                                    }}
                                    className="p-1 -mr-1 -mt-1 text-gray-300 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                                    title="Remover"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                                <p className="pl-2 text-[11px] text-gray-500 leading-relaxed font-sans">
                                  {item.mensagem}
                                </p>
                                <div className="pl-2 mt-1 flex justify-between items-center text-[9px] font-mono text-gray-400">
                                  <span className="flex items-center gap-0.5 font-semibold text-emerald-700 uppercase">
                                    <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                                    {item.nomeLoja}
                                  </span>
                                  <span>
                                    {new Date(item.criadoEm).toLocaleTimeString('pt-BR', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Dropdown Footer */}
                        <div className="p-3 bg-emerald-50/20 text-center border-t border-gray-100 flex justify-between items-center py-2 px-4.5">
                          <button
                            onClick={() => {
                              notificacoes.forEach(n => {
                                if (!n.lido && n.id) marcarNotificacaoComoLida(n.id);
                              });
                            }}
                            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 transition-colors flex items-center gap-0.5 cursor-pointer"
                          >
                            Marcar lidas
                          </button>
                          <span className="text-[10px] text-gray-400 font-medium bg-white px-2 py-0.5 rounded-full border border-gray-105">
                            {notificacoesPreferencias?.cepsDesejados.length || 'S/Filtro'} CEPs Ativos
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

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

      {/* PUSH PREFERENCES POPUP MODAL */}
      {showPrefs && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 bg-emerald-50/20 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-950 leading-none">Notificações Inteligentes</h3>
                  <p className="text-[9px] font-mono font-bold text-gray-400 mt-1.5 uppercase tracking-wide">FCM Push & Localização</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrefs(false)}
                className="p-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 transition-all border border-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSavePreferences} className="p-5 flex flex-col gap-4 text-left">
              
              {/* Permission & Status block */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-2.5">
                <span className="text-[9px] font-bold text-gray-400 font-mono tracking-wider uppercase">STATUS DO DISPOSITIVO</span>
                
                <div className="flex justify-between items-center text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-gray-750">Permissão do Navegador</span>
                    <span className="text-[10px] text-gray-400">Permite popups no seu sistema</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                    notificationsPermission === 'granted' 
                      ? 'bg-emerald-100 text-emerald-850' 
                      : notificationsPermission === 'denied' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-amber-100 text-amber-800'
                  }`}>
                    {notificationsPermission === 'granted' ? 'CONCEDIDA' : notificationsPermission === 'denied' ? 'NEGADA' : 'PEDIR'}
                  </span>
                </div>

                <div className="flex justify-between items-center border-t border-gray-200/50 pt-2 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-gray-750">Canal Push Firebase</span>
                    <span className="text-[10px] text-gray-400">Suporte técnico FCM</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                    isFCMSupported ? 'bg-indigo-100 text-indigo-805' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isFCMSupported ? 'ATIVO (WEB-PUSH)' : 'EM TEMPO REAL (ATIVADO)'}
                  </span>
                </div>

                {notificationsPermission !== 'granted' && (
                  <button
                    type="button"
                    onClick={async () => {
                      await requestNotificationPermissionAndToken(vapidInput);
                    }}
                    className="mt-1.5 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Ativar Comunicação Push
                  </button>
                )}
              </div>

              {/* Toggle Alerts switch */}
              <div className="flex justify-between items-center py-1">
                <div className="flex flex-col gap-0.5 text-xs">
                  <span className="font-bold text-gray-800">Alertas de Urgência</span>
                  <p className="text-[10px] text-gray-400">Deseja receber notificações de novos descontos?</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificacoesPreferencias?.notificarNovosDescontos ?? true}
                    onChange={async (e) => {
                      if (!user) return;
                      const ceps = cepInput.split(',').map(c => c.trim()).filter(c => c.length > 0);
                      await updateNotificacaoPreferencias(ceps, e.target.checked);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* CEP settings */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  Filtrar Mercados por CEP
                </label>
                <input
                  type="text"
                  value={cepInput}
                  onChange={(e) => setCepInput(e.target.value)}
                  placeholder="Ex: 01311, 13020 (vazio = monitora todos)"
                  className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 font-mono focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none transition-all"
                />
                <span className="text-[10px] text-gray-400 leading-normal">
                  Insira o CEP de bairros da sua rotina separados por vírgula. Quando mercados próximos adicionarem produtos, você receberá um som e popup!
                </span>
              </div>

              {/* Action Simulation Box */}
              <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={triggerTestPush}
                  className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Testar Alerta Sonoro & Visual (Simulação)
                </button>

                <div className="flex gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowPrefs(false)}
                    className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-650 border border-gray-200 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer text-center"
                  >
                    Salvar
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </nav>
  );
};
