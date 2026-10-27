/* =========================================================
   HALCYON Estates · listings & site data
   Demo content: addresses, prices, agents and reviews are
   illustrative placeholders for a portfolio showcase.
   ========================================================= */
window.HALCYON = {
  listings: [
    { id: 'cliffside-malibu', img: 'malibu-cliff', gallery: ['malibu-cliff', 'malibu-terrace', 'firepit-lounge', 'montecito-travertine'], tour: true,
      address: '21 Cliffside Drive', city: 'Malibu', area: 'Malibu', price: 18500000, beds: 5, baths: 7, sqft: 7420, lot: '0.92 ac', year: 2023, type: 'Modern', status: 'Featured',
      headline: 'Oceanfront glass pavilion above Point Dume',
      desc: 'Floor-to-ceiling glass frames 180° Pacific views from nearly every room. A 60-foot infinity edge pool, a sunken fire lounge and a primary suite that opens straight onto the sunset terrace.',
      features: ['Infinity edge pool', 'Private beach path', 'Chef’s kitchen', 'Wine room (600 bottles)', 'Home theater', 'Smart home + solar', 'Guest casita', '4-car garage'] },
    { id: 'laguna-bluff', img: 'laguna-sunset', gallery: ['laguna-sunset', 'beach-cottage'], address: '410 Bluff Lane', city: 'Laguna Beach', area: 'Orange County', price: 12950000, beds: 6, baths: 6, sqft: 6180, lot: '0.61 ac', year: 2019, type: 'Coastal', status: 'New',
      headline: 'Coastal estate with a lap pool on the bluff', desc: 'A Cape-inspired coastal home with wraparound balconies, a 75-foot lap pool and stairs straight down to the sand.', features: ['Oceanfront', 'Lap pool', 'Beach access', 'Outdoor kitchen', 'Elevator', 'Guest suite'] },
    { id: 'montecito-travertine', img: 'montecito-travertine', gallery: ['montecito-travertine', 'firepit-lounge'], address: '88 Olive Mill Road', city: 'Montecito', area: 'Santa Barbara', price: 9875000, beds: 5, baths: 6, sqft: 5640, lot: '1.20 ac', year: 2022, type: 'Modern', status: 'Open house',
      headline: 'Travertine retreat among heritage olive trees', desc: 'Warm travertine volumes, a stepping-stone pool with a spillway and a sunken fire-pit lounge under century-old olive trees.', features: ['Resort-style pool', 'Sunken fire lounge', 'Rooftop terrace', 'Outdoor dining pavilion', 'Olive grove', 'Pool house'] },
    { id: 'bel-air-reflection', img: 'bel-air-pool', gallery: ['bel-air-pool', 'palm-modern'], address: '1200 Stone Canyon Road', city: 'Bel Air', area: 'Los Angeles', price: 14200000, beds: 6, baths: 8, sqft: 8100, lot: '0.75 ac', year: 2024, type: 'Modern', status: 'New',
      headline: 'Reflecting-pool entry and a rooftop sky frame', desc: 'Arrive over a reflecting pool into double-height living spaces wrapped in stone and walnut. Rooftop lounge with canyon-to-city views.', features: ['Reflecting pool', 'Rooftop lounge', 'Motor court', 'Gym + spa', 'Walnut millwork', 'Staff quarters'] },
    { id: 'beverly-stone', img: 'stone-villa', gallery: ['stone-villa', 'encino-modern'], address: '905 N Alpine Drive', city: 'Beverly Hills', area: 'Los Angeles', price: 11750000, beds: 6, baths: 7, sqft: 7050, lot: '0.48 ac', year: 2021, type: 'Modern', status: 'For sale',
      headline: 'Split-face stone modern in the Flats', desc: 'Dark split-face stone meets crisp white cantilevers. A floating chandelier crowns the entry and every bedroom opens to its own terrace.', features: ['Cantilevered terraces', 'Floating staircase', 'Chef’s kitchen', 'Home office', 'Pool + spa', 'Landscaped motor court'] },
    { id: 'newport-lounge', img: 'firepit-lounge', gallery: ['firepit-lounge', 'bel-air-pool'], address: '17 Ocean Vista', city: 'Newport Coast', area: 'Orange County', price: 8950000, beds: 5, baths: 6, sqft: 5900, lot: '0.40 ac', year: 2020, type: 'Modern', status: 'Pending',
      headline: 'Indoor-outdoor living around a firelit pool bar', desc: 'Pocketing glass walls dissolve the line between the great room and a pool deck with a sunken lounge, fire trough and swim-up bar.', features: ['Pool bar', 'Fire trough', 'Pocketing glass walls', 'Wine wall', 'Media room', 'Guest wing'] },
    { id: 'palo-alto-cedar', img: 'stone-wood-dusk', gallery: ['stone-wood-dusk', 'garden-modern'], address: '322 Cowper Street', city: 'Palo Alto', area: 'Bay Area', price: 7450000, beds: 4, baths: 5, sqft: 4380, lot: '0.25 ac', year: 2024, type: 'Modern', status: 'New',
      headline: 'Limestone and cedar, minutes from University Ave', desc: 'Limestone blocks, vertical cedar fins and a glass entry hall with a crystal chandelier. Walking distance to downtown Palo Alto.', features: ['Glass entry hall', 'Cedar screens', 'Radiant floors', 'EV charging', 'ADU-ready', 'Top-rated schools'] },
    { id: 'palm-springs-grey', img: 'palm-modern', gallery: ['palm-modern', 'bel-air-pool'], address: '2140 Vista Del Sol', city: 'Palm Springs', area: 'Desert', price: 4295000, beds: 4, baths: 5, sqft: 4150, lot: '0.34 ac', year: 2022, type: 'Modern', status: 'For sale',
      headline: 'Desert modern with a floating roof frame', desc: 'Concrete and glass under a sculptural roof frame, lit palms and a wraparound glass balcony facing the San Jacinto mountains.', features: ['Mountain views', 'Glass balcony', 'Pool + spa', 'Outdoor shower', 'Solar', 'Casita'] },
    { id: 'pasadena-garden', img: 'garden-modern', gallery: ['garden-modern', 'white-modern'], address: '640 Arroyo Terrace', city: 'Pasadena', area: 'Los Angeles', price: 5680000, beds: 5, baths: 5, sqft: 4920, lot: '0.52 ac', year: 2021, type: 'Modern', status: 'Open house',
      headline: 'Garden modern with a wraparound planted terrace', desc: 'A planted glass terrace wraps the upper level while the ground floor opens onto stepping-stone gardens and a stacked-stone chimney.', features: ['Planted terrace', 'Stone chimney', 'Chef’s kitchen', 'Library', 'Gardens', 'Detached studio'] },
    { id: 'encino-noir', img: 'encino-modern', gallery: ['encino-modern', 'stone-villa'], address: '4815 Louise Avenue', city: 'Encino', area: 'Los Angeles', price: 6290000, beds: 4, baths: 4, sqft: 2850, lot: '0.12 ac', year: 2024, type: 'Modern', status: 'New',
      headline: 'Noir modern on a 5,380 sq ft lot', desc: 'A 2,850 sq ft four-bedroom with glowing floating steps, a glass-railed terrace and a flush-panel garage. Luxury, efficiently planned.', features: ['Floating lit steps', 'Glass terrace', '2-car garage', 'Smart lighting', 'Primary suite retreat', 'Low-maintenance landscaping'] },
    { id: 'irvine-white', img: 'white-modern', gallery: ['white-modern', 'garden-modern'], address: '12 Pinnacle', city: 'Irvine', area: 'Orange County', price: 3875000, beds: 4, baths: 4, sqft: 3900, lot: '0.21 ac', year: 2023, type: 'Modern', status: 'For sale',
      headline: 'Double-height glass in a gated enclave', desc: 'Crisp white render, double-height steel windows and a sculpted cactus garden with a quiet fountain courtyard.', features: ['Double-height living', 'Gated community', 'Fountain courtyard', 'Loft', 'Solar', 'Award-winning schools'] },
    { id: 'carmel-cottage', img: 'beach-cottage', gallery: ['beach-cottage', 'laguna-sunset'], address: '3 Dune Walk', city: 'Carmel-by-the-Sea', area: 'Central Coast', price: 6950000, beds: 4, baths: 4, sqft: 3600, lot: '0.30 ac', year: 2018, type: 'Coastal', status: 'Sold',
      headline: 'Shingle-style beach house on the dunes', desc: 'A light-filled shingle-style home with a Palladian window, a deep wraparound porch and a boardwalk to the sand.', features: ['On the sand', 'Wraparound porch', 'Vaulted great room', 'Standing-seam roof', 'Outdoor shower', 'Guest loft'] },
    { id: 'malibu-terrace', img: 'malibu-terrace', gallery: ['malibu-terrace', 'malibu-cliff'], address: '6 Carbon Beach Terrace', city: 'Malibu', area: 'Malibu', price: 16400000, beds: 5, baths: 6, sqft: 6200, lot: '0.55 ac', year: 2021, type: 'Modern', status: 'For sale',
      headline: 'Sunset great room on Billionaire’s Beach', desc: 'An open great room with a 30-foot dining table, stacked-stone walls and a terrace built for long sunsets over Carbon Beach.', features: ['Carbon Beach frontage', 'Open great room', 'Stone walls', 'Pool terrace', 'Primary terrace', 'Security suite'] },
  ],

  /* scroll tour for 21 Cliffside Drive: focal points are 0–1 of the photo */
  tour: [
    { img: 'malibu-cliff', room: 'Arrival', title: 'Arrive at golden hour', copy: 'A glass pavilion floats above the Pacific. Limestone steps glow as the sun drops behind Point Dume.', stats: ['7,420 sq ft', '0.92 acre'], from: { x: 0.5, y: 0.55, z: 1.0 }, to: { x: 0.34, y: 0.45, z: 1.45 }, plan: 'entry' },
    { img: 'malibu-cliff', room: 'Great Room', title: 'Through the glass', copy: 'Walls of pocketing glass slide away, and the living room becomes one with the terrace and the sea.', stats: ['22 ft ceilings', 'Pocketing glass'], from: { x: 0.34, y: 0.45, z: 1.45 }, to: { x: 0.28, y: 0.47, z: 1.95 }, plan: 'living' },
    { img: 'malibu-terrace', room: 'Living & Dining', title: 'Made for long dinners', copy: 'A 12-seat dining table sits between the chef’s kitchen and a sunken lounge. Every seat faces the water.', stats: ['12-seat dining', 'Chef’s kitchen'], from: { x: 0.55, y: 0.62, z: 1.3 }, to: { x: 0.62, y: 0.55, z: 1.05 }, plan: 'dining' },
    { img: 'malibu-terrace', room: 'Primary Suite', title: 'Wake up above the waves', copy: 'The upper-level primary suite opens onto a glass-railed terrace with an outdoor daybed and ocean views.', stats: ['Private terrace', 'Spa bath'], from: { x: 0.62, y: 0.4, z: 1.2 }, to: { x: 0.5, y: 0.3, z: 1.5 }, plan: 'suite' },
    { img: 'firepit-lounge', room: 'Pool Deck', title: 'Resort living, at home', copy: 'A sunken lounge with a fire trough, a marble pool bar and loungers lined up along the infinity edge.', stats: ['60 ft pool', 'Pool bar'], from: { x: 0.35, y: 0.7, z: 1.4 }, to: { x: 0.62, y: 0.55, z: 1.1 }, plan: 'pool' },
    { img: 'montecito-travertine', room: 'Fire Lounge', title: 'Evenings by the fire', copy: 'Step down into the fire-pit lounge beside the spillway spa, framed by heritage olive trees.', stats: ['Sunken lounge', 'Spillway spa'], from: { x: 0.5, y: 0.75, z: 1.35 }, to: { x: 0.55, y: 0.45, z: 1.05 }, plan: 'garden' },
    { img: 'laguna-sunset', room: 'Sunset Terrace', title: 'The view that sells itself', copy: 'End the day where the lawn meets the bluff, with the sun sliding into the Pacific.', stats: ['180° ocean views', 'Beach path'], from: { x: 0.5, y: 0.7, z: 1.3 }, to: { x: 0.25, y: 0.35, z: 1.15 }, plan: 'terrace' },
  ],

  neighborhoods: [
    { name: 'Malibu', img: 'malibu-cliff', median: 7800000, homes: 42, note: '27 miles of coastline' },
    { name: 'Beverly Hills', img: 'stone-villa', median: 6900000, homes: 58, note: 'The Flats & Trousdale' },
    { name: 'Montecito', img: 'montecito-travertine', median: 6200000, homes: 21, note: 'Estates under the oaks' },
    { name: 'Laguna Beach', img: 'laguna-sunset', median: 4600000, homes: 33, note: 'Bluffs & coves' },
    { name: 'Palm Springs', img: 'palm-modern', median: 1850000, homes: 64, note: 'Mid-century & desert modern' },
    { name: 'Palo Alto', img: 'stone-wood-dusk', median: 4200000, homes: 29, note: 'Silicon Valley classics' },
  ],

  agents: [
    { name: 'Olivia Hart', role: 'Founding Partner', area: 'Malibu & Westside', sales: '$1.1B', phone: '(310) 555-0118' },
    { name: 'Marcus Reyes', role: 'Senior Partner', area: 'Beverly Hills & Bel Air', sales: '$840M', phone: '(310) 555-0144' },
    { name: 'Sienna Park', role: 'Partner', area: 'Orange County Coast', sales: '$620M', phone: '(949) 555-0172' },
    { name: 'James Whitaker', role: 'Associate Partner', area: 'Montecito & Santa Barbara', sales: '$410M', phone: '(805) 555-0190' },
  ],

  journal: [
    { img: 'laguna-sunset', tag: 'Market report', title: 'Coastal California luxury: Q3 2026 in numbers', mins: 6 },
    { img: 'montecito-travertine', tag: 'Design', title: 'Why travertine and olive trees define the new Montecito look', mins: 4 },
    { img: 'palm-modern', tag: 'Buying guide', title: 'Desert modern: what to check before you buy in Palm Springs', mins: 5 },
  ],

  reviews: [
    { text: 'They sold our Malibu home off-market in eleven days, above asking. Quiet, precise and completely discreet.', name: 'Sample client', where: 'Seller, Malibu' },
    { text: 'The private tours were curated perfectly for our family. We never saw a home that wasn’t right for us.', name: 'Sample client', where: 'Buyers, Montecito' },
    { text: 'From valuation to closing, the marketing was on another level. The film of our home did the selling.', name: 'Sample client', where: 'Seller, Laguna Beach' },
  ],
};
