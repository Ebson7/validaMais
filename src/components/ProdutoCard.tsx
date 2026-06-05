/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { Produto } from '../types';
import { Calendar, Store, MapPin, AlertCircle, ShoppingCart } from 'lucide-react';

interface ProdutoCardProps {
  produto: Produto;
}

export const ProdutoCard: React.FC<ProdutoCardProps> = ({ produto }) => {
  const { navigateTo, user, avaliacoes } = useApp();

  const original = produto.precoOriginal;
  const promo = produto.precoPromocional;
  const discountPercent = original > 0 ? Math.round(((original - promo) / original) * 100) : 0;

  const avaliacoesLoja = (avaliacoes || []).filter(
    a => a.nomeLoja.toLowerCase().trim() === (produto?.nomeLoja || '').toLowerCase().trim()
  );

  const mediaAvaliacao = avaliacoesLoja.length > 0
    ? (avaliacoesLoja.reduce((sum, a) => sum + a.estrelas, 0) / avaliacoesLoja.length).toFixed(1)
    : null;

  // Calculo de validade
  const checkExpiryStatus = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr + 'T00:00:00'); // secure parse relative to local clock timezone
    expiry.setHours(0, 0, 0, 0);

    const timeDiff = expiry.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysLeft < 0) {
      return { label: 'VENCIDO', color: 'bg-rose-100 text-rose-800 border-rose-200', isExpired: true, days: daysLeft };
    } else if (daysLeft === 0) {
      return { label: 'VENCE HOJE', color: 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse', isExpired: false, days: 0 };
    } else if (daysLeft === 1) {
      return { label: 'VENCE AMANHÃ', color: 'bg-amber-100 text-amber-800 border-amber-200', isExpired: false, days: 1 };
    } else if (daysLeft <= 4) {
      return { label: `VENCE EM ${daysLeft} DIAS`, color: 'bg-amber-50 text-amber-700 border-amber-200', isExpired: false, days: daysLeft };
    } else {
      return { label: `${daysLeft} dias de validade`, color: 'bg-emerald-50 text-emerald-800 border-emerald-100', isExpired: false, days: daysLeft };
    }
  };

  const expiry = checkExpiryStatus(produto.dataValidade);
  const totalAvailable = produto.quantidadeDisponivel - produto.quantidadeReservada;
  const isEsgotado = totalAvailable <= 0 || produto.status === 'esgotado';

  // Format price
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Human category translation
  const getCategoryBadgeColor = (cat: string) => {
    const map: Record<string, string> = {
      'Laticínios': 'bg-blue-50 text-blue-800 border-blue-100',
      'Padaria': 'bg-amber-50 text-amber-800 border-amber-100',
      'Hortifrúti': 'bg-emerald-50 text-emerald-800 border-emerald-200',
      'Carnes': 'bg-red-50 text-red-800 border-red-100',
      'Bebidas': 'bg-purple-50 text-purple-800 border-purple-100',
      'Mercearia': 'bg-stone-50 text-stone-800 border-stone-100'
    };
    return map[cat] || 'bg-gray-50 text-gray-800 border-gray-100';
  };

  // Safe image display
  const finalImageUrl = (produto.imagens && produto.imagens.length > 0) 
    ? produto.imagens[0] 
    : (produto.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=60&w=400');

  return (
    <div
      id={`produto_card_${produto.id}`}
      className={`glass rounded-3xl border-white/45 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col group ${
        isEsgotado || expiry.isExpired ? 'opacity-85' : ''
      } ${
        !isEsgotado && !expiry.isExpired && expiry.days === 0 ? 'ring-2 ring-rose-500/80 hover:ring-rose-600 bg-rose-50/5/10 bg-red-50/10' : ''
      }`}
    >
      {/* Product Image & Badge */}
      <div className="relative aspect-video w-full bg-gray-50 overflow-hidden">
        <img
          src={finalImageUrl}
          alt={produto.nomeProduto}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Discount Badge */}
        {discountPercent > 0 && !isEsgotado && !expiry.isExpired && (
          <div className="absolute top-3 left-3 bg-rose-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg shadow-sm font-mono flex items-center gap-0.5">
            -{discountPercent}%
          </div>
        )}

        {/* Dynamic Expiry Status Badge */}
        <div className={`absolute top-3 right-3 border px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider shadow-xs uppercase font-mono ${expiry.color}`}>
          {expiry.label}
        </div>

        {/* Same-day expiration high urgency banner */}
        {!isEsgotado && !expiry.isExpired && expiry.days === 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-rose-600 text-white text-[10px] font-black tracking-wider uppercase font-mono py-1.5 px-3 flex items-center justify-between shadow-inner animate-pulse">
            <span className="flex items-center gap-1">🚨 Retirada Urgente</span>
            <span>Consumir Hoje!</span>
          </div>
        )}

        {/* Esgotado Overlay */}
        {isEsgotado && (
          <div className="absolute inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-rose-600 text-white font-black text-sm tracking-widest px-4 py-2 rounded-xl shadow-md border border-rose-500 uppercase font-mono">
              Esgotado
            </span>
          </div>
        )}

        {/* Expirado Overlay */}
        {!isEsgotado && expiry.isExpired && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-gray-800 text-white font-black text-sm tracking-widest px-4 py-2 rounded-xl shadow-md border border-gray-700 uppercase font-mono">
              Vencido
            </span>
          </div>
        )}
      </div>

      {/* Card Contents */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Shop and Category Info */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2 gap-2">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1 font-semibold text-gray-700 truncate">
                <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{produto.nomeLoja}</span>
              </div>
              {mediaAvaliacao && (
                <div className="flex items-center gap-0.5 text-[10px] text-amber-600 font-bold font-mono mt-0.5">
                  <span>★ {mediaAvaliacao}</span>
                  <span className="text-gray-400 font-normal font-sans">({avaliacoesLoja.length})</span>
                </div>
              )}
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 self-start ${getCategoryBadgeColor(produto.categoria)}`}>
              {produto.categoria}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="font-extrabold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-1 text-base leading-tight">
            {produto.nomeProduto}
          </h3>

          {/* Product Description */}
          {produto.descricao && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed min-h-[2rem]">
              {produto.descricao}
            </p>
          )}

          {/* Location Address */}
          <div className="flex items-center gap-1.5 text-gray-400 mt-2.5">
            <MapPin className="w-3 h-3 text-gray-300 shrink-0" />
            <span className="text-[10px] truncate max-w-full font-medium" title={produto.endereco}>
              {produto.endereco}
            </span>
          </div>
        </div>

        {/* Pricing & Reservation Footer */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-end justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-mono line-through font-medium">
              {formatCurrency(produto.precoOriginal)}
            </span>
            <span className="text-lg font-black text-emerald-600 leading-tight">
              {formatCurrency(produto.precoPromocional)}
            </span>
          </div>

          <div className="flex flex-col items-end text-right">
            {!isEsgotado && !expiry.isExpired ? (
              <>
                <span className="text-[10px] font-semibold text-gray-600">
                  {totalAvailable} unidades resta{totalAvailable === 1 ? 'm' : 'm'}
                </span>
                <button
                  id={`btn_reserva_link_${produto.id}`}
                  onClick={() => navigateTo('produto-detalhe', produto.id)}
                  className="mt-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 font-mono hover:ps-5 transition-all duration-300 ps-4 pe-4 py-1.5 rounded-xl cursor-pointer shadow-xs hover:shadow-md flex items-center gap-1"
                >
                  Reservar
                </button>
              </>
            ) : (
              <>
                <span className="text-[10px] font-semibold font-mono text-gray-400 uppercase">
                  Código de Estoque
                </span>
                <span className="text-[10px] text-gray-400 font-mono mt-2">
                  {ExpiryDaysText(expiry.days, isEsgotado)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function ExpiryDaysText(days: number, isEsgotado: boolean) {
  if (isEsgotado) return "Sem estoque";
  if (days < 0) return "Removido de venda";
  return "Indisponível";
}
