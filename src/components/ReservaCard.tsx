/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Reserva } from '../types';
import { ShoppingBag, Calendar, CheckSquare, XCircle, Store, User, Mail, DollarSign } from 'lucide-react';

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
  );
};
