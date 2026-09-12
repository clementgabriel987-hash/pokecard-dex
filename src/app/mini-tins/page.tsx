"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

interface MiniTinItem {
  id: string;
  order: number;
  pokemon: string;
  image: string;
  metalColor: string;
}

interface MiniTinSet {
  id: string;
  name: string;
  series: string;
  count: number;
  tins: MiniTinItem[];
}

const MINI_TIN_SETS: MiniTinSet[] = [
  {
    id: "sv03.5-tins",
    name: "Écarlate & Violet 151 (Frise 10 Boîtes)",
    series: "151",
    count: 10,
    tins: [
      { id: "151-1", order: 1, pokemon: "Arcanin & Salamèche", image: "https://tcgplayer-cdn.tcgplayer.com/product/511529_200w.jpg", metalColor: "from-amber-900/50 to-slate-900" },
      { id: "151-2", order: 2, pokemon: "Ectoplasma & Ptitard", image: "https://tcgplayer-cdn.tcgplayer.com/product/511530_200w.jpg", metalColor: "from-purple-950/50 to-slate-900" },
      { id: "151-3", order: 3, pokemon: "Dracolosse & Carapuce", image: "https://tcgplayer-cdn.tcgplayer.com/product/511531_200w.jpg", metalColor: "from-orange-950/50 to-slate-900" },
      { id: "151-4", order: 4, pokemon: "Élektek & Magnéti", image: "https://tcgplayer-cdn.tcgplayer.com/product/511532_200w.jpg", metalColor: "from-yellow-950/50 to-slate-900" },
      { id: "151-5", order: 5, pokemon: "Insécateur & Smogogo", image: "https://tcgplayer-cdn.tcgplayer.com/product/511533_200w.jpg", metalColor: "from-emerald-950/50 to-slate-900" },
      { id: "151-6", order: 6, pokemon: "Kadabra & Kicklee", image: "https://tcgplayer-cdn.tcgplayer.com/product/511534_200w.jpg", metalColor: "from-amber-950/50 to-slate-900" },
      { id: "151-7", order: 7, pokemon: "Mackogneur & Osselait", image: "https://tcgplayer-cdn.tcgplayer.com/product/511535_200w.jpg", metalColor: "from-slate-800 to-slate-900" },
      { id: "151-8", order: 8, pokemon: "Magnéton & Abo", image: "https://tcgplayer-cdn.tcgplayer.com/product/511536_200w.jpg", metalColor: "from-cyan-950/50 to-slate-900" },
      { id: "151-9", order: 9, pokemon: "Miaouss & Tygnon", image: "https://tcgplayer-cdn.tcgplayer.com/product/511537_200w.jpg", metalColor: "from-yellow-900/50 to-slate-900" },
      { id: "151-10", order: 10, pokemon: "Ramoloss & Sabelette", image: "https://tcgplayer-cdn.tcgplayer.com/product/511538_200w.jpg", metalColor: "from-pink-950/50 to-slate-900" }
    ]
  },
  {
    id: "swsh12.5-tins",
    name: "Zénith Suprême (Frise 5 Boîtes Galar)",
    series: "Zénith Suprême",
    count: 5,
    tins: [
      { id: "crz-1", order: 1, pokemon: "Gorythmic", image: "https://tcgplayer-cdn.tcgplayer.com/product/477067_200w.jpg", metalColor: "from-emerald-950/50 to-slate-900" },
      { id: "crz-2", order: 2, pokemon: "Lézargus", image: "https://tcgplayer-cdn.tcgplayer.com/product/477068_200w.jpg", metalColor: "from-cyan-950/50 to-slate-900" },
      { id: "crz-3", order: 3, pokemon: "Pyrobut", image: "https://tcgplayer-cdn.tcgplayer.com/product/477069_200w.jpg", metalColor: "from-red-950/50 to-slate-900" },
      { id: "crz-4", order: 4, pokemon: "Polthégeist", image: "https://tcgplayer-cdn.tcgplayer.com/product/477070_200w.jpg", metalColor: "from-purple-950/50 to-slate-900" },
      { id: "crz-5", order: 5, pokemon: "Lucario", image: "https://tcgplayer-cdn.tcgplayer.com/product/477071_200w.jpg", metalColor: "from-blue-950/50 to-slate-900" }
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
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="bg-slate-900 border border-slate-700 hover:bg-slate-800 text-yellow-400 px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer shadow-md">
            <span>⬅️</span> Retour au Classeur
          </Link>
          <div className="text-xs text-slate-400">
            {currentUser ? `Connecté : ${currentUser.email}` : "Mode hors-ligne (sauvegarde locale)"}
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-3 bg-gradient-to-r from-amber-400 via-yellow-300 to-red-500 bg-clip-text text-transparent">
            🥫 FRISES DE MINI TINS
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Clique sur chaque boîte métallique pour l&apos;allumer et révéler la fresque complète.
          </p>
        </div>

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
              🎉 Frise panoramique complète ! Toutes les boîtes sont réunies.
            </div>
          )}
        </div>

        {/* FRISE CONTINUE */}
        <div className="bg-slate-900/40 border-2 border-slate-800 rounded-3xl p-4 md:p-8 shadow-2xl overflow-x-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6 px-1 flex items-center justify-between">
            <span>Boîtes métalliques assemblées</span>
            <span className="text-slate-400">💡 Clique pour basculer possédé / manquant</span>
          </div>

          <div className="flex gap-3 min-w-max pb-4 justify-start">
            {currentSet.tins.map((tin) => {
              const isOwned = Boolean(ownedTins[tin.id]);

              return (
                <div
                  key={tin.id}
                  onClick={() => toggleTin(tin.id)}
                  className={`relative flex flex-col items-center justify-between p-3 rounded-3xl border-2 cursor-pointer transition-all duration-300 w-44 md:w-52 select-none ${
                    isOwned
                      ? `bg-gradient-to-b ${tin.metalColor} border-yellow-500/80 shadow-[0_10px_25px_rgba(234,179,8,0.25)] scale-100 opacity-100 ring-2 ring-yellow-500/20`
                      : "bg-slate-950/80 border-dashed border-slate-800 opacity-30 hover:opacity-60 scale-95"
                  }`}
                  style={{
                    boxShadow: isOwned ? "inset 0 1px 1px rgba(255,255,255,0.2), 0 10px 20px rgba(0,0,0,0.5)" : "none"
                  }}
                >
                  <div className="w-full flex justify-between items-center mb-1">
                    <span className="bg-slate-950/80 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-300">
                      N° {tin.order} / {currentSet.count}
                    </span>
                    <span className="text-sm">{isOwned ? "✅" : "➕"}</span>
                  </div>

                  <div className="h-56 md:h-64 w-full flex items-center justify-center my-2 relative overflow-hidden rounded-2xl bg-black/40 border border-white/5">
                    <img
                      src={tin.image}
                      alt={tin.pokemon}
                      className={`h-48 md:h-56 object-contain transition-all duration-300 drop-shadow-2xl ${
                        isOwned ? "filter-none scale-100" : "brightness-0 opacity-20 scale-90"
                      }`}
                      loading="lazy"
                    />

                    {!isOwned && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl opacity-50 mb-1">🔒</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Manquante</span>
                      </div>
                    )}
                  </div>

                  <div className="text-center w-full pt-2 border-t border-white/10">
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