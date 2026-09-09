import * as functions from 'firebase-functions/v2/https';
import { beforeUserCreated } from 'firebase-functions/v2/identity';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Blocking Function: Block direct self-registration via client SDK
export const blockSelfSignup = beforeUserCreated((event) => {
  // Direct client SDK signups carry client auth credentials (event.credential) or provider data.
  // Admin SDK (admin.auth().createUser) bypasses blocking functions by default.
  throw new functions.HttpsError('permission-denied', 'Pendaftaran mandiri tidak diizinkan. Hubungi Administrator sekolah untuk membuat akun.');
});

export const createStaffAccount = functions.onCall(async (request) => {

  if (!request.auth || request.auth.token.admin !== true) {
    throw new functions.HttpsError('permission-denied', 'Hanya admin yang boleh membuat akun baru.');
  }

  const { fullname, username, password, role, email } = request.data;

  if (!fullname || !username || !password) {
    throw new functions.HttpsError('invalid-argument', 'Nama, username, dan password wajib diisi.');
  }
  if (password.length < 6) {
    throw new functions.HttpsError('invalid-argument', 'Password minimal 6 karakter.');
  }

  const cleanUsername = username.trim().toLowerCase();
  const authEmail = email && email.includes('@') ? email.trim() : `${cleanUsername}@alhusna.app`;

  const userRecord = await admin.auth().createUser({
    email: authEmail,
    password,
    displayName: fullname,
  });

  await admin.auth().setCustomUserClaims(userRecord.uid, { admin: role === 'admin' });

  await admin.firestore().collection('users').doc(userRecord.uid).set({
    id: userRecord.uid,
    fullname,
    username: cleanUsername,
    role,
    email: authEmail,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: request.auth.uid,
  });

  return { uid: userRecord.uid, email: authEmail };
});

export const resetStaffPassword = functions.onCall(async (request) => {
  if (!request.auth || request.auth.token.admin !== true) {
    throw new functions.HttpsError('permission-denied', 'Hanya admin yang boleh mereset password pengguna lain.');
  }

  const { uid, newPassword } = request.data;
  if (!uid || !newPassword || newPassword.length < 6) {
    throw new functions.HttpsError('invalid-argument', 'UID dan password baru (min. 6 karakter) wajib diisi.');
  }

  await admin.auth().updateUser(uid, { password: newPassword });
  return { success: true };
});

export const deleteStaffAccount = functions.onCall(async (request) => {
  if (!request.auth || request.auth.token.admin !== true) {
    throw new functions.HttpsError('permission-denied', 'Hanya admin yang boleh menghapus akun.');
  }

  const { uid } = request.data;
  if (!uid) {
    throw new functions.HttpsError('invalid-argument', 'UID wajib diisi.');
  }

  try {
    await admin.auth().deleteUser(uid);
  } catch (err) {
    console.warn("User auth record might not exist or already deleted:", err);
  }

  await admin.firestore().collection('users').doc(uid).delete();
  return { success: true };
});
