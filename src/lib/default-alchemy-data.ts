
import { addAlchemicalItem, getAllAlchemicalItems } from './idb';
import type { NewAlchemicalItem } from './types';

const defaultAlchemicalItems: NewAlchemicalItem[] = [
  // Potions
  { name: 'Accuracy Potion', type: 'potion', tier: 'lesser', cost: 2, effect: 'Gain accurate 4.', tags: ['buff', 'accuracy'] },
  { name: 'Barrier Potion', type: 'potion', tier: 'lesser', cost: 2, effect: 'Gain fortified 4.', tags: ['buff', 'defense'] },
  { name: 'Cleansing Potion', type: 'potion', tier: 'lesser', cost: 2, effect: 'Clear all states.', tags: ['utility', 'state removal'] },
  { name: 'Focus Potion', type: 'potion', tier: 'lesser', cost: 2, effect: 'Gain 2 focus.', tags: ['buff', 'resource'] },
  { name: 'Healing Potion', type: 'potion', tier: 'lesser', cost: 2, effect: 'Make a recovery 4.', tags: ['healing'] },
  { name: 'Invigoration Potion', type: 'potion', tier: 'lesser', cost: 2, effect: 'Gain hastened 4.', tags: ['buff', 'speed'] },
  { name: 'Mending Potion', type: 'potion', tier: 'lesser', cost: 2, effect: 'Gain mending 4.', tags: ['healing', 'regeneration'] },
  { name: 'Protection Potion', type: 'potion', tier: 'lesser', cost: 2, effect: 'Gain guarded 4.', tags: ['buff', 'defense'] },
  { name: 'Strength Potion', type: 'potion', tier: 'lesser', cost: 2, effect: 'Gain strong 4.', tags: ['buff', 'damage'] },
  { name: 'Willpower Potion', type: 'potion', tier: 'lesser', cost: 2, effect: 'Gain willful 4.', tags: ['buff', 'defense'] },

  // Powders
  { name: 'Accuracy Powder', type: 'powder', tier: 'lesser', cost: 2, effect: 'Confer accurate 2.', tags: ['buff', 'accuracy'] },
  { name: 'Barrier Powder', type: 'powder', tier: 'lesser', cost: 2, effect: 'Confer fortified 2.', tags: ['buff', 'defense'] },
  { name: 'Cleansing Powder', type: 'powder', tier: 'lesser', cost: 2, effect: 'Each affect creature clears any one state.', tags: ['utility', 'state removal'] },
  { name: 'Healing Powder', type: 'powder', tier: 'lesser', cost: 2, effect: 'Grant a recovery 2.', tags: ['healing'] },
  { name: 'Invigoration Powder', type: 'powder', tier: 'lesser', cost: 2, effect: 'Confer hastened 2.', tags: ['buff', 'speed'] },
  { name: 'Mending Powder', type: 'powder', tier: 'lesser', cost: 2, effect: 'Confer mending 2.', tags: ['healing', 'regeneration'] },
  { name: 'Protection Powder', type: 'powder', tier: 'lesser', cost: 2, effect: 'Confer guarded 2.', tags: ['buff', 'defense'] },
  { name: 'Solidification Powder', type: 'powder', tier: 'lesser', cost: 2, effect: 'Create obstacles in any six squares within the area of effect.', tags: ['control', 'terrain'] },
  { name: 'Strength Powder', type: 'powder', tier: 'lesser', cost: 2, effect: 'Confer strong 2.', tags: ['buff', 'damage'] },
  { name: 'Willpower Powder', type: 'powder', tier: 'lesser', cost: 2, effect: 'Confer willful 2.', tags: ['buff', 'defense'] },

  // Oils
  { name: 'Delirium Oil', type: 'oil', tier: 'lesser', cost: 2, effect: 'Confer delirious 4.', tags: ['debuff', 'control'] },
  { name: 'Flames Oil', type: 'oil', tier: 'lesser', cost: 2, effect: 'Confer burning 4.', tags: ['debuff', 'damage over time'] },
  { name: 'Frailty Oil', type: 'oil', tier: 'lesser', cost: 2, effect: 'Confer frail 4.', tags: ['debuff', 'vulnerability'] },
  { name: 'Frenzy Oil', type: 'oil', tier: 'lesser', cost: 2, effect: 'Confer berserk 2. On its turn, the affected creature must move to the nearest creature and attempt a light attack deed against it before doing anything else. Then this state loses 1 intensity.', tags: ['debuff', 'control'] },
  { name: 'Frost Oil', type: 'oil', tier: 'lesser', cost: 2, effect: 'Confer slow 4.', tags: ['debuff', 'control', 'speed'] },
  { name: 'Impact Oil', type: 'oil', tier: 'lesser', cost: 2, effect: 'Push 4. Confer toppled 4.', tags: ['debuff', 'control', 'forced movement'] },
  { name: 'Poison Oil', type: 'oil', tier: 'lesser', cost: 2, effect: 'Confer poisoned 6.', tags: ['debuff', 'damage over time'] },
  { name: 'Slumber Oil', type: 'oil', tier: 'lesser', cost: 2, effect: 'Confer sleeping 4.', tags: ['debuff', 'control'] },
  { name: 'Sparks Oil', type: 'oil', tier: 'lesser', cost: 2, effect: 'Confer inaccurate 4.', tags: ['debuff', 'accuracy'] },
  { name: 'Stunning Oil', type: 'oil', tier: 'lesser', cost: 2, effect: 'The target loses two action points at the start of its next turn.', tags: ['debuff', 'control'] },
  { name: 'Vampirism Oil', type: 'oil', tier: 'lesser', cost: 2, effect: 'Regain hit points equal to half the damage dealt to the target.', tags: ['healing', 'lifesteal'] },
  { name: 'Weakening Oil', type: 'oil', tier: 'lesser', cost: 2, effect: 'Confer weak 4.', tags: ['debuff', 'damage'] },

  // Bombs
  { name: 'Cinders Bomb', type: 'bomb', tier: 'lesser', cost: 2, effect: 'Create a field of cinders that deals 2 terrain damage in the area of effect.', tags: ['damage', 'area of effect', 'terrain'] },
  { name: 'Blasting Bomb', type: 'bomb', tier: 'lesser', cost: 2, effect: 'Deal {DMG} damage.', tags: ['damage', 'area of effect'] },
  { name: 'Delirium Bomb', type: 'bomb', tier: 'lesser', cost: 2, effect: 'Confer delirious 2.', tags: ['debuff', 'control', 'area of effect'] },
  { name: 'Flames Bomb', type: 'bomb', tier: 'lesser', cost: 2, effect: 'Confer burning 2.', tags: ['debuff', 'damage over time', 'area of effect'] },
  { name: 'Glue Bomb', type: 'bomb', tier: 'lesser', cost: 2, effect: 'Create a field of difficult terrain the area of effect.', tags: ['control', 'terrain', 'area of effect'] },
  { name: 'Force Bomb', type: 'bomb', tier: 'lesser', cost: 2, effect: 'Push 2 from the center of the blast. Confer toppled.', tags: ['control', 'forced movement', 'area of effect'] },
  { name: 'Frost Bomb', type: 'bomb', tier: 'lesser', cost: 2, effect: 'Confer slow 2.', tags: ['debuff', 'control', 'speed', 'area of effect'] },
  { name: 'Poison Bomb', type: 'bomb', tier: 'lesser', cost: 2, effect: 'Confer poisoned 4.', tags: ['debuff', 'damage over time', 'area of effect'] },
  { name: 'Smoke Bomb', type: 'bomb', tier: 'lesser', cost: 2, effect: 'Create a heavy cloud in the area of effect.', tags: ['control', 'obscurement', 'area of effect'] },
  { name: 'Sparks Bomb', type: 'bomb', tier: 'lesser', cost: 2, effect: 'Confer inaccurate 2.', tags: ['debuff', 'accuracy', 'area of effect'] },
  { name: 'Stunning Bomb', type: 'bomb', tier: 'lesser', cost: 2, effect: 'The target loses one action point at the start of its next turn.', tags: ['debuff', 'control', 'area of effect'] },
  { name: 'Solidification Bomb', type: 'bomb', tier: 'lesser', cost: 2, effect: 'Create obstacles in any six squares within the area of effect.', tags: ['control', 'terrain', 'area of effect'] },
];

export async function populateDefaultAlchemyData() {
  try {
    const existingItems = await getAllAlchemicalItems();
    if (existingItems.length > 0) {
      return; // DB already has data
    }

    const transactionPromises = defaultAlchemicalItems.map(item => addAlchemicalItem(item));
    await Promise.all(transactionPromises);
    
    console.log(`Successfully populated ${defaultAlchemicalItems.length} default alchemical items.`);
  } catch (error) {
    console.error('Failed to populate default alchemical items:', error);
  }
}
