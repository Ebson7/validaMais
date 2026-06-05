/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { Usuario, UserRole } from '../types';

/**
 * Creates/Updates user document in Firestore post-authentication.
 */
export async function createOrUpdateUserDocument(uid: string, email: string, nome: string, role: UserRole, senha?: string): Promise<Usuario> {
  const userRef = doc(db, 'usuarios', uid);
  const userDoc: any = {
    uid,
    email,
    nome,
    role,
    criadoEm: serverTimestamp()
  };

  if (senha) {
    userDoc.senha = senha;
  }

  try {
    await setDoc(userRef, userDoc);
    return { ...userDoc, criadoEm: new Date().toISOString() } as Usuario;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `usuarios/${uid}`);
    throw error;
  }
}

/**
 * Retrieves the user profile document from Firestore.
 */
export async function getUserProfile(uid: string): Promise<Usuario | null> {
  const userRef = doc(db, 'usuarios', uid);
  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data() as Usuario;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `usuarios/${uid}`);
    throw error;
  }
}

/**
 * Verifies simulated credentials saved in Firestore across multiple browsers.
 */
export async function loginSimulatedUser(email: string, pass: string): Promise<Usuario> {
  const emailLower = email.trim().toLowerCase();
  const simulatedUid = 'sim_' + emailLower.replace(/[^a-zA-Z0-9]/g, '_');
  
  const profile = await getUserProfile(simulatedUid);
  if (!profile) {
    throw new Error('Usuário não localizado no banco.');
  }

  const cachedProfile = profile as any;
  if (cachedProfile.senha && cachedProfile.senha !== pass) {
    throw new Error('E-mail ou senha incorretos.');
  }

  return profile;
}

