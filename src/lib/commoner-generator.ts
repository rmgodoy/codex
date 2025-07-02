
import type { Commoner } from './types';

type AttributeName = 'might' | 'agility' | 'intellect' | 'spirit';

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

const PAST_LIFE_SOCIAL_GROUPS = [
  { range: [1, 3], group: 'Outcasts' },
  { range: [4, 6], group: 'Laborers' },
  { range: [7, 9], group: 'Farmers' },
  { range: [10, 12], group: 'Artisans' },
  { range: [13, 15], group: 'Merchants' },
  { range: [16, 17], group: 'Soldiers' },
  { range: [18, 19], group: 'Servants' },
  { range: [20, 20], group: 'Nobility' },
];

const OUTCASTS_TABLE = [
    { pastLife: 'Hermit', attributes: ['spirit'], skill: 'Nature', possessions: 'moonshine' },
    { pastLife: 'Leper', attributes: ['spirit'], skill: 'Stealth', possessions: 'crude cloak (1d6)' },
    { pastLife: 'Urchin', attributes: ['agility'], skill: 'Stealth', possessions: 'stuffed animal' },
    { pastLife: 'Poacher', attributes: ['agility'], skill: 'Perception', possessions: 'bag of hides' },
    { pastLife: 'Beggar', attributes: ['spirit'], skill: 'Folklore', possessions: 'tin cup, 5 cp' },
    { pastLife: 'Charlatan', attributes: ['spirit'], skill: 'Speech', possessions: 'disguise kit' },
    { pastLife: 'Graverobber', attributes: ['might'], skill: 'Perception', possessions: 'rusted shovel' },
    { pastLife: 'Fraud', attributes: ['intellect'], skill: 'Letters', possessions: 'quill, ink, paper' },
    { pastLife: 'Gambler', attributes: ['intellect'], skill: 'Speech', possessions: 'dice' },
    { pastLife: 'Pickpocket', attributes: ['agility'], skill: 'Stealth', possessions: 'keys to unknown door' },
    { pastLife: 'Arsonist', attributes: ['intellect'], skill: 'Athletics', possessions: 'crude sword (1d6)' },
    { pastLife: 'Drunkard', attributes: ['might'], skill: 'Speech', possessions: 'empty tankard' },
    { pastLife: 'Outlaw', attributes: ['agility'], skill: 'Stealth', possessions: 'stolen jewelry' },
    { pastLife: 'Expelled Acolyte', attributes: ['intellect'], skill: 'Letters', possessions: 'holy texts, unread' },
    { pastLife: 'Failed Apprentice', attributes: ['intellect'], skill: 'Magic', possessions: 'stolen spellbook' },
    { pastLife: 'Lockpicker', attributes: ['agility'], skill: 'Tinkering', possessions: 'lockpicks' },
    { pastLife: 'Vigilante', attributes: ['agility', 'spirit'], skill: 'Perception', possessions: 'cloak (d8)' },
    { pastLife: 'Doomsayer', attributes: ['intellect', 'spirit'], skill: 'Magic', possessions: 'manifesto' },
    { pastLife: 'Burglar', attributes: ['agility', 'intellect'], skill: 'Stealth', possessions: 'crowbar' },
    { pastLife: 'Pig Thief', attributes: ['might', 'agility'], skill: 'Stealth', possessions: 'pig' },
];

const LABORERS_TABLE = [
    { pastLife: 'Gongfarmer', attributes: ['might'], skill: 'Nature', possessions: 'dung shovel' },
    { pastLife: 'Scavenger', attributes: ['agility'], skill: 'Tinkering', possessions: 'crude helm' },
    { pastLife: 'Chimney Sweep', attributes: ['agility'], skill: 'Athletics', possessions: 'bag of limes' },
    { pastLife: 'Lamplighter', attributes: ['might'], skill: 'Acrobatics', possessions: 'rope' },
    { pastLife: 'Carver', attributes: ['agility'], skill: 'Nature', possessions: 'sextant' },
    { pastLife: 'Roofer', attributes: ['agility'], skill: 'Acrobatics', possessions: 'ten-foot ladder (heavy)' },
    { pastLife: 'Ferry Keeper', attributes: ['intellect'], skill: 'Folklore', possessions: 'broken oar' },
    { pastLife: 'Boatwright', attributes: ['intellect'], skill: 'Tinkering', possessions: 'hammer and nails' },
    { pastLife: 'Ragpicker', attributes: ['spirit'], skill: 'Stealth', possessions: 'chipped shovel' },
    { pastLife: 'Stable Hand', attributes: ['agility'], skill: 'Nature', possessions: 'push broom' },
    { pastLife: 'Stonemason', attributes: ['might'], skill: 'Tinkering', possessions: 'hammer and chisel' },
    { pastLife: 'Stable Keeper', attributes: ['might'], skill: 'Nature', possessions: 'sack of horseshoes' },
    { pastLife: 'Polisher', attributes: ['agility'], skill: 'Perception', possessions: 'silver knife (as dagger)' },
    { pastLife: 'Wagoner', attributes: ['might'], skill: 'Folklore', possessions: 'tattered scarf, tricorn hat' },
    { pastLife: 'Thatcher', attributes: ['agility'], skill: 'Acrobatics', possessions: 'bag of thatch' },
    { pastLife: 'Miner', attributes: ['might'], skill: 'Athletics', possessions: 'pickaxe' },
    { pastLife: 'Woodcutter', attributes: ['might'], skill: 'Nature', possessions: 'old axe' },
    { pastLife: 'Tavern Guard', attributes: ['might', 'spirit'], skill: 'Folklore', possessions: 'cudgel (1d6)' },
    { pastLife: 'Gravedigger', attributes: ['might', 'spirit'], skill: 'Athletics', possessions: 'tombstone' },
    { pastLife: 'Rat-Catcher', attributes: ['agility', 'intellect'], skill: 'Stealth', possessions: 'rat-bashing stick' },
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

const generatePastLife = (): { pastLife: string; attributeBonuses: AttributeName[]; skill: string; equipment: string } => {
  const d20 = roll(20);
  const socialGroup = PAST_LIFE_SOCIAL_GROUPS.find(sg => d20 >= sg.range[0] && d20 <= sg.range[1]);

  if (!socialGroup) {
      return { pastLife: 'Unknown', attributeBonuses: [], skill: 'To be determined', equipment: 'To be determined' };
  }

  if (socialGroup.group === 'Outcasts') {
      const d20Outcast = roll(20);
      const result = OUTCASTS_TABLE[d20Outcast - 1];
      return {
          pastLife: result.pastLife,
          attributeBonuses: result.attributes as AttributeName[],
          skill: result.skill,
          equipment: result.possessions
      };
  }

  if (socialGroup.group === 'Laborers') {
      const d20Laborer = roll(20);
      const result = LABORERS_TABLE[d20Laborer - 1];
      return {
          pastLife: result.pastLife,
          attributeBonuses: result.attributes as AttributeName[],
          skill: result.skill,
          equipment: result.possessions
      };
  }

  return { pastLife: socialGroup.group, attributeBonuses: [], skill: 'To be determined', equipment: 'To be determined' };
};


export const generateCommoner = (): Commoner => {
  const attributes: { [key in AttributeName]: number } = {
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

  const { pastLife, attributeBonuses, skill, equipment } = generatePastLife();

  for (const bonus of attributeBonuses) {
      if (attributes.hasOwnProperty(bonus)) {
          attributes[bonus]++;
      }
  }

  const keyAttribute = attributes.might >= attributes.agility ? 'Might' : 'Agility';

  return {
    id: crypto.randomUUID(),
    attributes,
    keyAttribute,
    alignment: generateAlignment(),
    pastLife: pastLife,
    skill: skill,
    equipment: equipment,
  };
};

export const generateFourCommoners = (): Commoner[] => {
  return Array.from({ length: 4 }, generateCommoner);
};
