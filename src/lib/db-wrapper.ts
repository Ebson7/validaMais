/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from './firebase';
import { Produto, Reserva } from '../types';

// Standard fallback mock products
const INITIAL_PRODUCTS = [
  {
    id: 'prod_leite',
    nomeProduto: 'Leite Integral UHT 1L',
    categoria: 'Laticínios',
    descricao: 'Caixa levemente amassada no transporte, lote perfeitamente intacto e conservado.',
    precoOriginal: 6.90,
    precoPromocional: 2.90,
    dataValidade: '2026-06-15',
    quantidadeDisponivel: 15,
    quantidadeReservada: 0,
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=60&w=400',
    status: 'disponivel' as const,
    endereco: 'Rua das Flores, 123 - Centro, São Paulo/SP',
    nomeLoja: 'Mercadinho do João'
  },
  {
    id: 'prod_queijo',
    nomeProduto: 'Queijo Prato Fatiado 150g',
    categoria: 'Laticínios',
    descricao: 'Lote promocional de giro rápido. Excelente estado de refrigeração.',
    precoOriginal: 14.50,
    precoPromocional: 6.90,
    dataValidade: '2026-06-25',
    quantidadeDisponivel: 10,
    quantidadeReservada: 2,
    imageUrl: 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?auto=format&fit=crop&q=60&w=400',
    status: 'disponivel' as const,
    endereco: 'Supermercado Vila Verde, Av. Paulista, 1000 - São Paulo/SP',
    nomeLoja: 'Supermercado Vila Verde'
  },
  {
    id: 'prod_pao',
    nomeProduto: 'Pão de Forma Artesanal 500g',
    categoria: 'Padaria',
    descricao: 'Casca dourada e extremamente macio. Ótimo aproveitamento.',
    precoOriginal: 9.80,
    precoPromocional: 3.90,
    dataValidade: '2026-06-08',
    quantidadeDisponivel: 8,
    quantidadeReservada: 0,
    imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=60&w=400',
    status: 'disponivel' as const,
    endereco: 'Panificadora Delícia, Rua Pamplona, 450 - São Paulo/SP',
    nomeLoja: 'Panificadora Delícia'
  },
  {
    id: 'prod_bolo',
    nomeProduto: 'Bolo de Chocolate Vulcão',
    categoria: 'Padaria',
    descricao: 'Bolo fofinho com cobertura trufada de chocolate artesanal.',
    precoOriginal: 35.00,
    precoPromocional: 14.90,
    dataValidade: '2026-06-04', // Vencido para teste visual
    quantidadeDisponivel: 6,
    quantidadeReservada: 0,
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=60&w=400',
    status: 'disponivel' as const,
    endereco: 'Panificadora Delícia, Rua Pamplona, 450 - São Paulo/SP',
    nomeLoja: 'Panificadora Delícia'
  },
  {
    id: 'prod_suco',
    nomeProduto: 'Suco de Laranja Integral 1L',
    categoria: 'Bebidas',
    descricao: 'Prensado a frio, sem conservantes ou adição de açúcares.',
    precoOriginal: 12.90,
    precoPromocional: 5.50,
    dataValidade: '2026-06-18',
    quantidadeDisponivel: 20,
    quantidadeReservada: 12,
    imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=60&w=400',
    status: 'disponivel' as const,
    endereco: 'Rua das Flores, 123 - Centro, São Paulo/SP',
    nomeLoja: 'Mercadinho do João'
  }
];

// Helper to load products from localStorage
function getLocalProducts(): Produto[] {
  const data = localStorage.getItem('validamais_produtos');
  if (!data) {
    localStorage.setItem('validamais_produtos', JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS as unknown as Produto[];
  }
  return JSON.parse(data);
}

// Helper to save products to localStorage
function saveLocalProducts(products: Produto[]) {
  localStorage.setItem('validamais_produtos', JSON.stringify(products));
}

// Helper to load reservations from localStorage
function getLocalReservations(): Reserva[] {
  const data = localStorage.getItem('validamais_reservas');
  if (!data) {
    localStorage.setItem('validamais_reservas', JSON.stringify([]));
    return [];
  }
  return JSON.parse(data);
}

// Helper to save reservations to localStorage
function saveLocalReservations(reservas: Reserva[]) {
  localStorage.setItem('validamais_reservas', JSON.stringify(reservas));
}

// 1. Get all products (catalogo)
export async function getProducts(): Promise<Produto[]> {
  try {
    const querySnap = await getDocs(collection(db, 'produtos'));
    const results: Produto[] = [];
    querySnap.forEach((docSnap) => {
      results.push({ id: docSnap.id, ...docSnap.data() } as Produto);
    });
    
    if (results.length > 0) {
      saveLocalProducts(results); // Sync cache
      return results;
    } else {
      // Database has 0 records - let's auto-seed to Firestore so it persists for everyone
      console.log("Firestore 'produtos' collection is empty. Auto-seeding default products...");
      await seedDefaultProducts('mock_userId_admin1');
      // Fetch fresh products from Firestore
      const freshSnap = await getDocs(collection(db, 'produtos'));
      const freshResults: Produto[] = [];
      freshSnap.forEach((docSnap) => {
        freshResults.push({ id: docSnap.id, ...docSnap.data() } as Produto);
      });
      if (freshResults.length > 0) {
        saveLocalProducts(freshResults);
        return freshResults;
      }
    }
  } catch (error) {
    console.warn("Firestore error in getProducts, falling back to localStorage:", error);
  }
  return getLocalProducts();
}

// 2. Get merchant products
export async function getStoreProducts(adminId: string): Promise<Produto[]> {
  try {
    const q = query(collection(db, 'produtos'), where('adminId', '==', adminId));
    const querySnap = await getDocs(q);
    const results: Produto[] = [];
    querySnap.forEach((docSnap) => {
      results.push({ id: docSnap.id, ...docSnap.data() } as Produto);
    });
    return results;
  } catch (error) {
    console.warn("Firestore error in getStoreProducts, using localStorage fallback:", error);
  }
  return getLocalProducts().filter(p => p.adminId === adminId || !p.adminId);
}

// 3. Get single product by ID
export async function getProductById(id: string): Promise<Produto | null> {
  try {
    const docSnap = await getDoc(doc(db, 'produtos', id));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Produto;
    }
  } catch (error) {
    console.warn("Firestore error in getProductById, using localStorage fallback:", error);
  }
  const local = getLocalProducts().find(p => p.id === id);
  return local || null;
}

// 4. Create or edit a product
export async function saveProduct(formData: any, productId: string | null = null, adminId: string): Promise<Produto> {
  const now = new Date().toISOString();
  let savedProd: Produto;

  try {
    if (productId) {
      // Edit mode
      const docRef = doc(db, 'produtos', productId);
      const previousDoc = await getProductById(productId);
      const quantityReserved = previousDoc ? previousDoc.quantidadeReservada : 0;
      const finalStatus = (formData.quantidadeDisponivel - quantityReserved <= 0) ? 'esgotado' : 'disponivel';
      
      const payload = {
        ...formData,
        quantidadeReservada: quantityReserved,
        status: finalStatus
      };
      
      await updateDoc(docRef, payload);
      savedProd = { id: productId, ...payload } as Produto;
    } else {
      // Create mode
      const productsCol = collection(db, 'produtos');
      const payload = {
        ...formData,
        adminId,
        quantidadeReservada: 0,
        status: 'disponivel',
        criadoEm: now
      };
      
      const docRef = await addDoc(productsCol, payload);
      savedProd = { id: docRef.id, ...payload } as Produto;
    }
  } catch (error) {
    console.warn("Firestore write error in saveProduct, executing locally:", error);
  }

  // Always update local storage
  const localList = getLocalProducts();
  if (productId) {
    const index = localList.findIndex(p => p.id === productId);
    const existing = localList[index] || {};
    const quantityReserved = existing.quantidadeReservada || 0;
    const finalStatus = (formData.quantidadeDisponivel - quantityReserved <= 0) ? 'esgotado' : 'disponivel';
    
    savedProd = {
      ...existing,
      ...formData,
      id: productId,
      quantidadeReservada: quantityReserved,
      status: finalStatus
    } as Produto;
    
    if (index !== -1) {
      localList[index] = savedProd;
    } else {
      localList.push(savedProd);
    }
  } else {
    const newId = `prod_${Date.now()}`;
    savedProd = {
      ...formData,
      id: newId,
      adminId,
      quantidadeReservada: 0,
      status: 'disponivel',
      criadoEm: now
    } as Produto;
    localList.push(savedProd);
  }
  saveLocalProducts(localList);
  return savedProd;
}

// 5. Delete a product
export async function deleteProduct(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'produtos', id));
  } catch (error) {
    console.warn("Firestore error in deleteProduct, executing locally:", error);
  }

  const localList = getLocalProducts().filter(p => p.id !== id);
  saveLocalProducts(localList);
}

// 6. Get reservations for a user or admin
export async function getReservations(usuarioId?: string): Promise<Reserva[]> {
  try {
    let q;
    if (usuarioId) {
      q = query(collection(db, 'reservas'), where('usuarioId', '==', usuarioId), orderBy('criadoEm', 'desc'));
    } else {
      q = query(collection(db, 'reservas'), orderBy('criadoEm', 'desc'));
    }
    const querySnap = await getDocs(q);
    const results: Reserva[] = [];
    querySnap.forEach((docSnap) => {
      results.push({ id: docSnap.id, ...docSnap.data() } as Reserva);
    });
    saveLocalReservations(results);
    return results;
  } catch (error) {
    console.warn("Firestore error in getReservations, fallback to localStorage:", error);
  }

  const local = getLocalReservations();
  if (usuarioId) {
    return local.filter(r => r.usuarioId === usuarioId);
  }
  return local;
}

// 7. Create a reservation
export async function createReservation(
  usuarioId: string, 
  usuarioEmail: string, 
  produtoId: string, 
  quantidade: number
): Promise<Reserva> {
  const now = new Date().toISOString();
  let createdRes: Reserva | null = null;

  const product = await getProductById(produtoId);
  if (!product) {
    throw new Error('Produto não encontrado!');
  }

  const totalLeft = product.quantidadeDisponivel - product.quantidadeReservada;
  if (totalLeft < quantidade) {
    throw new Error(`Quantidade indisponível no estoque! (${totalLeft} restantes)`);
  }

  const precoTotal = product.precoPromocional * quantidade;

  try {
    // 1. Transactional check in Firebase if available
    const productRef = doc(db, 'produtos', produtoId);
    const reservationCol = collection(db, 'reservas');

    await runTransaction(db, async (transaction) => {
      const prodSnap = await transaction.get(productRef);
      if (!prodSnap.exists()) throw new Error("Produto não existe.");
      const pData = prodSnap.data() as Produto;
      const currentReserved = pData.quantidadeReservada || 0;
      const avail = pData.quantidadeDisponivel - currentReserved;
      if (avail < quantidade) throw new Error("Estoque insuficiente na transação.");

      // Update reservation totals
      const nextReserved = currentReserved + quantidade;
      const finalStatus = (pData.quantidadeDisponivel - nextReserved <= 0) ? 'esgotado' : 'disponivel';
      
      transaction.update(productRef, {
        quantidadeReservada: nextReserved,
        status: finalStatus
      });

      const resPayload = {
        usuarioId,
        usuarioEmail,
        produtoId,
        nomeProduto: product.nomeProduto,
        nomeLoja: product.nomeLoja,
        quantidade,
        precoTotal,
        status: 'pendente' as const,
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp()
      };

      const newResDocRef = doc(reservationCol);
      transaction.set(newResDocRef, resPayload);
      createdRes = { id: newResDocRef.id, ...resPayload } as Reserva;
    });
  } catch (err) {
    console.warn("Firestore transaction failed, holding in LocalStorage instead:", err);
  }

  // Local Storage safety write
  const localProducts = getLocalProducts();
  const pIndex = localProducts.findIndex(p => p.id === produtoId);
  if (pIndex !== -1) {
    const localP = localProducts[pIndex];
    localP.quantidadeReservada = (localP.quantidadeReservada || 0) + quantidade;
    if (localP.quantidadeDisponivel - localP.quantidadeReservada <= 0) {
      localP.status = 'esgotado';
    }
    localProducts[pIndex] = localP;
    saveLocalProducts(localProducts);
  }

  const localResList = getLocalReservations();
  const resId = createdRes ? (createdRes as any).id : `res_${Date.now()}`;
  const localRes: Reserva = {
    id: resId,
    usuarioId,
    usuarioEmail,
    produtoId,
    nomeProduto: product.nomeProduto,
    nomeLoja: product.nomeLoja,
    quantidade,
    precoTotal,
    status: 'pendente',
    criadoEm: now,
    atualizadoEm: now
  };

  localResList.push(localRes);
  saveLocalReservations(localResList);

  return localRes;
}

// 8. Cancel reservation
export async function cancelReservation(reservaId: string): Promise<void> {
  const now = new Date().toISOString();
  try {
    const resRef = doc(db, 'reservas', reservaId);
    await runTransaction(db, async (transaction) => {
      const resSnap = await transaction.get(resRef);
      if (!resSnap.exists()) throw new Error("Reserva inválida.");
      const reservation = resSnap.data() as Reserva;
      if (reservation.status !== 'pendente') throw new Error("Não é possível cancelar.");

      // Return items to product
      const prodRef = doc(db, 'produtos', reservation.produtoId);
      const prodSnap = await transaction.get(prodRef);
      if (prodSnap.exists()) {
        const pData = prodSnap.data() as Produto;
        const newReserved = Math.max(0, (pData.quantidadeReservada || 0) - reservation.quantidade);
        const finalStatus = (pData.quantidadeDisponivel - newReserved <= 0) ? 'esgotado' : 'disponivel';
        transaction.update(prodRef, {
          quantidadeReservada: newReserved,
          status: finalStatus
        });
      }

      transaction.update(resRef, {
        status: 'cancelado',
        atualizadoEm: serverTimestamp()
      });
    });
  } catch (error) {
    console.warn("Firestore error canceling reservation, using local storage:", error);
  }

  // Local storage logic
  const reservations = getLocalReservations();
  const index = reservations.findIndex(r => r.id === reservaId);
  if (index !== -1) {
    const res = reservations[index];
    if (res.status === 'pendente') {
      res.status = 'cancelado';
      res.atualizadoEm = now;
      reservations[index] = res;
      saveLocalReservations(reservations);

      // Return local product quantity
      const localProducts = getLocalProducts();
      const pIndex = localProducts.findIndex(p => p.id === res.produtoId);
      if (pIndex !== -1) {
        const localP = localProducts[pIndex];
        localP.quantidadeReservada = Math.max(0, (localP.quantidadeReservada || 0) - res.quantidade);
        localP.status = 'disponivel';
        localProducts[pIndex] = localP;
        saveLocalProducts(localProducts);
      }
    }
  }
}

// 9. Confirm reservation retrieved (Admins only)
export async function updateReservationStatus(reservaId: string, status: 'retirado' | 'cancelado'): Promise<void> {
  const now = new Date().toISOString();
  try {
    const resRef = doc(db, 'reservas', reservaId);
    await updateDoc(resRef, {
      status,
      atualizadoEm: serverTimestamp()
    });
  } catch (error) {
    console.warn("Firestore update reservation error, executing locally:", error);
  }

  const reservations = getLocalReservations();
  const index = reservations.findIndex(r => r.id === reservaId);
  if (index !== -1) {
    const res = reservations[index];
    res.status = status;
    res.atualizadoEm = now;
    reservations[index] = res;
    saveLocalReservations(reservations);
  }
}

// 10. Generate mock products
export async function seedDefaultProducts(adminId: string): Promise<number> {
  const mockProductsWithAdmin = INITIAL_PRODUCTS.map(p => {
    const expDate = new Date();
    // Expiration shifts for visual variety
    let offset = 2;
    if (p.id === 'prod_bolo') offset = -1;
    if (p.id === 'prod_pao') offset = 0;
    if (p.id === 'prod_leite') offset = 1;
    expDate.setDate(expDate.getDate() + offset);
    
    return {
      ...p,
      adminId,
      dataValidade: expDate.toISOString().split('T')[0],
      criadoEm: new Date().toISOString()
    } as unknown as Produto;
  });

  saveLocalProducts(mockProductsWithAdmin);
  
  try {
    // Attempt real database seeds
    for (const prod of mockProductsWithAdmin) {
      const { id, ...payload } = prod as any;
      await addDoc(collection(db, 'produtos'), {
        ...payload,
        criadoEm: serverTimestamp()
      });
    }
  } catch (error) {
    console.warn("Firestore seed skip:", error);
  }

  return mockProductsWithAdmin.length;
}
