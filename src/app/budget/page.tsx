"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

interface Card {
  id: string;
  name: string;
  localId: string;
}

// Liste des extensions principales compatibles avec les cotes estimées
const AVAILABLE_SETS = [
  { id: "base1", name: "Base Set (Wizards)", lang: "fr", estimatedTotalCost: 1400 },
  { id: "base2", name: "Jungle (Wizards)", lang: "fr", estimatedTotalCost: 500 },
  { id: "base3", name: "Fossile (Wizards)", lang: "fr", estimatedTotalCost: 450 },
  { id: "neo1", name: "Neo Genesis", lang: "fr", estimatedTotalCost: 900 },
  { id: "swsh7", name: "Évolution Céleste", lang: "fr", estimatedTotalCost: 1100 },
  { id: "swsh12.5", name: "Zénith Suprême", lang: "fr", estimatedTotalCost: 450 },
  { id: "sv03.5", name: "151", lang: "fr", estimatedTotalCost: 380 },
  { id: "swsh11", name: "Origine Perdue", lang: "fr", estimatedTotalCost: 550 },
  { id: "sv01", name: "Écarlate et Violet (Base)", lang: "fr", estimatedTotalCost: 200 },
  { id: "sv02", name: "Évolutions à Paldea", lang: "fr", estimatedTotalCost: 220 },
  { id: "sv03", name: "Flammes Obsidiennes", lang: "fr", estimatedTotalCost: 230 },
  { id: "xy12", name: "Évolutions", lang: "fr", estimatedTotalCost: 650 },
  { id: "sm11.5", name: "Destinées Occultes", lang: "fr", estimatedTotalCost: 750 }
];

export default function BudgetSimulatorPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [collection, setCollection] = useState<Record<string, any>>({});
  const [selectedSetId, setSelectedSetId] = useState<string>(AVAILABLE_SETS[0].id);
  const [setCards, setSetCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || null;
      setCurrentUser(user);

      if (user) {
        const { data } = await supabase.from("user_data").select("collection").eq("id", user.id).maybeSingle();
        if (data && data.collection) setCollection(data.collection);
      }
    }
    init();
  }, []);

  useEffect(() => {
    async function fetchSetData() {
      setLoading(true);
      const currentSet = AVAILABLE_SETS.find(s => s.id === selectedSetId);
      if (!currentSet) return;

      try {
        const res = await fetch(`https://api.tcgdex.net/v2/${currentSet.lang}/sets/${selectedSetId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data && data.cards) {
          setSetCards(data.cards.map((c: any) => ({ id: c.id, name: c.name, localId: c.localId })));
        } else {
          setSetCards([]);
        }
      } catch {
        setSetCards([]);
      } finally {
        setLoading(false);
      }
    }
    fetchSetData();
  }, [selectedSetId]);

  const currentSetInfo = AVAILABLE_SETS.find(s => s.id === selectedSetId) || AVAILABLE_SETS[0];
  const totalCardsInSet = setCards.length;

  // Calcul des cartes manquantes
  const missingCards = setCards.filter(card => {
    const cardData = collection[card.id];
    const isNormal = cardData?.normalOwned || false;
    const isFoil = cardData?.foilOwned || false;
    return !isNormal && !isFoil;
  });

  const missingCount = missingCards.length;
  const ownedCount = totalCardsInSet - missingCount;
  
  // Estimation du budget restant proportionnel aux cartes manquantes
  const averagePricePerCard = totalCardsInSet > 0 ? currentSetInfo.estimatedTotalCost / totalCardsInSet : 0;
  const estimatedRemainingBudget = Math.round(missingCount * averagePricePerCard);
  const completionPercentage = totalCardsInSet > 0 ? Math.round((ownedCount / totalCardsInSet) * 100) : 0;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-10 relative">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="bg-slate-900 border border-slate-700 hover:bg-slate-800 text-yellow-400 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2">
            ⬅️ Retour au classeur
          </Link>
          <h1 className="text-2xl font-extrabold text-yellow-400">💰 Simulateur de Budget Restant</h1>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-8 shadow-xl space-y-4">
          <p className="text-sm text-slate-300">
            Sélectionne une extension ci-dessous pour calculer instantanément le nombre de cartes qu'il te manque et <strong className="text-yellow-400">l'estimation du budget en euros</strong> nécessaire pour l'achever.
          </p>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Choisir l'extension à simuler :</label>
            <select value={selectedSetId} onChange={(e) => setSelectedSetId(e.target.value)} className="w-full bg-slate-950 text-sm border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-yellow-500 cursor-pointer">
              {AVAILABLE_SETS.map(set => <option key={set.id} value={set.id}>{set.name}</option>)}
            </select>
          </div>
        </div>

        {!currentUser ? (
          <div className="text-center bg-slate-900 border border-slate-800 rounded-2xl p-10">
            <span className="text-4xl mb-3 block">🔒</span>
            <p className="text-slate-300 font-semibold mb-4">Connecte-toi pour que le simulateur analyse ton classeur personnel !</p>
            <Link href="/compte" className="bg-yellow-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs inline-block hover:bg-yellow-400 transition">
              Se connecter
            </Link>
          </div>
        ) : loading ? (
          <div className="text-center py-20 text-slate-400 animate-pulse font-medium text-lg">
            Calcul du budget et analyse du set... 💸
          </div>
        ) : (
          <div className="space-y-6">
            {/* Résultats du budget */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Budget Restant Estimé</p>
                <p className="text-3xl font-extrabold text-emerald-400">{estimatedRemainingBudget} €</p>
                <p className="text-[10px] text-slate-500 mt-1">Pour acquérir les {missingCount} cartes manquantes</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Cartes Manquantes</p>
                <p className="text-3xl font-extrabold text-red-400">{missingCount} <span className="text-sm font-normal text-slate-400">/ {totalCardsInSet}</span></p>
                <p className="text-[10px] text-slate-500 mt-1">À trouver pour compléter le set</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Complétion Actuelle</p>
                <p className="text-3xl font-extrabold text-yellow-400">{completionPercentage}%</p>
                <p className="text-[10px] text-slate-500 mt-1">{ownedCount} cartes déjà possédées</p>
              </div>
            </div>

            {/* Liste détaillée des cartes manquantes */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h2 className="text-base font-bold text-white mb-4">🛒 Liste d'achats prioritaire ({missingCount} cartes)</h2>
              {missingCount === 0 ? (
                <div className="text-center py-8 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-3xl mb-2 block">🎉</span>
                  <p className="text-emerald-400 font-bold text-sm">Félicitations ! Tu possèdes déjà toutes les cartes de cette extension.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-2">
                  {missingCards.map(card => (
                    <div key={card.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-200 truncate mr-2">{card.name}</span>
                      <span className="bg-slate-900 text-slate-400 px-2 py-1 rounded border border-slate-800 shrink-0">#{card.localId}</span>
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