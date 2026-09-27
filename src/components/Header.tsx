"use client";

import Link from "next/link";

interface HeaderProps {
  searchInput: string;
  setSearchInput: (val: string) => void;
  handleSearchSubmit: (e: React.FormEvent) => void;
  isGlobalBinder: boolean;
  setIsGlobalBinder: (val: boolean) => void;
  onOpenSidebar: () => void;
  onGoToExtensions: () => void;
  onGoToItems: () => void;
  currentView?: "EXTENSIONS" | "CARDS" | "ITEMS"; 
}

export default function Header({
  searchInput,
  setSearchInput,
  handleSearchSubmit,
  isGlobalBinder,
  setIsGlobalBinder,
  onOpenSidebar,
  onGoToExtensions,
  onGoToItems,
  currentView = "EXTENSIONS"
}: HeaderProps) {
  return (
    <header className="w-full max-w-[1260px] mx-auto h-20 md:h-24 bg-[#18181B] rounded-[32px] border border-white/10 flex items-center justify-between px-6 md:px-10 mt-6 shadow-2xl relative z-40 font-['Outfit']">
      
      <nav className="hidden lg:flex items-center gap-10 h-full">
        
        <div className="relative flex flex-col items-center group cursor-pointer h-full justify-center" onClick={() => setIsGlobalBinder(true)}>
          <span className={`text-xl flex items-center gap-1 transition-colors ${isGlobalBinder ? "text-white" : "text-zinc-500 hover:text-white"}`}>
            Ma Collection <span className="text-sm mt-1">⌄</span>
          </span>
          {isGlobalBinder && <div className="absolute bottom-4 w-12 h-1.5 bg-rose-500 rounded-full"></div>}
        </div>

        <div className="relative flex flex-col items-center group cursor-pointer h-full justify-center" onClick={onGoToExtensions}>
          <span className={`text-xl flex items-center gap-1 transition-colors ${!isGlobalBinder && currentView === "EXTENSIONS" ? "text-white" : "text-zinc-500 hover:text-white"}`}>
            Extension <span className="text-sm mt-1">⌄</span>
          </span>
          {!isGlobalBinder && currentView === "EXTENSIONS" && <div className="absolute bottom-4 w-12 h-1.5 bg-rose-500 rounded-full"></div>}
        </div>

        <div className="relative flex flex-col items-center group cursor-pointer h-full justify-center" onClick={onGoToItems}>
          <span className={`text-xl flex items-center gap-1 transition-colors ${currentView === "ITEMS" ? "text-white" : "text-zinc-500 hover:text-white"}`}>
            Items <span className="text-sm mt-1">⌄</span>
          </span>
          {currentView === "ITEMS" && <div className="absolute bottom-4 w-12 h-1.5 bg-rose-500 rounded-full"></div>}
        </div>
        
        <div className="relative flex flex-col items-center group cursor-pointer h-full justify-center">
          <span className="text-xl flex items-center gap-1 text-zinc-500 group-hover:text-white transition-colors">
            Outils <span className="text-sm mt-1">⌄</span>
          </span>
          
          <div className="absolute top-20 left-1/2 -translate-x-1/2 pt-2 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
            <div className="bg-[#09090B] border border-white/10 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
              <Link href="/intercalaires" className="flex items-center gap-4 px-5 py-4 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5 group/link">
                <div className="w-10 h-10 rounded-full bg-[#18181B] border border-white/10 flex items-center justify-center group-hover/link:border-rose-500/30 transition-colors">
                  <span className="text-lg">🗂️</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-[16px]">Générateur</span>
                  <span className="text-xs text-zinc-500">Créer des intercalaires</span>
                </div>
              </Link>
              <Link href="/centrage" className="flex items-center gap-4 px-5 py-4 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors group/link">
                <div className="w-10 h-10 rounded-full bg-[#18181B] border border-white/10 flex items-center justify-center group-hover/link:border-rose-500/30 transition-colors">
                  <span className="text-lg">📏</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-[16px]">Calculateur PCA</span>
                  <span className="text-xs text-zinc-500">Estimer son centrage</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-lg mx-8 hidden md:block">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <button type="submit" className="absolute left-4 text-zinc-500 hover:text-rose-400 text-xl transition-colors">🔍</button>
          <input 
            type="text" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher un(e) pokémon/série/item/...." 
            className="w-full bg-[#09090B] border border-white/10 text-neutral-500 pl-14 pr-6 py-3 rounded-full outline-none focus:border-rose-500/50 transition-colors text-base"
          />
        </form>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={onOpenSidebar} className="lg:hidden w-12 h-12 bg-[#09090B] border border-white/10 rounded-full flex items-center justify-center text-xl hover:text-rose-400 transition-colors">☰</button>
        
        {/* 👈 LE BOUTON EST MAINTENANT UN LIEN VERS /profil */}
        <Link href="/profil" className="w-14 h-14 rounded-full bg-[#09090B] border border-white/10 overflow-hidden flex items-center justify-center cursor-pointer hover:border-rose-500 hover:shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all duration-300">
          <span className="text-2xl">👤</span>
        </Link>
      </div>
    </header>
  );
}