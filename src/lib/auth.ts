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
export async function createOrUpdateUserDocument(uid: string, email: string, nome: string, role: UserRole): Promise<Usuario> {
  const userRef = doc(db, 'usuarios', uid);
  const userDoc: Usuario = {
    uid,
    email,
    nome,
    role,
    criadoEm: serverTimestamp()
  };

  try {
    await setDoc(userRef, userDoc);
    return userDoc;
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
