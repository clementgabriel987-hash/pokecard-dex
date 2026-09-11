"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "../../lib/supabase";

interface SetInfo {
  id: string;
  name: string;
  block: string;
  lang: string;
  totalCards?: number;
  releaseDate?: string;
  symbolUrl?: string;
  logoUrl?: string;
}

const SETS_DATA: SetInfo[] = [
  { id: "sv08.5", name: "Évolutions Prismatiques", block: "Écarlate & Violet", lang: "fr", releaseDate: "2025" },
  { id: "sv08", name: "Étincelles Survoltées", block: "Écarlate & Violet", lang: "fr", releaseDate: "2024" },
  { id: "sv03.5", name: "151", block: "Écarlate & Violet", lang: "fr", releaseDate: "2023" },
  { id: "swsh12.5", name: "Zénith Suprême", block: "Épée & Bouclier", lang: "fr", releaseDate: "2023" },
  { id: "cel25", name: "Célébrations", block: "Épée & Bouclier", lang: "fr", releaseDate: "2021" },
  { id: "base1", name: "Base Set", block: "Bloc Wizards", lang: "fr", releaseDate: "1999" },
  { id: "det1", name: "Détective Pikachu", block: "Hors-Séries", lang: "en", releaseDate: "2019" },
  { id: "pgo", name: "Pokémon GO", block: "Hors-Séries", lang: "en", releaseDate: "2022" },
  { id: "dp1", name: "Diamant & Perle", block: "Diamant & Perle", lang: "en", releaseDate: "2007" }
];

export default function IntercalairePage() {
  const [selectedSetId, setSelectedSetId] = useState<string>(SETS_DATA[0].id);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [showStats, setShowStats] = useState<boolean>(true);
  const [showQRCode, setShowQRCode] = useState<boolean>(true);
  const [customNote, setCustomNote] = useState<string>("Classeur Principal #1");
  const [setData, setSetData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [collectionCount, setCollectionCount] = useState<{ normal: number; foil: number }>({ normal: 0, foil: 0 });

  const currentSet = SETS_DATA.find((s) => s.id === selectedSetId) || SETS_DATA[0];

  useEffect(() => {
    async function loadSetDetails() {
      setLoading(true);
      try {
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
      } catch {
        setSetData(null);
      } finally {
        setLoading(false);
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

    loadSetDetails();
  }, [selectedSetId, currentSet]);

  const handlePrint = () => {
    window.print();
  };

  const appSetUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/?set=${currentSet.id}` 
    : `https://pokecardgabriel12.vercel.app/?set=${currentSet.id}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 print:bg-white print:text-black">
      {/* Panneau de configuration hors-impression */}
      <div className="print:hidden max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-yellow-400">📑 Générateur d&apos;Intercalaire A4</h1>
            <p className="text-xs text-slate-400">Crée tes pages de garde prêtes à glisser dans tes classeurs pour séparer tes séries.</p>
          </div>
          <Link href="/" className="px-4 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 rounded-xl text-xs font-bold transition">
            ⬅️ Retour au Classeur
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Choisir l&apos;extension :</label>
            <select
              value={selectedSetId}
              onChange={(e) => setSelectedSetId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 text-sm outline-none focus:border-yellow-500"
            >
              {SETS_DATA.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.block}] {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Annotation personnalisée :</label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Ex: Classeur 1 - Tiroir A"
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 text-sm outline-none focus:border-yellow-500"
            />
          </div>

          <div className="flex gap-4 items-center flex-wrap">
            <label className="text-xs font-bold text-slate-400">Thème :</label>
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
              onClick={handlePrint}
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
          {/* En-tête de l'intercalaire */}
          <div className="text-center border-b-2 pb-6 border-current">
            <span className="text-xs font-bold tracking-[0.3em] uppercase opacity-70 block mb-2">
              {currentSet.block}
            </span>
            <h2 className="text-4xl font-black uppercase tracking-tight mb-2">
              {currentSet.name}
            </h2>
            {currentSet.releaseDate && (
              <span className="text-sm font-semibold opacity-60">
                Année de parution : {currentSet.releaseDate}
              </span>
            )}
          </div>

          {/* Corps central avec visuels */}
          <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-8 text-center">
            {setData?.logo && (
              <img
                src={`${setData.logo}.png`}
                alt={currentSet.name}
                className="max-h-36 max-w-sm object-contain drop-shadow-md"
              />
            )}

            {setData?.symbol && (
              <div className="p-4 border-2 border-dashed border-current/20 rounded-full">
                <img
                  src={`${setData.symbol}.png`}
                  alt="Symbole"
                  className="w-16 h-16 object-contain"
                />
              </div>
            )}

            <div className="space-y-1">
              <div className="text-3xl font-extrabold tracking-tight">
                {setData?.cardCount?.official || "???"} Cartes Officielles
              </div>
              {setData?.cardCount?.total && setData.cardCount.total !== setData.cardCount.official && (
                <div className="text-sm opacity-60 font-medium">
                  {setData.cardCount.total} cartes au total avec les secrètes
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
              <div className="p-2 bg-white rounded-xl border border-slate-200">
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