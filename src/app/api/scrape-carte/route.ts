// src/app/api/scrape-carte/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// 🧠 Le "Cerveau" traducteur
function translateSetId(tcgdexId: string): string {
  let id = tcgdexId.toLowerCase();
  
  const exceptions: Record<string, string> = {
    // Promos & Hors-Séries
    'svp': 'PR-SV', 'swshp': 'PR-EB', 'smp': 'PR-SL', 'xyp': 'PR-XY',
    'bwp': 'PR-NB', 'hsp': 'PR-HS', 'dpp': 'PR-DP', 'basep': 'PR-W',
    
    // Détective Pikachu & Célébrations
    'det1': 'DPK',     // Code officiel Pokécardex pour Détective Pikachu
    'cel25': 'CEL',    // Célébrations (Pokécardex utilise souvent CEL)
    'cel25c': 'CEL',
    
    // Bloc Diamant & Perle
    'dp1': 'DP', 'dp2': 'MT', 'dp3': 'SW', 'dp4': 'MD', 'dp5': 'LA', 'dp6': 'SF',
    
    // Bloc Platine
    'pl1': 'PL', 'pl2': 'RR', 'pl3': 'SV', 'pl4': 'AR',
    
    // Bloc HeartGold & SoulSilver
    'hgss1': 'HS', 'hgss2': 'UL', 'hgss3': 'UD', 'hgss4': 'TM', 'col1': 'CL',
  };
  
  if (exceptions[id]) return exceptions[id];

  // Blocs modernes
  id = id.replace(/^sv0/, 'EV').replace(/^sv/, 'EV');
  id = id.replace(/^swsh/, 'EB').replace(/^sm/, 'SL').replace(/^bw/, 'NB');
  return id.toUpperCase();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const setId = searchParams.get('set'); 
  const localId = searchParams.get('id'); 

  if (!setId || !localId) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
  }

  try {
    const pkxSetId = translateSetId(setId);

    // 🚀 MÉTHODE 1 : Test direct de l'image (Ultra Rapide)
    // On teste plusieurs formats possibles sur Pokécardex
    const possibleImages = [
      `https://www.pokecardex.com/assets/images/cartes/fr/${pkxSetId}/${localId}.jpg`,
      `https://www.pokecardex.com/assets/images/cartes/fr/${pkxSetId}/${localId}.png`,
      `https://www.pokecardex.com/assets/images/cartes/${pkxSetId}/${localId}.jpg`,
      `https://www.pokecardex.com/assets/images/cartes/${pkxSetId}/${localId}.png`
    ];

    for (const imgUrl of possibleImages) {
      try {
        const headRes = await fetch(imgUrl, { method: 'HEAD' });
        if (headRes.ok) {
          console.log(`[Scraper] ⚡ Image directe trouvée : ${imgUrl}`);
          return NextResponse.json({ imageUrl: imgUrl });
        }
      } catch (e) { /* on ignore et on tente le suivant */ }
    }

    // 🐢 MÉTHODE 2 : L'arme fatale (Scraping de la page de la série complète)
    // Ex: https://www.pokecardex.com/series/DP
    const seriesUrl = `https://www.pokecardex.com/series/${pkxSetId}`;
    console.log(`[Scraper] 🔍 Scraping de la page série complète : ${seriesUrl}`);
    
    const response = await fetch(seriesUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html'
      }
    });
    
    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);
      let foundImageUrl: string | null = null;
      
      // On fouille dans TOUTES les images de la page de la série
      $('img').each((i, el) => {
        const src = $(el).attr('src');
        
        // Si l'image contient le code de la série (ex: /DP/ ou /DPK/)
        if (src && src.includes(`/${pkxSetId}/`)) {
          // On vérifie si le nom du fichier correspond au numéro de la carte (ex: /1.jpg, /01.jpg)
          const regexStrict = new RegExp(`/${localId}\\.(jpg|png)$`, 'i');
          const regexPadded = new RegExp(`/0+${localId}\\.(jpg|png)$`, 'i'); 
          
          if (regexStrict.test(src) || regexPadded.test(src)) {
             foundImageUrl = src;
             return false; // Ça arrête la boucle, on a trouvé !
          }
        }
      });

      if (foundImageUrl) {
        if (foundImageUrl.startsWith('/')) {
          foundImageUrl = `https://www.pokecardex.com${foundImageUrl}`;
        }
        console.log(`[Scraper] ✅ Image extraite de la page série : ${foundImageUrl}`);
        return NextResponse.json({ imageUrl: foundImageUrl });
      }
    }
    
    console.log(`[Scraper] ❌ Échec total pour le set ${pkxSetId} (carte ${localId})`);
    return NextResponse.json({ error: 'Image introuvable sur la page série' }, { status: 404 });
  } catch (error: any) {
    console.error(`[Scraper] 💥 Erreur API :`, error.message);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}