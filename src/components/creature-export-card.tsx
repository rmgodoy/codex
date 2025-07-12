
'use client';

import type { CreatureWithDeeds, Deed } from '@/lib/types';
import { Diamond } from 'lucide-react';
import { stepUpDamageDie, stepDownDamageDie } from '@/lib/roles';

interface CreatureExportCardProps {
  creature: CreatureWithDeeds;
}

const tierAbbreviation = (tier: Deed['tier']) => {
    switch (tier) {
        case 'light': return 'L';
        case 'heavy': return 'H';
        case 'mighty': return 'M';
        case 'tyrant': return 'T';
        case 'special': return 'S';
    }
}

const processEffect = (text: string | undefined, dmg: string): React.ReactNode => {
    if (!text) return null;

    let processed = text;
    // Regex to find all instances of \dd, \dd+#, or \dd-#
    const regex = /\\dd([+\-]\d+)?/g;
    
    processed = processed.replace(regex, (match, modifier) => {
        let currentDie = dmg;
        if (modifier) {
            const modValue = parseInt(modifier, 10);
            if (modValue > 0) {
                for (let i = 0; i < modValue; i++) {
                    currentDie = stepUpDamageDie(currentDie);
                }
            } else if (modValue < 0) {
                for (let i = 0; i < Math.abs(modValue); i++) {
                    currentDie = stepDownDamageDie(currentDie);
                }
            }
        }
        return currentDie;
    });

    const parts = processed.split(/(\bconfer\s+\w+\s+\d+\b)/gi);
    return parts.map((part, index) => {
      if (part.match(/\bconfer\s+\w+\s+\d+\b/i)) {
        const words = part.split(' ');
        return (
          <span key={index}>
            {words.slice(0, -1).join(' ')} <span className="font-bold">{words[words.length -1]}</span>
          </span>
        )
      }
      return part;
    });
};

const TemplateDescription = ({ template }: { template: CreatureWithDeeds['template'] }) => {
    switch (template) {
        case 'Underling':
        return (
            <p>
            <span className="font-bold">Underling:</span> Any amount of damage from a hit is enough to kill this creature. It is immune to state damage, environmental damage and damage from missed attacks.
            </p>
        );
        case 'Paragon':
        return (
            <p>
            <span className="font-bold">Extra Turn:</span> This creature takes an additional turn at the end of the round. Immune to effects that delay its turn (loses an action point on its next turn instead).
            </p>
        );
        case 'Tyrant':
        return (
            <>
            <p><span className="font-bold">Extra Turn:</span> This creature takes an additional turn at the end of the round. Immune to effects that delay its turn (loses an action point on its next turn instead).</p>
            <p className="mt-1"><span className="font-bold">Unstoppable:</span> Can make a free prevail check against one state at the end of each round.</p>
            </>
        );
        default:
        return null;
    }
};

export default function CreatureExportCard({ creature }: CreatureExportCardProps) {
  if (!creature) return null;

  const tierOrder: Record<Deed['tier'], number> = { light: 0, heavy: 1, mighty: 2, tyrant: 3, special: 4 };
  const sortedDeeds = [...creature.deeds].sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);
  
  const renderEffectLine = (label: string, text: string | undefined) => {
    if (!text) return null;
    const processedText = processEffect(text, creature.attributes.DMG);
    return (
      <p><span className="font-bold">{label}:</span> {processedText}</p>
    );
  };

  return (
    <div className="bg-stone-200 text-black font-sans text-xs w-[350px] shadow-lg" style={{ fontFamily: 'Literata, serif' }}>
      <header className="flex bg-gray-700 text-white font-bold uppercase">
        <h1 className="flex-1 p-1.5 pl-2">{creature.name}</h1>
        <div className="border-l-2 border-white p-1.5 px-3">
          TR {creature.TR}
        </div>
      </header>

      <section className="p-2 grid grid-cols-2 gap-x-4 bg-white border-b border-stone-300">
        <div className="space-y-1">
          <p className="flex items-center gap-1.5"><Diamond className="w-2 h-2 fill-current" /> {creature.role} {creature.template !== 'Normal' && creature.template} {creature.level}</p>
          <p className="flex items-center gap-1.5"><Diamond className="w-2 h-2 fill-current" /> HP: {creature.attributes.HP}</p>
          <p className="flex items-center gap-1.5"><Diamond className="w-2 h-2 fill-current" /> Speed: {creature.attributes.Speed}</p>
          <p className="flex items-center gap-1.5"><Diamond className="w-2 h-2 fill-current" /> Initiative: {creature.attributes.Initiative}</p>
        </div>
        <div className="space-y-1">
          <p className="flex items-center gap-1.5"><Diamond className="w-2 h-2 fill-current" /> Accuracy: {creature.attributes.Accuracy}</p>
          <p className="flex items-center gap-1.5"><Diamond className="w-2 h-2 fill-current" /> Guard: {creature.attributes.Guard}</p>
          <p className="flex items-center gap-1.5"><Diamond className="w-2 h-2 fill-current" /> Resist: {creature.attributes.Resist}</p>
          <p className="flex items-center gap-1.5"><Diamond className="w-2 h-2 fill-current" /> Roll Bonus: {creature.attributes.rollBonus > 0 ? `+${creature.attributes.rollBonus}` : creature.attributes.rollBonus}</p>
        </div>
      </section>
      
      {creature.template !== 'Normal' && (
        <section className="p-2 bg-stone-100 border-b border-stone-300 text-stone-800">
          <TemplateDescription template={creature.template} />
        </section>
      )}

      {creature.abilities && creature.abilities.length > 0 && (
          <section className="p-2 bg-white border-b border-stone-300">
              <div className="space-y-1">
                  {creature.abilities.map((ability, index) => (
                      <p key={ability.id || index}>
                          <span className="font-bold">{ability.name}:</span> {ability.description}
                      </p>
                  ))}
              </div>
          </section>
      )}

      <section className="space-y-1">
        {sortedDeeds.map((deed) => (
          <div key={deed.id} className="p-2 border-t border-stone-300">
            <h2 className="font-bold">
                ({tierAbbreviation(deed.tier)}) {deed.name.toUpperCase()} <Diamond className="w-2 h-2 inline-block fill-current" /> {deed.deedType.toUpperCase()} ATTACK VS. {deed.versus.toUpperCase()}
            </h2>
            <div className="pl-3 text-stone-800 space-y-0.5">
              {deed.target && <p>Target: {deed.target}</p>}
              {renderEffectLine('Start', deed.effects.start)}
              {renderEffectLine('Base', deed.effects.base)}
              {renderEffectLine('Hit', deed.effects.hit)}
              {renderEffectLine('Spark', deed.effects.spark)}
              {renderEffectLine('Shadow', deed.effects.shadow)}
              {renderEffectLine('After', deed.effects.after)}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
