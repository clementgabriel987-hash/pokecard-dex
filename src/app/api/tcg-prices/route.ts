import { NextResponse } from "next/server";

// Cache mémoire serveur pour éviter d'appeler TCGCSV à chaque clic (valable 1 heure)
let groupsCache: any[] | null = null;
let lastGroupsFetch = 0;
const pricesCache: Record<string, { timestamp: number; prices: Record<string, number> }> = {};

// Correspondances directes des séries populaires
const SET_NAME_MATCHES: Record<string, string> = {
  "sv08": "Surging Sparks",
  "sv08.5": "Prismatic Evolutions",
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
  "swsh12.5": "Crown Zenith",
  "swsh12": "Silver Tempest",
  "swsh11": "Lost Origin",
  "swsh10": "Astral Radiance",
  "swsh9": "Brilliant Stars",
  "swsh8": "Fusion Strike",
  "cel25": "Celebrations",
  "swsh7": "Evolving Skies",
  "pop1": "POP Series 1",
  "pop2": "POP Series 2",
  "pop3": "POP Series 3",
  "pop4": "POP Series 4",
  "pop5": "POP Series 5",
  "base1": "Base Set",
  "base2": "Jungle",
  "base3": "Fossil",
  "base4": "Base Set 2"
};

const USD_TO_EUR = 0.92; // Taux de conversion USD -> EUR

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const setId = searchParams.get("set") || "";
  const setName = searchParams.get("name") || "";

  if (!setId && !setName) {
    return NextResponse.json({ error: "Paramètre set manquant" }, { status: 400 });
  }

  // Vérification du cache local serveur
  if (pricesCache[setId] && Date.now() - pricesCache[setId].timestamp < 3600000) {
    return NextResponse.json({ success: true, prices: pricesCache[setId].prices });
  }

  const headers = {
    "User-Agent": "PokeCardGabrielApp/1.0",
    "Accept": "application/json"
  };

  try {
    // 1. Récupération des groupes TCGplayer (Pokémon categoryId: 3)
    if (!groupsCache || Date.now() - lastGroupsFetch > 86400000) {
      const gRes = await fetch("https://tcgcsv.com/tcgplayer/3/groups", { headers });
      if (gRes.ok) {
        const gData = await gRes.json();
        groupsCache = gData.results || [];
        lastGroupsFetch = Date.now();
      }
    }

    // 2. Recherche du groupe correspondant
    const searchTarget = (SET_NAME_MATCHES[setId] || setName || setId).toLowerCase();
    const matchedGroup = groupsCache?.find(g => 
      g.name.toLowerCase().includes(searchTarget) || 
      searchTarget.includes(g.name.toLowerCase())
    );

    if (!matchedGroup) {
      return NextResponse.json({ success: false, message: "Série non trouvée sur TCGplayer" });
    }

    const groupId = matchedGroup.groupId;

    // 3. Récupération des cartes (products) et des prix (prices) en parallèle
    const [productsRes, pricesRes] = await Promise.all([
      fetch(`https://tcgcsv.com/tcgplayer/3/${groupId}/products`, { headers }),
      fetch(`https://tcgcsv.com/tcgplayer/3/${groupId}/prices`, { headers })
    ]);

    if (!productsRes.ok || !pricesRes.ok) {
      return NextResponse.json({ success: false, message: "Erreur lors de la récupération TCGCSV" });
    }

    const productsData = await productsRes.json();
    const pricesData = await pricesRes.json();

    const priceMap: Record<number, number> = {};
    for (const p of pricesData.results || []) {
      // Priorité au marketPrice, sinon midPrice
      const val = p.marketPrice || p.midPrice || p.lowPrice;
      if (val && val > 0) {
        if (!priceMap[p.productId] || (p.subTypeName === "Normal" && p.marketPrice)) {
          priceMap[p.productId] = val * USD_TO_EUR;
        }
      }
    }

    // Associer par numéro de carte localId (#001, #002...) et par nom
    const finalPrices: Record<string, number> = {};
    for (const prod of productsData.results || []) {
      const price = priceMap[prod.productId];
      if (price) {
        // Recherche du numéro de carte dans extendedData
        const numField = prod.extendedData?.find((e: any) => e.name === "Number" || e.name === "CardNumber");
        if (numField?.value) {
          finalPrices[numField.value.toString()] = price;
          finalPrices[numField.value.toString().replace(/^0+/, "")] = price; // Sans les zéros initiaux
        }
        finalPrices[prod.cleanName.toLowerCase()] = price;
      }
    }

    pricesCache[setId] = { timestamp: Date.now(), prices: finalPrices };

    return NextResponse.json({ success: true, prices: finalPrices });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Erreur serveur TCGplayer" }, { status: 500 });
  }
}