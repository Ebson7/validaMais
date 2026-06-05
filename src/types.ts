/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'user' | 'admin';

export interface Categoria {
  id?: string;
  nome: string;
  criadoEm?: any;
}

export interface Usuario {
  uid: string;
  email: string;
  nome: string;
  role: UserRole;
  senha?: string;
  criadoEm: any; // Firestore Timestamp
}

export interface Produto {
  id?: string;
  adminId: string;
  nomeLoja: string;
  nomeProduto: string;
  categoria: string;
  descricao?: string;
  precoOriginal: number;
  precoPromocional: number;
  dataValidade: string; // ISO date string YYYY-MM-DD
  quantidadeDisponivel: number;
  quantidadeReservada: number;
  imageUrl?: string;
  imagens?: string[];
  status: 'disponivel' | 'esgotado';
  endereco: string;
  criadoEm: any; // Firestore Timestamp
}

export interface Reserva {
  id?: string;
  usuarioId: string;
  usuarioEmail: string;
  produtoId: string;
  nomeProduto: string;
  nomeLoja: string;
  quantidade: number;
  precoTotal: number;
  status: 'pendente' | 'retirado' | 'cancelado';
  criadoEm: any; // Firestore Timestamp
  atualizadoEm: any; // Firestore Timestamp
}

export interface AvaliacaoLoja {
  id?: string;
  reservaId: string;
  nomeLoja: string;
  usuarioId: string;
  usuarioEmail: string;
  estrelas: number; // 1-5
  comentario: string;
  criadoEm: any; // ISO date string or Firestore Timestamp
}

export interface NotificacaoPreferencias {
  uid: string;
  cepsDesejados: string[]; // List of CEPs to monitor
  distanciaKm: number; // radius to monitor (or simply CEP prefix match)
  notificarNovosDescontos: boolean;
  fcmTokens: string[];
}

export interface NotificacaoFeedItem {
  id?: string;
  usuarioId: string; // The user this was sent to
  titulo: string;
  mensagem: string;
  produtoId: string;
  nomeLoja: string;
  precoOriginal: number;
  precoPromocional: number;
  lido: boolean;
  criadoEm: any;
}


