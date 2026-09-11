"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "../../lib/supabase";

interface SetItem {
  id: string;
  name: string;
  block: string;
  lang: string;
}

const POKEMON_BLOCKS = [
  {
    blockName: "⭐ Cartes Promotionnelles",
    sets: [
      { id: "svp", name: "Scarlet & Violet Promos", lang: "fr" },
      { id: "swshp", name: "SWSH Black Star Promos", lang: "fr" },
      { id: "smp", name: "SM Black Star Promos", lang: "fr" },
      { id: "xyp", name: "XY Black Star Promos", lang: "fr" },
      { id: "bwp", name: "BW Black Star Promos", lang: "fr" },
      { id: "hgss.p", name: "HGSS Black Star Promos", lang: "en" },
      { id: "dpp", name: "DP Black Star Promos", lang: "en" },
      { id: "basep", name: "Wizards Black Star Promos", lang: "en" },
      { id: "mep", name: "Mega-Evolution Black Star Promos", lang: "en" }
    ]
  },
  {
    blockName: "🍔 Collections McDonald's",
    sets: [
      { id: "mcd11", name: "McDonald's Collection 2011", lang: "en" },
      { id: "mcd12", name: "McDonald's Collection 2012", lang: "en" },
      { id: "mcd14", name: "McDonald's Collection 2014", lang: "en" },
      { id: "mcd15", name: "McDonald's Collection 2015", lang: "en" },
      { id: "mcd16", name: "McDonald's Collection 2016", lang: "en" },
      { id: "mcd17", name: "McDonald's Collection 2017", lang: "en" },
      { id: "mcd18", name: "McDonald's Collection 2018", lang: "en" },
      { id: "mcd19", name: "McDonald's Collection 2019", lang: "en" },
      { id: "mcd21", name: "McDonald's Collection 2021", lang: "en" },
      { id: "mcd22", name: "McDonald's Collection 2022", lang: "en" }
    ]
  },
  {
    blockName: "📦 Hors-Séries & Spéciales",
    sets: [
      { id: "det1", name: "Détective Pikachu", lang: "en" },
      { id: "pgo", name: "Pokémon GO", lang: "en" },
      { id: "rumble", name: "Pokémon Rumble", lang: "en" },
      { id: "pop1", name: "POP Series 1", lang: "fr" },
      { id: "pop2", name: "POP Series 2", lang: "fr" },
      { id: "pop3", name: "POP Series 3", lang: "fr" },
      { id: "pop4", name: "POP Series 4", lang: "fr" },
      { id: "pop5", name: "POP Series 5", lang: "fr" },
      { id: "pop6", name: "POP Series 6", lang: "fr" },
      { id: "pop7", name: "POP Series 7", lang: "fr" },
      { id: "pop8", name: "POP Series 8", lang: "fr" },
      { id: "pop9", name: "POP Series 9", lang: "fr" }
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
      { id: "dp1", name: "Diamant & Perle (FR)", lang: "en" },
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
      { id: "pl1", name: "Platine de base (FR)", lang: "fr" },
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
      { id: "hgss3", name: "HS - Indomptable (FR)", lang: "fr" },
      { id: "hgss4", name: "HS - Triomphant (FR)", lang: "fr" },
      { id: "col1", name: "L'Appel des Légendes (FR)", lang: "fr" }
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
      { id: "dv1", name: "Coffret des Dragons (Dragon Vault)", lang: "en" },
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
      { id: "cel25", name: "Célébrations (FR)", lang: "fr" },
      { id: "swsh8", name: "Poing de Fusion (FR)", lang: "fr" },
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
      { id: "sv08.5", name: "Évolutions Prismatiques (FR)", lang: "fr" },
      { id: "sv09", name: "Aventures Ensemble (FR)", lang: "fr" },
      { id: "sv10", name: "Rivalités Destinées (FR)", lang: "fr" },
      { id: "blk", name: "Foudre Noire (FR)", lang: "fr" },
      { id: "wht", name: "Flamme Blanche (FR)", lang: "fr" }
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

const ALL_SETS_FLAT: SetItem[] = POKEMON_BLOCKS.flatMap((b) =>
  b.sets.map((s) => ({ ...s, block: b.blockName }))
);

const TCG_IO_SETS = [
  "dp1", "pgo", "rumble", "det1", "hgss.p",
  "mcd11", "mcd12", "mcd14", "mcd15", "mcd16", "mcd17",
  "mcd18", "mcd19", "mcd21", "mcd22"
];

export default function IntercalairePage() {
  const [selectedSetId, setSelectedSetId] = useState<string>(ALL_SETS_FLAT[0].id);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [showStats, setShowStats] = useState<boolean>(true);
  const [showQRCode, setShowQRCode] = useState<boolean>(true);
  const [customNote, setCustomNote] = useState<string>("Classeur Principal #1");

  const [setData, setSetData] = useState<any>(null);
  const [logoFailed, setLogoFailed] = useState<boolean>(false);
  const [symbolFailed, setSymbolFailed] = useState<boolean>(false);
  const [collectionCount, setCollectionCount] = useState<{ normal: number; foil: number }>({ normal: 0, foil: 0 });

  const currentSet = ALL_SETS_FLAT.find((s) => s.id === selectedSetId) || ALL_SETS_FLAT[0];

  useEffect(() => {
    setLogoFailed(false);
    setSymbolFailed(false);

    async function loadDetails() {
      try {
        if (TCG_IO_SETS.includes(currentSet.id)) {
          const setMapCode: Record<string, string> = {
            dp1: "dp1", pgo: "pgo", rumble: "ru1", det1: "det1", "hgss.p": "hsp",
            mcd11: "mcd11", mcd12: "mcd12", mcd14: "mcd14", mcd15: "mcd15",
            mcd16: "mcd16", mcd17: "mcd17", mcd18: "mcd18", mcd19: "mcd19",
            mcd21: "mcd21", mcd22: "mcd22"
          };
          const apiCode = setMapCode[currentSet.id] || currentSet.id;
          const res = await fetch(`/api/pokemon?set=${apiCode}`);
          if (res.ok) {
            const json = await res.json();
            const totalCards = Array.isArray(json.data) ? json.data.length : 0;
            setSetData({
              name: currentSet.name,
              cardCount: { official: totalCards, total: totalCards },
              logo: null,
              symbol: null
            });
          }
        } else {
          const res = await fetch(`https://api.tcgdex.net/v2/${currentSet.lang}/sets/${currentSet.id}`);
          if (res.ok) {
            const data = await res.json();
            setSetData(data);
          } else {
            setSetData({
              name: currentSet.name,
              cardCount: { official: "—", total: "—" },
              logo: null,
              symbol: null
            });
          }
        }
      } catch {
        setSetData(null);
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (user) {
        const { data: dbData } = await supabase.from("user_data").select("collection").eq("id", user.id).maybeSingle();
        if (dbData?.collection) {
          const col = dbData.collection;
          let n = 0;
          let f = 0;
          Object.keys(col).forEach((id) => {
            if (id.startsWith(`${currentSet.id}-`)) {
              if (col[id]?.normalOwned) n++;
              if (col[id]?.foilOwned) f++;
            }
          });
          setCollectionCount({ normal: n, foil: f });
        }
      }
    }

    loadDetails();
  }, [selectedSetId, currentSet]);

  const appSetUrl = typeof window !== "undefined"
    ? `${window.location.origin}/?set=${currentSet.id}`
    : `https://pokecardgabriel12.vercel.app/?set=${currentSet.id}`;

  // Gestion des extensions d'URL sans duplication
  const getImageUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.endsWith(".png") || url.endsWith(".jpg") || url.endsWith(".webp") || url.endsWith(".svg")) {
      return url;
    }
    return `${url}.png`;
  };

  const logoUrl = getImageUrl(setData?.logo);
  const symbolUrl = getImageUrl(setData?.symbol);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 print:bg-white print:text-black">
      {/* Panneau de configuration (masqué à l'impression) */}
      <div className="print:hidden max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-yellow-400">📑 Générateur d&apos;Intercalaires A4</h1>
            <p className="text-xs text-slate-400">Crée tes pages de séparation de séries pour tes classeurs.</p>
          </div>
          <Link href="/" className="px-4 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 rounded-xl text-xs font-bold transition">
            ⬅️ Retour au Classeur
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Choisir l&apos;extension :
            </label>
            <select
              value={selectedSetId}
              onChange={(e) => setSelectedSetId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 text-xs outline-none focus:border-yellow-500 cursor-pointer"
            >
              {POKEMON_BLOCKS.map((block) => (
                <optgroup key={block.blockName} label={block.blockName}>
                  {block.sets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Annotation personnalisée :
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Ex: Classeur Anneaux #1"
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 text-xs outline-none focus:border-yellow-500"
            />
          </div>

          <div className="flex gap-4 items-center flex-wrap">
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-700 transition"
            >
              {theme === "light" ? "☀️ Clair (Éco d'encre)" : "🌙 Sombre (Collector)"}
            </button>
            <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
              <input type="checkbox" checked={showQRCode} onChange={(e) => setShowQRCode(e.target.checked)} />
              QR Code
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
              <input type="checkbox" checked={showStats} onChange={(e) => setShowStats(e.target.checked)} />
              Afficher ma progression
            </label>
          </div>

          <div className="flex items-end justify-end">
            <button
              onClick={() => window.print()}
              className="w-full md:w-auto px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black rounded-xl text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              🖨️ Imprimer / Sauvegarder en PDF
            </button>
          </div>
        </div>
      </div>

      {/* Rendu feuille A4 */}
      <div className="flex justify-center p-0 md:p-8 print:p-0">
        <div
          className={`w-[210mm] min-h-[297mm] p-[15mm] flex flex-col justify-between border print:border-none shadow-2xl print:shadow-none transition-colors duration-200 ${
            theme === "dark" ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-300 text-slate-900"
          }`}
          style={{ boxSizing: "border-box" }}
        >
          {/* En-tête */}
          <div className="text-center border-b-2 pb-6 border-current">
            <span className="text-xs font-bold tracking-[0.3em] uppercase opacity-70 block mb-2">
              {currentSet.block}
            </span>
            <h2 className="text-4xl font-black uppercase tracking-tight mb-2">
              {currentSet.name}
            </h2>
          </div>

          {/* Corps central */}
          <div className="flex-1 flex flex-col items-center justify-center py-8 space-y-6 text-center">
            {logoUrl && !logoFailed ? (
              <img
                src={logoUrl}
                alt={currentSet.name}
                className="max-h-36 max-w-sm object-contain drop-shadow-md"
                onError={() => setLogoFailed(true)}
              />
            ) : null}

            {symbolUrl && !symbolFailed ? (
              <div className="p-4 border-2 border-dashed border-current/20 rounded-full">
                <img
                  src={symbolUrl}
                  alt="Symbole de l'extension"
                  className="w-14 h-14 object-contain"
                  onError={() => setSymbolFailed(true)}
                />
              </div>
            ) : null}

            <div className="space-y-1">
              <div className="text-3xl font-extrabold tracking-tight">
                {setData?.cardCount?.official || "—"} Cartes Officielles
              </div>
              {setData?.cardCount?.total && setData.cardCount.total !== setData.cardCount.official && (
                <div className="text-xs opacity-60 font-semibold">
                  {setData.cardCount.total} cartes au total (secrètes incluses)
                </div>
              )}
            </div>

            {customNote && (
              <div className="inline-block px-4 py-1.5 border border-current/30 rounded-full text-xs font-bold tracking-wider uppercase">
                🏷️ {customNote}
              </div>
            )}

            {showStats && (
              <div className="w-full max-w-md border border-current/20 rounded-2xl p-4 space-y-2 bg-current/5">
                <div className="text-xs font-extrabold uppercase tracking-wider opacity-70">
                  Progression du Classeur
                </div>
                <div className="grid grid-cols-2 gap-4 text-left pt-2 border-t border-current/10">
                  <div>
                    <span className="text-[10px] block opacity-60 font-bold uppercase">Cartes Normales</span>
                    <span className="text-lg font-black">{collectionCount.normal} possédées</span>
                  </div>
                  <div>
                    <span className="text-[10px] block opacity-60 font-bold uppercase">Cartes Foils</span>
                    <span className="text-lg font-black">{collectionCount.foil} possédées</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pied de page avec QR Code */}
          <div className="border-t-2 pt-6 border-current flex items-center justify-between">
            <div className="space-y-1 text-left">
              <span className="text-xs font-bold uppercase tracking-wider block">Inventaire Numérique</span>
              <span className="text-[11px] opacity-60 block">Scanne pour ouvrir l&apos;extension dans l&apos;application</span>
            </div>

            {showQRCode && (
              <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                <QRCodeSVG value={appSetUrl} size={70} />
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}