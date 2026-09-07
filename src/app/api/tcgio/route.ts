import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const setId = searchParams.get('setId');

  if (!setId) {
    return NextResponse.json({ error: 'Il manque le paramètre setId' }, { status: 400 });
  }

  try {
    // Le serveur Next.js interroge l'API officielle (aucun blocage CORS de serveur à serveur)
    const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&pageSize=250`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des données' }, { status: 500 });
  }
}