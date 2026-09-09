// src/app/api/scrape-carte/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// 🧠 Le "Cerveau" traducteur : convertit les codes TCGdex vers Pokécardex
function translateSetId(tcgdexId: string): string {
  let id = tcgdexId.toLowerCase();
  
  // 1. Les exceptions pures et les anciens blocs (Le dictionnaire de traduction)
  const exceptions: Record<string, string> = {
    // Promos & Hors-Séries
    'svp': 'PR-SV', 
    'swshp': 'PR-EB', 
    'smp': 'PR-SL', 
    'xyp': 'PR-XY',
    'bwp': 'PR-NB', 
    'hsp': 'PR-HS', 
    'dpp': 'PR-DP', 
    'basep': 'PR-W',
    'det1': 'DET', 
    
    // Bloc Diamant & Perle (Pokécardex utilise les abréviations US)
    'dp1': 'DP',   // Diamant & Perle de base
    'dp2': 'MT',   // Trésors Mystérieux (Mysterious Treasures)
    'dp3': 'SW',   // Merveilles Secrètes (Secret Wonders)
    'dp4': 'MD',   // Aube Majestueuse (Majestic Dawn)
    'dp5': 'LA',   // Éveil des Légendes (Legends Awakened)
    'dp6': 'SF',   // Tempête (Stormfront)

    // Bloc Platine
    'pl1': 'PL',   // Platine
    'pl2': 'RR',   // Rivaux Émergents (Rising Rivals)
    'pl3': 'SV',   // Vainqueurs Suprêmes (Supreme Victors)
    'pl4': 'AR',   // Arceus

    // Bloc HeartGold & SoulSilver
    'hgss1': 'HS', // HeartGold SoulSilver
    'hgss2': 'UL', // Déchaînement (Unleashed)
    'hgss3': 'UD', // Indomptable (Undaunted)
    'hgss4': 'TM', // Triomphant (Triumphant)
    'col1': 'CL',  // Appel des Légendes (Call of Legends)
  };
  
  if (exceptions[id]) return exceptions[id];

  // 2. Remplacements dynamiques (Convertit les blocs modernes logiques)
  id = id.replace(/^sv0/, 'EV');  // sv01 -> EV1, sv03.5 -> EV3.5
  id = id.replace(/^sv/, 'EV');   // sv10 -> EV10
  id = id.replace(/^swsh/, 'EB'); // swsh1 -> EB1, swsh4.5 -> EB4.5
  id = id.replace(/^sm/, 'SL');   // sm1 -> SL1
  id = id.replace(/^bw/, 'NB');   // bw1 -> NB1
  
  // Si c'est déjà bon (ex: xy1, ex1), ça le met juste en majuscules
  return id.toUpperCase();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const setId = searchParams.get('set'); 
  const localId = searchParams.get('id'); 

  if (!setId || !localId) {
    return NextResponse.json({ error: 'Il manque le set ou l\'ID' }, { status: 400 });
  }

  try {
    // On passe le code TCGdex dans la moulinette
    const pkxSetId = translateSetId(setId);

    // On fabrique l'URL exacte de Pokécardex
    const url = `https://www.pokecardex.com/series/fr/${pkxSetId}/${localId}`;
    
    console.log(`[Scraper] 🔍 Recherche sur : ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });
    
    if (!response.ok) {
      console.log(`[Scraper] ❌ Erreur ${response.status} pour ${url}`);
      return NextResponse.json({ error: 'Page introuvable sur Pokécardex' }, { status: 404 });
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // On cherche l'image HD
    let imageUrl = $('meta[property="og:image"]').attr('content');

    if (!imageUrl) {
      imageUrl = $('.card-image img').attr('src'); 
    }

    if (imageUrl) {
      if (imageUrl.startsWith('/')) {
        imageUrl = `https://www.pokecardex.com${imageUrl}`;
      }
      console.log(`[Scraper] ✅ Trouvé ! -> ${imageUrl}`);
      return NextResponse.json({ imageUrl });
    } else {
      return NextResponse.json({ error: 'Image introuvable dans le code HTML' }, { status: 404 });
    }
    
  } catch (error: any) {
    console.error(`[Scraper] 💥 Erreur interne :`, error.message);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}