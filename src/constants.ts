// The only account with full admin rights: user management (grant/revoke edit access,
// link accounts to player profiles). Set per-deployment via VITE_ADMIN_EMAIL — see .env.example.
// Mirrored in firestore.rules — security is enforced there, this is just for UI gating.
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
