"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

interface MiniTinItem {
  id: string;
  order: number; // Position de 1 à 5 (ou 1 à 10) dans la frise
  name: string;
  pokemon: string;
  image: string;
}

interface MiniTinSet {
  id: string;
  name: string;
  series: string;
  count: number;
  tins: MiniTinItem[];
}

// Données des séries de Mini Tins emblématiques avec ordre de la frise
const MINI_TIN_SETS: MiniTinSet[] = [
  {
    id: "sv03.5-tins",
    name: "Écarlate & Violet 151 (Frise 10 Boîtes)",
    series: "151",
    count: 10,
    tins: [
      { id: "151-1", order: 1, name: "Mini Tin 1", pokemon: "Grodoudou & Arbok", image: "https://images.pokemontcg.io/sv3pt5/logo.png" },
      { id: "151-2", order: 2, name: "Mini Tin 2", pokemon: "Ectoplasma & Magnéti", image: "https://images.pokemontcg.io/sv3pt5/logo.png" },
      { id: "151-3", order: 3, name: "Mini Tin 3", pokemon: "Dracaufeu & Insécateur", image: "https://images.pokemontcg.io/sv3pt5/logo.png" },
      { id: "151-4", order: 4, name: "Mini Tin 4", pokemon: "Électhor & Joliflor", image: "https://images.pokemontcg.io/sv3pt5/logo.png" },
      { id: "151-5", order: 5, name: "Mini Tin 5", pokemon: "Ronflex & Salamèche", image: "https://images.pokemontcg.io/sv3pt5/logo.png" },
      { id: "151-6", order: 6, name: "Mini Tin 6", pokemon: "Tortank & Carapuce", image: "https://images.pokemontcg.io/sv3pt5/logo.png" },
      { id: "151-7", order: 7, name: "Mini Tin 7", pokemon: "Florizarre & Bulbizarre", image: "https://images.pokemontcg.io/sv3pt5/logo.png" },
      { id: "151-8", order: 8, name: "Mini Tin 8", pokemon: "Mewtwo & Osselait", image: "https://images.pokemontcg.io/sv3pt5/logo.png" },
      { id: "151-9", order: 9, name: "Mini Tin 9", pokemon: "Dracolosse & Minidraco", image: "https://images.pokemontcg.io/sv3pt5/logo.png" },
      { id: "151-10", order: 10, name: "Mini Tin 10", pokemon: "Alakazam & Fantominus", image: "https://images.pokemontcg.io/sv3pt5/logo.png" }
    ]
  },
  {
    id: "swsh12.5-tins",
    name: "Zénith Suprême (Frise 5 Boîtes)",
    series: "Zénith Suprême",
    count: 5,
    tins: [
      { id: "crz-1", order: 1, name: "Mini Tin 1", pokemon: "Gorythmic", image: "https://images.pokemontcg.io/swsh12pt5/logo.png" },
      { id: "crz-2", order: 2, name: "Mini Tin 2", pokemon: "Lézargus", image: "https://images.pokemontcg.io/swsh12pt5/logo.png" },
      { id: "crz-3", order: 3, name: "Mini Tin 3", pokemon: "Pyrobut", image: "https://images.pokemontcg.io/swsh12pt5/logo.png" },
      { id: "crz-4", order: 4, name: "Mini Tin 4", pokemon: "Polthégeist", image: "https://images.pokemontcg.io/swsh12pt5/logo.png" },
      { id: "crz-5", order: 5, name: "Mini Tin 5", pokemon: "Zarbi & Lucario", image: "https://images.pokemontcg.io/swsh12pt5/logo.png" }
    ]
  },
  {
    id: "sv08.5-tins",
    name: "Évolutions Prismatiques (Frise Évolitions)",
    series: "Évolutions Prismatiques",
    count: 8,
    tins: [
      { id: "pre-1", order: 1, name: "Mini Tin Évoli", pokemon: "Évoli", image: "https://images.tcgdex.net/fr/sv/sv08.5/logo.png" },
      { id: "pre-2", order: 2, name: "Mini Tin Aquali", pokemon: "Aquali", image: "https://images.tcgdex.net/fr/sv/sv08.5/logo.png" },
      { id: "pre-3", order: 3, name: "Mini Tin Voltali", pokemon: "Voltali", image: "https://images.tcgdex.net/fr/sv/sv08.5/logo.png" },
      { id: "pre-4", order: 4, name: "Mini Tin Pyroli", pokemon: "Pyroli", image: "https://images.tcgdex.net/fr/sv/sv08.5/logo.png" },
      { id: "pre-5", order: 5, name: "Mini Tin Mentali", pokemon: "Mentali", image: "https://images.tcgdex.net/fr/sv/sv08.5/logo.png" },
      { id: "pre-6", order: 6, name: "Mini Tin Noctali", pokemon: "Noctali", image: "https://images.tcgdex.net/fr/sv/sv08.5/logo.png" },
      { id: "pre-7", order: 7, name: "Mini Tin Givrali", pokemon: "Givrali", image: "https://images.tcgdex.net/fr/sv/sv08.5/logo.png" },
      { id: "pre-8", order: 8, name: "Mini Tin Nymphali", pokemon: "Nymphali", image: "https://images.tcgdex.net/fr/sv/sv08.5/logo.png" }
    ]
  },
  {
    id: "pgo-tins",
    name: "Pokémon GO (Frise 5 Boîtes)",
    series: "Pokémon GO",
    count: 5,
    tins: [
      { id: "pgo-1", order: 1, name: "Mini Tin 1", pokemon: "Magicarpe", image: "https://images.pokemontcg.io/pgo/logo.png" },
      { id: "pgo-2", order: 2, name: "Mini Tin 2", pokemon: "Évoli", image: "https://images.pokemontcg.io/pgo/logo.png" },
      { id: "pgo-3", order: 3, name: "Mini Tin 3", pokemon: "Leuphorie & Leveinard", image: "https://images.pokemontcg.io/pgo/logo.png" },
      { id: "pgo-4", order: 4, name: "Mini Tin 4", pokemon: "Ronflex", image: "https://images.pokemontcg.io/pgo/logo.png" },
      { id: "pgo-5", order: 5, name: "Mini Tin 5", pokemon: "Pikachu", image: "https://images.pokemontcg.io/pgo/logo.png" }
    ]
  }
];

export default function MiniTinsPage() {
  const [selectedSetId, setSelectedSetId] = useState<string>(MINI_TIN_SETS[0].id);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [ownedTins, setOwnedTins] = useState<Record<string, boolean>>({});

  const currentSet = MINI_TIN_SETS.find(s => s.id === selectedSetId) || MINI_TIN_SETS[0];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // Chargement des mini tins possédées depuis Supabase
  useEffect(() => {
    async function loadTins() {
      if (!currentUser) {
        // Fallback localstorage si déconnecté
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

  // Bascule de possession d'une boîte au clic
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

  const ownedCount = currentSet.tins.filter(t => ownedTins[t.id]).length;
  const isCompleted = ownedCount === currentSet.count && currentSet.count > 0;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Navigation retour */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="bg-slate-900 border border-slate-700 hover:bg-slate-800 text-yellow-400 px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2">
            <span>⬅️</span> Retour au Classeur
          </Link>
          <div className="text-xs text-slate-400">
            {currentUser ? `Connecté : ${currentUser.email}` : "Mode hors-ligne (sauvegarde locale)"}
          </div>
        </div>

        {/* Titre & Description */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-3 bg-gradient-to-r from-amber-400 via-yellow-300 to-red-500 bg-clip-text text-transparent">
            🎨 LES FRISES DE MINI TINS
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Clique sur une boîte pour la débloquer et reconstituer l&apos;illustration complète pièce par pièce.
          </p>
        </div>

        {/* Sélecteur de série de Mini Tins */}
        <div className="flex justify-center gap-2 flex-wrap mb-8">
          {MINI_TIN_SETS.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedSetId(s.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedSetId === s.id
                  ? "bg-yellow-500 text-slate-950 shadow-lg scale-105"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {s.series} ({s.count} boîtes)
            </button>
          ))}
        </div>

        {/* Barre de progression de la frise */}
        <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl mb-8 shadow-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-slate-300">{currentSet.name}</span>
            <span className="text-sm font-extrabold text-yellow-400">
              {ownedCount} / {currentSet.count} ({Math.round((ownedCount / currentSet.count) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isCompleted ? "bg-gradient-to-r from-yellow-400 to-amber-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]" : "bg-yellow-500"
              }`}
              style={{ width: `${(ownedCount / currentSet.count) * 100}%` }}
            ></div>
          </div>
          {isCompleted && (
            <div className="mt-3 text-center text-xs font-bold text-yellow-400 animate-pulse">
              🎉 Frise panoramique complète ! Le dessin est entièrement réuni.
            </div>
          )}
        </div>

        {/* LE PUZZLE : Frise côte à côte */}
        <div className="bg-slate-900/40 border-2 border-slate-800 rounded-3xl p-4 md:p-8 shadow-2xl overflow-x-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 px-1 flex items-center justify-between">
            <span>Aperçu de la frise continue</span>
            <span className="text-slate-400">💡 Clique sur une boîte pour l&apos;ajouter</span>
          </div>

          {/* Grille collée façon puzzle / frise continue */}
          <div className="flex gap-2 min-w-max pb-4">
            {currentSet.tins.map((tin) => {
              const isOwned = Boolean(ownedTins[tin.id]);
              return (
                <div
                  key={tin.id}
                  onClick={() => toggleTin(tin.id)}
                  className={`relative flex flex-col items-center justify-between p-3 rounded-2xl border-2 cursor-pointer transition-all duration-300 w-36 md:w-44 select-none ${
                    isOwned
                      ? "bg-slate-900 border-yellow-500/80 shadow-[0_0_20px_rgba(234,179,8,0.2)] scale-100 opacity-100"
                      : "bg-slate-950/70 border-dashed border-slate-800 opacity-40 hover:opacity-75 hover:border-slate-600 scale-95"
                  }`}
                >
                  {/* Badge numéro d'ordre dans la frise */}
                  <div className="absolute top-2 left-2 z-10 bg-slate-950/80 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-300">
                    Partie {tin.order} / {currentSet.count}
                  </div>

                  {/* Cœur / Statut */}
                  <div className="absolute top-2 right-2 z-10 text-xs">
                    {isOwned ? "✅" : "➕"}
                  </div>

                  {/* Visuel de la boîte (silhouette si non possédée) */}
                  <div className="h-44 md:h-52 w-full flex items-center justify-center my-2 overflow-hidden relative rounded-xl">
                    {isOwned ? (
                      <div className="flex flex-col items-center text-center">
                        <span className="text-5xl md:text-6xl mb-2 drop-shadow-md">📦</span>
                        <span className="text-xs font-extrabold text-yellow-400">{tin.pokemon}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-600">
                        <span className="text-4xl md:text-5xl grayscale opacity-30 mb-2">❓</span>
                        <span className="text-[11px] font-semibold text-slate-500">Pièce manquante</span>
                        <span className="text-[9px] text-slate-600">{tin.pokemon}</span>
                      </div>
                    )}
                  </div>

                  {/* Nom en bas */}
                  <div className="text-center w-full pt-2 border-t border-slate-800">
                    <p className={`text-xs font-bold truncate ${isOwned ? "text-white" : "text-slate-500"}`}>
                      {tin.pokemon}
                    </p>
                    <span className="text-[10px] text-slate-500 block">
                      {isOwned ? "Dans la collection" : "À trouver"}
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