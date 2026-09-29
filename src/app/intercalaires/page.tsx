"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "../../../lib/supabase";
import { POKEMON_BLOCKS } from "../../../constants/pokemonSets";

interface SetItem {
  id: string;
  name: string;
  block: string;
  lang: string;
}

const ALL_SETS_FLAT: SetItem[] = POKEMON_BLOCKS.flatMap((b) =>
  b.sets.map((s) => ({ ...s, block: b.blockName }))
);

const TCG_IO_SETS = [
  "dp1", "pgo", "rumble", "det1", "hgss.p",
  "mcd11", "mcd12", "mcd14", "mcd15", "mcd16", "mcd17",
  "mcd18", "mcd19", "mcd21", "mcd22"
];

export default function IntercalairesPage() {
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
            const releaseDate = json.data?.[0]?.set?.releaseDate || "—";
            setSetData({
              name: currentSet.name,
              cardCount: { official: totalCards, total: totalCards },
              releaseDate: releaseDate,
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
              releaseDate: null,
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

  const getImageUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.endsWith(".png") || url.endsWith(".jpg") || url.endsWith(".webp") || url.endsWith(".svg")) {
      return url;
    }
    return `${url}.png`;
  };

  const logoUrl = getImageUrl(setData?.logo) || `/logos/${currentSet.id}.png`;
  const symbolUrl = getImageUrl(setData?.symbol);
  const displayYear = setData?.releaseDate ? setData.releaseDate.slice(0, 4) : null;

  return (
    <main className="min-h-screen bg-[#09090B] text-white font-sans font-['Outfit'] print:bg-white print:text-black">
      
      {/* ========================================= */}
      {/* INTERFACE UTILISATEUR (Masquée à l'impression) */}
      {/* ========================================= */}
      <div className="print:hidden max-w-[1260px] mx-auto px-4 md:px-8 py-10 flex flex-col gap-8">
        
        {/* En-tête et Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-6">
          <div>
            <Link href="/" className="text-zinc-500 hover:text-white transition text-sm mb-4 inline-block">
              &larr; Retour au site
            </Link>
            <h1 className="text-3xl md:text-[40px] font-normal leading-tight text-white">
              Générateur d'Intercalaires A4
            </h1>
            <p className="text-zinc-500 text-base md:text-lg mt-1">
              {ALL_SETS_FLAT.length} extensions disponibles pour tes classeurs.
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="w-full md:w-auto bg-rose-500 text-white text-base md:text-lg font-medium px-6 py-3 rounded-xl outline outline-1 outline-white/10 hover:bg-rose-600 transition-colors shadow-[0_0_15px_rgba(244,63,94,0.3)] shrink-0"
          >
            Imprimer / Sauvegarder en PDF
          </button>
        </div>

        {/* Panneau de configuration DA Dark */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-[#18181B] border border-white/10 p-6 md:p-8 rounded-[24px]">
          
          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-rose-500 mb-2.5">
                Choisir l'extension :
              </label>
              <div className="relative">
                <select
                  value={selectedSetId}
                  onChange={(e) => setSelectedSetId(e.target.value)}
                  className="w-full appearance-none bg-[#09090B] border border-white/10 text-white rounded-xl p-3.5 text-sm outline-none focus:border-rose-500 transition-colors cursor-pointer pr-10 shadow-inner"
                >
                  {POKEMON_BLOCKS.map((block) => (
                    <optgroup key={block.blockName} label={block.blockName} className="bg-[#18181B] text-zinc-400">
                      {block.sets.map((s) => (
                        <option key={s.id} value={s.id} className="text-white">
                          {s.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-rose-500 mb-2.5">
                Annotation personnalisée :
              </label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Ex: Classeur Principal #1"
                className="w-full bg-[#09090B] border border-white/10 text-white rounded-xl p-3.5 text-sm outline-none focus:border-rose-500 transition-colors shadow-inner"
              />
            </div>
          </div>

          <div className="flex flex-col gap-5 justify-center bg-[#09090B] border border-white/5 rounded-xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-500">Options d'impression</h3>
            
            <div className="flex flex-col gap-4">
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="self-start px-4 py-2 bg-[#18181B] border border-white/10 rounded-lg text-sm font-medium hover:bg-white/5 transition cursor-pointer text-zinc-300"
              >
                {theme === "light" ? "Mode Clair (Éco d'encre)" : "Mode Sombre (Collector)"}
              </button>
              
              <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer group w-max">
                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${showQRCode ? 'bg-rose-500 border-rose-500' : 'bg-[#18181B] border-white/10 group-hover:border-white/30'}`}>
                  {showQRCode && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                </div>
                <input type="checkbox" className="hidden" checked={showQRCode} onChange={(e) => setShowQRCode(e.target.checked)} />
                Afficher le QR Code d'accès rapide
              </label>
              
              <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer group w-max">
                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${showStats ? 'bg-rose-500 border-rose-500' : 'bg-[#18181B] border-white/10 group-hover:border-white/30'}`}>
                  {showStats && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                </div>
                <input type="checkbox" className="hidden" checked={showStats} onChange={(e) => setShowStats(e.target.checked)} />
                Afficher la progression de la collection
              </label>
            </div>
          </div>
          
        </div>
      </div>

      {/* ========================================= */}
      {/* RENDU FEUILLE A4 (Prévisualisation + Impression) */}
      {/* ========================================= */}
      <div className="flex justify-center p-0 md:p-6 print:p-0 print:m-0 w-full overflow-x-auto">
        <div
          id="intercalaire-page"
          className={`w-[210mm] h-[297mm] max-h-[297mm] p-[10mm] flex flex-col justify-between border print:border-none shadow-2xl print:shadow-none transition-colors duration-200 overflow-hidden box-border shrink-0 ${
            theme === "dark" ? "bg-[#09090B] border-white/10 text-white" : "bg-white border-zinc-200 text-zinc-900"
          }`}
        >
          {/* En-tête de la page A4 */}
          <div className={`text-center border-b-2 pb-4 shrink-0 ${theme === "dark" ? "border-white/10" : "border-zinc-200"}`}>
            <span className={`text-[12px] font-bold tracking-[0.25em] uppercase block mb-1 ${theme === "dark" ? "text-rose-500" : "text-rose-600"}`}>
              {currentSet.block}
            </span>
            <h2 className="text-4xl font-black uppercase tracking-tight mb-1">
              {currentSet.name}
            </h2>
            {displayYear && (
              <span className={`text-sm font-semibold ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                Année de parution : {displayYear}
              </span>
            )}
          </div>

          {/* Corps central (Logo + Infos) */}
          <div className="flex-1 flex flex-col items-center justify-center py-6 space-y-6 text-center">
            {logoUrl && !logoFailed ? (
              <img
                src={logoUrl}
                alt={currentSet.name}
                className={`max-h-36 max-w-sm object-contain ${theme === "dark" ? "drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" : "drop-shadow-sm"}`}
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <div className="w-24 h-24 border-2 border-dashed border-current/20 rounded-2xl flex items-center justify-center text-4xl opacity-50">
                🃏
              </div>
            )}

            {symbolUrl && !symbolFailed ? (
              <div className={`p-3 border-2 rounded-full ${theme === "dark" ? "border-white/10 bg-[#18181B]" : "border-zinc-200 bg-zinc-50"}`}>
                <img
                  src={symbolUrl}
                  alt="Symbole de l'extension"
                  className="w-12 h-12 object-contain"
                  onError={() => setSymbolFailed(true)}
                />
              </div>
            ) : null}

            <div className="space-y-1">
              <div className="text-3xl font-extrabold tracking-tight">
                {setData?.cardCount?.official || "—"} Cartes
              </div>
              {setData?.cardCount?.total && setData.cardCount.total !== setData.cardCount.official && (
                <div className={`text-xs font-semibold ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                  {setData.cardCount.total} cartes avec les secrètes
                </div>
              )}
            </div>

            {customNote && (
              <div className={`inline-block px-4 py-1.5 border rounded-full text-xs font-bold tracking-wider uppercase ${theme === "dark" ? "border-rose-500/30 text-rose-400 bg-rose-500/10" : "border-rose-200 text-rose-600 bg-rose-50"}`}>
                {customNote}
              </div>
            )}

            {showStats && (
              <div className={`w-full max-w-md border rounded-2xl p-4 mt-4 ${theme === "dark" ? "border-white/10 bg-[#18181B]" : "border-zinc-200 bg-zinc-50"}`}>
                <div className={`text-[10px] font-extrabold uppercase tracking-wider text-center mb-3 ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
                  Progression du Classeur
                </div>
                <div className={`grid grid-cols-2 gap-4 text-center pt-3 border-t ${theme === "dark" ? "border-white/5" : "border-zinc-200"}`}>
                  <div>
                    <span className={`text-[10px] block font-bold uppercase mb-1 ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>Cartes Normales</span>
                    <span className="text-xl font-black">{collectionCount.normal} <span className="text-sm font-medium opacity-50">possédées</span></span>
                  </div>
                  <div>
                    <span className={`text-[10px] block font-bold uppercase mb-1 ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>Cartes Foils</span>
                    <span className="text-xl font-black">{collectionCount.foil} <span className="text-sm font-medium opacity-50">possédées</span></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pied de page (QR Code) */}
          <div className={`border-t-2 pt-4 pb-2 flex items-center justify-between shrink-0 ${theme === "dark" ? "border-white/10" : "border-zinc-200"}`}>
            <div className="space-y-1 text-left">
              <span className={`text-[12px] font-bold uppercase tracking-wider block ${theme === "dark" ? "text-white" : "text-zinc-900"}`}>Inventaire Numérique</span>
              <span className={`text-[11px] block ${theme === "dark" ? "text-zinc-500" : "text-zinc-500"}`}>Scannez pour ouvrir l'extension sur le Pokédex</span>
            </div>

            {showQRCode && (
              <div className="p-2 bg-white rounded-xl border border-zinc-200 shrink-0">
                <QRCodeSVG value={appSetUrl} size={64} />
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
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            height: 100% !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #intercalaire-page {
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </main>
  );
}