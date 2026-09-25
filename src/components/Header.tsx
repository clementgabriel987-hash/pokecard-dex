"use client";

interface HeaderProps {
  searchInput: string;
  setSearchInput: (val: string) => void;
  handleSearchSubmit: (e: React.FormEvent) => void;
  isGlobalBinder: boolean;
  setIsGlobalBinder: (val: boolean) => void;
  onOpenSidebar: () => void;
  // Nouvelle fonction pour ouvrir le menu des extensions
  onGoToExtensions: () => void; 
}

export default function Header({
  searchInput,
  setSearchInput,
  handleSearchSubmit,
  isGlobalBinder,
  setIsGlobalBinder,
  onOpenSidebar,
  onGoToExtensions,
}: HeaderProps) {
  return (
    <header className="w-full max-w-[1260px] mx-auto h-20 md:h-24 bg-[#18181B] rounded-[32px] border border-white/10 flex items-center justify-between px-6 md:px-10 mt-6 shadow-2xl relative z-40 font-['Outfit']">
      
      <nav className="hidden lg:flex items-center gap-10">
        <div className="relative flex flex-col items-center group cursor-pointer" onClick={() => setIsGlobalBinder(true)}>
          <span className={`text-xl flex items-center gap-1 transition-colors ${isGlobalBinder ? "text-white" : "text-zinc-500 hover:text-white"}`}>
            Ma Collection <span className="text-sm mt-1">⌄</span>
          </span>
          {isGlobalBinder && <div className="absolute -bottom-3 w-12 h-1.5 bg-rose-500 rounded-full"></div>}
        </div>

        {/* Le bouton Extension appelle maintenant onGoToExtensions */}
        <div className="relative flex flex-col items-center group cursor-pointer" onClick={onGoToExtensions}>
          <span className={`text-xl flex items-center gap-1 transition-colors ${!isGlobalBinder ? "text-white" : "text-zinc-500 hover:text-white"}`}>
            Extension <span className="text-sm mt-1">⌄</span>
          </span>
          {!isGlobalBinder && <div className="absolute -bottom-3 w-12 h-1.5 bg-rose-500 rounded-full"></div>}
        </div>

        <div className="relative flex flex-col items-center group cursor-pointer">
          <span className="text-xl flex items-center gap-1 text-zinc-500 hover:text-white transition-colors">
            Items <span className="text-sm mt-1">⌄</span>
          </span>
        </div>
        
        <div className="relative flex flex-col items-center group cursor-pointer">
          <span className="text-xl flex items-center gap-1 text-zinc-500 hover:text-white transition-colors">
            Calculateur Centrage <span className="text-sm mt-1">⌄</span>
          </span>
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
        <div className="w-14 h-14 rounded-full bg-[#09090B] border border-white/10 overflow-hidden flex items-center justify-center cursor-pointer hover:border-rose-500/50 transition-colors">
          <span className="text-2xl">👤</span>
        </div>
      </div>
    </header>
  );
}