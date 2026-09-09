import * as functions from 'firebase-functions/v2/https';
import { beforeUserCreated } from 'firebase-functions/v2/identity';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { defineString } from 'firebase-functions/params';

admin.initializeApp();
const databaseId = defineString('FIRESTORE_DATABASE_ID', {
  default: 'ai-studio-remixsistemrapor-f02331d8-d6aa-49d7-98f3-009fa8536148',
});
const staffDatabase = () => getFirestore(admin.app(), databaseId.value());

// Blocking Function: Block direct self-registration via client SDK
export const blockSelfSignup = beforeUserCreated((event) => {
  // Direct client SDK signups carry client auth credentials (event.credential) or provider data.
  // Admin SDK (admin.auth().createUser) bypasses blocking functions by default.
  throw new functions.HttpsError(
    'permission-denied',
    'Pendaftaran mandiri tidak diizinkan. Hubungi Administrator sekolah untuk membuat akun.',
  );
});

export const createStaffAccount = functions.onCall(async (request) => {
  if (!request.auth || request.auth.token.admin !== true) {
    throw new functions.HttpsError(
      'permission-denied',
      'Hanya admin yang boleh membuat akun baru.',
    );
  }

  const { fullname, username, password, role, email } = request.data;

  if (
    typeof fullname !== 'string' ||
    !fullname.trim() ||
    typeof username !== 'string' ||
    !/^[a-zA-Z0-9._-]+$/.test(username) ||
    typeof password !== 'string' ||
    !['admin', 'teacher'].includes(role)
  ) {
    throw new functions.HttpsError(
      'invalid-argument',
      'Nama, username, dan password wajib diisi.',
    );
  }
  if (password.length < 6) {
    throw new functions.HttpsError(
      'invalid-argument',
      'Password minimal 6 karakter.',
    );
  }

  if (
    email !== undefined &&
    (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  )
    throw new functions.HttpsError('invalid-argument', 'Email tidak valid.');
  const cleanUsername = username.trim().toLowerCase();
  const authEmail =
    email && email.includes('@')
      ? email.trim()
      : `${cleanUsername}@alhusna.app`;

  const userRecord = await admin.auth().createUser({
    email: authEmail,
    password,
    displayName: fullname,
  });

  await admin
    .auth()
    .setCustomUserClaims(userRecord.uid, { admin: role === 'admin' });

  await staffDatabase().collection('users').doc(userRecord.uid).set({
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
    throw new functions.HttpsError(
      'permission-denied',
      'Hanya admin yang boleh mereset password pengguna lain.',
    );
  }

  const { uid, newPassword } = request.data;
  if (
    typeof uid !== 'string' ||
    !uid ||
    typeof newPassword !== 'string' ||
    newPassword.length < 6
  ) {
    throw new functions.HttpsError(
      'invalid-argument',
      'UID dan password baru (min. 6 karakter) wajib diisi.',
    );
  }

  await admin.auth().updateUser(uid, { password: newPassword });
  return { success: true };
});

export const deleteStaffAccount = functions.onCall(async (request) => {
  if (!request.auth || request.auth.token.admin !== true) {
    throw new functions.HttpsError(
      'permission-denied',
      'Hanya admin yang boleh menghapus akun.',
    );
  }

  const { uid } = request.data;
  if (typeof uid !== 'string' || !uid) {
    throw new functions.HttpsError('invalid-argument', 'UID wajib diisi.');
  }

  if (uid === request.auth.uid)
    throw new functions.HttpsError(
      'failed-precondition',
      'Akun yang sedang digunakan tidak dapat dihapus.',
    );
  try {
    await admin.auth().deleteUser(uid);
  } catch (err) {
    if ((err as { code?: string }).code !== 'auth/user-not-found') throw err;
  }

  await staffDatabase().collection('users').doc(uid).delete();
  return { success: true };
});
