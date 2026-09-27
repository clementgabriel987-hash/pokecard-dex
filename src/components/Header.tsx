"use client";

import Link from "next/link";

interface HeaderProps {
  searchInput: string;
  setSearchInput: (val: string) => void;
  handleSearchSubmit: (e: React.FormEvent) => void;
  isGlobalBinder: boolean;
  setIsGlobalBinder: (val: boolean) => void;
  onOpenSidebar: () => void;
  currentView: "EXTENSIONS" | "CARDS" | "ITEMS";
  onGoToExtensions: () => void;
  onGoToItems: () => void;
  currentTcg: "pokemon" | "yugioh";
  onToggleTcg: (tcg: "pokemon" | "yugioh") => void;
  currentUser: any;
  onLogin: () => void;
  onLogout: () => void;
}

export default function Header({
  searchInput,
  setSearchInput,
  handleSearchSubmit,
  isGlobalBinder,
  setIsGlobalBinder,
  onOpenSidebar,
  currentView,
  onGoToExtensions,
  onGoToItems,
  currentTcg,
  onToggleTcg,
  currentUser,
  onLogin,
  onLogout,
}: HeaderProps) {
  return (
    <header className="w-full bg-[#18181B] border-b border-white/10 sticky top-0 z-40 backdrop-blur-md bg-opacity-90">
      <div className="max-w-[1260px] mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
        
        {/* HAUT A GAUCHE : Selecteur TCG + Menu */}
        <div className="flex items-center gap-3 md:gap-4 shrink-0">
          <button 
            onClick={onOpenSidebar}
            className="bg-[#09090B] border border-white/10 text-white p-2.5 rounded-xl hover:bg-white/5 transition flex items-center justify-center"
            title="Ouvrir le menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          {/* Selecteur TCG */}
          <div className="bg-[#09090B] border border-white/10 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => onToggleTcg("pokemon")}
              className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                currentTcg === "pokemon"
                  ? "bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.4)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Pokemon
            </button>
            <button
              onClick={() => onToggleTcg("yugioh")}
              className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                currentTcg === "yugioh"
                  ? "bg-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Yu-Gi-Oh!
            </button>
          </div>
        </div>

        {/* NAVIGATION CENTRALE */}
        <div className="hidden md:flex items-center gap-2 md:gap-3">
          <button
            onClick={onGoToExtensions}
            className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-medium transition ${
              currentView === "EXTENSIONS" && !isGlobalBinder
                ? "bg-white/10 text-white border border-white/10"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Extensions
          </button>

          {currentTcg === "pokemon" && (
            <button
              onClick={onGoToItems}
              className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-medium transition ${
                currentView === "ITEMS" && !isGlobalBinder
                  ? "bg-white/10 text-white border border-white/10"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Items Scellés
            </button>
          )}

          <button
            onClick={() => setIsGlobalBinder(true)}
            className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-medium transition ${
              isGlobalBinder
                ? "bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Ma Collection
          </button>
        </div>

        {/* HAUT A DROITE : Bouton Connexion / Profil */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400 hidden lg:inline truncate max-w-[150px]">
                {currentUser.email}
              </span>
              <button
                onClick={onLogout}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 px-3 py-1.5 rounded-xl text-xs md:text-sm font-medium transition"
              >
                Deconnexion
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition shadow-[0_0_10px_rgba(244,63,94,0.3)]"
            >
              Connexion
            </button>
          )}
        </div>

      </div>
    </header>
  );
}