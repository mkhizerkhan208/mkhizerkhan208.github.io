/* =========================================================
   VELORA · catalogue data
   Prices are in USD; the currency switcher converts them.
   Ratings and reviews are sample content for the demo store.
   ========================================================= */
window.VELORA = {
  currencies: {
    USD: { symbol: '$', rate: 1 },
    EUR: { symbol: '€', rate: 0.92 },
    GBP: { symbol: '£', rate: 0.79 },
  },
  coupons: {
    WELCOME10: { type: 'percent', value: 10, label: '10% off your first order' },
    VELORA20: { type: 'percent', value: 20, label: '20% off, orders over $150', min: 150 },
    FREESHIP: { type: 'ship', value: 0, label: 'Free express shipping' },
  },
  freeShippingAt: 75,
  shipping: [
    { id: 'standard', name: 'Standard', eta: '4 to 6 business days', price: 6.95 },
    { id: 'express', name: 'Express', eta: '1 to 2 business days', price: 14.95 },
    { id: 'pickup', name: 'Store pickup', eta: 'Ready in 2 hours', price: 0 },
  ],
  taxRate: 0.0825,

  categories: [
    { id: 'watches', name: 'Watches', img: 'chrono-emerald' },
    { id: 'footwear', name: 'Footwear', img: 'court-classic' },
    { id: 'apparel', name: 'Apparel', img: 'varsity-tracksuit' },
    { id: 'caps', name: 'Caps', img: 'washed-cap-forest' },
    { id: 'beauty', name: 'Beauty & Travel', img: 'brush-set' },
    { id: 'lifestyle', name: 'Lifestyle', img: 'travel-mug' },
  ],

  products: [
    {
      id: 'heritage-chrono-emerald', name: 'Heritage Two-Tone Chronograph', sub: 'Emerald dial', cat: 'watches', img: 'chrono-emerald',
      price: 189, was: 229, rating: 4.8, reviews: 214, colors: [{ n: 'Emerald / Gold', c: '#2f4a3a' }], sizes: null, stock: 7,
      badges: ['Bestseller'], tags: ['new'],
      desc: 'A 42mm steel chronograph with a textured emerald dial, rose-gold indices and a polished two-tone jubilee bracelet. Three working sub-dials: day, 24-hour and seconds.',
      specs: { Case: '42mm stainless steel', Movement: 'Quartz chronograph', Glass: 'Hardened mineral crystal', Water: '5 ATM', Strap: 'Two-tone steel, fold-over clasp' },
    },
    {
      id: 'midnight-moonphase', name: 'Midnight Moonphase Chronograph', sub: 'Black dial, steel', cat: 'watches', img: 'chrono-midnight',
      price: 159, was: null, rating: 4.7, reviews: 188, colors: [{ n: 'Black / Rose', c: '#1c1a22' }], sizes: null, stock: 12,
      badges: ['New'], tags: ['new'],
      desc: 'Crystal-set indices, a working moonphase and a date window under a domed crystal. The rose-toned bezel catches the light from every angle.',
      specs: { Case: '43mm stainless steel', Movement: 'Quartz, moonphase', Glass: 'Domed mineral crystal', Water: '3 ATM', Strap: 'Solid-link steel' },
    },
    {
      id: 'aviator-moonphase', name: 'Aviator Moonphase', sub: 'Navy dial, tan suede', cat: 'watches', img: 'aviator-moonphase',
      price: 139, was: 169, rating: 4.6, reviews: 142, colors: [{ n: 'Navy / Tan', c: '#243a5e' }], sizes: null, stock: 18,
      badges: ['-18%'], tags: ['sale'],
      desc: 'A matte-black case, deep navy sunray dial and a soft tan suede strap with contrast stitching. Moonphase, date and a 1/10 second chronograph.',
      specs: { Case: '44mm black-plated steel', Movement: 'Quartz chronograph', Glass: 'Mineral crystal', Water: '3 ATM', Strap: 'Genuine suede leather' },
    },
    {
      id: 'monolith-low', name: 'Monolith Low Sneaker', sub: 'Triple white leather', cat: 'footwear', img: 'monolith-low',
      price: 120, was: null, rating: 4.9, reviews: 402, colors: [{ n: 'Triple White', c: '#f2f2f0' }], sizes: ['7', '8', '9', '10', '11', '12'], stock: 22,
      badges: ['Drop 04'], tags: ['new'],
      desc: 'Full-grain leather upper, perforated toe box and a cushioned cupsole built for all-day wear. The one white sneaker that goes with everything.',
      specs: { Upper: 'Full-grain leather', Sole: 'Rubber cupsole', Lining: 'Breathable textile', Fit: 'True to size' },
    },
    {
      id: 'court-classic', name: 'Court Classic Leather Sneaker', sub: 'White with gum sole', cat: 'footwear', img: 'court-classic',
      price: 98, was: null, rating: 4.8, reviews: 276, colors: [{ n: 'White / Gum', c: '#efe7dc' }], sizes: ['7', '8', '9', '10', '11', '12'], stock: 15,
      badges: ['Bestseller'], tags: [],
      desc: 'A minimalist court sneaker in smooth vegan leather with a tan heel tab and a vintage gum sole. Clean enough for the office, easy enough for the weekend.',
      specs: { Upper: 'Vegan leather', Sole: 'Gum rubber', Insole: 'Memory foam', Fit: 'True to size' },
    },
    {
      id: 'canvas-mid-cognac', name: 'Canvas Mid Sneaker', sub: 'Cognac', cat: 'footwear', img: 'canvas-mid-cognac',
      price: 69, was: 89, rating: 4.5, reviews: 131, colors: [{ n: 'Cognac', c: '#8a4b2a' }], sizes: ['7', '8', '9', '10', '11'], stock: 9,
      badges: ['-22%'], tags: ['sale'],
      desc: 'Heavy cotton canvas, brass eyelets and a leather-trimmed heel on a bright white vulcanised sole. A mid-top that softens with every wear.',
      specs: { Upper: 'Cotton canvas', Sole: 'Vulcanised rubber', Details: 'Brass eyelets, leather heel tab', Fit: 'Half size up' },
    },
    {
      id: 'canvas-low-navy', name: 'Canvas Low Sneaker', sub: 'Navy', cat: 'footwear', img: 'canvas-low-navy',
      price: 59, was: null, rating: 4.4, reviews: 97, colors: [{ n: 'Navy', c: '#23304f' }], sizes: ['7', '8', '9', '10', '11'], stock: 30,
      badges: [], tags: [],
      desc: 'The everyday low-top in deep navy canvas with tan leather accents. Lightweight, breathable and ready for summer.',
      specs: { Upper: 'Cotton canvas', Sole: 'Vulcanised rubber', Details: 'Leather heel and tongue patch', Fit: 'True to size' },
    },
    {
      id: 'tipped-pique-polo', name: 'Tipped Piqué Polo', sub: 'White / navy tipping', cat: 'apparel', img: 'tipped-polo-look',
      price: 48, was: null, rating: 4.7, reviews: 163, colors: [{ n: 'White', c: '#f6f6f4' }], sizes: ['S', 'M', 'L', 'XL'], stock: 40,
      badges: [], tags: ['new'],
      desc: 'Heavyweight cotton piqué with contrast-tipped collar and cuffs and an embroidered chest emblem. Relaxed through the body.',
      specs: { Fabric: '100% cotton piqué, 240gsm', Fit: 'Relaxed', Care: 'Machine wash cold' },
    },
    {
      id: 'ombre-knit', name: 'Ombré Distressed Knit', sub: 'Black to white', cat: 'apparel', img: 'ombre-knit',
      price: 78, was: 98, rating: 4.6, reviews: 88, colors: [{ n: 'Black Ombré', c: '#2a2a2a' }], sizes: ['S', 'M', 'L', 'XL'], stock: 6,
      badges: ['Low stock'], tags: ['sale'],
      desc: 'A dip-dyed crew-neck sweater with hand-frayed texture and ribbed trims. Oversized, soft and made to layer.',
      specs: { Fabric: 'Cotton-acrylic blend', Fit: 'Oversized', Care: 'Hand wash, dry flat' },
    },
    {
      id: 'riviera-knit-set', name: 'Riviera Knit Polo Set', sub: 'Ivory & chocolate', cat: 'apparel', img: 'riviera-knit-set',
      price: 96, was: null, rating: 4.8, reviews: 74, colors: [{ n: 'Ivory / Chocolate', c: '#6b4226' }], sizes: ['S', 'M', 'L', 'XL'], stock: 14,
      badges: ['Set'], tags: ['new'],
      desc: 'A ribbed open-collar knit polo paired with pleated tailored trousers. Resort dressing that works from lunch to late dinners.',
      specs: { Fabric: 'Viscose knit / poly-wool trousers', Fit: 'Regular', Includes: 'Polo + trousers' },
    },
    {
      id: 'varsity-tracksuit', name: 'Varsity Quarter-Zip Tracksuit', sub: 'Black & white', cat: 'apparel', img: 'varsity-tracksuit',
      price: 110, was: 135, rating: 4.7, reviews: 119, colors: [{ n: 'Black / White', c: '#111111' }], sizes: ['S', 'M', 'L', 'XL'], stock: 11,
      badges: ['-19%'], tags: ['sale'],
      desc: 'A collared quarter-zip with block-stripe sleeves and matching joggers with side taping. Brushed fleece inside.',
      specs: { Fabric: 'Cotton-poly fleece, 320gsm', Fit: 'Regular top, tapered jogger', Includes: 'Top + joggers' },
    },
    {
      id: 'brushstroke-set', name: 'Brushstroke Camp Shirt Set', sub: 'Monochrome print', cat: 'apparel', img: 'brushstroke-set',
      price: 72, was: null, rating: 4.5, reviews: 56, colors: [{ n: 'Monochrome', c: '#9a9a9a' }], sizes: ['S', 'M', 'L', 'XL'], stock: 19,
      badges: [], tags: [],
      desc: 'A breezy camp-collar shirt in an abstract brushstroke print, paired with drawstring trousers in black.',
      specs: { Fabric: 'Lightweight woven poly', Fit: 'Relaxed', Includes: 'Shirt + trousers' },
    },
    {
      id: 'washed-cap-forest', name: 'Washed Denim Cap', sub: 'Forest', cat: 'caps', img: 'washed-cap-forest',
      price: 28, was: null, rating: 4.6, reviews: 203, colors: [{ n: 'Forest', c: '#3e6b5c' }], sizes: null, stock: 50,
      badges: [], tags: [],
      desc: 'Stone-washed denim, raised 3D embroidery and a hand-distressed brim. Adjustable strap, one size.',
      specs: { Fabric: '100% cotton denim', Fit: 'Adjustable, one size', Details: '3D embroidery' },
    },
    {
      id: 'city-cap-sand', name: 'Distressed City Cap', sub: 'Sand', cat: 'caps', img: 'city-cap-sand',
      price: 26, was: 32, rating: 4.5, reviews: 158, colors: [{ n: 'Sand', c: '#cbb89c' }, { n: 'Graphite', c: '#5a5a5a' }, { n: 'Navy', c: '#28324f' }, { n: 'Bone', c: '#efece6' }, { n: 'Mocha', c: '#5b3a2a' }, { n: 'Black', c: '#151515' }], sizes: null, stock: 44,
      badges: ['6 colours'], tags: ['sale'],
      desc: 'Structured cotton twill with bold 3D lettering, a compass patch and a frayed brim. Available in six washes.',
      specs: { Fabric: 'Cotton twill', Fit: 'Adjustable, one size', Details: 'Side patch, 3D embroidery' },
    },
    {
      id: 'velvet-brush-set', name: 'Velvet Blend Brush Set', sub: '13 pieces with pouch', cat: 'beauty', img: 'brush-set',
      price: 42, was: null, rating: 4.9, reviews: 521, colors: [{ n: 'Mocha', c: '#8b5a44' }], sizes: null, stock: 26,
      badges: ['Bestseller'], tags: [],
      desc: 'Ultra-soft synthetic bristles for powder, cream and liquid. Weighted metallic ferrules and a velvet drawstring pouch.',
      specs: { Pieces: '13 brushes + pouch', Bristles: 'Vegan synthetic', Care: 'Wash weekly with mild soap' },
    },
    {
      id: 'frosted-washbag-set', name: 'Frosted Travel Wash Bag Set', sub: 'Blush, 3 sizes', cat: 'beauty', img: 'washbag-set',
      price: 39, was: 49, rating: 4.7, reviews: 311, colors: [{ n: 'Blush', c: '#e8a7a7' }], sizes: null, stock: 33,
      badges: ['-20%'], tags: ['sale'],
      desc: 'Water-resistant frosted PVC with soft PU trim, smooth zips and carry handles. Nests together for easy storage.',
      specs: { Material: 'Frosted PVC, PU trim', Includes: 'Large, medium and small', Care: 'Wipe clean' },
    },
    {
      id: 'commuter-travel-mug', name: 'Commuter Steel Travel Mug', sub: '16 oz, gunmetal', cat: 'lifestyle', img: 'travel-mug',
      price: 34, was: null, rating: 4.8, reviews: 244, colors: [{ n: 'Gunmetal', c: '#4b4e52' }], sizes: null, stock: 28,
      badges: [], tags: [],
      desc: 'Double-wall vacuum insulation keeps coffee hot for 5 hours. Leak-resistant flip lid, textured grip and a chunky handle.',
      specs: { Capacity: '16 oz / 473 ml', Material: '18/8 stainless steel', Keeps: 'Hot 5h, cold 12h', Care: 'Hand wash' },
    },
    {
      id: 'tritan-sport-bottle', name: 'Tritan Sport Bottle', sub: '1 litre, onyx', cat: 'lifestyle', img: 'sport-bottle',
      price: 22, was: 26, rating: 4.6, reviews: 389, colors: [{ n: 'Onyx', c: '#2b2e33' }], sizes: null, stock: 60,
      badges: [], tags: ['sale'],
      desc: 'BPA-free Tritan with a one-click flip lid, leak-proof seal and a carry loop. Light enough for the gym, tough enough for the trail.',
      specs: { Capacity: '1 L / 34 oz', Material: 'BPA-free Tritan', Lid: 'Lockable flip-top', Care: 'Dishwasher safe (top rack)' },
    },
  ],

  sampleReviews: [
    { name: 'Jordan M.', loc: 'Austin, TX', stars: 5, title: 'Better than the photos', text: 'Quality is excellent and it arrived two days early. The packaging alone felt premium.' },
    { name: 'Priya S.', loc: 'Seattle, WA', stars: 5, title: 'Instant favourite', text: 'I have worn it almost every day since it arrived. Fit and finish are spot on.' },
    { name: 'Marcus L.', loc: 'Chicago, IL', stars: 4, title: 'Great value', text: 'Looks far more expensive than it is. Sizing ran slightly large for me.' },
    { name: 'Elena R.', loc: 'Miami, FL', stars: 5, title: 'Gift that landed', text: 'Bought as a gift and had to order a second one for myself.' },
  ],
};
