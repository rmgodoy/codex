
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

const FARMERS_TABLE = [
    { pastLife: 'Cabbage Farmer', attributes: ['might'], skill: 'Athletics', possessions: 'bag of cabbages' },
    { pastLife: 'Carrot Farmer', attributes: ['might'], skill: 'Athletics', possessions: 'bag of carrots' },
    { pastLife: 'Onion Farmer', attributes: ['might'], skill: 'Athletics', possessions: 'bag of onions' },
    { pastLife: 'Wheat Farmer', attributes: ['agility'], skill: 'Athletics', possessions: 'scythe (weapon)' },
    { pastLife: 'Herbalist', attributes: ['intellect'], skill: 'Nature', possessions: 'bag of herbs' },
    { pastLife: 'Forager', attributes: ['might'], skill: 'Nature', possessions: 'pouch of berries' },
    { pastLife: 'Miller', attributes: ['might'], skill: 'Athletics', possessions: 'bag of flour' },
    { pastLife: 'Chicken Farmer', attributes: ['agility'], skill: 'Acrobatics', possessions: 'chicken' },
    { pastLife: 'Shepherd', attributes: ['might'], skill: 'Perception', possessions: 'bag of wool' },
    { pastLife: 'Cowherd', attributes: ['might'], skill: 'Nature', possessions: 'cattle prod' },
    { pastLife: 'Swineherd', attributes: ['might'], skill: 'Nature', possessions: 'slop bucket, slop' },
    { pastLife: 'Fowler', attributes: ['agility'], skill: 'Acrobatics', possessions: 'quail eggs' },
    { pastLife: 'Butter Churner', attributes: ['agility'], skill: 'Athletics', possessions: 'butter churn' },
    { pastLife: 'Fisher', attributes: ['spirit'], skill: 'Nature', possessions: 'rod and tackle' },
    { pastLife: 'Horse Trainer', attributes: ['might'], skill: 'Nature', possessions: 'bag of carrots' },
    { pastLife: 'Beekeeper', attributes: ['spirit'], skill: 'Nature', possessions: 'queen in a jar' },
    { pastLife: 'Trapper', attributes: ['intellect'], skill: 'Tinkering', possessions: 'iron bear trap' },
    { pastLife: 'Hound Keeper', attributes: ['might', 'spirit'], skill: 'Nature', possessions: 'puppy' },
    { pastLife: 'Hunter', attributes: ['might', 'agility'], skill: 'Stealth', possessions: 'bow (d8)' },
    { pastLife: 'Falconer', attributes: ['agility', 'spirit'], skill: 'Nature', possessions: 'trained falcon' },
];

const ARTISANS_TABLE = [
    { pastLife: 'Carpenter', attributes: ['might'], skill: 'Crafting', possessions: 'woodworking tools' },
    { pastLife: 'Cobbler', attributes: ['spirit'], skill: 'Tinkering', possessions: 'boots (L./+0/d6)' },
    { pastLife: 'Wood-Carver', attributes: ['agility'], skill: 'Crafting', possessions: 'carving of a squirrel' },
    { pastLife: 'Glassblower', attributes: ['agility'], skill: 'Crafting', possessions: '1d6 glass vials' },
    { pastLife: 'Leather-Worker', attributes: ['might'], skill: 'Crafting', possessions: 'leather gloves (L./+1/d6)' },
    { pastLife: 'Cook', attributes: ['spirit'], skill: 'Alchemy', possessions: 'cookware' },
    { pastLife: 'Weaver', attributes: ['agility'], skill: 'Crafting', possessions: 'quilt' },
    { pastLife: 'Locksmith', attributes: ['agility'], skill: 'Tinkering', possessions: 'simple lock and key' },
    { pastLife: 'Brewer', attributes: ['spirit'], skill: 'Alchemy', possessions: 'small keg of ale' },
    { pastLife: 'Soap-Maker', attributes: ['might'], skill: 'Alchemy', possessions: 'bag of soap bars' },
    { pastLife: 'Tailor', attributes: ['agility'], skill: 'Crafting', possessions: 'well-maintained outfit' },
    { pastLife: 'Tinker', attributes: ['intellect'], skill: 'Tinkering', possessions: 'wind-up toy' },
    { pastLife: 'Candle-Maker', attributes: ['spirit'], skill: 'Alchemy', possessions: 'huge ceremonial candle' },
    { pastLife: 'Fletcher', attributes: ['agility'], skill: 'Crafting', possessions: 'bundle of arrows' },
    { pastLife: 'Baker', attributes: ['might'], skill: 'Nature', possessions: 'loaf of bread' },
    { pastLife: 'Butcher', attributes: ['might'], skill: 'Nature', possessions: 'meat cleaver (1d6)' },
    { pastLife: 'Barber', attributes: ['agility'], skill: 'Speech', possessions: 'shaving razors' },
    { pastLife: 'Inventor', attributes: ['intellect', 'spirit'], skill: 'Crafting', possessions: 'bundle of notes' },
    { pastLife: 'Jeweler', attributes: ['agility', 'intellect'], skill: 'Tinkering', possessions: 'tray of semi-precious gems' },
    { pastLife: 'Blacksmith', attributes: ['might', 'spirit'], skill: 'Crafting', possessions: 'hammer' },
];

const MERCHANTS_TABLE = [
    { pastLife: 'Fence', attributes: ['intellect'], skill: 'Magic', possessions: 'box of stolen junk' },
    { pastLife: 'Salvage Dealer', attributes: ['might'], skill: 'Tinkering', possessions: 'broken sword hilt' },
    { pastLife: 'Relic Peddler', attributes: ['spirit'], skill: 'Folklore', possessions: 'reliquary, fake relic' },
    { pastLife: 'Wine Merchant', attributes: ['intellect'], skill: 'Nature', possessions: 'bottle of lowland red' },
    { pastLife: 'Street Hawker', attributes: ['spirit'], skill: 'Speech', possessions: 'arrow-shaped sign' },
    { pastLife: 'Bird Seller', attributes: ['spirit'], skill: 'Perception', possessions: 'fine plumes' },
    { pastLife: 'Fishmonger', attributes: ['might'], skill: 'Athletics', possessions: 'rod and tackle' },
    { pastLife: 'Cheesemonger', attributes: ['spirit'], skill: 'Speech', possessions: 'bucket of cheeses' },
    { pastLife: 'Fortune Teller', attributes: ['spirit'], skill: 'Magic', possessions: 'fortune-telling cards' },
    { pastLife: 'Tavern Server', attributes: ['might'], skill: 'Folklore', possessions: 'serving platter' },
    { pastLife: 'Pie Seller', attributes: ['spirit'], skill: 'Perception', possessions: 'basket of meat pies' },
    { pastLife: 'Florist', attributes: ['spirit'], skill: 'Nature', possessions: 'basket of flowers' },
    { pastLife: 'Cartographer', attributes: ['intellect'], skill: 'Letters', possessions: 'scroll case with map' },
    { pastLife: 'Spice Merchant', attributes: ['intellect'], skill: 'Speech', possessions: 'spice box' },
    { pastLife: 'Shopkeeper', attributes: ['spirit'], skill: 'Speech', possessions: 'dusty ledger' },
    { pastLife: 'Bookseller', attributes: ['intellect'], skill: 'Letters', possessions: 'tome on a useful subject' },
    { pastLife: 'Moneylender', attributes: ['intellect'], skill: 'Letters', possessions: 'pouch of silver pieces' },
    { pastLife: 'Apothecary', attributes: ['intellect', 'spirit'], skill: 'Nature', possessions: 'satchel of herbs' },
    { pastLife: 'Perfumer', attributes: ['agility', 'spirit'], skill: 'Perception', possessions: 'fine perfume' },
    { pastLife: 'Innkeeper', attributes: ['might', 'intellect'], skill: 'Speech', possessions: 'bottle of hard liquor' },
];

const SOLDIERS_TABLE = [
    { pastLife: 'Deserter', attributes: ['intellect'], skill: 'Stealth', possessions: 'rusted helm (d6)' },
    { pastLife: 'Mercenary', attributes: ['might'], skill: 'Stealth', possessions: 'crude sword (d6)' },
    { pastLife: 'Bodyguard', attributes: ['might'], skill: 'Perception', possessions: 'crude crossbow (d6)' },
    { pastLife: 'Town Guard', attributes: ['might'], skill: 'Perception', possessions: 'crude flail (d6)' },
    { pastLife: 'Catchpole', attributes: ['intellect'], skill: 'Athletics', possessions: 'broken catchpole' },
    { pastLife: 'Jailer', attributes: ['might'], skill: 'Perception', possessions: 'set of keys' },
    { pastLife: 'Executioner', attributes: ['might'], skill: 'Athletics', possessions: 'crude greataxe (d8)' },
    { pastLife: 'Sheriff', attributes: ['spirit'], skill: 'Perception', possessions: 'crude crossbow (d8)' },
    { pastLife: 'Scout', attributes: ['agility'], skill: 'Perception', possessions: 'forest-green cloak (L./+0/d6)' },
    { pastLife: 'Messenger', attributes: ['agility'], skill: 'Letters', possessions: 'bag of undelivered letters' },
    { pastLife: 'Foot Soldier', attributes: ['might'], skill: 'Athletics', possessions: 'round shield (d8)' },
    { pastLife: 'Rider', attributes: ['agility'], skill: 'Nature', possessions: 'saddle bag' },
    { pastLife: 'Flag-Bearer', attributes: ['spirit'], skill: 'Speech', possessions: 'tattered banner (as staff)' },
    { pastLife: 'Siege Engineer', attributes: ['intellect'], skill: 'Tinkering', possessions: 'unfinished schematic' },
    { pastLife: 'Sapper', attributes: ['agility'], skill: 'Perception', possessions: 'grenade (deals 3d6 in a blast 3)' },
    { pastLife: 'Archer', attributes: ['agility'], skill: 'Perception', possessions: 'shortbow (d6)' },
    { pastLife: 'Sergeant', attributes: ['might'], skill: 'Athletics', possessions: 'child\'s drawing' },
    { pastLife: 'Herald', attributes: ['might', 'spirit'], skill: 'Speech', possessions: 'brass horn' },
    { pastLife: 'Lieutenant', attributes: ['might', 'intellect'], skill: 'Letters', possessions: 'medal of honor' },
    { pastLife: 'Captain', attributes: ['might', 'spirit'], skill: 'Speech', possessions: 'battle map' },
];

const SERVANTS_TABLE = [
    { pastLife: 'Teacher', attributes: ['intellect'], skill: 'Letters', possessions: 'history book' },
    { pastLife: 'Troubadour', attributes: ['spirit'], skill: 'Folklore', possessions: 'book of sagas' },
    { pastLife: 'Dancer', attributes: ['agility'], skill: 'Acrobatics', possessions: 'dancing shoes' },
    { pastLife: 'Singer', attributes: ['spirit'], skill: 'Speech', possessions: 'whistle' },
    { pastLife: 'Tax Collector', attributes: ['intellect'], skill: 'Letters', possessions: 'empty coffer' },
    { pastLife: 'Physician', attributes: ['intellect'], skill: 'Alchemy', possessions: 'medicine bag' },
    { pastLife: 'Gardener', attributes: ['might'], skill: 'Nature', possessions: 'gardening hoe' },
    { pastLife: 'Chef', attributes: ['intellect'], skill: 'Alchemy', possessions: 'kitchen knife (as dagger)' },
    { pastLife: 'Mortician', attributes: ['intellect'], skill: 'Letters', possessions: 'autopsy kit' },
    { pastLife: 'Pilgrim', attributes: ['spirit'], skill: 'Folklore', possessions: 'holy text' },
    { pastLife: 'Librarian', attributes: ['intellect'], skill: 'Letters', possessions: 'tome on a useless subject' },
    { pastLife: 'Thespian', attributes: ['spirit'], skill: 'Speech', possessions: 'makeup kit' },
    { pastLife: 'Circus Performer', attributes: ['agility'], skill: 'Acrobatics', possessions: 'hoop' },
    { pastLife: 'Pigeon Fancier', attributes: ['intellect'], skill: 'Nature', possessions: 'pigeon in a cage' },
    { pastLife: 'Painter', attributes: ['spirit'], skill: 'Perception', possessions: 'brush and paints' },
    { pastLife: 'Philosopher', attributes: ['intellect'], skill: 'Letters', possessions: 'treatise on ethics' },
    { pastLife: 'Astrologer', attributes: ['intellect'], skill: 'Magic', possessions: 'chart of the cosmos' },
    { pastLife: 'Spy', attributes: ['agility', 'intellect'], skill: 'Letters', possessions: 'stolen letters' },
    { pastLife: 'Poet', attributes: ['intellect', 'spirit'], skill: 'Letters', possessions: 'binder of notes' },
    { pastLife: 'Jester', attributes: ['agility', 'spirit'], skill: 'Acrobatics', possessions: 'jester\'s cap (as cap)' },
];

const FALLEN_NOBILITY_TABLE = [
  { range: [1, 4], title: 'Lady / Lord', attributes: ['might', 'agility', 'spirit'], skill: 'Letters' },
  { range: [5, 8], title: 'Duchess / Duke', attributes: ['might', 'intellect', 'spirit'], skill: 'Letters' },
  { range: [9, 12], title: 'Count / Countess', attributes: ['agility', 'intellect', 'spirit'], skill: 'Letters' },
  { range: [13, 16], title: 'Baron / Baroness', attributes: ['might', 'agility', 'intellect'], skill: 'Letters' },
  { range: [17, 18], title: 'Princess / Prince', attributes: ['might', 'agility', 'intellect', 'spirit'], skill: 'Letters, Speech' },
  { range: [19, 20], title: 'Queen / King', attributes: ['might', 'agility', 'intellect', 'spirit'], skill: 'Letters, Speech' },
];

const NOBILITY_POSSESSIONS = [
    'tattered but fine clothes',
    'a signet ring',
    'a deed to a forgotten land',
    'a single, perfect pearl',
    'a letter of introduction to a powerful figure',
    'a portrait of a lost loved one'
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
  
  const d20SubRoll = roll(20);

  if (socialGroup.group === 'Nobility') {
      const result = FALLEN_NOBILITY_TABLE.find(entry => d20SubRoll >= entry.range[0] && d20SubRoll <= entry.range[1]);
      if (result) {
        const possessions = NOBILITY_POSSESSIONS[roll(NOBILITY_POSSESSIONS.length) - 1];
        return {
            pastLife: result.title,
            attributeBonuses: result.attributes as AttributeName[],
            skill: result.skill,
            equipment: possessions,
        }
      }
  }

  let resultTable;
  switch (socialGroup.group) {
      case 'Outcasts': resultTable = OUTCASTS_TABLE; break;
      case 'Laborers': resultTable = LABORERS_TABLE; break;
      case 'Farmers': resultTable = FARMERS_TABLE; break;
      case 'Artisans': resultTable = ARTISANS_TABLE; break;
      case 'Merchants': resultTable = MERCHANTS_TABLE; break;
      case 'Soldiers': resultTable = SOLDIERS_TABLE; break;
      case 'Servants': resultTable = SERVANTS_TABLE; break;
      default: return { pastLife: socialGroup.group, attributeBonuses: [], skill: 'To be determined', equipment: 'To be determined' };
  }
  
  const result = resultTable[d20SubRoll - 1];
  return {
      pastLife: result.pastLife,
      attributeBonuses: result.attributes as AttributeName[],
      skill: result.skill,
      equipment: result.possessions
  };
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
