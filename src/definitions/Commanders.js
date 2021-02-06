import { Vector3 } from '@babylonjs/core';

export const CommanderRarities = {
    Common: 0,
    Rare: 1,
    Epic: 2,
    Legendary: 3,
};

export const CommanderRaritiesColors = {
    0: '#73ffbe',
    1: '#2196F3',
    2: '#7B1FA2',
    3: '#FFD740',
};

export const commanderRarityToString = (rarity) => {
    const lookup = {
        0: 'Common',
        1: 'Rare',
        2: 'Epic',
        3: 'Legendary'
    };

    return lookup[rarity] || '';
};

export const Commanders = [
    {
        name: 'XT-101',
        asset: 'assets/robot_5/',
        description: 'Standard issue command robot issued to all Commanders. First and last iteration of its kind, provides slight bonuses to attack and defence.',
        stats: {
            attack: {
                modifier: 2,
                vs: 0,
            },
            defence: {
                modifier: 2,
                vs: 0,
            },
        },
        scale: 10,
        visuals: {
            pickAnimations: ['Ball_To_Stand', 'Idle', 'Idle_Look_Back', 'Idle_Look_Side'],
            positionOffset: new Vector3(0, 0.8, 0),
        },
        rarity: CommanderRarities.Common,
    },
    {
        name: 'Magnus',
        asset: 'assets/trooper/',
        description: 'Cyborgs are the ultimate combination of human intuition and robot processing power. While lacking in empathy, they make for formiddable commanders.',
        stats: {
            attack: {
                modifier: 10,
            },
            defence: {
                modifier: 5,
            },
        },
        scale: 60,
        visuals: {
            positionOffset: new Vector3(0, -1.8, 0),
        },
        rarity: CommanderRarities.Rare,
    },
];
