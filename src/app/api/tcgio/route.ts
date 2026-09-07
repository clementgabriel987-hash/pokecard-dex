import { NextResponse } from 'next/server';

// INDISPENSABLE SUR VERCEL : Empêche Next.js de mettre cette route en cache
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const setId = searchParams.get('setId');

  if (!setId) {
    return NextResponse.json({ error: 'Il manque le paramètre setId' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&pageSize=250`, {
      headers: {
        // On se déguise en navigateur classique pour passer les sécurités anti-bots
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });

    // Si l'API bloque toujours, on capture l'erreur exacte
    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ 
        error: `L'API a répondu avec le statut ${response.status}`, 
        details: text 
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    // Si ça plante, on renvoie le message d'erreur exact pour comprendre
    return NextResponse.json({ 
      error: 'Erreur Serveur Interne', 
      message: error.message 
    }, { status: 500 });
  }
}