"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

interface MiniTinItem {
  id: string;
  order: number;
  name: string;
  pokemon: string;
  image: string;
  accentColor: string;
}

interface MiniTinSet {
  id: string;
  name: string;
  series: string;
  count: number;
  tins: MiniTinItem[];
}

// Les séries de Mini Tins avec leurs illustrations Pokémon HD officielles
const MINI_TIN_SETS: MiniTinSet[] = [
  {
    id: "sv03.5-tins",
    name: "Écarlate & Violet 151 (Frise 10 Boîtes)",
    series: "151",
    count: 10,
    tins: [
      { id: "151-1", order: 1, name: "Boîte 1", pokemon: "Grodoudou & Arbok", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/40.png", accentColor: "from-pink-950/40 to-slate-900" },
      { id: "151-2", order: 2, name: "Boîte 2", pokemon: "Ectoplasma & Magnéti", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png", accentColor: "from-purple-950/40 to-slate-900" },
      { id: "151-3", order: 3, name: "Boîte 3", pokemon: "Dracaufeu & Insécateur", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png", accentColor: "from-orange-950/40 to-slate-900" },
      { id: "151-4", order: 4, name: "Boîte 4", pokemon: "Électhor & Joliflor", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/145.png", accentColor: "from-yellow-950/40 to-slate-900" },
      { id: "151-5", order: 5, name: "Boîte 5", pokemon: "Ronflex & Salamèche", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png", accentColor: "from-blue-950/40 to-slate-900" },
      { id: "151-6", order: 6, name: "Boîte 6", pokemon: "Tortank & Carapuce", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png", accentColor: "from-cyan-950/40 to-slate-900" },
      { id: "151-7", order: 7, name: "Boîte 7", pokemon: "Florizarre & Bulbizarre", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png", accentColor: "from-emerald-950/40 to-slate-900" },
      { id: "151-8", order: 8, name: "Boîte 8", pokemon: "Mewtwo & Osselait", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png", accentColor: "from-purple-950/40 to-slate-900" },
      { id: "151-9", order: 9, name: "Boîte 9", pokemon: "Dracolosse & Minidraco", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png", accentColor: "from-amber-950/40 to-slate-900" },
      { id: "151-10", order: 10, name: "Boîte 10", pokemon: "Alakazam & Fantominus", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/65.png", accentColor: "from-indigo-950/40 to-slate-900" }
    ]
  },
  {
    id: "sv08.5-tins",
    name: "Évolutions Prismatiques (Frise 8 Évolitions)",
    series: "Évolutions Prismatiques",
    count: 8,
    tins: [
      { id: "pre-1", order: 1, name: "Tin Évoli", pokemon: "Évoli", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png", accentColor: "from-amber-950/40 to-slate-900" },
      { id: "pre-2", order: 2, name: "Tin Aquali", pokemon: "Aquali", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/134.png", accentColor: "from-blue-950/40 to-slate-900" },
      { id: "pre-3", order: 3, name: "Tin Voltali", pokemon: "Voltali", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/135.png", accentColor: "from-yellow-950/40 to-slate-900" },
      { id: "pre-4", order: 4, name: "Tin Pyroli", pokemon: "Pyroli", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/136.png", accentColor: "from-red-950/40 to-slate-900" },
      { id: "pre-5", order: 5, name: "Tin Mentali", pokemon: "Mentali", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/196.png", accentColor: "from-purple-950/40 to-slate-900" },
      { id: "pre-6", order: 6, name: "Tin Noctali", pokemon: "Noctali", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/197.png", accentColor: "from-slate-900 to-black" },
      { id: "pre-7", order: 7, name: "Tin Givrali", pokemon: "Givrali", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/471.png", accentColor: "from-cyan-950/40 to-slate-900" },
      { id: "pre-8", order: 8, name: "Tin Nymphali", pokemon: "Nymphali", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/700.png", accentColor: "from-pink-950/40 to-slate-900" }
    ]
  },
  {
    id: "swsh12.5-tins",
    name: "Zénith Suprême (Frise 5 Boîtes Galar)",
    series: "Zénith Suprême",
    count: 5,
    tins: [
      { id: "crz-1", order: 1, name: "Tin 1", pokemon: "Gorythmic", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/812.png", accentColor: "from-emerald-950/40 to-slate-900" },
      { id: "crz-2", order: 2, name: "Tin 2", pokemon: "Lézargus", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/818.png", accentColor: "from-cyan-950/40 to-slate-900" },
      { id: "crz-3", order: 3, name: "Tin 3", pokemon: "Pyrobut", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/815.png", accentColor: "from-red-950/40 to-slate-900" },
      { id: "crz-4", order: 4, name: "Tin 4", pokemon: "Polthégeist", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/855.png", accentColor: "from-purple-950/40 to-slate-900" },
      { id: "crz-5", order: 5, name: "Tin 5", pokemon: "Lucario", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png", accentColor: "from-blue-950/40 to-slate-900" }
    ]
  },
  {
    id: "pgo-tins",
    name: "Pokémon GO (Frise 5 Boîtes)",
    series: "Pokémon GO",
    count: 5,
    tins: [
      { id: "pgo-1", order: 1, name: "Tin Magicarpe", pokemon: "Magicarpe", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/129.png", accentColor: "from-red-950/40 to-slate-900" },
      { id: "pgo-2", order: 2, name: "Tin Évoli", pokemon: "Évoli", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png", accentColor: "from-amber-950/40 to-slate-900" },
      { id: "pgo-3", order: 3, name: "Tin Leuphorie", pokemon: "Leuphorie", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/242.png", accentColor: "from-pink-950/40 to-slate-900" },
      { id: "pgo-4", order: 4, name: "Tin Ronflex", pokemon: "Ronflex", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png", accentColor: "from-blue-950/40 to-slate-900" },
      { id: "pgo-5", order: 5, name: "Tin Pikachu", pokemon: "Pikachu", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png", accentColor: "from-yellow-950/40 to-slate-900" }
    ]
  }
];

export default function MiniTinsPage() {
  const [selectedSetId, setSelectedSetId] = useState<string>(MINI_TIN_SETS[0].id);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [ownedTins, setOwnedTins] = useState<Record<string, boolean>>({});

  const currentSet = MINI_TIN_SETS.find((s) => s.id === selectedSetId) || MINI_TIN_SETS[0];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // Chargement des mini tins possédées
  useEffect(() => {
    async function loadTins() {
      if (!currentUser) {
        const local = localStorage.getItem("pokemon_owned_minitins");
        if (local) setOwnedTins(JSON.parse(local));
        return;
      }
      const { data } = await supabase.from("user_data").select("mini_tins").eq("id", currentUser.id).maybeSingle();
      if (data && data.mini_tins) {
        setOwnedTins(data.mini_tins);
      }
    }
    loadTins();
  }, [currentUser]);

  // Bascule de possession au clic
  const toggleTin = async (tinId: string) => {
    const updated = { ...ownedTins, [tinId]: !ownedTins[tinId] };
    if (!updated[tinId]) delete updated[tinId];

    setOwnedTins(updated);

    if (currentUser) {
      await supabase.from("user_data").upsert({ id: currentUser.id, mini_tins: updated });
    } else {
      localStorage.setItem("pokemon_owned_minitins", JSON.stringify(updated));
    }
  };

  const ownedCount = currentSet.tins.filter((t) => ownedTins[t.id]).length;
  const isCompleted = ownedCount === currentSet.count && currentSet.count > 0;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Navigation retour */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="bg-slate-900 border border-slate-700 hover:bg-slate-800 text-yellow-400 px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer shadow-md">
            <span>⬅️</span> Retour au Classeur
          </Link>
          <div className="text-xs text-slate-400">
            {currentUser ? `Connecté : ${currentUser.email}` : "Mode hors-ligne (sauvegarde locale)"}
          </div>
        </div>

        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-3 bg-gradient-to-r from-amber-400 via-yellow-300 to-red-500 bg-clip-text text-transparent">
            🥫 FRISES DE MINI TINS
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Clique sur une boîte pour la débloquer et reconstituer la fresque métallique complète.
          </p>
        </div>

        {/* Sélecteur de série */}
        <div className="flex justify-center gap-2 flex-wrap mb-8">
          {MINI_TIN_SETS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSetId(s.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedSetId === s.id
                  ? "bg-yellow-500 text-slate-950 shadow-lg scale-105"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {s.series} ({s.count} boîtes)
            </button>
          ))}
        </div>

        {/* Progression */}
        <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl mb-8 shadow-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-slate-300">{currentSet.name}</span>
            <span className="text-sm font-extrabold text-yellow-400">
              {ownedCount} / {currentSet.count} ({Math.round((ownedCount / currentSet.count) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isCompleted ? "bg-gradient-to-r from-yellow-400 to-amber-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]" : "bg-yellow-500"
              }`}
              style={{ width: `${(ownedCount / currentSet.count) * 100}%` }}
            ></div>
          </div>
          {isCompleted && (
            <div className="mt-3 text-center text-xs font-bold text-yellow-400 animate-pulse">
              🎉 Frise complète ! Toutes les boîtes de cette fresque sont réunies.
            </div>
          )}
        </div>

        {/* FRISE CONTINUE : Les boîtes côte à côte façon puzzle */}
        <div className="bg-slate-900/40 border-2 border-slate-800 rounded-3xl p-4 md:p-8 shadow-2xl overflow-x-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 px-1 flex items-center justify-between">
            <span>Aperçu panoramique continu</span>
            <span className="text-slate-400">💡 Clique pour basculer possédé / manquant</span>
          </div>

          <div className="flex gap-2 min-w-max pb-4 justify-start lg:justify-center">
            {currentSet.tins.map((tin) => {
              const isOwned = Boolean(ownedTins[tin.id]);
              return (
                <div
                  key={tin.id}
                  onClick={() => toggleTin(tin.id)}
                  className={`relative flex flex-col items-center justify-between p-3 rounded-2xl border-2 cursor-pointer transition-all duration-300 w-40 md:w-48 select-none ${
                    isOwned
                      ? `bg-gradient-to-b ${tin.accentColor} border-yellow-500/80 shadow-[0_0_20px_rgba(234,179,8,0.25)] scale-100 opacity-100`
                      : "bg-slate-950/80 border-dashed border-slate-800 opacity-35 hover:opacity-65 hover:border-slate-600 scale-95"
                  }`}
                >
                  {/* Badge de position dans la frise */}
                  <div className="w-full flex justify-between items-center mb-1">
                    <span className="bg-slate-950/80 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-300">
                      N° {tin.order} / {currentSet.count}
                    </span>
                    <span className="text-sm">{isOwned ? "✅" : "➕"}</span>
                  </div>

                  {/* Silhouette ou Artwork HD */}
                  <div className="h-44 md:h-52 w-full flex items-center justify-center my-2 relative overflow-hidden rounded-xl bg-slate-950/50 border border-slate-800/40">
                    <img
                      src={tin.image}
                      alt={tin.pokemon}
                      className={`h-36 md:h-44 object-contain transition-all duration-300 drop-shadow-xl ${
                        isOwned ? "filter-none scale-105" : "brightness-0 opacity-20 scale-90"
                      }`}
                      loading="lazy"
                    />

                    {!isOwned && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl opacity-60">❓</span>
                        <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Manquante</span>
                      </div>
                    )}
                  </div>

                  {/* Nom du Pokémon / Boîte */}
                  <div className="text-center w-full pt-2 border-t border-slate-800/80">
                    <p className={`text-xs font-extrabold truncate ${isOwned ? "text-yellow-400" : "text-slate-500"}`}>
                      {tin.pokemon}
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {isOwned ? "Boîte acquise" : "À trouver"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}