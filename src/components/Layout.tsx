import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { CharacterPromptModal } from "./CharacterPromptModal";
import { useAuth } from "../contexts/AuthContext";
import { usePlayersCollection } from "../hooks/useCollection";
import type { Player } from "../types";

export function Layout() {
  const { user, loading, canEdit, playerId } = useAuth();
  const { data: players } = usePlayersCollection<Player>();
  const [promptDismissed, setPromptDismissed] = useState(false);

  const showCharacterPrompt = !loading && !!user && playerId === null && !promptDismissed;

  return (
    <div className="min-h-screen bg-[#0f1115]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        {!loading && !user && (
          <div className="mb-5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2.5 text-sm text-indigo-200">
            Browsing as a guest — sign in with Google to create, edit, or delete anything.
          </div>
        )}
        {!loading && user && !canEdit && (
          <div className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-200">
            You're signed in with view-only access — ask the admin to grant you editor access to
            create, edit, or delete anything.
          </div>
        )}
        <Outlet />
      </main>

      {showCharacterPrompt && (
        <CharacterPromptModal
          uid={user!.uid}
          players={players}
          onDone={() => setPromptDismissed(true)}
        />
      )}
    </div>
  );
}
