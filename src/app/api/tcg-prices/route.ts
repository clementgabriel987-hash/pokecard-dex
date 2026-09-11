import { NextResponse } from "next/server";

// Cache mémoire serveur (1h pour les prix, 24h pour la liste des groupes)
let groupsCache: any[] | null = null;
let lastGroupsFetch = 0;
const pricesCache: Record<string, { timestamp: number; prices: Record<string, number> }> = {};

// Correspondances entre identifiants du projet et noms de sets officiels TCGplayer
const SET_NAME_MATCHES: Record<string, string> = {
  // Méga-Évolution
  "me01": "Mega Evolution",
  "me02": "Phantasmal Flames",
  "me02.5": "Transcendent Heroes",
  "me03": "Perfect Equilibrium",
  "me04": "Rising Chaos",
  "me05": "Pitch Black", // Nuit Noire

  // Écarlate & Violet
  "sv08.5": "Prismatic Evolutions",
  "sv08": "Surging Sparks",
  "sv07": "Stellar Crown",
  "sv06.5": "Shrouded Fable",
  "sv06": "Twilight Masquerade",
  "sv05": "Temporal Forces",
  "sv04.5": "Paldean Fates",
  "sv04": "Paradox Rift",
  "sv03.5": "151",
  "sv03": "Obsidian Flames",
  "sv02": "Paldea Evolved",
  "sv01": "Scarlet & Violet",

  // Épée & Bouclier
  "swsh12.5": "Crown Zenith",
  "swsh12": "Silver Tempest",
  "swsh11": "Lost Origin",
  "swsh10": "Astral Radiance",
  "swsh9": "Brilliant Stars",
  "swsh8": "Fusion Strike",
  "cel25": "Celebrations",
  "swsh7": "Evolving Skies",
  "swsh6": "Chilling Reign",
  "swsh5": "Battle Styles",
  "swsh4.5": "Shining Fates",
  "swsh4": "Vivid Voltage",
  "swsh3.5": "Champion's Path",
  "swsh3": "Darkness Ablaze",
  "swsh2": "Rebel Clash",
  "swsh1": "Sword & Shield",

  // Séries POP
  "pop1": "POP Series 1",
  "pop2": "POP Series 2",
  "pop3": "POP Series 3",
  "pop4": "POP Series 4",
  "pop5": "POP Series 5",
  "pop6": "POP Series 6",
  "pop7": "POP Series 7",
  "pop8": "POP Series 8",
  "pop9": "POP Series 9",

  // Wizards Classic
  "base1": "Base Set",
  "base2": "Jungle",
  "base3": "Fossil",
  "base4": "Base Set 2",
  "gym1": "Gym Heroes",
  "neo1": "Neo Genesis",
  "neo2": "Neo Discovery",
  "neo3": "Neo Revelation",
  "neo4": "Neo Destiny"
};

const USD_TO_EUR = 0.92;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const setId = searchParams.get("set") || "";
  const setName = searchParams.get("name") || "";

  if (!setId && !setName) {
    return NextResponse.json({ error: "Paramètre set manquant" }, { status: 400 });
  }

  // Retour du cache mémoire si disponible
  if (pricesCache[setId] && Date.now() - pricesCache[setId].timestamp < 3600000) {
    return NextResponse.json({ success: true, prices: pricesCache[setId].prices });
  }

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json"
  };

  try {
    // 1. Récupération des groupes TCGplayer (catégorie Pokémon = 3)
    if (!groupsCache || Date.now() - lastGroupsFetch > 86400000) {
      const gRes = await fetch("https://tcgcsv.com/tcgplayer/3/groups", { headers, next: { revalidate: 86400 } });
      if (gRes.ok) {
        const gData = await gRes.json();
        groupsCache = gData.results || [];
        lastGroupsFetch = Date.now();
      }
    }

    // 2. Recherche du groupe correspondant
    const searchTarget = (SET_NAME_MATCHES[setId] || setName || setId).toLowerCase().trim();
    let matchedGroup = groupsCache?.find(g => g.name.toLowerCase() === searchTarget);

    if (!matchedGroup) {
      matchedGroup = groupsCache?.find(g => 
        g.name.toLowerCase().includes(searchTarget) || 
        searchTarget.includes(g.name.toLowerCase())
      );
    }

    if (!matchedGroup) {
      return NextResponse.json({ success: false, message: "Série introuvable sur TCGplayer", prices: {} });
    }

    const groupId = matchedGroup.groupId;

    // 3. Récupération des produits et des prix du set
    const [productsRes, pricesRes] = await Promise.all([
      fetch(`https://tcgcsv.com/tcgplayer/3/${groupId}/products`, { headers, next: { revalidate: 3600 } }),
      fetch(`https://tcgcsv.com/tcgplayer/3/${groupId}/prices`, { headers, next: { revalidate: 3600 } })
    ]);

    if (!productsRes.ok || !pricesRes.ok) {
      return NextResponse.json({ success: false, message: "Données de prix non disponibles", prices: {} });
    }

    const productsData = await productsRes.json();
    const pricesData = await pricesRes.json();

    // Table de correspondance productId -> Prix en €
    const priceMap: Record<number, number> = {};
    for (const p of pricesData.results || []) {
      const val = p.marketPrice || p.midPrice || p.lowPrice;
      if (val && val > 0) {
        const eurVal = Number((val * USD_TO_EUR).toFixed(2));
        if (!priceMap[p.productId] || p.subTypeName === "Normal") {
          priceMap[p.productId] = eurVal;
        }
      }
    }

    // Indexation par numéro de carte et par nom
    const finalPrices: Record<string, number> = {};
    for (const prod of productsData.results || []) {
      const price = priceMap[prod.productId];
      if (price) {
        const numField = prod.extendedData?.find((e: any) => e.name === "Number" || e.name === "CardNumber");
        if (numField?.value) {
          const rawNum = numField.value.toString().trim();
          const cleanNum = rawNum.replace(/^0+/, "");
          finalPrices[rawNum] = price;
          finalPrices[cleanNum] = price;
        }
        if (prod.cleanName) {
          finalPrices[prod.cleanName.toLowerCase()] = price;
        }
      }
    }

    pricesCache[setId] = { timestamp: Date.now(), prices: finalPrices };

    return NextResponse.json({ success: true, prices: finalPrices });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Erreur serveur TCGplayer", prices: {} }, { status: 500 });
  }
}