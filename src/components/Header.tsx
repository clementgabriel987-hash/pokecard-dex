"use client";

import { useState, useRef, useEffect } from "react";
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
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isCatalogueOpen, setIsCatalogueOpen] = useState(false);
  
  const toolsRef = useRef<HTMLDivElement>(null);
  const catalogueRef = useRef<HTMLDivElement>(null);

  // Fermer les menus quand on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
      if (catalogueRef.current && !catalogueRef.current.contains(event.target as Node)) {
        setIsCatalogueOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="w-full bg-[#18181B] border-b border-white/10 sticky top-0 z-40 backdrop-blur-md bg-opacity-90">
      <div className="max-w-[1260px] mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
        
        {/* HAUT A GAUCHE : Bouton Menu classique */}
        <div className="flex items-center shrink-0">
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
        </div>

        {/* NAVIGATION CENTRALE */}
        <div className="flex flex-wrap md:flex-nowrap items-center gap-1.5 md:gap-3">
          
          {/* MENU DÉROULANT CATALOGUE (Extensions + Items) */}
          <div className="relative" ref={catalogueRef}>
            <button
              onClick={() => setIsCatalogueOpen(!isCatalogueOpen)}
              className={`px-3 py-2 rounded-xl text-xs md:text-sm font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                (!isGlobalBinder && (currentView === "EXTENSIONS" || currentView === "ITEMS")) || isCatalogueOpen
                  ? "bg-white/10 text-white border border-white/10"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Catalogue
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className={`transition-transform duration-200 ${isCatalogueOpen ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {isCatalogueOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-[#18181B] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                <button 
                  onClick={() => {
                    onGoToExtensions();
                    setIsCatalogueOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition border-b border-white/5"
                >
                  Extensions
                </button>
                
                {currentTcg === "pokemon" && (
                  <button 
                    onClick={() => {
                      onGoToItems();
                      setIsCatalogueOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition"
                  >
                    Items Scelles
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => setIsGlobalBinder(true)}
            className={`px-3 py-2 rounded-xl text-xs md:text-sm font-medium transition whitespace-nowrap ${
              isGlobalBinder
                ? "bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Ma Collection
          </button>

          {/* MENU DÉROULANT OUTILS */}
          <div className="relative" ref={toolsRef}>
            <button
              onClick={() => setIsToolsOpen(!isToolsOpen)}
              className={`px-3 py-2 rounded-xl text-xs md:text-sm font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                isToolsOpen
                  ? "bg-white/10 text-white border border-white/10"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Outils
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className={`transition-transform duration-200 ${isToolsOpen ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {isToolsOpen && (
              <div className="absolute top-full left-0 md:left-1/2 md:-translate-x-1/2 mt-2 w-56 bg-[#18181B] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                <Link 
                  href="/intercalaires"
                  onClick={() => setIsToolsOpen(false)}
                  className="block px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition border-b border-white/5 last:border-0"
                >
                  Generateur d'intercalaires
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* HAUT A DROITE : Toggle TCG discret + Connexion */}
        <div className="flex items-center gap-3 shrink-0">
          
          <div className="flex bg-[#09090B] border border-white/10 p-0.5 rounded-lg items-center">
            <button 
              onClick={() => onToggleTcg("pokemon")} 
              className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wider transition ${currentTcg === "pokemon" ? "bg-rose-500 text-white" : "text-zinc-600 hover:text-zinc-300"}`}
            >
              PKMN
            </button>
            <button 
              onClick={() => onToggleTcg("yugioh")} 
              className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wider transition ${currentTcg === "yugioh" ? "bg-amber-500 text-white" : "text-zinc-600 hover:text-zinc-300"}`}
            >
              YGO
            </button>
          </div>

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
              className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-medium transition shadow-[0_0_10px_rgba(244,63,94,0.3)]"
            >
              Connexion
            </button>
          )}
        </div>

      </div>
    </header>
  );
}