// src/app/api/scrape-carte/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

function translateSetId(tcgdexId: string): string {
  let id = tcgdexId.toLowerCase();
  
  const exceptions: Record<string, string> = {
    'svp': 'PR-SV', 'swshp': 'PR-EB', 'smp': 'PR-SL', 'xyp': 'PR-XY',
    'bwp': 'PR-NB', 'hsp': 'PR-HS', 'dpp': 'PR-DP', 'basep': 'PR-W',
    'det1': 'DPK', 'cel25': 'CEL', 'cel25c': 'CEL',
    'dp1': 'DP', 'dp2': 'MT', 'dp3': 'SW', 'dp4': 'MD', 'dp5': 'LA', 'dp6': 'SF',
    'pl1': 'PL', 'pl2': 'RR', 'pl3': 'SV', 'pl4': 'AR',
    'hgss1': 'HS', 'hgss2': 'UL', 'hgss3': 'UD', 'hgss4': 'TM', 'col1': 'CL',
  };
  
  if (exceptions[id]) return exceptions[id];

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

  const pkxSetId = translateSetId(setId);
  const cleanId = localId.replace(/^0+/, '');

  try {
    const seriesUrl = `https://www.pokecardex.com/series/${pkxSetId}`;
    
    const response = await fetch(seriesUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Série introuvable' }, { status: 404 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // ✅ On type explicitement la variable en string pour éviter l'erreur TypeScript
    let cardImageUrl: string = '';

    $('a').each((i, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      
      if (href.startsWith('/carte/') && (text === cleanId || text === localId)) {
        const img = $(el).find('img').attr('src') || $(el).closest('.card-container, .card, li, div').find('img').attr('src') || '';
        if (img) {
          cardImageUrl = img;
          return false; 
        }
      }
    });

    if (cardImageUrl.length > 0) {
      if (cardImageUrl.startsWith('/')) {
        cardImageUrl = `https://www.pokecardex.com${cardImageUrl}`;
      }
      return NextResponse.json({ imageUrl: cardImageUrl });
    }

    return NextResponse.json({ error: 'Image non indexée' }, { status: 404 });

  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}