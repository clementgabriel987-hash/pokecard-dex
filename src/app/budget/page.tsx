"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

interface Card {
  id: string;
  name: string;
  localId: string;
}

interface SetOption {
  id: string;
  name: string;
  lang: string;
  blockName: string;
}

// Récupération de tous les blocs et séries de l'application
const POKEMON_BLOCKS = [
  {
    blockName: "⭐ Cartes Promotionnelles",
    sets: [
      { id: "svp", name: "Scarlet & Violet Promos", lang: "fr" },
      { id: "swshp", name: "SWSH Black Star Promos", lang: "fr" },
      { id: "smp", name: "SM Black Star Promos", lang: "fr" },
      { id: "xyp", name: "XY Black Star Promos", lang: "fr" },
      { id: "bwp", name: "BW Black Star Promos", lang: "fr" },
      { id: "hsp", name: "HGSS Black Star Promos", lang: "fr" },
      { id: "dpp", name: "DP Black Star Promos", lang: "en" },
      { id: "basep", name: "Wizards Black Star Promos", lang: "en" }
    ]
  },
  {
    blockName: "📦 Hors-Séries & Spéciales",
    sets: [
      { id: "det1", name: "Détective Pikachu", lang: "fr" },
      { id: "pop1", name: "POP Series 1", lang: "en" },
      { id: "pop2", name: "POP Series 2", lang: "en" },
      { id: "pop3", name: "POP Series 3", lang: "en" },
      { id: "pop4", name: "POP Series 4", lang: "en" },
      { id: "pop5", name: "POP Series 5", lang: "en" },
      { id: "pop6", name: "POP Series 6", lang: "en" },
      { id: "pop7", name: "POP Series 7", lang: "en" },
      { id: "pop8", name: "POP Series 8", lang: "en" },
      { id: "pop9", name: "POP Series 9", lang: "en" },
      { id: "mcd22", name: "McDonald's Collection 2022", lang: "en" },
      { id: "mcd23", name: "McDonald's Collection 2023", lang: "en" },
      { id: "mcd24", name: "McDonald's Collection 2024", lang: "en" }
    ]
  },
  {
    blockName: "Bloc Wizards (Classic)",
    sets: [
      { id: "base1", name: "Base Set (FR)", lang: "fr" },
      { id: "base2", name: "Jungle (FR)", lang: "fr" },
      { id: "base3", name: "Fossile (FR)", lang: "fr" },
      { id: "base4", name: "Base Set 2 (EN)", lang: "en" },
      { id: "gym1", name: "Gym Heroes (EN)", lang: "en" },
      { id: "neo1", name: "Neo Genesis (FR)", lang: "fr" },
      { id: "neo2", name: "Neo Discovery (FR)", lang: "fr" },
      { id: "neo3", name: "Neo Revelation (EN)", lang: "en" },
      { id: "neo4", name: "Neo Destiny (EN)", lang: "en" }
    ]
  },
  {
    blockName: "Bloc EX (Ruby & Sapphire)",
    sets: [
      { id: "ex1", name: "EX Rubis & Saphir (FR)", lang: "fr" },
      { id: "ex2", name: "EX Tempête de Sable (FR)", lang: "fr" },
      { id: "ex3", name: "EX Dragon (FR)", lang: "fr" },
      { id: "ex4", name: "EX Team Magma vs Team Aqua (FR)", lang: "fr" },
      { id: "ex5", name: "EX Légendes Oubliées (FR)", lang: "fr" },
      { id: "ex6", name: "EX Rouge Feu & Vert Feuille (FR)", lang: "fr" },
      { id: "ex7", name: "EX Team Rocket Returns (EN)", lang: "en" },
      { id: "ex8", name: "EX Deoxys (FR)", lang: "fr" },
      { id: "ex9", name: "EX Émeraude (FR)", lang: "fr" },
      { id: "ex10", name: "EX Forces Cachées (FR)", lang: "fr" },
      { id: "ex11", name: "EX Espèces Delta (FR)", lang: "fr" },
      { id: "ex12", name: "EX Créateurs de Légendes (FR)", lang: "fr" },
      { id: "ex13", name: "EX Fantômes Holon (FR)", lang: "fr" },
      { id: "ex14", name: "EX Gardiens de Cristal (FR)", lang: "fr" },
      { id: "ex15", name: "EX Île des Dragons (FR)", lang: "fr" },
      { id: "ex16", name: "EX Gardiens du Pouvoir (FR)", lang: "fr" }
    ]
  },
  {
    blockName: "Bloc Diamant & Perle",
    sets: [
      { id: "dp1", name: "Diamant & Perle (FR)", lang: "fr" },
      { id: "dp2", name: "Trésors Mystérieux (FR)", lang: "fr" },
      { id: "dp3", name: "Merveilles Secrètes (FR)", lang: "fr" },
      { id: "dp4", name: "Aube Majestueuse (FR)", lang: "fr" },
      { id: "dp5", name: "Éveil des Légendes (FR)", lang: "fr" },
      { id: "dp6", name: "Tempête (FR)", lang: "fr" }
    ]
  },
  {
    blockName: "Bloc Platine",
    sets: [
      { id: "pl1", name: "Platine (FR)", lang: "fr" },
      { id: "pl2", name: "Rivaux Émergents (FR)", lang: "fr" },
      { id: "pl3", name: "Vainqueurs Suprêmes (FR)", lang: "fr" },
      { id: "pl4", name: "Arceus (FR)", lang: "fr" }
    ]
  },
  {
    blockName: "Bloc HeartGold & SoulSilver (HGSS)",
    sets: [
      { id: "hgss1", name: "HeartGold & SoulSilver (FR)", lang: "fr" },
      { id: "hgss2", name: "HS - Déchaîné (FR)", lang: "fr" },
      { id: "hgss3", name: "HS - Vainqueurs Suprêmes (FR)", lang: "fr" },
      { id: "hgss4", name: "HS - L'Appel des Légendes (FR)", lang: "fr" }
    ]
  },
  {
    blockName: "Bloc Noir & Blanc",
    sets: [
      { id: "bw1", name: "Noir & Blanc (FR)", lang: "fr" },
      { id: "bw2", name: "Pouvoirs Émergents (FR)", lang: "fr" },
      { id: "bw3", name: "Nobles Victoires (FR)", lang: "fr" },
      { id: "bw4", name: "Destinées Futures (FR)", lang: "fr" },
      { id: "bw5", name: "Explorateurs Obscurs (FR)", lang: "fr" },
      { id: "bw6", name: "Dragons Exaltés (FR)", lang: "fr" },
      { id: "bw7", name: "Frontières Franchies (FR)", lang: "fr" },
      { id: "bw8", name: "Tempête Plasma (FR)", lang: "fr" },
      { id: "bw9", name: "Glaciation Plasma (FR)", lang: "fr" },
      { id: "bw10", name: "Explosion Plasma (FR)", lang: "fr" },
      { id: "bw11", name: "Trésors Légendaires (EN)", lang: "en" }
    ]
  },
  {
    blockName: "Bloc XY",
    sets: [
      { id: "xy1", name: "XY de base (FR)", lang: "fr" },
      { id: "xy2", name: "Étincelles (FR)", lang: "fr" },
      { id: "xy3", name: "Poings Furieux (FR)", lang: "fr" },
      { id: "xy4", name: "Vigueur Spectrale (FR)", lang: "fr" },
      { id: "xy5", name: "Primo-Choc (FR)", lang: "fr" },
      { id: "xy6", name: "Ciel Rugissant (FR)", lang: "fr" },
      { id: "xy7", name: "Origines Antiques (FR)", lang: "fr" },
      { id: "xy8", name: "Impulsion Turbo (FR)", lang: "fr" },
      { id: "xy9", name: "Rupture Turbo (FR)", lang: "fr" },
      { id: "xy10", name: "Impact des Destins (FR)", lang: "fr" },
      { id: "xy11", name: "Offensive Vapeur (FR)", lang: "fr" },
      { id: "xy12", name: "Évolutions (FR)", lang: "fr" },
      { id: "g1", name: "Générations (FR)", lang: "fr" }
    ]
  },
  {
    blockName: "Bloc Soleil & Lune",
    sets: [
      { id: "sm1", name: "Soleil et Lune (FR)", lang: "fr" },
      { id: "sm2", name: "Gardiens Ascendants (FR)", lang: "fr" },
      { id: "sm3", name: "Ombres Ardentes (FR)", lang: "fr" },
      { id: "sm3.5", name: "Légendes Brillantes (FR)", lang: "fr" },
      { id: "sm4", name: "Invasion Carmin (FR)", lang: "fr" },
      { id: "sm5", name: "Ultra-Prisme (FR)", lang: "fr" },
      { id: "sm6", name: "Lumière Interdite (FR)", lang: "fr" },
      { id: "sm7", name: "Tempête Céleste (FR)", lang: "fr" },
      { id: "sm8", name: "Tonnerre Perdu (FR)", lang: "fr" },
      { id: "sm9", name: "Duo de Choc (FR)", lang: "fr" },
      { id: "sm10", name: "Alliance Infaillible (FR)", lang: "fr" },
      { id: "sm11", name: "Harmonie des Esprits (FR)", lang: "fr" },
      { id: "sm11.5", name: "Destinées Occultes (FR)", lang: "fr" },
      { id: "sm12", name: "Éclipse Cosmique (FR)", lang: "fr" }
    ]
  },
  {
    blockName: "Bloc Épée & Bouclier",
    sets: [
      { id: "swsh1", name: "Épée et Bouclier (FR)", lang: "fr" },
      { id: "swsh2", name: "Clash des Rebelles (FR)", lang: "fr" },
      { id: "swsh3", name: "Ténèbres Embrasées (FR)", lang: "fr" },
      { id: "swsh3.5", name: "La Voie du Maître (FR)", lang: "fr" },
      { id: "swsh4", name: "Voltage Éclatant (FR)", lang: "fr" },
      { id: "swsh4.5", name: "Destinées Radieuses (FR)", lang: "fr" },
      { id: "swsh5", name: "Styles de Combat (FR)", lang: "fr" },
      { id: "swsh6", name: "Règne de Glace (FR)", lang: "fr" },
      { id: "swsh7", name: "Évolution Céleste (FR)", lang: "fr" },
      { id: "swsh8", name: "Célébrations (FR)", lang: "fr" },
      { id: "swsh9", name: "Stars Étincelantes (FR)", lang: "fr" },
      { id: "swsh10", name: "Astres Radieux (FR)", lang: "fr" },
      { id: "swsh11", name: "Origine Perdue (FR)", lang: "fr" },
      { id: "swsh12", name: "Tempête Argentée (FR)", lang: "fr" },
      { id: "swsh12.5", name: "Zénith Suprême (FR)", lang: "fr" }
    ]
  },
  {
    blockName: "Bloc Écarlate & Violet (EV)",
    sets: [
      { id: "sv01", name: "Écarlate et Violet (FR)", lang: "fr" },
      { id: "sv02", name: "Évolutions à Paldea (FR)", lang: "fr" },
      { id: "sv03", name: "Flammes Obsidiennes (FR)", lang: "fr" },
      { id: "sv03.5", name: "151 (FR)", lang: "fr" },
      { id: "sv04", name: "Faille Paradoxe (FR)", lang: "fr" },
      { id: "sv04.5", name: "Destinées de Paldea (FR)", lang: "fr" },
      { id: "sv05", name: "Forces Temporelles (FR)", lang: "fr" },
      { id: "sv06", name: "Mascarade Crépusculaire (FR)", lang: "fr" },
      { id: "sv06.5", name: "Fable Nébuleuse (FR)", lang: "fr" },
      { id: "sv07", name: "Couronne Stellaire (FR)", lang: "fr" },
      { id: "sv08", name: "Étincelles Survoltées (FR)", lang: "fr" },
      { id: "sv08.5", name: "Évolutions Prismatiques (FR)", lang: "fr" }
    ]
  },
  {
    blockName: "Bloc Méga-Évolution (ME)",
    sets: [
      { id: "me01", name: "Méga-Évolution (FR)", lang: "fr" },
      { id: "me02", name: "Flammes Fantasmagoriques (FR)", lang: "fr" },
      { id: "me02.5", name: "Héros Transcendants (FR)", lang: "fr" },
      { id: "me03", name: "Équilibre Parfait (FR)", lang: "fr" },
      { id: "me04", name: "Chaos Ascendant (FR)", lang: "fr" },
      { id: "me05", name: "Nuit Noire (FR)", lang: "fr" }
    ]
  }
];

const ALL_AVAILABLE_SETS: SetOption[] = POKEMON_BLOCKS.flatMap(block => 
  block.sets.map(set => ({ ...set, blockName: block.blockName }))
);

export default function BudgetSimulatorPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [collection, setCollection] = useState<Record<string, any>>({});
  const [selectedSetId, setSelectedSetId] = useState<string>(ALL_AVAILABLE_SETS[0].id);
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
      const currentSet = ALL_AVAILABLE_SETS.find(s => s.id === selectedSetId);
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

  const currentSetInfo = ALL_AVAILABLE_SETS.find(s => s.id === selectedSetId) || ALL_AVAILABLE_SETS[0];
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
  
  // Estimation dynamique intelligente du coût total du set selon l'ère
  const isRetro = currentSetInfo.blockName.includes("Wizards") || currentSetInfo.blockName.includes("EX");
  const estimatedCostPerCard = isRetro ? 12 : 4; // ~12€ par carte pour le rétro, ~4€ pour le moderne en moyenne
  const estimatedTotalCost = totalCardsInSet * estimatedCostPerCard;
  
  const averagePricePerCard = totalCardsInSet > 0 ? estimatedTotalCost / totalCardsInSet : 0;
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
            Sélectionne <strong>n'importe quelle extension</strong> de l'application ci-dessous pour calculer instantanément les cartes manquantes et estimer ton budget restant en euros.
          </p>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Choisir l'extension à simuler :</label>
            <select value={selectedSetId} onChange={(e) => setSelectedSetId(e.target.value)} className="w-full bg-slate-950 text-sm border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-yellow-500 cursor-pointer">
              {POKEMON_BLOCKS.map(block => (
                <optgroup key={block.blockName} label={block.blockName}>
                  {block.sets.map(set => <option key={set.id} value={set.id}>{set.name}</option>)}
                </optgroup>
              ))}
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
            Chargement de l'extension et calcul du budget... 💸
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