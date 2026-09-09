import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// 🧠 Le "Cerveau" traducteur : convertit les codes TCGdex vers Pokécardex
function translateSetId(tcgdexId: string): string {
  let id = tcgdexId.toLowerCase();
  
  // 1. Les exceptions pures (Promos, Hors-séries)
  const exceptions: Record<string, string> = {
    'svp': 'PR-SV', 
    'swshp': 'PR-EB', 
    'smp': 'PR-SL', 
    'xyp': 'PR-XY',
    'bwp': 'PR-NB', 
    'hsp': 'PR-HS', 
    'dpp': 'PR-DP', 
    'basep': 'PR-W',
    'det1': 'DET' // <-- La correction pour Détective Pikachu est ici !
  };
  
  if (exceptions[id]) return exceptions[id];

  // 2. Remplacements dynamiques (Convertit les blocs Entiers)
  id = id.replace(/^sv0/, 'EV');  // sv01 -> EV1, sv03.5 -> EV3.5
  id = id.replace(/^sv/, 'EV');   // sv10 -> EV10
  id = id.replace(/^swsh/, 'EB'); // swsh1 -> EB1, swsh4.5 -> EB4.5
  id = id.replace(/^sm/, 'SL');   // sm1 -> SL1
  id = id.replace(/^bw/, 'NB');   // bw1 -> NB1
  id = id.replace(/^hgss/, 'HS'); // hgss1 -> HS1
  
  // Si c'est déjà bon (ex: xy1, ex1, pop1), ça le met juste en majuscules
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