import type { AmazonMarketplace } from '../types/index.ts';

export interface CatalogIdea {
  id: string;
  name: string;
  suggested_custom_code: string;
  category_id: string;
  category_name: string;
  short_description: string;
  description: string;
  key_points: string[];
  useful_for: string[];
  considerations: string;
  image_path: string;
  suggested_price: string;
  affiliate_url: string;
  marketplace_code: AmazonMarketplace;
}

export const CATALOG_IDEAS: CatalogIdea[] = [
  {
    id: 'idea-kitchen-scale',
    name: 'Precision Digital Kitchen Scale with Walnut Platform',
    suggested_custom_code: '#K-01',
    category_id: 'cat-kitchen',
    category_name: 'Kitchen',
    short_description: '0.1g high-precision food & coffee scale with integrated timer and real walnut deck.',
    description: 'Designed for precision pour-overs, artisanal baking, and macro-tracking. Combines laboratory-grade strain gauge sensors with a spill-resistant real walnut wood weighing deck and hidden backlit LED display.',
    key_points: [
      'High-precision 0.1g resolution up to 3,000g capacity',
      'Dual modes: Auto-tare flow timer for espresso/pour-over and standard unit toggle',
      'Hidden LED display shines through the brushed timber face when active',
      'Rechargeable 1,200mAh lithium battery via USB-C (lasts up to 4 months per charge)',
    ],
    useful_for: [
      'Specialty coffee brewing where water-to-bean ratios determine flavor',
      'Sourdough and pastry baking requiring exact gram measurements',
      'Meal prepping and fitness macro weighing with zero visual counter clutter',
    ],
    considerations: 'Walnut deck should be wiped with damp cloth; do not immerse in dishwater.',
    image_path: '/images/gan_compact_charger_1791747854699.jpg',
    suggested_price: '$38.00',
    affiliate_url: 'https://www.amazon.com/dp/B0CKITCHSC?tag=findniche-20',
    marketplace_code: 'US',
  },
  {
    id: 'idea-gravity-grinder',
    name: 'Rechargeable Gravity Electric Salt & Pepper Mill Set',
    suggested_custom_code: '#K-02',
    category_id: 'cat-kitchen',
    category_name: 'Kitchen',
    short_description: 'One-handed tilt-activated ceramic burr grinders with warm LED illumination.',
    description: 'Simply invert the grinder with one hand to freshly crack sea salt or peppercorns over your skillet. Features rustproof ceramic burrs, adjustable coarseness from fine powder to coarse cracked crunch, and a magnetic desktop charging dock.',
    key_points: [
      'Automatic gravity activation: tilts 45 degrees to start grinding automatically',
      'Non-corrosive heavy-duty ceramic grinding cores that never alter spice flavor',
      'Stepless coarseness adjustment knob on the stainless steel top cap',
      'Built-in warm white spotlight illuminates cooking pots so you see spice dispersion',
    ],
    useful_for: [
      'Busy cooking moments when one hand is stirring or flipping food',
      'Anyone experiencing arthritis or hand strain with traditional manual twist mills',
      'Dinner tables and outdoor barbecues',
    ],
    considerations: 'Clear spice hopper holds up to 85g of whole peppercorns. Recharges on dual contact dock.',
    image_path: '/images/magsafe_power_bank_1791747842268.jpg',
    suggested_price: '$45.00',
    affiliate_url: 'https://www.amazon.com/dp/B0CGRVTMLL?tag=findniche-20',
    marketplace_code: 'US',
  },
  {
    id: 'idea-magnetic-timer',
    name: 'Minimalist Rotary Magnetic Kitchen & Focus Timer',
    suggested_custom_code: '#K-03',
    category_id: 'cat-kitchen',
    category_name: 'Kitchen',
    short_description: 'Intuitive metallic twist dial timer with silent countdown and magnetic fridge backing.',
    description: 'A tactile, delightful alternative to clumsy phone alarms. Spin the outer aluminum bezel to dial your time from 1 second to 99 minutes. Adheres to refrigerators, range hoods, or sits at a 70-degree angle on your countertop.',
    key_points: [
      'Smooth twist bezel with mechanical haptic resistance for fast, precise time setting',
      'Dual volume levels plus a silent blinking LED mode for study sessions',
      'Strong dual neodymium magnets grip firmly to stainless appliances without sliding',
      'Large high-contrast mirror display visible from across the room',
    ],
    useful_for: [
      'Steeping teas, boiling eggs, and timing oven bakes without picking up greasy phones',
      'Pomodoro study and focus work blocks away from digital distractions',
      'Workout intervals and classroom presentations',
    ],
    considerations: 'Uses 3 AAA batteries (included); average battery lifespan is over 1 year.',
    image_path: '/images/desk_screenbar_light_1791747866894.jpg',
    suggested_price: '$22.00',
    affiliate_url: 'https://www.amazon.com/dp/B09ROTMTMR?tag=findniche-20',
    marketplace_code: 'US',
  },
  {
    id: 'idea-cold-brew-bottle',
    name: 'Borosilicate Glass Cold Brew Bottle with Ultrafine Filter',
    suggested_custom_code: '#K-04',
    category_id: 'cat-kitchen',
    category_name: 'Kitchen',
    short_description: 'Wine-bottle silhouette cold brewer with 800-mesh stainless steel filtration cone.',
    description: 'Brew silky, low-acidity cold brew coffee or iced loose-leaf tea directly inside your refrigerator door. Crafted from thermal-shock resistant borosilicate glass with a silicone spout cap that seals tight when laid horizontally.',
    key_points: [
      'Wine bottle profile slides into slim refrigerator door shelves effortlessly',
      'Ultra-fine 800-mesh reusable filter ensures crystal clear coffee with zero sludge',
      'Food-grade silicone spout with leakproof airtight stopper cap',
      'Dishwasher safe glass body withstands temperatures from -4°F to 300°F',
    ],
    useful_for: [
      'Overnight batch cold brewing for ready-to-drink morning iced coffee',
      'Cold steeping fruit-infused waters and Japanese sencha green teas',
      'Serving chilled beverages at brunch gatherings with minimalist poise',
    ],
    considerations: 'Yields 750ml of brew (approx. 3–4 iced coffee servings).',
    image_path: '/images/ergonomic_vertical_mouse_1791747877658.jpg',
    suggested_price: '$32.00',
    affiliate_url: 'https://www.amazon.com/dp/B08CLDBREW?tag=findniche-20',
    marketplace_code: 'US',
  },
  {
    id: 'idea-titanium-pry',
    name: 'Grade 5 Titanium Pocket Prybar & Bottle Opener',
    suggested_custom_code: '#EDC-01',
    category_id: 'cat-edc',
    category_name: 'EDC',
    short_description: 'Indestructible featherweight everyday utility tool with deep-carry pocket clip.',
    description: 'CNC-machined from aerospace Grade 5 titanium, this 4-inch pocket bar handles the hard scraping, box opening, and prying tasks that would chip or break a folding knife blade.',
    key_points: [
      'CNC milled from solid 6Al-4V titanium: virtually indestructible and rustproof',
      'Weighs only 1.4 oz (39 grams) for completely imperceptible pocket carry',
      'Features box tape scorer, flathead driver/pry wedge, and cap lifter',
      'Stonewashed surface hides everyday pocket rub and key scratches',
    ],
    useful_for: [
      'Opening taped packages, scraping labels, and prying open paint cans or battery doors',
      'Popping bottle caps cleanly without bending',
      'Keychains and pocket pouches for everyday carry enthusiasts',
    ],
    considerations: 'Beveled edge is optimized for prying and scraping rather than razor-sharp cutting.',
    image_path: '/images/magnetic_cable_dock_1791747890185.jpg',
    suggested_price: '$39.00',
    affiliate_url: 'https://www.amazon.com/dp/B09EDCPRY1?tag=findniche-20',
    marketplace_code: 'US',
  },
  {
    id: 'idea-leather-desk-pad',
    name: 'Top-Grain Full Desk Mat with Magnetic Cable Guide',
    suggested_custom_code: '#H-01',
    category_id: 'cat-home',
    category_name: 'Home',
    short_description: 'Water-resistant vegan saddle leather desk blotter with recessed magnetic cable groove.',
    description: 'Transforms cold wood or laminate desks into an inviting, warm tactile workstation. Features a full 36x18 inch footprint, smooth optical mouse tracking, and an integrated magnetic cable dock along the top edge.',
    key_points: [
      'Supple dual-layer vegan leather with non-slip suede bottom backing',
      'Waterproof oil-resistant surface wipes clean from coffee drops in seconds',
      'Includes 2 matching magnetic cable anchors that lock into the top channel',
      'Cushions forearms and reduces keyboard typing reverberation through the desk',
    ],
    useful_for: [
      'Creating a defined, organized visual perimeter for keyboard, mouse, and notebook',
      'Protecting expensive wooden desks from scratches, heat, and moisture rings',
      'Smooth, low-friction glide for optical and laser mice without extra mousepads',
    ],
    considerations: 'Ships rolled; lay flat for 24 hours or place books on corners for initial settling.',
    image_path: '/images/desk_screenbar_light_1791747866894.jpg',
    suggested_price: '$36.00',
    affiliate_url: 'https://www.amazon.com/dp/B08DSKMAT1?tag=findniche-20',
    marketplace_code: 'US',
  },
];
