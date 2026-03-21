import type { InstockProduct, PartnerProduct, Partner, ImportServiceConfig } from '@/types/types';

// ─── Shared Partners & Configs ───────────────────────────────────

const importConfigJP: ImportServiceConfig = {
  id: 'isc-001', code: 'JP-STD', base_shipping_fee: 15.00, country_code: 'JP', country_name: 'Japan',
  import_tax_percentage: 8.00, is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
};

const importConfigUS: ImportServiceConfig = {
  id: 'isc-002', code: 'US-STD', base_shipping_fee: 22.50, country_code: 'US', country_name: 'United States',
  import_tax_percentage: 5.00, is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
};

const partnerLumina: Partner = {
  id: 'ptr-001', name: 'LuminaCraft Co.', description: 'Premium 3D printed lighting solutions',
  contact_email: 'ops@luminacraft.jp', contact_phone: '+81-3-1234-5678', address: 'Shibuya, Tokyo, Japan',
  slug: 'luminacraft-co', import_service_config_id: 'isc-001', is_active: true,
  created_at: '2025-03-10T00:00:00Z', updated_at: '2025-06-15T00:00:00Z',
  import_service_config: importConfigJP,
};

const partnerDino: Partner = {
  id: 'ptr-002', name: 'DinoMakers Studio', description: 'Articulated toy design studio',
  contact_email: 'hello@dinomakers.com', contact_phone: '+1-555-234-5678', address: '123 Maker St, San Francisco, CA',
  slug: 'dinomakers-studio', import_service_config_id: 'isc-002', is_active: true,
  created_at: '2025-04-01T00:00:00Z', updated_at: '2025-09-20T00:00:00Z',
  import_service_config: importConfigUS,
};

const partnerTerra: Partner = {
  id: 'ptr-003', name: 'TerraPrint Designs', description: 'Topographic and architectural art',
  contact_email: 'info@terraprint.de', contact_phone: '+49-30-9876-5432', address: 'Kreuzberg, Berlin, Germany',
  slug: 'terraprint-designs', import_service_config_id: 'isc-002', is_active: true,
  created_at: '2025-05-15T00:00:00Z', updated_at: '2025-11-10T00:00:00Z',
  import_service_config: importConfigUS,
};

// ─── Instock Products ────────────────────────────────────────────

export const instockProducts: InstockProduct[] = [
  {
    id: 'ip-001', code: 'PCC', slug: 'puzzle-cube-classic', name: 'Puzzle Cube Classic',
    total_piece_count: 26,
    difficult_level: 'EASY', estimated_build_time: 15,
    thumbnail_url: 'https://placehold.co/120x120/1a1a2e/e0e0e0?text=Cube',
    preview_asset: { images: ['cube_front.webp', 'cube_side.webp'], video: 'cube_360.mp4' },
    description: 'A timeless 3×3 puzzle cube made from premium ABS plastic. Perfect for beginners and speedcubers alike.',
    topic_id: 'topic-001', assembly_method_id: 'am-001', capability_id: 'cap-001', material_id: 'mat-001',
    is_active: true, created_at: '2025-11-14T08:30:00Z', updated_at: '2026-01-20T10:00:00Z',
    topic: { id: 'topic-001', name: 'Puzzles', description: 'Brain-teaser puzzles', slug: 'puzzles', parent_id: 'root', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
    assembly_method: { id: 'am-001', name: 'Snap-fit', description: 'Interlocking snap connections', slug: 'snap-fit', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
    material: { id: 'mat-001', name: 'ABS Plastic', description: 'Durable thermoplastic', slug: 'abs-plastic', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
    capability: { id: 'cap-001', name: 'Motor Skills', description: 'Enhances fine motor skills', slug: 'motor-skills', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
    variants: [
      {
        id: 'v-001a', instock_product_id: 'ip-001', sku: 'PCC-BLK', color: 'Black',
        assembled_length_mm: 57, assembled_width_mm: 57, assembled_height_mm: 57,
        is_active: true, created_at: '2025-11-14T08:30:00Z', updated_at: '2026-01-20T10:00:00Z',
        inventory: { id: 'inv-001a', instock_product_variant_id: 'v-001a', total_quantity: 340, created_at: '2025-11-14T08:30:00Z', updated_at: '2026-03-01T00:00:00Z' },
        price_details: [
          { id: 'ppd-001a', instock_price_id: 'price-std', instock_product_variant_id: 'v-001a', unit_price: 12.99, is_active: true, created_at: '2025-11-01T00:00:00Z', updated_at: '2025-11-01T00:00:00Z', price_name: 'Standard' },
        ],
      },
      {
        id: 'v-001b', instock_product_id: 'ip-001', sku: 'PCC-WHT', color: 'White',
        assembled_length_mm: 57, assembled_width_mm: 57, assembled_height_mm: 57,
        is_active: true, created_at: '2025-11-14T08:30:00Z', updated_at: '2026-01-20T10:00:00Z',
        inventory: { id: 'inv-001b', instock_product_variant_id: 'v-001b', total_quantity: 210, created_at: '2025-11-14T08:30:00Z', updated_at: '2026-02-15T00:00:00Z' },
        price_details: [
          { id: 'ppd-001b', instock_price_id: 'price-std', instock_product_variant_id: 'v-001b', unit_price: 12.99, is_active: true, created_at: '2025-11-01T00:00:00Z', updated_at: '2025-11-01T00:00:00Z', price_name: 'Standard' },
        ],
      },
      {
        id: 'v-001c', instock_product_id: 'ip-001', sku: 'PCC-NAT', color: 'Natural',
        assembled_length_mm: 60, assembled_width_mm: 60, assembled_height_mm: 60,
        is_active: false, created_at: '2025-12-01T00:00:00Z', updated_at: '2026-01-20T10:00:00Z',
        inventory: { id: 'inv-001c', instock_product_variant_id: 'v-001c', total_quantity: 45, created_at: '2025-12-01T00:00:00Z', updated_at: '2026-02-10T00:00:00Z' },
        price_details: [
          { id: 'ppd-001c', instock_price_id: 'price-std', instock_product_variant_id: 'v-001c', unit_price: 24.99, is_active: true, created_at: '2025-12-15T00:00:00Z', updated_at: '2025-12-15T00:00:00Z', price_name: 'Standard' },
          { id: 'ppd-001c2', instock_price_id: 'price-promo', instock_product_variant_id: 'v-001c', unit_price: 19.99, is_active: false, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-31T00:00:00Z', price_name: 'Jan Promo' },
        ],
      },
    ],
  },
  {
    id: 'ip-002', code: 'DSK', slug: 'dragon-sculpture-kit', name: 'Dragon Sculpture Kit',
    total_piece_count: 124,
    difficult_level: 'HARD', estimated_build_time: 180,
    thumbnail_url: 'https://placehold.co/120x120/2d1b69/e0e0e0?text=Dragon',
    preview_asset: { images: ['dragon_front.webp'], video: null },
    description: 'An intricate 3D dragon model consisting of 120+ interlocking pieces. Includes a display stand and LED eye inserts.',
    topic_id: 'topic-002', assembly_method_id: 'am-002', capability_id: 'cap-002', material_id: 'mat-002',
    is_active: true, created_at: '2026-01-05T14:00:00Z', updated_at: '2026-02-28T09:00:00Z',
    topic: { id: 'topic-002', name: 'Figures', description: 'Display figures and sculptures', slug: 'figures', parent_id: 'root', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
    assembly_method: { id: 'am-002', name: 'Glue & Pin', description: 'Adhesive with alignment pins', slug: 'glue-pin', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
    material: { id: 'mat-002', name: 'PLA Resin', description: 'Biodegradable resin', slug: 'pla-resin', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
    capability: { id: 'cap-002', name: 'Creativity', description: 'Enhances creative skills', slug: 'creativity', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
    variants: [
      {
        id: 'v-002a', instock_product_id: 'ip-002', sku: 'DSK-RED', color: 'Crimson Red',
        assembled_length_mm: 250, assembled_width_mm: 120, assembled_height_mm: 180,
        is_active: true, created_at: '2026-01-05T14:00:00Z', updated_at: '2026-02-28T09:00:00Z',
        inventory: { id: 'inv-002a', instock_product_variant_id: 'v-002a', total_quantity: 58, created_at: '2026-01-05T14:00:00Z', updated_at: '2026-03-01T00:00:00Z' },
        price_details: [
          { id: 'ppd-002a', instock_price_id: 'price-std', instock_product_variant_id: 'v-002a', unit_price: 79.99, is_active: true, created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z', price_name: 'Standard' },
        ],
      },
      {
        id: 'v-002b', instock_product_id: 'ip-002', sku: 'DSK-GLD', color: 'Metallic Gold',
        assembled_length_mm: 250, assembled_width_mm: 120, assembled_height_mm: 180,
        is_active: true, created_at: '2026-01-05T14:00:00Z', updated_at: '2026-02-28T09:00:00Z',
        inventory: { id: 'inv-002b', instock_product_variant_id: 'v-002b', total_quantity: 15, created_at: '2026-01-05T14:00:00Z', updated_at: '2026-03-05T00:00:00Z' },
        price_details: [
          { id: 'ppd-002b', instock_price_id: 'price-std', instock_product_variant_id: 'v-002b', unit_price: 89.99, is_active: true, created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-05T00:00:00Z', price_name: 'Standard' },
        ],
      },
    ],
  },
  {
    id: 'ip-003', code: 'MCB', slug: 'mini-city-block-set', name: 'Mini City Block Set',
    total_piece_count: 88,
    difficult_level: 'MEDIUM', estimated_build_time: 90,
    thumbnail_url: 'https://placehold.co/120x120/0d7377/e0e0e0?text=City',
    preview_asset: { images: ['city_overview.webp'] },
    description: 'A modular city-building set with snap-fit architecture. Create skyscrapers, parks, and streets.',
    topic_id: 'topic-003', assembly_method_id: 'am-001', capability_id: 'cap-001', material_id: 'mat-001',
    is_active: false, created_at: '2026-02-20T10:15:00Z', updated_at: '2026-03-01T08:00:00Z',
    variants: [
      {
        id: 'v-003a', instock_product_id: 'ip-003', sku: 'MCB-MIX', color: 'Multicolor',
        assembled_length_mm: 300, assembled_width_mm: 200, assembled_height_mm: 150,
        is_active: true, created_at: '2026-02-20T10:15:00Z', updated_at: '2026-03-01T08:00:00Z',
        inventory: { id: 'inv-003a', instock_product_variant_id: 'v-003a', total_quantity: 0, created_at: '2026-02-20T10:15:00Z', updated_at: '2026-03-10T00:00:00Z' },
        price_details: [
          { id: 'ppd-003a', instock_price_id: 'price-std', instock_product_variant_id: 'v-003a', unit_price: 34.99, is_active: true, created_at: '2026-02-20T00:00:00Z', updated_at: '2026-02-20T00:00:00Z', price_name: 'Standard' },
        ],
      },
    ],
  },
  {
    id: 'ip-004', code: 'MHP', slug: 'mechanical-heart-puzzle', name: 'Mechanical Heart Puzzle',
    total_piece_count: 210,
    difficult_level: 'EXPERT', estimated_build_time: 240,
    thumbnail_url: 'https://placehold.co/120x120/8b0000/e0e0e0?text=Heart',
    preview_asset: { images: ['heart_assembled.webp', 'heart_exploded.webp'], video: 'heart_demo.mp4' },
    description: 'A beautifully engineered gear-driven heart. Turns and clicks with satisfying precision.',
    topic_id: 'topic-004', assembly_method_id: 'am-002', capability_id: 'cap-002', material_id: 'mat-003',
    is_active: true, created_at: '2026-03-01T16:45:00Z', updated_at: '2026-03-10T14:00:00Z',
    variants: [
      {
        id: 'v-004a', instock_product_id: 'ip-004', sku: 'MHP-BRZ', color: 'Bronze',
        assembled_length_mm: 140, assembled_width_mm: 130, assembled_height_mm: 120,
        is_active: true, created_at: '2026-03-01T16:45:00Z', updated_at: '2026-03-10T14:00:00Z',
        inventory: { id: 'inv-004a', instock_product_variant_id: 'v-004a', total_quantity: 12, created_at: '2026-03-01T16:45:00Z', updated_at: '2026-03-12T00:00:00Z' },
        price_details: [
          { id: 'ppd-004a', instock_price_id: 'price-std', instock_product_variant_id: 'v-004a', unit_price: 149.99, is_active: true, created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z', price_name: 'Standard' },
        ],
      },
      {
        id: 'v-004b', instock_product_id: 'ip-004', sku: 'MHP-SLV', color: 'Silver',
        assembled_length_mm: 140, assembled_width_mm: 130, assembled_height_mm: 120,
        is_active: true, created_at: '2026-03-01T16:45:00Z', updated_at: '2026-03-10T14:00:00Z',
        inventory: { id: 'inv-004b', instock_product_variant_id: 'v-004b', total_quantity: 7, created_at: '2026-03-01T16:45:00Z', updated_at: '2026-03-12T00:00:00Z' },
        price_details: [
          { id: 'ppd-004b', instock_price_id: 'price-std', instock_product_variant_id: 'v-004b', unit_price: 159.99, is_active: true, created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z', price_name: 'Standard' },
        ],
      },
      {
        id: 'v-004c', instock_product_id: 'ip-004', sku: 'MHP-WAL', color: 'Dark Brown',
        assembled_length_mm: 145, assembled_width_mm: 135, assembled_height_mm: 125,
        is_active: false, created_at: '2026-02-15T00:00:00Z', updated_at: '2026-03-10T14:00:00Z',
        inventory: { id: 'inv-004c', instock_product_variant_id: 'v-004c', total_quantity: 30, created_at: '2026-02-15T00:00:00Z', updated_at: '2026-03-08T00:00:00Z' },
        price_details: [
          { id: 'ppd-004c', instock_price_id: 'price-std', instock_product_variant_id: 'v-004c', unit_price: 119.99, is_active: true, created_at: '2026-02-15T00:00:00Z', updated_at: '2026-02-15T00:00:00Z', price_name: 'Standard' },
          { id: 'ppd-004c2', instock_price_id: 'price-promo', instock_product_variant_id: 'v-004c', unit_price: 99.99, is_active: false, created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-15T00:00:00Z', price_name: 'Mar Promo' },
        ],
      },
    ],
  },
];

// ─── Partner Products ────────────────────────────────────────────

export const partnerProducts: PartnerProduct[] = [
  {
    id: 'pp-001', partner_id: 'ptr-001', name: 'Galaxy Lamp Night Light',
    reference_price: 39.99,
    description: 'Stunning galaxy-themed lamp with rotating projection.',
    thumbnail_url: 'https://placehold.co/120x120/6366f1/ffffff?text=Lamp',
    preview_asset: { images: ['galaxy_lamp.webp'] },
    slug: 'galaxy-lamp-night-light',
    is_active: true, created_at: '2026-01-18T09:00:00Z', updated_at: '2026-02-10T00:00:00Z',
    partner: partnerLumina,
  },
  {
    id: 'pp-002', partner_id: 'ptr-002', name: 'Articulated Flexi-Rex',
    reference_price: 18.50,
    description: 'Fully articulated T-Rex fidget toy, print-in-place design.',
    thumbnail_url: 'https://placehold.co/120x120/22c55e/ffffff?text=Rex',
    preview_asset: { images: ['flexirex.webp'] },
    slug: 'articulated-flexi-rex',
    is_active: true, created_at: '2026-02-03T11:30:00Z', updated_at: '2026-03-01T00:00:00Z',
    partner: partnerDino,
  },
  {
    id: 'pp-003', partner_id: 'ptr-003', name: 'Topographic Map Wall Art',
    reference_price: 65.00,
    description: 'Layered 3D topographic map for wall mounting.',
    thumbnail_url: 'https://placehold.co/120x120/f97316/ffffff?text=Map',
    preview_asset: { images: ['topo_map.webp'] },
    slug: 'topographic-map-wall-art',
    is_active: true, created_at: '2026-02-28T14:20:00Z', updated_at: '2026-03-05T00:00:00Z',
    partner: partnerTerra,
  },
  {
    id: 'pp-004', partner_id: 'ptr-001', name: 'Modular Desk Organizer',
    reference_price: 27.99,
    description: 'Customizable 3D printed desk organizer with interlocking modules.',
    thumbnail_url: 'https://placehold.co/120x120/6366f1/ffffff?text=Desk',
    preview_asset: { images: ['desk_org.webp'] },
    slug: 'modular-desk-organizer',
    is_active: false, created_at: '2026-03-10T08:50:00Z', updated_at: '2026-03-12T00:00:00Z',
    partner: partnerLumina,
  },
];
