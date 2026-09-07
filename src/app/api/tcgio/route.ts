import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const setId = searchParams.get('setId');

  if (!setId) {
    return NextResponse.json({ error: 'Il manque le paramètre setId' }, { status: 400 });
  }

  try {
    // La requête VIP avec TA clé API
    const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&pageSize=250`, {
      headers: {
        'X-Api-Key': '7c2bb80f-679f-48a2-a682-da0396517cb2', // Ta clé secrète !
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: `Erreur Cloudflare ${response.status}`, details: text }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur Serveur', message: error.message }, { status: 500 });
  }
}