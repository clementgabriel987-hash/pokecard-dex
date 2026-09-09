"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

interface CardDetails {
  normalOwned: boolean;
  foilOwned: boolean;
  langs?: string[];
  isWishlist?: boolean;
}

type UserCollectionJSON = Record<string, CardDetails>;

export default function StatistiquesPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [collection, setCollection] = useState<UserCollectionJSON>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || null;
      setCurrentUser(user);

      if (user) {
        const { data } = await supabase.from("user_data").select("collection").eq("id", user.id).maybeSingle();
        if (data && data.collection) {
          setCollection(data.collection);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  // Calculs statistiques
  const totalEntries = Object.keys(collection).length;
  const normalCount = Object.values(collection).filter(c => c.normalOwned).length;
  const foilCount = Object.values(collection).filter(c => c.foilOwned).length;
  const wishlistCount = Object.values(collection).filter(c => c.isWishlist).length;
  const bothCount = Object.values(collection).filter(c => c.normalOwned && c.foilOwned).length;

  // Analyse par bloc basée sur les préfixes des ID de cartes (ex: "base1-1" -> "base1", "swsh12.5-15" -> "swsh12.5")
  const blockStats: Record<string, number> = {};
  Object.keys(collection).forEach(cardId => {
    if (collection[cardId].normalOwned || collection[cardId].foilOwned) {
      const parts = cardId.split("-");
      const setId = parts.length > 1 ? parts[0] : "autres";
      blockStats[setId] = (blockStats[setId] || 0) + 1;
    }
  });

  const sortedBlocks = Object.entries(blockStats).sort((a, b) => b[1] - a[1]);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-10 relative">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="bg-slate-900 border border-slate-700 hover:bg-slate-800 text-yellow-400 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2">
            ⬅️ Retour au classeur
          </Link>
          <h1 className="text-2xl font-extrabold text-yellow-400">📈 Tableau de Bord & Statistiques</h1>
        </div>

        {!currentUser ? (
          <div className="text-center bg-slate-900 border border-slate-800 rounded-2xl p-10 mt-10">
            <span className="text-4xl mb-3 block">🔒</span>
            <p className="text-slate-300 font-semibold mb-4">Connecte-toi pour voir les statistiques détaillées de ta collection !</p>
            <Link href="/compte" className="bg-yellow-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs inline-block hover:bg-yellow-400 transition">
              Se connecter
            </Link>
          </div>
        ) : loading ? (
          <div className="text-center py-20 text-slate-400 animate-pulse font-medium text-lg">
            Analyse des données du classeur en cours... 📊
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cartes de KPIs principaux */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Références</p>
                <p className="text-3xl font-extrabold text-white">{totalEntries}</p>
                <p className="text-[10px] text-slate-500 mt-1">Cartes enregistrées</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Normales</p>
                <p className="text-3xl font-extrabold text-yellow-400">{normalCount}</p>
                <p className="text-[10px] text-slate-500 mt-1">Possédées en version standard</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Foils / Brillantes</p>
                <p className="text-3xl font-extrabold text-purple-400">{foilCount}</p>
                <p className="text-[10px] text-slate-500 mt-1">Possédées en version brillante</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Wishlist</p>
                <p className="text-3xl font-extrabold text-red-400">{wishlistCount}</p>
                <p className="text-[10px] text-slate-500 mt-1">Cartes en chasse active</p>
              </div>
            </div>

            {/* Répartition visuelle des types de possession */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h2 className="text-base font-bold text-white mb-4">🎯 Répartition de la Collection</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-slate-300">Cartes normales uniquement</span>
                    <span className="text-yellow-400">{normalCount - bothCount} cartes</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-yellow-500 h-full rounded-full transition-all duration-500" style={{ width: `${totalEntries > 0 ? ((normalCount - bothCount) / totalEntries) * 100 : 0}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-slate-300">Cartes foils uniquement</span>
                    <span className="text-purple-400">{foilCount - bothCount} cartes</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${totalEntries > 0 ? ((foilCount - bothCount) / totalEntries) * 100 : 0}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-slate-300">Double exemplaire (Normal + Foil possédés)</span>
                    <span className="text-emerald-400">{bothCount} cartes</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${totalEntries > 0 ? (bothCount / totalEntries) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top extensions possédées */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h2 className="text-base font-bold text-white mb-4">🏆 Cartes possédées par Extension (Top Sets)</h2>
              {sortedBlocks.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Aucune carte enregistrée pour l'instant. Coche des cartes dans ton classeur !</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sortedBlocks.slice(0, 8).map(([setId, count]) => (
                    <div key={setId} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center">
                      <span className="text-xs font-bold uppercase text-slate-300">Set : {setId}</span>
                      <span className="text-xs font-extrabold bg-yellow-500/20 text-yellow-400 px-2.5 py-1 rounded-lg border border-yellow-500/30">
                        {count} carte{count > 1 ? "s" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}