import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { usePlayersCollection } from "../hooks/useCollection";
import { setUserRole, setUserPlayerId } from "../services/users";
import { ADMIN_EMAIL } from "../constants";
import type { Player, UserProfile, UserRole } from "../types";

export default function Admin() {
  const { isAdmin, loading } = useAuth();

  if (loading) return <p className="text-gray-400">Loading…</p>;
  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-gray-500">
        This page is only available to the site admin.
      </div>
    );
  }

  return <AdminUserList />;
}

function AdminUserList() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: players } = usePlayersCollection<Player>();
  const playerById = new Map(players.map((p) => [p.id, p]));

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("lastSignInAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as UserProfile));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const handleRoleChange = async (uid: string, role: UserRole) => {
    try {
      await setUserRole(uid, role);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handlePlayerChange = async (uid: string, playerId: string) => {
    try {
      await setUserPlayerId(uid, playerId || null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-white">Admin</h1>
        <p className="text-sm text-gray-400">
          Everyone who has ever signed in shows up here. Grant editor access to let someone
          create, edit, or delete data, and link each account to the player profile they
          actually are.
        </p>
      </div>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
      {loading && <p className="text-gray-400">Loading users…</p>}
      {!loading && users.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-gray-500">
          No one has signed in yet.
        </div>
      )}

      {!loading && users.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#181a20] text-left text-xs font-medium text-gray-400">
                <th className="px-4 py-2.5">User</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Last sign-in</th>
                <th className="px-4 py-2.5">Character</th>
                <th className="px-4 py-2.5">Access</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => {
                const isSiteAdmin = u.email === ADMIN_EMAIL;
                const linkedPlayer = u.playerId ? playerById.get(u.playerId) : undefined;
                return (
                  <tr key={u.id} className={idx % 2 === 0 ? "bg-[#181a20]" : "bg-[#15171d]"}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {u.photoURL && (
                          <img
                            src={u.photoURL}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="h-7 w-7 rounded-full"
                          />
                        )}
                        <span className="text-white">{u.displayName ?? "(no name)"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-400">{u.email}</td>
                    <td className="px-4 py-2.5 text-gray-400">
                      {u.lastSignInAt instanceof Timestamp
                        ? u.lastSignInAt.toDate().toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={u.playerId ?? ""}
                        onChange={(e) => void handlePlayerChange(u.id, e.target.value)}
                        className={`rounded-md border border-white/10 bg-[#0f1115] px-2 py-1 text-xs outline-none focus:border-indigo-500 ${
                          linkedPlayer ? "text-white" : "text-gray-500"
                        }`}
                      >
                        <option value="">— Not linked —</option>
                        {players.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      {isSiteAdmin ? (
                        <span className="rounded-md bg-purple-500/15 px-2 py-0.5 text-xs font-semibold text-purple-300">
                          Admin
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => void handleRoleChange(u.id, e.target.value as UserRole)}
                          className={`rounded-md border border-white/10 bg-[#0f1115] px-2 py-1 text-xs outline-none focus:border-indigo-500 ${
                            u.role === "editor" ? "text-emerald-300" : "text-gray-300"
                          }`}
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
