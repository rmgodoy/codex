
import type { NewTreasure } from './types';

const MATERIALS_AND_GEMSTONES = [
  { material: 'Stone', gemstone: 'Jasper' },
  { material: 'Wood', gemstone: 'Citrine' },
  { material: 'Bone', gemstone: 'Moonstone' },
  { material: 'Leather', gemstone: 'Jade' },
  { material: 'Bronze', gemstone: 'Lapis Lazuli' },
  { material: 'Tin', gemstone: 'Amber' },
  { material: 'Lead', gemstone: 'Moonstone' },
  { material: 'Pewter', gemstone: 'Agate' },
  { material: 'Brass', gemstone: 'Peridot' },
  { material: 'Copper', gemstone: 'Turquoise' },
  { material: 'Iron', gemstone: 'Amethyst' },
  { material: 'Porcelain', gemstone: 'Opal' },
  { material: 'Glass', gemstone: 'Aquamarine' },
  { material: 'Coral', gemstone: 'Zircon' },
  { material: 'Petrified Wood', gemstone: 'Garnet' },
  { material: 'Crystal', gemstone: 'Pearl' },
  { material: 'Silver', gemstone: 'Emerald' },
  { material: 'Electrum', gemstone: 'Sapphire' },
  { material: 'Gold', gemstone: 'Ruby' },
  { material: 'Platinum', gemstone: 'Diamond' },
];

const TREASURE_FORM_FACTOR = [
  { '1-3': { name: 'Gemstone (no material roll)', slots: 'tiny' }, '4-6': { name: 'Pot', slots: '1' } },
  { '1-3': { name: 'Game Piece', slots: 'tiny' }, '4-6': { name: 'Toy', slots: '1' } },
  { '1-3': { name: 'Silverware', slots: 'tiny' }, '4-6': { name: 'Box', slots: '1' } },
  { '1-3': { name: 'Earring', slots: 'tiny' }, '4-6': { name: 'Drum', slots: '1' } },
  { '1-3': { name: 'Ring', slots: 'tiny' }, '4-6': { name: 'Flute', slots: '1' } },
  { '1-3': { name: 'Buckle', slots: 'tiny' }, '4-6': { name: 'Lute', slots: '1' } },
  { '1-3': { name: 'Hairpin', slots: 'tiny' }, '4-6': { name: 'Horn', slots: '1' } },
  { '1-3': { name: 'Doll', slots: 'tiny' }, '4-6': { name: 'Game Set', slots: '1' } },
  { '1-3': { name: 'Figurine', slots: 'tiny' }, '4-6': { name: 'Scroll Case', slots: '1' } },
  { '1-3': { name: 'Bracelet', slots: 'tiny' }, '4-6': { name: 'Candelabra', slots: '1' } },
  { '1-3': { name: 'Torque', slots: 'tiny' }, '4-6': { name: 'Framed Painting', slots: '2' } },
  { '1-3': { name: 'Circlet', slots: 'tiny' }, '4-6': { name: 'Statuette', slots: '2' } },
  { '1-3': { name: 'Necklace', slots: 'tiny' }, '4-6': { name: 'Vase', slots: '2' } },
  { '1-3': { name: 'Goblet', slots: 'tiny' }, '4-6': { name: 'Cauldron', slots: '2' } },
  { '1-3': { name: 'Hand Mirror', slots: '1' }, '4-6': { name: 'Harp', slots: '2' } },
  { '1-3': { name: 'Book', slots: '1' }, '4-6': { name: 'Chest', slots: '2' } },
  { '1-3': { name: 'Spyglass', slots: '1' }, '4-6': { name: 'Large Framed Painting', slots: '3' } },
  { '1-3': { name: 'Scepter', slots: '1' }, '4-6': { name: 'Tapestry', slots: '3' } },
  { '1-3': { name: 'Crown', slots: '1' }, '4-6': { name: 'Standing Mirror', slots: '3' } },
  { '1-3': { name: 'Holy Relic', slots: '1' }, '4-6': { name: 'Sculpture', slots: '3' } },
];

const roll = (sides: number) => Math.floor(Math.random() * sides) + 1;

const calculateValue = (d20Sum: number): number => {
  if (d20Sum <= 25) return 1;
  if (d20Sum <= 35) return 3;
  return 5;
};

export const generateRandomTreasure = (): Omit<NewTreasure, 'tags'> => {
  const d20FormFactor = roll(20);
  const d20Material = roll(20);
  const d20Gemstone = roll(20);
  const d6 = roll(6);

  const value = calculateValue(d20FormFactor + d20Material + d20Gemstone);

  const formFactorColumn = d6 <= 3 ? '1-3' : '4-6';
  const formFactorResult = TREASURE_FORM_FACTOR[d20FormFactor - 1][formFactorColumn];

  const { gemstone } = MATERIALS_AND_GEMSTONES[d20Gemstone - 1];
  let { material } = MATERIALS_AND_GEMSTONES[d20Material - 1];
  
  // Handle Gemstone form factor override
  if (formFactorResult.name.startsWith('Gemstone')) {
      material = 'N/A';
  }

  const name = formFactorResult.name;
  const slots = formFactorResult.slots;

  let description = `A ${name.toLowerCase()}`;
  if (material !== 'N/A') {
      description += ` made of ${material.toLowerCase()}`;
  }
  description += `, inlaid with ${gemstone.toLowerCase()}.`;

  return {
    name,
    description,
    value,
    slots,
    material,
    gemstone,
    isGenerated: true,
  };
};
