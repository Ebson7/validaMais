/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { collection, writeBatch, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { Produto } from '../types';

const SAMPLE_PRODUCTS = [
  {
    nomeProduto: 'Leite Integral UHT 1L',
    categoria: 'Laticínios',
    descricao: 'Caixa levemente amassada no transporte, produto intacto.',
    precoOriginal: 6.90,
    precoPromocional: 2.90,
    offsetDays: 1, // Expirando amanhã
    quantidadeDisponivel: 15,
    quantidadeReservada: 0,
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=60&w=400',
    status: 'disponivel' as const,
    endereco: 'Rua das Flores, 123 - Centro, São Paulo/SP',
    nomeLoja: 'Mercadinho do João'
  },
  {
    nomeProduto: 'Queijo Prato Fatiado 150g',
    categoria: 'Laticínios',
    descricao: 'Lote promocional de giro rápido. Excelente estado.',
    precoOriginal: 14.50,
    precoPromocional: 6.90,
    offsetDays: 2, // Expirando em 2 dias
    quantidadeDisponivel: 10,
    quantidadeReservada: 2,
    imageUrl: 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?auto=format&fit=crop&q=60&w=400',
    status: 'disponivel' as const,
    endereco: 'Supermercado Vila Verde, Av. Paulista, 1000 - São Paulo/SP',
    nomeLoja: 'Supermercado Vila Verde'
  },
  {
    nomeProduto: 'Pão de Forma Artesanal 500g',
    categoria: 'Padaria',
    descricao: 'Casca dourada e macio. Ótimo aproveitamento de sanduíches.',
    precoOriginal: 9.80,
    precoPromocional: 3.90,
    offsetDays: 0, // Expira hoje!
    quantidadeDisponivel: 8,
    quantidadeReservada: 0,
    imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=60&w=400',
    status: 'disponivel' as const,
    endereco: 'Panificadora Delícia, Rua Pamplona, 450 - São Paulo/SP',
    nomeLoja: 'Panificadora Delícia'
  },
  {
    nomeProduto: 'Bolo de Chocolate Vulcão',
    categoria: 'Padaria',
    descricao: 'Bolo fofinho com cobertura trufada de chocolate.',
    precoOriginal: 35.00,
    precoPromocional: 14.90,
    offsetDays: -1, // Expired yesterday to showcase the VENCIDO tag!
    quantidadeDisponivel: 6,
    quantidadeReservada: 0,
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=60&w=400',
    status: 'disponivel' as const,
    endereco: 'Panificadora Delícia, Rua Pamplona, 450 - São Paulo/SP',
    nomeLoja: 'Panificadora Delícia'
  },
  {
    nomeProduto: 'Suco de Laranja Integral 1L',
    categoria: 'Bebidas',
    descricao: 'Prensado a frio, sem conservantes ou adição de açúcares.',
    precoOriginal: 12.90,
    precoPromocional: 5.50,
    offsetDays: 4, // Expira em 4 dias
    quantidadeDisponivel: 20,
    quantidadeReservada: 12,
    imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=60&w=400',
    status: 'disponivel' as const,
    endereco: 'Rua das Flores, 123 - Centro, São Paulo/SP',
    nomeLoja: 'Mercadinho do João'
  },
  {
    nomeProduto: 'Carne Moída Prime Friboi 500g',
    categoria: 'Carnes',
    descricao: 'Passada no moedor duas vezes. Fresca e premium.',
    precoOriginal: 28.90,
    precoPromocional: 15.90,
    offsetDays: 3, // Expira em 3 dias
    quantidadeDisponivel: 12,
    quantidadeReservada: 12, // Fully reserved so it triggers the esgotado layout!
    imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&q=60&w=400',
    status: 'esgotado' as const,
    endereco: 'Açougue São Francisco, Alameda Lorena, 12 - São Paulo/SP',
    nomeLoja: 'Açougue São Francisco'
  }
];

export async function seedDatabase(adminId: string): Promise<number> {
  const batch = writeBatch(db);
  const productsCol = collection(db, 'produtos');

  for (const item of SAMPLE_PRODUCTS) {
    const docRef = doc(productsCol);
    
    // Resolve expiration date relative to current browser runtime
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + item.offsetDays);
    const dateStr = expDate.toISOString().split('T')[0];

    const { offsetDays, ...rest } = item;
    
    const prodDoc: Produto = {
      ...rest,
      adminId,
      dataValidade: dateStr,
      criadoEm: serverTimestamp()
    };

    batch.set(docRef, prodDoc);
  }

  await batch.commit();
  return SAMPLE_PRODUCTS.length;
}

export async function isDatabaseEmpty(): Promise<boolean> {
  const querySnap = await getDocs(collection(db, 'produtos'));
  return querySnap.empty;
}
