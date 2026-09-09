"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function MaterialCalculatorPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [collectionSize, setCollectionSize] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Paramètres personnalisables par le collectionneur
  const [mode, setMode] = useState<"database" | "custom">("database");
  const [customCardCount, setCustomCardCount] = useState<number>(360);
  const [pageType, setPageType] = useState<number>(18); // 18 poches par page (standard Dragon Shield)
  const [includeFoilsSeparate, setIncludeFoilsSeparate] = useState<boolean>(false); // Ranger les foils dans une autre poche ou dos à dos

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || null;
      setCurrentUser(user);

      if (user) {
        const { data } = await supabase.from("user_data").select("collection").eq("id", user.id).maybeSingle();
        if (data && data.collection) {
          const col = data.collection;
          let totalToStore = 0;
          Object.values(col).forEach((c: any) => {
            if (c.normalOwned) totalToStore++;
            if (c.foilOwned) {
              if (includeFoilsSeparate) totalToStore++; // Si on compte la foil séparément
            }
          });
          setCollectionSize(totalToStore);
        }
      }
      setLoading(false);
    }
    init();
  }, [includeFoilsSeparate]);

  // Nombre de cartes total à ranger selon le mode choisi
  const totalCardsToStore = mode === "database" ? collectionSize : customCardCount;

  // Calculs logistiques Dragon Shield
  const pocketsPerPage = pageType; // 8, 16, 18 ou 24 poches
  const pagesNeeded = Math.ceil(totalCardsToStore / pocketsPerPage);
  
  // Les pages Dragon Shield sont vendues par paquets de 50
  const packSize = 50;
  const packsNeeded = Math.ceil(pagesNeeded / packSize);
  
  // Un classeur standard (type Zipster Binder) peut contenir confortablement environ 25 à 30 pages max pour ne pas abîmer la tranche
  const maxPagesPerBinder = 25;
  const bindersNeeded = Math.ceil(pagesNeeded / maxPagesPerBinder);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-10 relative">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="bg-slate-900 border border-slate-700 hover:bg-slate-800 text-yellow-400 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2">
            ⬅️ Retour au classeur
          </Link>
          <h1 className="text-2xl font-extrabold text-yellow-400">🛡️ Calculateur de Matériel Dragon Shield</h1>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-8 shadow-xl space-y-6">
          <p className="text-sm text-slate-300">
            Ne te retrouve plus jamais à court de pages de rangement au milieu d'un set ! Cet outil calcule précisément le nombre de recharges <strong className="text-purple-400">Dragon Shield (paquets de 50)</strong> et de classeurs nécessaires.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source des cartes */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">1. Source du nombre de cartes :</label>
              <div className="flex gap-2">
                <button onClick={() => setMode("database")} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${mode === "database" ? "bg-yellow-500 text-slate-950 shadow-md" : "bg-slate-900 text-slate-400 border border-slate-800"}`}>
                  Mon Classeur Supabase ({collectionSize} cartes)
                </button>
                <button onClick={() => setMode("custom")} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${mode === "custom" ? "bg-yellow-500 text-slate-950 shadow-md" : "bg-slate-900 text-slate-400 border border-slate-800"}`}>
                  Nombre personnalisé
                </button>
              </div>

              {mode === "custom" && (
                <div className="mt-2">
                  <input type="number" value={customCardCount} onChange={(e) => setCustomCardCount(Math.max(1, parseInt(e.target.value) || 0))} className="w-full bg-slate-900 border border-slate-700 text-sm px-3 py-2 rounded-lg text-white outline-none focus:border-yellow-500" />
                </div>
              )}
            </div>

            {/* Modèle de pages Dragon Shield */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">2. Modèle de pages Dragon Shield :</label>
              <select value={pageType} onChange={(e) => setPageType(parseInt(e.target.value))} className="w-full bg-slate-900 text-sm border border-slate-700 text-white px-3 py-2.5 rounded-lg outline-none focus:border-yellow-500 cursor-pointer">
                <option value={18}>18 Poches par page (Standard 9x2 recto/verso)</option>
                <option value={24}>24 Poches par page (Grand format 12x2)</option>
                <option value={16}>16 Poches par page (8x2)</option>
                <option value={8}>8 Poches par page (Petit format / Mini binder)</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 animate-pulse font-medium text-lg">
            Analyse de ton inventaire de cartes... 📦
          </div>
        ) : (
          <div className="space-y-6">
            {/* Résultats principaux */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-purple-500/30 p-5 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-purple-500/10 text-purple-400 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-purple-500/30">Dragon Shield</div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Paquets de 50 pages</p>
                <p className="text-4xl font-extrabold text-purple-400">{packsNeeded} <span className="text-sm font-normal text-slate-400">paquet{packsNeeded > 1 ? "s" : ""}</span></p>
                <p className="text-[10px] text-slate-500 mt-2">Soit {pagesNeeded} pages individuelles</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Classeurs nécessaires</p>
                <p className="text-4xl font-extrabold text-yellow-400">{bindersNeeded} <span className="text-sm font-normal text-slate-400">album{bindersNeeded > 1 ? "s" : ""}</span></p>
                <p className="text-[10px] text-slate-500 mt-2">Basé sur ~25 pages par classeur</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Capacité totale calculée</p>
                <p className="text-4xl font-extrabold text-emerald-400">{pagesNeeded * pocketsPerPage} <span className="text-sm font-normal text-slate-400">cartes</span></p>
                <p className="text-[10px] text-slate-500 mt-2">Pour {totalCardsToStore} cartes à ranger</p>
              </div>
            </div>

            {/* Conseils logistiques */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>💡</span> Conseils d'organisation Dragon Shield
              </h2>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                <li>Les pages Dragon Shield à chargement latéral (<strong className="text-purple-300">Side-Loading</strong>) empêchent tes cartes de glisser par le haut lorsque tu manipules ton classeur.</li>
                <li>Il est recommandé de ne pas dépasser <strong>25 à 30 pages</strong> par classeur à anneaux ou Zipster pour éviter de courber les cartes situées sur les bords extérieurs.</li>
                <li>Si tu ranges des cartes double-sleeved (protection interne + externe Dragon Shield Perfect Fit), prévois 10% de pages supplémentaires car l'épaisseur est plus importante.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}