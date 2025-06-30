
export type StateEffectAttribute = 'Accuracy' | 'Guard' | 'Initiative' | 'Speed' | 'Resist' | 'rollBonus';

export type StateEffect = {
    attribute: StateEffectAttribute;
    modifier: 'bonus' | 'penalty'; // This will be multiplied by intensity
} | {
    attribute: 'Accuracy' | 'Guard' | 'Initiative' | 'Resist' | 'rollBonus';
    modifier: 'fixed';
    value: number; // This is a fixed value to add (can be negative)
} | {
    attribute: 'Speed';
    modifier: 'halve';
};


export type CommonState = {
    name: string;
    description: string;
    effects?: StateEffect[];
}

export const COMMON_STATES: CommonState[] = [
    { name: 'Accurate', description: 'You take an intensity bonus to accuracy checks. Cancels out inaccurate.', effects: [{ attribute: 'Accuracy', modifier: 'bonus' }] },
    { name: 'Inaccurate', description: 'You take an intensity penalty to accuracy checks. Cancels out accurate.', effects: [{ attribute: 'Accuracy', modifier: 'penalty' }] },
    { name: 'Bleeding', description: 'You suffer intensity damage when you move, jump, teleport, or are forced to move. You only take this damage once per instance of movement, even if you move multiple squares as part of that movement.' },
    { name: 'Burning', description: 'You suffer (intensity)d6 damage at the start of your turn, up to a maximum of three dice. Then the intensity increases by +1.' },
    { name: 'Delirious', description: 'At the start of your turn, roll (intensity)d6, up to a maximum of three dice. For each result, perform the listed action, spending the required action point: 1: fling something at the nearest creature (damage) 2: hurt yourself and suffer damage 3: stumble half your speed in a random direction 4: stare blankly and do nothing 5 or 6: no effect' },
    { name: 'Fortified', description: 'Damage you take from attacks is reduced by intensity. Cancels out frail.' },
    { name: 'Frail', description: 'Damage you take from attacks is increased by intensity. Cancels out fortified.', },
    { name: 'Guarded', description: 'You gain an intensity bonus to guard checks. Cancels out unguarded.', effects: [{ attribute: 'Guard', modifier: 'bonus' }] },
    { name: 'Unguarded', description: 'You take an intensity penalty to guard checks. Cancels out guarded.', effects: [{ attribute: 'Guard', modifier: 'penalty' }] },
    { name: 'Hastened', description: 'You gain an intensity bonus to initiative checks. Cancels out hindered.', effects: [{ attribute: 'Initiative', modifier: 'bonus' }] },
    { name: 'Hindered', description: 'You take an intensity penalty to initiative checks. Cancels out hastened.', effects: [{ attribute: 'Initiative', modifier: 'penalty' }] },
    { name: 'Mending', description: 'You regain intensity hit points at the start of your turn. Cancels out poisoned.' },
    { name: 'Poisoned', description: 'You suffer intensity damage at the start of your turn. Cancels out mending.' },
    { name: 'Provoked', description: 'You take an intensity penalty to attacks that do not include the provoking creature as a target. If a different creature confers this state on you, it becomes the provoking creature.' },
    { name: 'Sleeping', description: 'You also gain toppled when you gain this condition. You take no turn, but you make one free prevail against this state at the end of each round. After waking, you cannot take a turn until the following round. This state ends immediately if you suffer damage.' },
    { name: 'Slow', description: 'You take an intensity penalty to speed. Cancels out swift.', effects: [{ attribute: 'Speed', modifier: 'penalty' }] },
    { name: 'Swift', description: 'You gain an intensity bonus to speed. Cancels out slow.', effects: [{ attribute: 'Speed', modifier: 'bonus' }] },
    {
        name: 'Toppled',
        description: 'You have -2 accuracy and guard, and you move at half speed. You can end this state by spending an action to stand up. If this state has an intensity, you must prevail to stand up instead.',
        effects: [
            { attribute: 'Accuracy', modifier: 'fixed', value: -2 },
            { attribute: 'Guard', modifier: 'fixed', value: -2 },
            { attribute: 'Speed', modifier: 'halve' },
        ]
    },
    { name: 'Strong', description: 'You gain an intensity bonus to damage rolls on attacks. Cancels out weak.', effects: [{ attribute: 'rollBonus', modifier: 'bonus' }] },
    { name: 'Weak', description: 'You take an intensity penalty to damage rolls on attacks. Cancels out strong.', effects: [{ attribute: 'rollBonus', modifier: 'penalty' }] },
    { name: 'Weary', description: 'You take an intensity penalty to resist checks. Cancels out willful.', effects: [{ attribute: 'Resist', modifier: 'penalty' }] },
    { name: 'Willful', description: 'You take an intensity bonus to resist checks. Cancels out weary.', effects: [{ attribute: 'Resist', modifier: 'bonus' }] },
];
