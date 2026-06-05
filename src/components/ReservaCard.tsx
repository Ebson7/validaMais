/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Reserva } from '../types';
import { ShoppingBag, Calendar, CheckSquare, XCircle, Store, User, Mail, DollarSign, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ReservaCardProps {
  reserva: Reserva;
  isAdminView: boolean;
  onStatusUpdate: (reservaId: string, newStatus: 'retirado' | 'cancelado') => Promise<void>;
}

export const ReservaCard: React.FC<ReservaCardProps> = ({
  reserva,
  isAdminView,
  onStatusUpdate
}) => {
  const [updating, setUpdating] = useState(false);
  const { avaliacoes, addAvaliacaoLoja } = useApp();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const avaliacaoExistente = avaliacoes.find(a => a.reservaId === reserva.id);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    try {
      await addAvaliacaoLoja(reserva.id!, reserva.nomeLoja, rating, comment);
      setShowReviewForm(false);
      setRating(0);
      setComment('');
    } catch (err) {
      console.error(err);
    }
  };

  const renderStars = (ratingNum: number, interactive = false, onSelect?: (stars: number) => void) => {
    return (
      <div className="flex gap-1 items-center">
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= ratingNum;
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => onSelect && onSelect(star)}
              className={`${interactive ? 'cursor-pointer hover:scale-110 active:scale-95 transition-transform' : 'cursor-default focus:outline-none'}`}
            >
              <Star
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                  active 
                    ? 'fill-amber-400 text-amber-400' 
                    : 'text-gray-300'
                }`}
              />
            </button>
          );
        })}
      </div>
    );
  };

  // Parse server timestamp
  const getFormattedDate = (timestamp: any) => {
    if (!timestamp) return 'Carregando...';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusBadge = (status: Reserva['status']) => {
    const configs = {
      pendente: {
        label: 'Aguardando Retirada',
        styles: 'bg-amber-100 text-amber-800 border-amber-200 shadow-xs'
      },
      retirado: {
        label: 'Retirado / Finalizado',
        styles: 'bg-emerald-100 text-emerald-800 border-emerald-200'
      },
      cancelado: {
        label: 'Cancelado',
        styles: 'bg-gray-100 text-gray-700 border-gray-200'
      }
    };
    const current = configs[status] || configs.pendente;
    return (
      <span className={`text-xs font-bold leading-none px-3 py-1 rounded-full border uppercase tracking-wider font-mono ${current.styles}`}>
        {current.label}
      </span>
    );
  };

  const handleUpdate = async (status: 'retirado' | 'cancelado') => {
    let confirmPrompt = `Confirmar alteração para ${status === 'retirado' ? 'RETIRADO' : 'CANCELADO'}?`;
    if (status === 'cancelado') {
      confirmPrompt = 'Tem certeza que deseja cancelar esta reserva? (O produto retornará ao estoque)';
    }

    if (!window.confirm(confirmPrompt)) return;

    setUpdating(true);
    try {
      await onStatusUpdate(reserva.id!, status);
    } catch (error) {
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Main card */}
      <div
        id={`reserva_card_${reserva.id}`}
        className="glass rounded-3xl border-white/50 p-6 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        {/* Information block */}
        <div className="space-y-2.5 flex-1 w-full">
          <div className="flex flex-wrap items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600 shrink-0" />
            <h3 className="text-base font-extrabold text-gray-900 leading-tight">
              {reserva.nomeProduto}
            </h3>
            <div className="font-mono text-xs font-semibold text-gray-500 bg-white/40 px-2.5 py-1 rounded-lg border border-white/40">
              Qtd: {reserva.quantidade}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-gray-600 font-medium">
            {/* Dependent on role, either show Client profile details or Merchant names */}
            {isAdminView ? (
              <div className="flex items-center gap-1.5 text-gray-700">
                <User className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="font-semibold">{reserva.usuarioEmail}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-gray-700">
                <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-semibold">{reserva.nomeLoja}</span>
              </div>
            )}

            {/* Reserved Date */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="font-mono">{getFormattedDate(reserva.criadoEm)}</span>
            </div>
          </div>

          {/* Pricing tag */}
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-sm font-black text-emerald-600">
              Total da Reserva:{' '}
              {reserva.precoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>

        {/* Control Actions block */}
        <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0 w-full md:w-auto">
          {/* Reservation Status badge */}
          {getStatusBadge(reserva.status)}

          {/* Interactive action controls */}
          {reserva.status === 'pendente' && (
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {isAdminView ? (
                <>
                  <button
                    onClick={() => handleUpdate('retirado')}
                    disabled={updating}
                    className="bg-emerald-600 hover:bg-emerald-700 font-sans text-xs font-bold text-white px-3.5 py-1.5 rounded-xl cursor-pointer shadow-xs active:scale-95 transition-all flex items-center gap-1 flex-1 sm:flex-initial disabled:opacity-50"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    Confirmar Retirada
                  </button>
                  <button
                    onClick={() => handleUpdate('cancelado')}
                    disabled={updating}
                    className="border border-gray-200 hover:bg-rose-50 text-gray-600 hover:text-rose-600 font-sans text-xs font-bold px-3.5 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1 flex-1 sm:flex-initial disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Recusar/Cancelar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleUpdate('cancelado')}
                  disabled={updating}
                  className="border border-rose-200 text-rose-700 hover:bg-rose-50 font-sans text-xs font-bold px-4 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1 flex-1 sm:flex-initial disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Cancelar Reserva
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review trigger & Display for user */}
      {reserva.status === 'retirado' && !isAdminView && (
        <div className="mt-1 transition-all">
          {avaliacaoExistente ? (
            <div className="bg-amber-50/40 border border-amber-200/40 rounded-2xl p-4 sm:ml-6 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-amber-700 font-mono uppercase tracking-wider">
                  Sua Avaliação de {reserva.nomeLoja}
                </span>
                {renderStars(avaliacaoExistente.estrelas)}
              </div>
              {avaliacaoExistente.comentario && (
                <p className="text-xs text-gray-700 italic font-medium">
                  "{avaliacaoExistente.comentario}"
                </p>
              )}
            </div>
          ) : showReviewForm ? (
            <form onSubmit={handleSubmitReview} className="bg-white/80 border border-emerald-200 rounded-3xl p-5 sm:ml-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] font-extrabold text-slate-700 font-mono uppercase tracking-wider">
                  Avaliar Estabelecimento: <span className="text-emerald-700">{reserva.nomeLoja}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewForm(false);
                    setRating(0);
                    setComment('');
                  }}
                  className="text-gray-400 hover:text-rose-600 text-[10px] font-bold font-mono uppercase transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wide">Sua nota de atendimento e frescor:</div>
                {renderStars(rating, true, setRating)}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wide">Comentário sobre a retirada:</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  rows={2}
                  placeholder="Ex: Frutas estavam perfeitas, atendimento rápido no balcão e facilidade na validação."
                  className="w-full text-xs p-3 bg-white border border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-all font-medium text-gray-800 shadow-inner animate-fade-in"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={rating === 0}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-bold font-mono uppercase rounded-xl shadow-xs transition-all cursor-pointer select-none active:scale-95"
                >
                  Enviar Feedback &rarr;
                </button>
              </div>
            </form>
          ) : (
            <div className="flex justify-end sm:pr-2">
              <button
                onClick={() => setShowReviewForm(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 font-mono uppercase bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl cursor-pointer transition-all active:scale-95"
              >
                ★ Avaliar este mercado
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
