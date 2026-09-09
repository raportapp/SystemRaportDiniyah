import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { UserAccount } from '../types';

const createStaffAccountFn = httpsCallable<
  { fullname: string; username: string; password?: string; role: string; email?: string },
  { uid: string; email: string }
>(functions, 'createStaffAccount');

const resetStaffPasswordFn = httpsCallable<
  { uid: string; newPassword: string },
  { success: boolean }
>(functions, 'resetStaffPassword');

const deleteStaffAccountFn = httpsCallable<
  { uid: string },
  { success: boolean }
>(functions, 'deleteStaffAccount');

export async function createStaffAccount(
  fullname: string, 
  username: string, 
  role: 'admin' | 'teacher', 
  password?: string, 
  email?: string
): Promise<UserAccount> {
  if (!password || password.length < 6) throw new Error('Password minimal 6 karakter.');
  const cleanUsername = username.trim().toLowerCase();
  const authEmail = email && email.includes('@') ? email.trim() : `${cleanUsername}@alhusna.app`;

  try {
    const res = await createStaffAccountFn({
      fullname,
      username: cleanUsername,
      role,
      password,
      email: authEmail
    });
    
    const uid = res.data.uid;
    return {
      id: uid,
      fullname,
      username: cleanUsername,
      role,
      email: authEmail
    };
  } catch (err: any) {
    console.error("Gagal membuat akun via Cloud Function:", err);
    throw new Error(err.message || 'Gagal membuat akun. Pastikan Cloud Functions sudah di-deploy dan project Firebase aktif.');
  }
}

export async function resetStaffPassword(uid: string, newPassword: string): Promise<void> {
  try {
    await resetStaffPasswordFn({ uid, newPassword });
  } catch (err: any) {
    console.error("Gagal mereset password via Cloud Function:", err);
    throw new Error(err.message || 'Gagal mereset password via Cloud Function.');
  }
}

export async function deleteStaffAccount(uid: string): Promise<void> {
  try {
    await deleteStaffAccountFn({ uid });
  } catch (err: any) {
    console.error("Gagal menghapus akun via Cloud Function:", err);
    throw new Error(err.message || 'Gagal menghapus akun via Cloud Function.');
  }
}

