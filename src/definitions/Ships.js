import { Color3 } from '@babylonjs/core';

export const Ships = [
    {
        name: 'Frigate',
        asset: 'assets/frigate/',
        description: 'Cheap, quick and agile, the frigate can be used as a quick strike weapon, able to reach enemy lines quickest. Can not withstand much heat though.',
        stats: {
            cp: 1,
            hp: 1000,
            attack: {
                base: 30,
                variable: 5,
            },
            defence: 2,
            speed: 6,
            range: 6,
            agility: 25,
        },
        scale: 1,
        combatScale: 0.6,
        visuals: {
            beamColor: new Color3(0, 1, 0),
            beamWidth: Math.PI / 256,
        },
    },
    {
        name: 'Cruiser',
        asset: 'assets/cruiser/',
        description: 'As lightest of the heavier ships, the cruiser retains some of the speed and maneuverability of the frigate while offering big improvements in the hull and weaponry.',
        stats: {
            cp: 4,
            hp: 4000,
            attack: {
                base: 100,
                variable: 20,
            },
            defence: 12,
            speed: 4,
            range: 8,
            agility: 15,
        },
        scale: 6,
        combatScale: 0.4,
        visuals: {
            beamColor: new Color3(0.2, 0.2, 1),
            beamWidth: Math.PI / 96,
        },
    },
    {
        name: 'Destroyer',
        asset: 'assets/destroyer/',
        description: 'The destroyer is an effective killing machine, providing both effective support and serving as an artillery line raining heavy damage on enemy ships.',
        stats: {
            cp: 5,
            hp: 5000,
            attack: {
                base: 130,
                variable: 10,
            },
            defence: 15,
            speed: 3,
            range: 10,
            agility: 10,
        },
        scale: 9,
        combatScale: 0.5,
        visuals: {
            beamColor: new Color3(1, 1, 1),
            beamWidth: Math.PI / 96,
        },
    },
    {
        name: 'Battleship',
        asset: 'assets/battleship/',
        description: 'Fitted with state of the art weaponry and protection, the battleship is the ultimate fighting force in the galaxy.',
        stats: {
            cp: 15,
            hp: 10000,
            attack: {
                base: 200,
                variable: 5,
            },
            defence: 20,
            speed: 2,
            range: 12,
            agility: 0,
        },
        scale: 12,
        combatScale: 0.6,
        visuals: {
            beamColor: new Color3(1, 0, 1),
            beamWidth: Math.PI / 64,
        },
    },
];
