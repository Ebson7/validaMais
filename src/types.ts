/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'user' | 'admin';

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
