// ═══════════════════════════════════════════════════════════════
//  translations.js — Carta dei Vini · Lago Bin
//  UI strings only. Wine names, producers, descriptions stay in Italian.
// ═══════════════════════════════════════════════════════════════

const TRANSLATIONS = {

  // ─── ITALIANO ────────────────────────────────────────────────
  it: {
    // Search
    search_placeholder: 'Cerca vino, vitigno, regione…',
    search_header:      '🔍 Risultati ricerca',
    no_results:         'Nessun vino trovato',

    // Hint bar
    hint_bar: 'Tocca la categoria per espandere · Tocca il vino per i dettagli',

    // Pairing
    pairing_hint:   '🍷 Con cosa lo abbini? Scegli e ti suggerisco il vino',
    chip_antipasto: '🥗 Antipasto',
    chip_pasta:     '🍝 Pasta',
    chip_carne:     '🥩 Carne',
    chip_pesce:     '🐟 Pesce',
    dish_btn:       'Abbina al tuo piatto',
    pairing_header: '🍽️ Abbinamento per',

    // Category labels
    cat_lago:       'Vini del Lago Bin',
    cat_bollicine:  'Bollicine',
    cat_territorio: 'Vini del Territorio',
    cat_bianchi:    'Vini Bianchi',
    cat_rosati:     'Vini Rosati',
    cat_rossi:      'Vini Rossi',

    // Dish modal
    dish_modal_title: '🍽️ Con quale piatto?',
    dish_cat_antipasti: '🥗 Antipasti',
    dish_cat_primi:     '🍝 Primi',
    dish_cat_secondi:   '🥩 Secondi',

    // Modal detail labels
    detail_paese:     'Paese',
    detail_regione:   'Regione',
    detail_gradazione:'Gradazione',
    detail_uve:       'Uve',
    detail_colore:    'Colore',
    detail_sigla:     'Sigla',

    // Modal sections
    modal_gusto:  'Gusto',
    modal_desc:   'Descrizione',
    modal_vinif:  'Vinificazione',
    modal_price_cl: '· 75 cl',

    // Similar wines
    similar_title: '✦ Forse ti piacerà anche',

    // Wine count suffix
    wines_count: 'vini',

    // Footer
    footer_note: 'Tutti i prezzi si intendono per bottiglia da 75 Cl',
  },

  // ─── ENGLISH ─────────────────────────────────────────────────
  en: {
    search_placeholder: 'Search wine, grape variety, region…',
    search_header:      '🔍 Search results',
    no_results:         'No wine found',

    hint_bar: 'Tap a category to expand · Tap a wine for details',

    pairing_hint:   '🍷 What are you having? Choose a dish and we\'ll suggest the wine',
    chip_antipasto: '🥗 Starters',
    chip_pasta:     '🍝 Pasta',
    chip_carne:     '🥩 Meat',
    chip_pesce:     '🐟 Fish',
    dish_btn:       'Match to your dish',
    pairing_header: '🍽️ Pairing for',

    cat_lago:       'Lago Bin Wines',
    cat_bollicine:  'Sparkling Wines',
    cat_territorio: 'Local Wines',
    cat_bianchi:    'White Wines',
    cat_rosati:     'Rosé Wines',
    cat_rossi:      'Red Wines',

    dish_modal_title:    '🍽️ Which dish are you having?',
    dish_cat_antipasti:  '🥗 Starters',
    dish_cat_primi:      '🍝 First Courses',
    dish_cat_secondi:    '🥩 Main Courses',

    detail_paese:      'Country',
    detail_regione:    'Region',
    detail_gradazione: 'Alcohol',
    detail_uve:        'Grapes',
    detail_colore:     'Colour',
    detail_sigla:      'Appellation',

    modal_gusto:    'Taste',
    modal_desc:     'Description',
    modal_vinif:    'Winemaking',
    modal_price_cl: '· 75 cl',

    similar_title: '✦ You might also like',

    wines_count: 'wines',

    footer_note: 'All prices are per 75 cl bottle',
  },

  // ─── FRANÇAIS ────────────────────────────────────────────────
  fr: {
    search_placeholder: 'Rechercher vin, cépage, région…',
    search_header:      '🔍 Résultats de recherche',
    no_results:         'Aucun vin trouvé',

    hint_bar: 'Appuyez sur la catégorie pour développer · Appuyez sur le vin pour les détails',

    pairing_hint:   '🍷 Avec quoi l\'accompagner? Choisissez et nous suggérons le vin',
    chip_antipasto: '🥗 Entrées',
    chip_pasta:     '🍝 Pâtes',
    chip_carne:     '🥩 Viande',
    chip_pesce:     '🐟 Poisson',
    dish_btn:       'Associer à votre plat',
    pairing_header: '🍽️ Accord pour',

    cat_lago:       'Vins du Lago Bin',
    cat_bollicine:  'Vins Pétillants',
    cat_territorio: 'Vins du Terroir',
    cat_bianchi:    'Vins Blancs',
    cat_rosati:     'Vins Rosés',
    cat_rossi:      'Vins Rouges',

    dish_modal_title:    '🍽️ Avec quel plat?',
    dish_cat_antipasti:  '🥗 Entrées',
    dish_cat_primi:      '🍝 Premiers Plats',
    dish_cat_secondi:    '🥩 Plats Principaux',

    detail_paese:      'Pays',
    detail_regione:    'Région',
    detail_gradazione: 'Alcool',
    detail_uve:        'Cépages',
    detail_colore:     'Couleur',
    detail_sigla:      'Appellation',

    modal_gusto:    'Goût',
    modal_desc:     'Description',
    modal_vinif:    'Vinification',
    modal_price_cl: '· 75 cl',

    similar_title: '✦ Vous aimerez peut-être aussi',

    wines_count: 'vins',

    footer_note: 'Tous les prix s\'entendent par bouteille de 75 cl',
  },

  // ─── DEUTSCH ─────────────────────────────────────────────────
  de: {
    search_placeholder: 'Wein, Rebsorte, Region suchen…',
    search_header:      '🔍 Suchergebnisse',
    no_results:         'Kein Wein gefunden',

    hint_bar: 'Kategorie antippen zum Öffnen · Wein antippen für Details',

    pairing_hint:   '🍷 Womit kombinieren? Wähle ein Gericht und wir empfehlen den Wein',
    chip_antipasto: '🥗 Vorspeisen',
    chip_pasta:     '🍝 Pasta',
    chip_carne:     '🥩 Fleisch',
    chip_pesce:     '🐟 Fisch',
    dish_btn:       'Zum Gericht kombinieren',
    pairing_header: '🍽️ Kombination für',

    cat_lago:       'Lago Bin Weine',
    cat_bollicine:  'Schaumweine',
    cat_territorio: 'Lokale Weine',
    cat_bianchi:    'Weißweine',
    cat_rosati:     'Roséweine',
    cat_rossi:      'Rotweine',

    dish_modal_title:    '🍽️ Zu welchem Gericht?',
    dish_cat_antipasti:  '🥗 Vorspeisen',
    dish_cat_primi:      '🍝 Erster Gang',
    dish_cat_secondi:    '🥩 Hauptgerichte',

    detail_paese:      'Land',
    detail_regione:    'Region',
    detail_gradazione: 'Alkohol',
    detail_uve:        'Rebsorten',
    detail_colore:     'Farbe',
    detail_sigla:      'Appellation',

    modal_gusto:    'Geschmack',
    modal_desc:     'Beschreibung',
    modal_vinif:    'Weinbereitung',
    modal_price_cl: '· 75 cl',

    similar_title: '✦ Das könnte Ihnen auch gefallen',

    wines_count: 'Weine',

    footer_note: 'Alle Preise gelten pro 75-cl-Flasche',
  },

  // ─── ESPAÑOL ─────────────────────────────────────────────────
  es: {
    search_placeholder: 'Buscar vino, uva, región…',
    search_header:      '🔍 Resultados de búsqueda',
    no_results:         'No se encontró ningún vino',

    hint_bar: 'Toca la categoría para expandir · Toca el vino para los detalles',

    pairing_hint:   '🍷 ¿Con qué lo acompañas? Elige un plato y te sugerimos el vino',
    chip_antipasto: '🥗 Entrantes',
    chip_pasta:     '🍝 Pasta',
    chip_carne:     '🥩 Carne',
    chip_pesce:     '🐟 Pescado',
    dish_btn:       'Maridaje con tu plato',
    pairing_header: '🍽️ Maridaje para',

    cat_lago:       'Vinos del Lago Bin',
    cat_bollicine:  'Vinos Espumosos',
    cat_territorio: 'Vinos del Territorio',
    cat_bianchi:    'Vinos Blancos',
    cat_rosati:     'Vinos Rosados',
    cat_rossi:      'Vinos Tintos',

    dish_modal_title:    '🍽️ ¿Con qué plato?',
    dish_cat_antipasti:  '🥗 Entrantes',
    dish_cat_primi:      '🍝 Primeros Platos',
    dish_cat_secondi:    '🥩 Segundos Platos',

    detail_paese:      'País',
    detail_regione:    'Región',
    detail_gradazione: 'Alcohol',
    detail_uve:        'Uvas',
    detail_colore:     'Color',
    detail_sigla:      'Denominación',

    modal_gusto:    'Sabor',
    modal_desc:     'Descripción',
    modal_vinif:    'Vinificación',
    modal_price_cl: '· 75 cl',

    similar_title: '✦ También te podría gustar',

    wines_count: 'vinos',

    footer_note: 'Todos los precios son por botella de 75 cl',
  },

  // ─── PORTUGUÊS ───────────────────────────────────────────────
  pt: {
    search_placeholder: 'Pesquisar vinho, uva, região…',
    search_header:      '🔍 Resultados da pesquisa',
    no_results:         'Nenhum vinho encontrado',

    hint_bar: 'Toque na categoria para expandir · Toque no vinho para detalhes',

    pairing_hint:   '🍷 Com o que vai harmonizar? Escolha um prato e sugerimos o vinho',
    chip_antipasto: '🥗 Entradas',
    chip_pasta:     '🍝 Massa',
    chip_carne:     '🥩 Carne',
    chip_pesce:     '🐟 Peixe',
    dish_btn:       'Harmonizar com seu prato',
    pairing_header: '🍽️ Harmonização para',

    cat_lago:       'Vinhos do Lago Bin',
    cat_bollicine:  'Vinhos Espumantes',
    cat_territorio: 'Vinhos do Território',
    cat_bianchi:    'Vinhos Brancos',
    cat_rosati:     'Vinhos Rosés',
    cat_rossi:      'Vinhos Tintos',

    dish_modal_title:    '🍽️ Com qual prato?',
    dish_cat_antipasti:  '🥗 Entradas',
    dish_cat_primi:      '🍝 Primeiros Pratos',
    dish_cat_secondi:    '🥩 Pratos Principais',

    detail_paese:      'País',
    detail_regione:    'Região',
    detail_gradazione: 'Teor Alcoólico',
    detail_uve:        'Uvas',
    detail_colore:     'Cor',
    detail_sigla:      'Denominação',

    modal_gusto:    'Sabor',
    modal_desc:     'Descrição',
    modal_vinif:    'Vinificação',
    modal_price_cl: '· 75 cl',

    similar_title: '✦ Você também pode gostar',

    wines_count: 'vinhos',

    footer_note: 'Todos os preços são por garrafa de 75 cl',
  },

  // ─── РУССКИЙ ─────────────────────────────────────────────────
  ru: {
    search_placeholder: 'Поиск вина, сорта винограда, региона…',
    search_header:      '🔍 Результаты поиска',
    no_results:         'Вино не найдено',

    hint_bar: 'Нажмите на категорию · Нажмите на вино для деталей',

    pairing_hint:   '🍷 С чем сочетается? Выберите блюдо — подберём вино',
    chip_antipasto: '🥗 Закуски',
    chip_pasta:     '🍝 Паста',
    chip_carne:     '🥩 Мясо',
    chip_pesce:     '🐟 Рыба',
    dish_btn:       'Подобрать к блюду',
    pairing_header: '🍽️ Сочетание для',

    cat_lago:       'Вина Lago Bin',
    cat_bollicine:  'Игристые вина',
    cat_territorio: 'Местные вина',
    cat_bianchi:    'Белые вина',
    cat_rosati:     'Розовые вина',
    cat_rossi:      'Красные вина',

    dish_modal_title:    '🍽️ К какому блюду?',
    dish_cat_antipasti:  '🥗 Закуски',
    dish_cat_primi:      '🍝 Первые блюда',
    dish_cat_secondi:    '🥩 Основные блюда',

    detail_paese:      'Страна',
    detail_regione:    'Регион',
    detail_gradazione: 'Крепость',
    detail_uve:        'Сорт винограда',
    detail_colore:     'Цвет',
    detail_sigla:      'Апелласьон',

    modal_gusto:    'Вкус',
    modal_desc:     'Описание',
    modal_vinif:    'Виноделие',
    modal_price_cl: '· 75 cl',

    similar_title: '✦ Вам также может понравиться',

    wines_count: 'вин',

    footer_note: 'Все цены указаны за бутылку 75 cl',
  },

  // ─── NEDERLANDS ──────────────────────────────────────────────
  nl: {
    search_placeholder: 'Zoek wijn, druivenras, regio…',
    search_header:      '🔍 Zoekresultaten',
    no_results:         'Geen wijn gevonden',

    hint_bar: 'Tik op een categorie · Tik op een wijn voor details',

    pairing_hint:   '🍷 Wat eet je? Kies een gerecht en wij stellen een wijn voor',
    chip_antipasto: '🥗 Voorgerechten',
    chip_pasta:     '🍝 Pasta',
    chip_carne:     '🥩 Vlees',
    chip_pesce:     '🐟 Vis',
    dish_btn:       'Combineren met uw gerecht',
    pairing_header: '🍽️ Combinatie voor',

    cat_lago:       'Lago Bin Wijnen',
    cat_bollicine:  'Mousserende Wijnen',
    cat_territorio: 'Lokale Wijnen',
    cat_bianchi:    'Witte Wijnen',
    cat_rosati:     'Rosé Wijnen',
    cat_rossi:      'Rode Wijnen',

    dish_modal_title:    '🍽️ Bij welk gerecht?',
    dish_cat_antipasti:  '🥗 Voorgerechten',
    dish_cat_primi:      '🍝 Eerste Gang',
    dish_cat_secondi:    '🥩 Hoofdgerechten',

    detail_paese:      'Land',
    detail_regione:    'Regio',
    detail_gradazione: 'Alcohol',
    detail_uve:        'Druivenrassen',
    detail_colore:     'Kleur',
    detail_sigla:      'Appellation',

    modal_gusto:    'Smaak',
    modal_desc:     'Beschrijving',
    modal_vinif:    'Vinificatie',
    modal_price_cl: '· 75 cl',

    similar_title: '✦ Misschien vindt u dit ook lekker',

    wines_count: 'wijnen',

    footer_note: 'Alle prijzen zijn per fles van 75 cl',
  },

  // ─── POLSKI ──────────────────────────────────────────────────
  pl: {
    search_placeholder: 'Szukaj wina, szczepu, regionu…',
    search_header:      '🔍 Wyniki wyszukiwania',
    no_results:         'Nie znaleziono wina',

    hint_bar: 'Dotknij kategorię · Dotknij wino aby zobaczyć szczegóły',

    pairing_hint:   '🍷 Z czym chcesz podać? Wybierz danie – dobierzemy wino',
    chip_antipasto: '🥗 Przystawki',
    chip_pasta:     '🍝 Makaron',
    chip_carne:     '🥩 Mięso',
    chip_pesce:     '🐟 Ryba',
    dish_btn:       'Dobierz do dania',
    pairing_header: '🍽️ Połączenie dla',

    cat_lago:       'Wina Lago Bin',
    cat_bollicine:  'Wina Musujące',
    cat_territorio: 'Wina Regionalne',
    cat_bianchi:    'Wina Białe',
    cat_rosati:     'Wina Różowe',
    cat_rossi:      'Wina Czerwone',

    dish_modal_title:    '🍽️ Do jakiego dania?',
    dish_cat_antipasti:  '🥗 Przystawki',
    dish_cat_primi:      '🍝 Pierwsze Dania',
    dish_cat_secondi:    '🥩 Dania Główne',

    detail_paese:      'Kraj',
    detail_regione:    'Region',
    detail_gradazione: 'Alkohol',
    detail_uve:        'Odmiany Winogron',
    detail_colore:     'Kolor',
    detail_sigla:      'Apelacja',

    modal_gusto:    'Smak',
    modal_desc:     'Opis',
    modal_vinif:    'Winifikacja',
    modal_price_cl: '· 75 cl',

    similar_title: '✦ Może ci się też spodobać',

    wines_count: 'win',

    footer_note: 'Wszystkie ceny dotyczą butelki 75 cl',
  },

  // ─── SVENSKA ─────────────────────────────────────────────────
  sv: {
    search_placeholder: 'Sök vin, druvsort, region…',
    search_header:      '🔍 Sökresultat',
    no_results:         'Inget vin hittades',

    hint_bar: 'Tryck på en kategori · Tryck på ett vin för detaljer',

    pairing_hint:   '🍷 Vad äter du? Välj en rätt och vi föreslår ett vin',
    chip_antipasto: '🥗 Förrätter',
    chip_pasta:     '🍝 Pasta',
    chip_carne:     '🥩 Kött',
    chip_pesce:     '🐟 Fisk',
    dish_btn:       'Matcha till din rätt',
    pairing_header: '🍽️ Kombination för',

    cat_lago:       'Lago Bin Viner',
    cat_bollicine:  'Mousserande Viner',
    cat_territorio: 'Lokala Viner',
    cat_bianchi:    'Vita Viner',
    cat_rosati:     'Roséer',
    cat_rossi:      'Röda Viner',

    dish_modal_title:    '🍽️ Till vilken rätt?',
    dish_cat_antipasti:  '🥗 Förrätter',
    dish_cat_primi:      '🍝 Första Rätter',
    dish_cat_secondi:    '🥩 Huvudrätter',

    detail_paese:      'Land',
    detail_regione:    'Region',
    detail_gradazione: 'Alkohol',
    detail_uve:        'Druvsort',
    detail_colore:     'Färg',
    detail_sigla:      'Appellation',

    modal_gusto:    'Smak',
    modal_desc:     'Beskrivning',
    modal_vinif:    'Vinifiering',
    modal_price_cl: '· 75 cl',

    similar_title: '✦ Du kanske också gillar',

    wines_count: 'viner',

    footer_note: 'Alla priser gäller per flaska 75 cl',
  },

  // ─── DANSK ───────────────────────────────────────────────────
  da: {
    search_placeholder: 'Søg vin, drue, region…',
    search_header:      '🔍 Søgeresultater',
    no_results:         'Ingen vin fundet',

    hint_bar: 'Tryk på en kategori · Tryk på en vin for detaljer',

    pairing_hint:   '🍷 Hvad spiser du? Vælg en ret og vi foreslår vinen',
    chip_antipasto: '🥗 Forretter',
    chip_pasta:     '🍝 Pasta',
    chip_carne:     '🥩 Kød',
    chip_pesce:     '🐟 Fisk',
    dish_btn:       'Match til din ret',
    pairing_header: '🍽️ Kombination til',

    cat_lago:       'Lago Bin Vine',
    cat_bollicine:  'Mousserende Vine',
    cat_territorio: 'Lokale Vine',
    cat_bianchi:    'Hvidvine',
    cat_rosati:     'Rosévine',
    cat_rossi:      'Rødvine',

    dish_modal_title:    '🍽️ Til hvilken ret?',
    dish_cat_antipasti:  '🥗 Forretter',
    dish_cat_primi:      '🍝 Forretter/Pasta',
    dish_cat_secondi:    '🥩 Hovedretter',

    detail_paese:      'Land',
    detail_regione:    'Region',
    detail_gradazione: 'Alkohol',
    detail_uve:        'Druesorter',
    detail_colore:     'Farve',
    detail_sigla:      'Appellation',

    modal_gusto:    'Smag',
    modal_desc:     'Beskrivelse',
    modal_vinif:    'Vinifikation',
    modal_price_cl: '· 75 cl',

    similar_title: '✦ Du vil måske også kunne lide',

    wines_count: 'vine',

    footer_note: 'Alle priser er pr. flaske på 75 cl',
  },

  // ─── NORSK ───────────────────────────────────────────────────
  no: {
    search_placeholder: 'Søk vin, drue, region…',
    search_header:      '🔍 Søkeresultater',
    no_results:         'Ingen vin funnet',

    hint_bar: 'Trykk på en kategori · Trykk på en vin for detaljer',

    pairing_hint:   '🍷 Hva spiser du? Velg en rett og vi foreslår vinen',
    chip_antipasto: '🥗 Forretter',
    chip_pasta:     '🍝 Pasta',
    chip_carne:     '🥩 Kjøtt',
    chip_pesce:     '🐟 Fisk',
    dish_btn:       'Match til din rett',
    pairing_header: '🍽️ Kombinasjon for',

    cat_lago:       'Lago Bin Viner',
    cat_bollicine:  'Musserende Viner',
    cat_territorio: 'Lokale Viner',
    cat_bianchi:    'Hvite Viner',
    cat_rosati:     'Roséer',
    cat_rossi:      'Røde Viner',

    dish_modal_title:    '🍽️ Til hvilken rett?',
    dish_cat_antipasti:  '🥗 Forretter',
    dish_cat_primi:      '🍝 Første Retter',
    dish_cat_secondi:    '🥩 Hovedretter',

    detail_paese:      'Land',
    detail_regione:    'Region',
    detail_gradazione: 'Alkohol',
    detail_uve:        'Drueverieteter',
    detail_colore:     'Farge',
    detail_sigla:      'Appellation',

    modal_gusto:    'Smak',
    modal_desc:     'Beskrivelse',
    modal_vinif:    'Vinifisering',
    modal_price_cl: '· 75 cl',

    similar_title: '✦ Du liker kanskje også',

    wines_count: 'viner',

    footer_note: 'Alle priser er per flaske på 75 cl',
  },

  // ─── SUOMI ───────────────────────────────────────────────────
  fi: {
    search_placeholder: 'Hae viiniä, rypälettä, aluetta…',
    search_header:      '🔍 Hakutulokset',
    no_results:         'Viiniä ei löydy',

    hint_bar: 'Napauta kategoriaa · Napauta viiniä tiedoille',

    pairing_hint:   '🍷 Mitä syöt? Valitse ruokalaji ja suosittelemme viinin',
    chip_antipasto: '🥗 Alkupalat',
    chip_pasta:     '🍝 Pasta',
    chip_carne:     '🥩 Liha',
    chip_pesce:     '🐟 Kala',
    dish_btn:       'Sovita ruokalajiin',
    pairing_header: '🍽️ Yhdistelmä',

    cat_lago:       'Lago Bin Viinit',
    cat_bollicine:  'Kuohuviinit',
    cat_territorio: 'Paikalliset Viinit',
    cat_bianchi:    'Valkoviinit',
    cat_rosati:     'Roséviinit',
    cat_rossi:      'Punaviinit',

    dish_modal_title:    '🍽️ Mille ruokalajille?',
    dish_cat_antipasti:  '🥗 Alkupalat',
    dish_cat_primi:      '🍝 Ensimmäinen Ruokalaji',
    dish_cat_secondi:    '🥩 Pääruoat',

    detail_paese:      'Maa',
    detail_regione:    'Alue',
    detail_gradazione: 'Alkoholi',
    detail_uve:        'Rypäleet',
    detail_colore:     'Väri',
    detail_sigla:      'Appellation',

    modal_gusto:    'Maku',
    modal_desc:     'Kuvaus',
    modal_vinif:    'Valmistus',
    modal_price_cl: '· 75 cl',

    similar_title: '✦ Saatat pitää myös tästä',

    wines_count: 'viiniä',

    footer_note: 'Kaikki hinnat ovat 75 cl:n pulloa kohti',
  },

  // ─── ČEŠTINA ─────────────────────────────────────────────────
  cs: {
    search_placeholder: 'Hledat víno, odrůdu, region…',
    search_header:      '🔍 Výsledky hledání',
    no_results:         'Žádné víno nenalezeno',

    hint_bar: 'Klepněte na kategorii · Klepněte na víno pro detaily',

    pairing_hint:   '🍷 S čím chcete víno? Vyberte jídlo a doporučíme víno',
    chip_antipasto: '🥗 Předkrmy',
    chip_pasta:     '🍝 Těstoviny',
    chip_carne:     '🥩 Maso',
    chip_pesce:     '🐟 Ryby',
    dish_btn:       'Párovat k jídlu',
    pairing_header: '🍽️ Kombinace pro',

    cat_lago:       'Vína Lago Bin',
    cat_bollicine:  'Šumivá Vína',
    cat_territorio: 'Místní Vína',
    cat_bianchi:    'Bílá Vína',
    cat_rosati:     'Růžová Vína',
    cat_rossi:      'Červená Vína',

    dish_modal_title:    '🍽️ K jakému jídlu?',
    dish_cat_antipasti:  '🥗 Předkrmy',
    dish_cat_primi:      '🍝 První Chody',
    dish_cat_secondi:    '🥩 Hlavní Chody',

    detail_paese:      'Země',
    detail_regione:    'Region',
    detail_gradazione: 'Alkohol',
    detail_uve:        'Odrůdy',
    detail_colore:     'Barva',
    detail_sigla:      'Označení',

    modal_gusto:    'Chuť',
    modal_desc:     'Popis',
    modal_vinif:    'Vinifikace',
    modal_price_cl: '· 75 cl',

    similar_title: '✦ Mohlo by se vám líbit také',

    wines_count: 'vín',

    footer_note: 'Všechny ceny jsou za lahev 75 cl',
  },

  // ─── MAGYAR ──────────────────────────────────────────────────
  hu: {
    search_placeholder: 'Bor, szőlőfajta, régió keresése…',
    search_header:      '🔍 Keresési eredmények',
    no_results:         'Nem található bor',

    hint_bar: 'Érintse meg a kategóriát · Érintse meg a bort a részletekért',

    pairing_hint:   '🍷 Mihez iszik? Válasszon ételt és ajánlunk bort',
    chip_antipasto: '🥗 Előételek',
    chip_pasta:     '🍝 Tészta',
    chip_carne:     '🥩 Hús',
    chip_pesce:     '🐟 Hal',
    dish_btn:       'Párosítás az ételhez',
    pairing_header: '🍽️ Párosítás ehhez',

    cat_lago:       'Lago Bin Borok',
    cat_bollicine:  'Pezsgők',
    cat_territorio: 'Helyi Borok',
    cat_bianchi:    'Fehérborok',
    cat_rosati:     'Roséborok',
    cat_rossi:      'Vörösborok',

    dish_modal_title:    '🍽️ Melyik ételhez?',
    dish_cat_antipasti:  '🥗 Előételek',
    dish_cat_primi:      '🍝 Első Fogás',
    dish_cat_secondi:    '🥩 Főételek',

    detail_paese:      'Ország',
    detail_regione:    'Régió',
    detail_gradazione: 'Alkohol',
    detail_uve:        'Szőlőfajta',
    detail_colore:     'Szín',
    detail_sigla:      'Eredetmegjelölés',

    modal_gusto:    'Íz',
    modal_desc:     'Leírás',
    modal_vinif:    'Borászat',
    modal_price_cl: '· 75 cl',

    similar_title: '✦ Talán ez is tetszeni fog',

    wines_count: 'bor',

    footer_note: 'Minden ár 75 cl-es palackra vonatkozik',
  },

  // ─── ROMÂNĂ ──────────────────────────────────────────────────
  ro: {
    search_placeholder: 'Caută vin, soi, regiune…',
    search_header:      '🔍 Rezultatele căutării',
    no_results:         'Niciun vin găsit',

    hint_bar: 'Atingeți categoria · Atingeți vinul pentru detalii',

    pairing_hint:   '🍷 Cu ce îl asociezi? Alege un fel de mâncare și îți sugerăm vinul',
    chip_antipasto: '🥗 Antreuri',
    chip_pasta:     '🍝 Paste',
    chip_carne:     '🥩 Carne',
    chip_pesce:     '🐟 Pește',
    dish_btn:       'Asociere cu felul tău',
    pairing_header: '🍽️ Asociere pentru',

    cat_lago:       'Vinurile Lago Bin',
    cat_bollicine:  'Vinuri Spumante',
    cat_territorio: 'Vinuri Locale',
    cat_bianchi:    'Vinuri Albe',
    cat_rosati:     'Vinuri Roze',
    cat_rossi:      'Vinuri Roșii',

    dish_modal_title:    '🍽️ Cu ce fel de mâncare?',
    dish_cat_antipasti:  '🥗 Antreuri',
    dish_cat_primi:      '🍝 Feluri Întâi',
    dish_cat_secondi:    '🥩 Feluri Principale',

    detail_paese:      'Țară',
    detail_regione:    'Regiune',
    detail_gradazione: 'Alcool',
    detail_uve:        'Soiuri',
    detail_colore:     'Culoare',
    detail_sigla:      'Denumire',

    modal_gusto:    'Gust',
    modal_desc:     'Descriere',
    modal_vinif:    'Vinificație',
    modal_price_cl: '· 75 cl',

    similar_title: '✦ S-ar putea să vă placă și',

    wines_count: 'vinuri',

    footer_note: 'Toate prețurile sunt per sticlă de 75 cl',
  },

  // ─── TÜRKÇE ──────────────────────────────────────────────────
  tr: {
    search_placeholder: 'Şarap, üzüm, bölge ara…',
    search_header:      '🔍 Arama sonuçları',
    no_results:         'Şarap bulunamadı',

    hint_bar: 'Kategoriyi genişletmek için dokun · Detaylar için şaraba dokun',

    pairing_hint:   '🍷 Ne yiyorsunuz? Bir yemek seçin, şarabı önereceğiz',
    chip_antipasto: '🥗 Başlangıçlar',
    chip_pasta:     '🍝 Makarna',
    chip_carne:     '🥩 Et',
    chip_pesce:     '🐟 Balık',
    dish_btn:       'Yemeğinizle eşleştirin',
    pairing_header: '🍽️ Eşleşme için',

    cat_lago:       'Lago Bin Şarapları',
    cat_bollicine:  'Köpüklü Şaraplar',
    cat_territorio: 'Yerel Şaraplar',
    cat_bianchi:    'Beyaz Şaraplar',
    cat_rosati:     'Roze Şaraplar',
    cat_rossi:      'Kırmızı Şaraplar',

    dish_modal_title:    '🍽️ Hangi yemekle?',
    dish_cat_antipasti:  '🥗 Başlangıçlar',
    dish_cat_primi:      '🍝 Birinci Kurslar',
    dish_cat_secondi:    '🥩 Ana Yemekler',

    detail_paese:      'Ülke',
    detail_regione:    'Bölge',
    detail_gradazione: 'Alkol',
    detail_uve:        'Üzüm Çeşitleri',
    detail_colore:     'Renk',
    detail_sigla:      'Menşei Adı',

    modal_gusto:    'Tat',
    modal_desc:     'Açıklama',
    modal_vinif:    'Şarapçılık',
    modal_price_cl: '· 75 cl',

    similar_title: '✦ Bunları da beğenebilirsiniz',

    wines_count: 'şarap',

    footer_note: 'Tüm fiyatlar 75 cl şişe başınadır',
  },

  // ─── العربية ─────────────────────────────────────────────────
  ar: {
    search_placeholder: 'ابحث عن نبيذ، عنب، منطقة…',
    search_header:      '🔍 نتائج البحث',
    no_results:         'لم يُعثر على نبيذ',

    hint_bar: 'اضغط على الفئة للتوسيع · اضغط على النبيذ للتفاصيل',

    pairing_hint:   '🍷 ما الطبق؟ اختر طبقاً ونقترح لك النبيذ',
    chip_antipasto: '🥗 المقبلات',
    chip_pasta:     '🍝 المعكرونة',
    chip_carne:     '🥩 اللحم',
    chip_pesce:     '🐟 السمك',
    dish_btn:       'اختر طبقاً للتوصية',
    pairing_header: '🍽️ توافق مع',

    cat_lago:       'نبيذ Lago Bin',
    cat_bollicine:  'النبيذ الفوار',
    cat_territorio: 'النبيذ المحلي',
    cat_bianchi:    'النبيذ الأبيض',
    cat_rosati:     'النبيذ الروزيه',
    cat_rossi:      'النبيذ الأحمر',

    dish_modal_title:    '🍽️ مع أي طبق؟',
    dish_cat_antipasti:  '🥗 المقبلات',
    dish_cat_primi:      '🍝 الأطباق الأولى',
    dish_cat_secondi:    '🥩 الأطباق الرئيسية',

    detail_paese:      'البلد',
    detail_regione:    'المنطقة',
    detail_gradazione: 'الكحول',
    detail_uve:        'أصناف العنب',
    detail_colore:     'اللون',
    detail_sigla:      'التسمية',

    modal_gusto:    'المذاق',
    modal_desc:     'الوصف',
    modal_vinif:    'صناعة النبيذ',
    modal_price_cl: '· 75 cl',

    similar_title: '✦ قد يعجبك أيضاً',

    wines_count: 'نبيذ',

    footer_note: 'جميع الأسعار لزجاجة 75 سل',
  },

  // ─── 中文 ─────────────────────────────────────────────────────
  'zh-CN': {
    search_placeholder: '搜索葡萄酒、葡萄品种、产区…',
    search_header:      '🔍 搜索结果',
    no_results:         '未找到葡萄酒',

    hint_bar: '点击类别展开 · 点击葡萄酒查看详情',

    pairing_hint:   '🍷 您点了什么菜？选择菜肴，我们为您推荐葡萄酒',
    chip_antipasto: '🥗 开胃菜',
    chip_pasta:     '🍝 意面',
    chip_carne:     '🥩 肉类',
    chip_pesce:     '🐟 海鲜',
    dish_btn:       '按菜肴搭配',
    pairing_header: '🍽️ 搭配菜肴',

    cat_lago:       'Lago Bin 葡萄酒',
    cat_bollicine:  '起泡酒',
    cat_territorio: '本地葡萄酒',
    cat_bianchi:    '白葡萄酒',
    cat_rosati:     '桃红葡萄酒',
    cat_rossi:      '红葡萄酒',

    dish_modal_title:    '🍽️ 搭配哪道菜？',
    dish_cat_antipasti:  '🥗 开胃菜',
    dish_cat_primi:      '🍝 第一道',
    dish_cat_secondi:    '🥩 主菜',

    detail_paese:      '国家',
    detail_regione:    '产区',
    detail_gradazione: '酒精度',
    detail_uve:        '葡萄品种',
    detail_colore:     '颜色',
    detail_sigla:      '产区命名',

    modal_gusto:    '口感',
    modal_desc:     '描述',
    modal_vinif:    '酿造工艺',
    modal_price_cl: '· 75 cl',

    similar_title: '✦ 您可能也会喜欢',

    wines_count: '款酒',

    footer_note: '所有价格均为每瓶75cl',
  },

  // ─── 日本語 ───────────────────────────────────────────────────
  ja: {
    search_placeholder: 'ワイン、品種、地域を検索…',
    search_header:      '🔍 検索結果',
    no_results:         'ワインが見つかりません',

    hint_bar: 'カテゴリをタップして展開 · ワインをタップして詳細',

    pairing_hint:   '🍷 何を召し上がりますか？料理を選んでワインをご提案します',
    chip_antipasto: '🥗 前菜',
    chip_pasta:     '🍝 パスタ',
    chip_carne:     '🥩 肉料理',
    chip_pesce:     '🐟 魚料理',
    dish_btn:       '料理に合わせる',
    pairing_header: '🍽️ マリアージュ',

    cat_lago:       'Lago Bin ワイン',
    cat_bollicine:  'スパークリングワイン',
    cat_territorio: '地元ワイン',
    cat_bianchi:    '白ワイン',
    cat_rosati:     'ロゼワイン',
    cat_rossi:      '赤ワイン',

    dish_modal_title:    '🍽️ どの料理に合わせますか？',
    dish_cat_antipasti:  '🥗 前菜',
    dish_cat_primi:      '🍝 パスタ料理',
    dish_cat_secondi:    '🥩 メイン料理',

    detail_paese:      '国',
    detail_regione:    '産地',
    detail_gradazione: 'アルコール度数',
    detail_uve:        'ブドウ品種',
    detail_colore:     '色',
    detail_sigla:      'アペラシオン',

    modal_gusto:    '味わい',
    modal_desc:     '説明',
    modal_vinif:    '醸造法',
    modal_price_cl: '· 75 cl',

    similar_title: '✦ こちらもおすすめ',

    wines_count: '本',

    footer_note: '価格はすべて75cl 1本あたりの価格です',
  },

};

// ─── Helper: get current lang translation ────────────────────
function t(key) {
  const lang = window._currentLang || 'it';
  const dict = TRANSLATIONS[lang] || TRANSLATIONS['it'];
  return dict[key] || TRANSLATIONS['it'][key] || key;
}
