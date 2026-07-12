import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const baseLinks = [
  { to: "/", label: "Parties", end: true },
  { to: "/bosses", label: "Bosses" },
  { to: "/players", label: "Players" },
];

export function Navbar() {
  const { user, loading, isAdmin, signIn, logOut } = useAuth();
  const links = isAdmin ? [...baseLinks, { to: "/admin", label: "Admin", end: true }] : baseLinks;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#12141a]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
            <img src="/favicon.png" alt="" className="h-7 w-7" />
            Boss Planner
          </span>
          <nav className="hidden gap-1 sm:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-500/20 text-indigo-300"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {!loading && user && (
            <div className="flex items-center gap-2">
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt={user.displayName ?? "User"}
                  referrerPolicy="no-referrer"
                  className="h-7 w-7 rounded-full"
                />
              )}
              <span className="hidden text-sm text-gray-300 md:inline">
                {user.displayName}
              </span>
              <button
                onClick={() => void logOut()}
                className="rounded-md px-3 py-1.5 text-sm text-gray-400 hover:bg-white/5 hover:text-white"
              >
                Sign out
              </button>
            </div>
          )}
          {!loading && !user && (
            <button
              onClick={() => void signIn()}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Sign in with Google
            </button>
          )}
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-white/5 px-4 py-1.5 sm:hidden">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ${
                isActive ? "bg-indigo-500/20 text-indigo-300" : "text-gray-400"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
