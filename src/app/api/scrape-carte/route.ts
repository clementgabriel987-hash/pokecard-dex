// src/app/api/scrape-carte/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  // On récupère les paramètres de l'URL (ex: ?set=sv01&id=15)
  const { searchParams } = new URL(request.url);
  const setId = searchParams.get('set'); 
  const localId = searchParams.get('id'); 

  if (!setId || !localId) {
    return NextResponse.json({ error: 'Il manque le set ou l\'ID' }, { status: 400 });
  }

  try {
    // 1. On fabrique l'URL de la carte sur Pokécardex (ex: SV1 / 15)
    // Note: Il faudra peut-être adapter le code de la série selon les abréviations de Pokécardex
    const url = `https://www.pokecardex.com/series/fr/${setId.toUpperCase()}/${localId}`;
    
    // 2. Le serveur va visiter la page web comme un utilisateur normal
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) throw new Error('Page introuvable sur Pokécardex');
    
    // 3. On aspire le code HTML de la page
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // 4. L'astuce magique : sur la plupart des sites, l'image HD est cachée dans la balise "og:image" (utilisée pour les aperçus Twitter/Discord)
    let imageUrl = $('meta[property="og:image"]').attr('content');

    // Si on ne la trouve pas là, on cherche la balise image classique de Pokécardex
    if (!imageUrl) {
      imageUrl = $('.card-image img').attr('src'); 
    }

    if (imageUrl) {
      // Si l'URL est relative (ex: /images/carte.jpg), on rajoute le domaine devant
      if (imageUrl.startsWith('/')) {
        imageUrl = `https://www.pokecardex.com${imageUrl}`;
      }
      return NextResponse.json({ imageUrl });
    } else {
      return NextResponse.json({ error: 'Image introuvable dans le code source' }, { status: 404 });
    }
    
  } catch (error) {
    return NextResponse.json({ error: 'Erreur pendant le scraping' }, { status: 500 });
  }
}