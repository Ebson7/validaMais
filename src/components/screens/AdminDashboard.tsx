/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getStoreProducts, getReservations } from '../../lib/db-wrapper';
import { Produto, Reserva } from '../../types';
import { Package, ShoppingBag, Clock, CheckSquare, PlusCircle, ClipboardList, TrendingUp } from 'lucide-react';

export const AdminDashboardValida: React.FC = () => {
  const { user, navigateTo } = useApp();
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    pendingReservations: 0,
    withdrawnReservations: 0,
    itemsSaved: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadMetrics = async () => {
      setLoading(true);
      try {
        // 1. Get products registered by this specific merchant admin
        const myProducts = await getStoreProducts(user.uid);

        // 2. Scan reservations
        const allReservas = await getReservations();
        let pending = 0;
        let withdrawn = 0;
        let savedCount = 0;

        allReservas.forEach((res) => {
          // Filter dynamically by products belonging to this admin
          const hasProduct = myProducts.some(p => p.id === res.produtoId || p.nomeProduto === res.nomeProduto);
          const belongsToLoja = res.nomeLoja === user.nome || (user.nome && res.nomeLoja?.toLowerCase().includes(user.nome.toLowerCase()));
          
          if (hasProduct || belongsToLoja) {
            if (res.status === 'pendente') pending++;
            if (res.status === 'retirado') {
              withdrawn++;
              savedCount += res.quantidade;
            }
          }
        });

        setMetrics({
          totalProducts: myProducts.length,
          pendingReservations: pending,
          withdrawnReservations: withdrawn,
          itemsSaved: savedCount
        });
      } catch (err) {
        console.error("Error drawing admin metrics: ", err);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [user]);

  return (
    <div id="admin_dashboard" className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 leading-tight">Painel do Lojista</h1>
          <p className="text-sm text-gray-500 font-semibold mt-1">Gerencie seus produtos próximos do vencimento e acompanhe as coletas realizadas</p>
        </div>
        <button
          onClick={() => navigateTo('admin-produtos-novo')}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 hover:shadow-md transition-all text-white text-xs font-bold font-mono uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-amber-50" />
          Cadastrar Novo Lote
        </button>
      </div>

      {/* Metrics widgets */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1,2,3,4].map(n => (
            <div key={n} className="bg-gray-100 h-28 rounded-2xl border" />
          ))}
        </div>
      ) : (        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Active lots */}
          <div className="glass border-white/50 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider">Produtos Postados</span>
              <Package className="w-5 h-5 text-gray-405" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-slate-800">{metrics.totalProducts}</span>
              <span className="block text-[10px] text-gray-400 font-medium mt-1">Lotes em oferta ativa</span>
            </div>
          </div>

          {/* Card 2: Pending Reservations */}
          <div className="glass border-orange-200/55 rounded-2xl p-5 flex flex-col justify-between shadow-xs ring-2 ring-amber-500/10">
            <div className="flex items-center justify-between text-amber-550">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-amber-700">Aguardando Coleta</span>
              <Clock className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-amber-600">{metrics.pendingReservations}</span>
              <span className="block text-[10px] text-amber-500 font-medium mt-1">Reservas pendentes</span>
            </div>
          </div>

          {/* Card 3: Completed Collections */}
          <div className="glass border-white/50 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-emerald-600">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-emerald-800">Finalizadas</span>
              <CheckSquare className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-emerald-600">{metrics.withdrawnReservations}</span>
              <span className="block text-[10px] text-emerald-500 font-medium mt-1">Retiradas realizadas</span>
            </div>
          </div>

          {/* Card 4: Food saved indicator */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-2xl p-5 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-emerald-100">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider">Salvos do Lixo</span>
              <TrendingUp className="w-5 h-5 text-emerald-250 text-white" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black">{metrics.itemsSaved}</span>
              <span className="block text-[10px] text-emerald-150 text-emerald-100 font-medium mt-1">Unidades resgatadas</span>
            </div>
          </div>
        </div>
      )}

      {/* Admin Shortcuts Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Box 1 */}
        <button
          onClick={() => navigateTo('admin-produtos-novo')}
          className="glass rounded-3xl border-white/50 p-6 text-left hover:border-amber-400 group cursor-pointer transition-all hover:shadow-md"
        >
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
            <PlusCircle className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-sm text-gray-900">Novo Lote Promocional</h3>
          <p className="text-xs text-gray-500 mt-1 lines-clamp-2 leading-relaxed">
            Cadastre os itens perecíveis do seu estoque que estão aproximando-se do prazo regulamentar e determine preços reduzidos de liquidação.
          </p>
        </button>

        {/* Box 2 */}
        <button
          onClick={() => navigateTo('admin-produtos')}
          className="glass rounded-3xl border-white/50 p-6 text-left hover:border-amber-400 group cursor-pointer transition-all hover:shadow-md"
        >
          <div className="w-12 h-12 bg-amber-50 text-amber-650 text-amber-600 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-sm text-gray-900">Gerenciar Catalogados</h3>
          <p className="text-xs text-gray-500 mt-1 lines-clamp-2 leading-relaxed">
            Veja a relação de todos os lotes que você publicou, edite descrições de embalagem, atualize preços promocionais ou remova liquidações expiradas.
          </p>
        </button>

        {/* Box 3 */}
        <button
          onClick={() => navigateTo('admin-reservas')}
          className="glass rounded-3xl border-white/50 p-6 text-left hover:border-amber-400 group cursor-pointer transition-all hover:shadow-md"
        >
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-sm text-gray-900">Gerenciar Reservas Recebidas</h3>
          <p className="text-xs text-gray-500 mt-1 lines-clamp-2 leading-relaxed">
            Consulte as solicitações de reserva feitas por usuários, identifique os clientes que virão retirar o mantimento e dê baixa para confirmar a retirada.
          </p>
        </button>
      </div>
    </div>
  );
};
