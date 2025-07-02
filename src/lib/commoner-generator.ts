
import type { Commoner } from './types';

const roll = (sides: number) => Math.floor(Math.random() * sides) + 1;

const ALIGNMENT_TYPES = [
  { range: [1, 1], type: 'Wicked', rolls: ['vice', 'vice'] },
  { range: [2, 3], type: 'Unhinged', rolls: ['vice', 'oddity'] },
  { range: [4, 7], type: 'Balanced', rolls: ['virtue', 'vice'] },
  { range: [8, 9], type: 'Eccentric', rolls: ['virtue', 'oddity'] },
  { range: [10, 10], type: 'Virtuous', rolls: ['virtue', 'virtue'] },
];

const VIRTUES_AND_VICES = [
  { virtue: 'Calm', vice: 'Wrathful' }, // 1
  { virtue: 'Daring', vice: 'Cowardly' }, // 2
  { virtue: 'Thoughtful', vice: 'Impulsive' }, // 3
  { virtue: 'Dutiful', vice: 'Unruly' }, // 4
  { virtue: 'Generous', vice: 'Greedy' }, // 5
  { virtue: 'Honest', vice: 'Deceitful' }, // 6
  { virtue: 'Supportive', vice: 'Envious' }, // 7
  { virtue: 'Humble', vice: 'Arrogant' }, // 8
  { virtue: 'Kind', vice: 'Cruel' }, // 9
  { virtue: 'Trusting', vice: 'Paranoid' }, // 10
];

const ODDITIES = [
  // d6 ->
  ['Obsessive', 'Steadfast', 'Altruistic', 'Haunted', 'Crude', 'Naïve'], // d8=1
  ['Whimsical', 'Imperious', 'Observant', 'Prideful', 'Self-Righteous', 'Vile'], // d8=2
  ['Anarchic', 'Eloquent', 'Jaded', 'Imaginative', 'Blunt', 'Tedious'], // d8=3
  ['Gentle', 'Delusional', 'Capricious', 'Nonchalant', 'Valiant', 'Merciful'], // d8=4
  ['Destructive', 'Loyal', 'Sarcastic', 'Servile', 'Ethical', 'Devout'], // d8=5
  ['Callous', 'Tense', 'Seductive', 'Fair-Minded', 'Spirited', 'Absentminded'], // d8=6
  ['Slothful', 'Curious', 'Clumsy', 'Heartless', 'Dramatic', 'Erudite'], // d8=7
  ['Stoic', 'Cheerful', 'Regal', 'Ambitious', 'Reliable', 'Vengeful'], // d8=8
];

const rollOddity = (): string => {
  const d8 = roll(8);
  const d6 = roll(6);
  return ODDITIES[d8 - 1][d6 - 1];
};

const generateAlignment = (): string => {
  const d10 = roll(10);
  const alignmentType = ALIGNMENT_TYPES.find(at => d10 >= at.range[0] && d10 <= at.range[1])!;

  let traits: string[] = [];
  let d10Rolls: number[] = [];

  for (const rollType of alignmentType.rolls) {
    if (rollType === 'virtue') {
      const virtueRoll = roll(10);
      d10Rolls.push(virtueRoll);
      traits.push(VIRTUES_AND_VICES[virtueRoll - 1].virtue);
    } else if (rollType === 'vice') {
      const viceRoll = roll(10);
      d10Rolls.push(viceRoll);
      traits.push(VIRTUES_AND_VICES[viceRoll - 1].vice);
    } else { // oddity
      traits.push(rollOddity());
    }
  }

  // Check for "Strange" alignment conditions
  const hasDuplicateTraits = new Set(traits).size !== traits.length;
  const hasOpposedPair = d10Rolls.length === 2 && d10Rolls[0] === d10Rolls[1];

  if (hasDuplicateTraits || hasOpposedPair) {
    let oddity1 = rollOddity();
    let oddity2 = rollOddity();
    while (oddity1 === oddity2) {
      oddity2 = rollOddity(); // Ensure two different oddities
    }
    return `Strange: ${oddity1} & ${oddity2}`;
  }

  return `${alignmentType.type}: ${traits.join(' & ')}`;
};

export const generateCommoner = (): Commoner => {
  const attributes = {
    might: 0,
    agility: 0,
    intellect: 0,
    spirit: 0,
  };

  for (let i = 0; i < 4; i++) {
    const d4 = roll(4);
    if (d4 === 1) attributes.might++;
    else if (d4 === 2) attributes.agility++;
    else if (d4 === 3) attributes.intellect++;
    else if (d4 === 4) attributes.spirit++;
  }

  const keyAttribute = attributes.might >= attributes.agility ? 'Might' : 'Agility';

  return {
    id: crypto.randomUUID(),
    attributes,
    keyAttribute,
    alignment: generateAlignment(),
    pastLife: 'To be determined',
    equipment: 'To be determined',
  };
};

export const generateFourCommoners = (): Commoner[] => {
  return Array.from({ length: 4 }, generateCommoner);
};
