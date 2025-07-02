
import type { Commoner } from './types';

const roll = (sides: number) => Math.floor(Math.random() * sides) + 1;

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
    alignment: 'To be determined',
    pastLife: 'To be determined',
    equipment: 'To be determined',
  };
};

export const generateFourCommoners = (): Commoner[] => {
  return Array.from({ length: 4 }, generateCommoner);
};
