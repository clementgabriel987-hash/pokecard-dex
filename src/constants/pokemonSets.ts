export interface PokemonSet {
  id: string;
  name: string;
  lang: string;
  seriesName?: string;
}

export interface PokemonBlock {
  blockName: string;
  sets: PokemonSet[];
}

export const POKEMON_BLOCKS: PokemonBlock[] = [
  {
    blockName: "Cartes Promotionnelles",
    sets: [
      { id: "svp", name: "écarlate & Violet Promos", lang: "fr" },
      { id: "swshp", name: "SWSH Black Star Promos", lang: "fr" },
      { id: "smp", name: "SM Black Star Promos", lang: "fr" },
      { id: "xyp", name: "XY Black Star Promos", lang: "fr" },
      { id: "bwp", name: "BW Black Star Promos", lang: "fr" },
      { id: "hgss.p", name: "HGSS Black Star Promos", lang: "en" },
      { id: "dpp", name: "DP Black Star Promos", lang: "en" },
      { id: "basep", name: "Wizards Black Star Promos", lang: "en" },
      { id: "mep", name: "Mega-Evolution Black Star Promos", lang: "en" }
    ]
  },
  {
    blockName: "Hors-Séries",
    sets: [
      { id: "30c", name: "30th Celebration / 30 Ans (FR/EN)", lang: "en" },
      { id: "det1", name: "Détective Pikachu", lang: "en" },
      { id: "pgo", name: "Pokémon GO", lang: "en" },
      { id: "rumble", name: "Pokémon Rumble", lang: "en" },
    ]
  },
  {
    blockName: "Bloc Wizards",
    sets: [
      { id: "base1", name: "Base Set (FR)", lang: "fr" },
      { id: "base2", name: "Jungle (FR)", lang: "fr" },
      { id: "base3", name: "Fossile (FR)", lang: "fr" },
      { id: "base4", name: "Base Set 2 (EN)", lang: "en" },
      { id: "gym1", name: "Gym Heroes (EN)", lang: "en" },
      { id: "gym2", name: "Gym Challenge (EN)", lang: "en" },
      { id: "neo1", name: "Neo Genesis (FR)", lang: "fr" },
      { id: "neo2", name: "Neo Discovery (FR)", lang: "fr" },
      { id: "neo3", name: "Neo Revelation (EN)", lang: "en" },
      { id: "neo4", name: "Neo Destiny (EN)", lang: "en" }
    ]
  },{
    blockName: "Séries POP",
    sets: [
      { id: "pop1", name: "POP Series 1", lang: "fr" },
      { id: "pop2", name: "POP Series 2", lang: "fr" },
      { id: "pop3", name: "POP Series 3", lang: "fr" },
      { id: "pop4", name: "POP Series 4", lang: "fr" },
      { id: "pop5", name: "POP Series 5", lang: "fr" },
      { id: "pop6", name: "POP Series 6", lang: "fr" },
      { id: "pop7", name: "POP Series 7", lang: "fr" },
      { id: "pop8", name: "POP Series 8", lang: "fr" },
      { id: "pop9", name: "POP Series 9", lang: "fr" }
    ]
  },
  {
    blockName: "Bloc EX",
    sets: [
      { id: "ex1", name: "EX Rubis & Saphir (FR)", lang: "fr" },
      { id: "ex2", name: "EX Tempête de Sable (FR)", lang: "fr" },
      { id: "ex3", name: "EX Dragon (FR)", lang: "fr" },
      { id: "ex4", name: "EX Team Magma vs Team Aqua (FR)", lang: "fr" },
      { id: "ex5", name: "EX Légendes Oubliées (FR)", lang: "fr" },
      { id: "ex6", name: "EX Rouge Feu & Vert Feuille (FR)", lang: "fr" },
      { id: "ex7", name: "EX Team Rocket Returns (EN)", lang: "en" },
      { id: "ex8", name: "EX Deoxys (FR)", lang: "fr" },
      { id: "ex9", name: "EX Émeraude (FR)", lang: "fr" },
      { id: "ex10", name: "EX Forces Cachées (FR)", lang: "fr" },
      { id: "ex11", name: "EX Espèces Delta (FR)", lang: "fr" },
      { id: "ex12", name: "EX Créateurs de Légendes (FR)", lang: "fr" },
      { id: "ex13", name: "EX Fantômes Holon (FR)", lang: "fr" },
      { id: "ex14", name: "EX Gardiens de Cristal (FR)", lang: "fr" },
      { id: "ex15", name: "EX Île des Dragons (FR)", lang: "fr" },
      { id: "ex16", name: "EX Gardiens du Pouvoir (FR)", lang: "fr" }
    ]
  },
  {
    blockName: "Bloc Diamant & Perle",
    sets: [
      { id: "dp1", name: "Diamant & Perle (FR)", lang: "en" },
      { id: "dp2", name: "Trésors Mystérieux (FR)", lang: "fr" },
      { id: "dp3", name: "Merveilles Secrètes / Duels au Sommet (FR/EN)", lang: "en" },
      { id: "dp4", name: "Secret Wonders / Duels au Sommet (EN)", lang: "en" },
      { id: "dp5", name: "Éveil des Légendes (FR)", lang: "fr" },
      { id: "dp6", name: "Tempête (FR)", lang: "fr" }
    ]
  },
  {
    blockName: "Bloc Platine",
    sets: [
      { id: "pl1", name: "Platine de base (FR)", lang: "fr" },
      { id: "pl2", name: "Rivaux Émergents (FR)", lang: "fr" },
      { id: "pl3", name: "Vainqueurs Suprêmes (FR)", lang: "fr" },
      { id: "pl4", name: "Arceus (FR)", lang: "fr" }
    ]
  },
  {
    blockName: "Bloc HeartGold & SoulSilver",
    sets: [
      { id: "hgss1", name: "HeartGold & SoulSilver (FR)", lang: "fr" },
      { id: "hgss2", name: "HS - Déchaînement (FR)", lang: "fr" },
      { id: "hgss3", name: "HS - Indomptable (FR)", lang: "fr" },
      { id: "hgss4", name: "HS - Triomphe (FR)", lang: "fr" },
      { id: "col1", name: "L'Appel des Légendes (FR)", lang: "fr" }
    ]
  },
  {
    blockName: "Bloc Noir & Blanc",
    sets: [
      { id: "bw1", name: "Noir & Blanc (FR)", lang: "fr" },
      { id: "bw2", name: "Pouvoirs Émergents (FR)", lang: "fr" },
      { id: "bw3", name: "Nobles Victoires (FR)", lang: "fr" },
      { id: "bw4", name: "Destinées Futures (FR)", lang: "fr" },
      { id: "bw5", name: "Explorateurs Obscurs (FR)", lang: "fr" },
      { id: "bw6", name: "Dragons Exaltés (FR)", lang: "fr" },
      { id: "dv1", name: "Coffret des Dragons (Dragon Vault)", lang: "en" },
      { id: "bw7", name: "Frontières Franchies (FR)", lang: "fr" },
      { id: "bw8", name: "Tempête Plasma (FR)", lang: "fr" },
      { id: "bw9", name: "Glaciation Plasma (FR)", lang: "fr" },
      { id: "bw10", name: "Explosion Plasma (FR)", lang: "fr" },
      { id: "bw11", name: "Trésors Légendaires (EN)", lang: "en" }
    ]
  },
  {
    blockName: "Bloc XY",
    sets: [
      { id: "xy0", name: "Bienvenue A Kalos(FR/EN)", lang: "en" },
      { id: "xy1", name: "XY de base (FR)", lang: "fr" },
      { id: "xy2", name: "Étincelles (FR)", lang: "fr" },
      { id: "xy3", name: "Poings Furieux (FR)", lang: "fr" },
      { id: "xy4", name: "Vigueur Spectrale (FR)", lang: "fr" },
      { id: "xy5", name: "Primo-Choc (FR)", lang: "fr" },
      { id: "xy6", name: "Ciel Rugissant (FR)", lang: "fr" },
      { id: "xy7", name: "Origines Antiques (FR)", lang: "fr" },
      { id: "xy8", name: "Impulsion Turbo (FR)", lang: "fr" },
      { id: "xy9", name: "Rupture Turbo (FR)", lang: "fr" },
      { id: "xy10", name: "Impact des Destins (FR)", lang: "fr" },
      { id: "xy11", name: "Offensive Vapeur (FR)", lang: "fr" },
      { id: "xy12", name: "Évolutions (FR)", lang: "fr" },
      { id: "g1", name: "Générations (FR)", lang: "fr" }
    ]
  },
  {
    blockName: "Bloc Soleil & Lune",
    sets: [
      { id: "sm1", name: "Soleil et Lune (FR)", lang: "fr" },
      { id: "sm2", name: "Gardiens Ascendants (FR)", lang: "fr" },
      { id: "sm3", name: "Ombres Ardentes (FR)", lang: "fr" },
      { id: "sm3.5", name: "Légendes Brillantes (FR)", lang: "fr" },
      { id: "sm4", name: "Invasion Carmin (FR)", lang: "fr" },
      { id: "sm5", name: "Ultra-Prisme (FR)", lang: "fr" },
      { id: "sm6", name: "Lumière Interdite (FR)", lang: "fr" },
      { id: "sm7", name: "Tempête Céleste (FR)", lang: "fr" },
      { id: "sm8", name: "Tonnerre Perdu (FR)", lang: "fr" },
      { id: "sm9", name: "Duo de Choc (FR)", lang: "fr" },
      { id: "sm10", name: "Alliance Infaillible (FR)", lang: "fr" },
      { id: "sm11", name: "Harmonie des Esprits (FR)", lang: "fr" },
      { id: "sm11.5", name: "Destinées Occultes (FR)", lang: "fr" },
      { id: "sma", name: "Destinées Occultes Shiny (FR)", lang: "en" },
      { id: "sm12", name: "Éclipse Cosmique (FR)", lang: "fr" }
    ]
  },
  {
    blockName: "Bloc Épée & Bouclier",
    sets: [
      { id: "swsh1", name: "Épée et Bouclier (FR)", lang: "fr" },
      { id: "swsh2", name: "Clash des Rebelles (FR)", lang: "fr" },
      { id: "swsh3", name: "Ténèbres Embrasées (FR)", lang: "fr" },
      { id: "swsh3.5", name: "La Voie du Maître (FR)", lang: "fr" },
      { id: "swsh4", name: "Voltage Éclatant (FR)", lang: "fr" },
      { id: "swsh4.5", name: "Destinées Radieuses (FR)", lang: "fr" },
      { id: "swsh5", name: "Styles de Combat (FR)", lang: "fr" },
      { id: "swsh6", name: "Règne de Glace (FR)", lang: "fr" },
      { id: "swsh7", name: "Évolution Céleste (FR)", lang: "fr" },
      { id: "cel25", name: "Célébrations (FR)", lang: "fr" },
      { id: "swsh8", name: "Poing de Fusion (FR)", lang: "fr" },
      { id: "swsh9", name: "Stars Étincelantes (FR)", lang: "fr" },
      { id: "swsh10", name: "Astres Radieux (FR)", lang: "fr" },
      { id: "swsh11", name: "Origine Perdue (FR)", lang: "fr" },
      { id: "swsh12", name: "Tempête Argentée (FR)", lang: "fr" },
      { id: "swsh12.5", name: "Zénith Suprême (FR)", lang: "fr" }
    ]
  },
  {
    blockName: "Bloc Écarlate & Violet",
    sets: [
      { id: "sv01", name: "Écarlate et Violet (FR)", lang: "fr" },
      { id: "sv02", name: "Évolutions à Paldea (FR)", lang: "fr" },
      { id: "sv03", name: "Flammes Obsidiennes (FR)", lang: "fr" },
      { id: "sv03.5", name: "151 (FR)", lang: "fr" },
      { id: "sv04", name: "Faille Paradoxe (FR)", lang: "fr" },
      { id: "sv04.5", name: "Destinées de Paldea (FR)", lang: "fr" },
      { id: "sv05", name: "Forces Temporelles (FR)", lang: "fr" },
      { id: "sv06", name: "Mascarade Crépusculaire (FR)", lang: "fr" },
      { id: "sv06.5", name: "Fable Nébuleuse (FR)", lang: "fr" },
      { id: "sv07", name: "Couronne Stellaire (FR)", lang: "fr" },
      { id: "sv08", name: "Étincelles Déferlantes (FR)", lang: "fr" },
      { id: "sv08.5", name: "Évolutions Prismatiques (FR)", lang: "fr" },
      { id: "sv09", name: "Aventures Ensemble (FR)", lang: "fr" },
      { id: "sv10", name: "Rivalités Destinées (FR)", lang: "fr" },
      { id: "blk", name: "Foudre Noire (FR)", lang: "fr" },
      { id: "wht", name: "Flamme Blanche (FR)", lang: "fr" }
    ]
  },
  {
    blockName: "Bloc Méga-Évolution",
    sets: [
      { id: "me01", name: "Méga-Évolution (FR)", lang: "fr" },
      { id: "me02", name: "Flammes Fantasmagoriques (FR)", lang: "fr" },
      { id: "me02.5", name: "Héros Transcendants (FR)", lang: "fr" },
      { id: "me03", name: "Équilibre Parfait (FR)", lang: "fr" },
      { id: "me04", name: "Chaos Ascendant (FR)", lang: "fr" },
      { id: "me05", name: "Nuit Noire (FR)", lang: "fr" }
    ]
  }
];

export const ALL_FLAT_SERIES: PokemonSet[] = POKEMON_BLOCKS.flatMap((b) => b.sets);

export const TCG_IO_ONLY_SETS: string[] = [
  "dp1", "pgo", "rumble", "det1", "hgss.p",
  "mcd11", "mcd12", "mcd14", "mcd15", "mcd16", "mcd17", 
  "mcd18", "mcd19", "mcd21", "mcd22", "30c"
];