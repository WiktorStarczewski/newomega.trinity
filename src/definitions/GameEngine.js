import _ from 'underscore';
import { Ships } from './Ships';


export const GameEngine = (selectionLhs, selectionRhs) => {
    const MAX_ROUNDS = 50;
    const BOARD_SIZE = 15;

    const shipPositionsLhs = [ 10, 11, 12, 13 ];
    const shipPositionsRhs = [ -10, -11, -12, -13 ];

    const shipMaxHpLhs = _.map(selectionLhs, (count, index) => {
        return (Ships[index].stats.hp * count) || 0;
    });
    const shipMaxHpRhs = _.map(selectionRhs, (count, index) => {
        return (Ships[index].stats.hp * count) || 0;
    });
    let shipHpsLhs = _.clone(shipMaxHpLhs);
    let shipHpsRhs = _.clone(shipMaxHpRhs);

    const isLhsDead = () => {
        return !_.find(shipHpsLhs, (shipHp) => shipHp > 0);
    };
    const isRhsDead = () => {
        return !_.find(shipHpsRhs, (shipHp) => shipHp > 0);
    };

    const getTarget = (currentShip, shipPositionsOwn, shipPositionsEnemy, shipHpsEnemy) => {
        const position = shipPositionsOwn[currentShip];
        const distances = _.map(shipPositionsEnemy, (positionTarget, enemyShip) => {
            const distance = Math.abs(position - positionTarget);

            if (shipHpsEnemy[enemyShip] <= 0) {
                return Number.MAX_SAFE_INTEGER;
            }
            if (distance > Ships[currentShip].stats.range) {
                return Number.MAX_SAFE_INTEGER;
            }
            return distance;
        });
        const min = _.min(distances);
        const index = distances.indexOf(min);

        return min === Number.MAX_SAFE_INTEGER ? null : index;
    };

    const getTargetLhs = (currentShip) => {
        return getTarget(currentShip, shipPositionsLhs, shipPositionsRhs, shipHpsRhs);
    };

    const getTargetRhs = (currentShip) => {
        return getTarget(currentShip, shipPositionsRhs, shipPositionsLhs, shipHpsLhs);
    };

    const getRandomInt = (max) => {
        return Math.floor(Math.random() * Math.floor(max));
    };

    const calculateDamage = (source, target, sourceHp, sourceMaxHp) => {
        const attack = Ships[source].stats.attack.base +
            getRandomInt(Ships[source].stats.attack.variable);
        const defence = Ships[target].stats.defence;
        const accuracy = 100 - Ships[target].stats.agility;
        const damage = (attack - defence) * accuracy * (sourceHp / sourceMaxHp);

        const sourceShipsCount = Math.ceil(sourceHp / Ships[source].stats.hp);
        const capDamage = sourceShipsCount * Ships[target].stats.hp;

        return Math.min(Math.floor(Math.max(0, damage)), capDamage);
    };

    const isPositionFree = (position) => {
        if (Math.abs(position) > BOARD_SIZE) {
            return false;
        }

        return !_.find(shipPositionsLhs, (positionIter, ind) => {
            return positionIter === position && shipHpsLhs[ind] > 0;
        }) && !_.find(shipPositionsRhs, (positionIter, ind) => {
            return positionIter === position && shipHpsRhs[ind] > 0;
        });
    };

    const moveShips = (shipPositions, source, direction) => {
        const speed = Ships[source].stats.speed;

        for (let speedCheck = speed; speedCheck > 0; speedCheck--) {
            const proposedPosition = shipPositions[source] + direction * speedCheck;
            if (isPositionFree(proposedPosition)) {
                shipPositions[source] = proposedPosition;
                break;
            }
        }

        return shipPositions[source];
    };

    const moveShipLhs = (source) => {
        return moveShips(shipPositionsLhs, source, -1);
    };

    const moveShipRhs = (source) => {
        return moveShips(shipPositionsRhs, source, 1);
    };

    const lhsMoves = [], rhsMoves = [];
    const logShoot = (round, moves, source, target, damage) => {
        moves.push({
            moveType: 'shoot',
            round,
            source,
            target,
            damage,
        });
    };

    const logMove = (round, moves, source, targetPosition) => {
        moves.push({
            moveType: 'move',
            round,
            source,
            targetPosition,
        });
    };

    const logLhsShoot = (round, source, target, damage) => {
        logShoot(round, lhsMoves, source, target, damage);
    };

    const logLhsMove = (round, source, targetPosition) => {
        logMove(round, lhsMoves, source, targetPosition);
    };

    const logRhsShoot = (round, source, target, damage) => {
        logShoot(round, rhsMoves, source, target, damage);
    };

    const logRhsMove = (round, source, targetPosition) => {
        logMove(round, rhsMoves, source, targetPosition);
    };

    let round;
    for (round = 0; round < MAX_ROUNDS && !isLhsDead() && !isRhsDead(); round++) {
        // Left turn
        for (let currentShip = 0; currentShip < Ships.length; currentShip++) {
            if (shipHpsLhs[currentShip] > 0) {
                const target = getTargetLhs(currentShip);
                if (target || target === 0) { // Shoot
                    const damage = calculateDamage(currentShip, target,
                        shipHpsLhs[currentShip], shipMaxHpLhs[currentShip]);
                    shipHpsRhs[target] -= damage;
                    logLhsShoot(round, currentShip, target, damage);
                } else { // Move
                    moveShipLhs(currentShip);
                    logLhsMove(round, currentShip, shipPositionsLhs[currentShip]);
                }
            }
        }

        // Right turn
        for (let currentShip = 0; currentShip < Ships.length; currentShip++) {
            if (shipHpsRhs[currentShip] > 0) {
                const target = getTargetRhs(currentShip);
                if (target || target === 0) { // Shoot
                    const damage = calculateDamage(currentShip, target,
                        shipHpsRhs[currentShip], shipMaxHpRhs[currentShip]);
                    shipHpsLhs[target] -= damage;
                    logRhsShoot(round, currentShip, target, damage);
                } else { // Move
                    moveShipRhs(currentShip);
                    logRhsMove(round, currentShip, shipPositionsRhs[currentShip]);
                }
            }
        }
    }

    return {
        lhs: lhsMoves,
        rhs: rhsMoves,
        lhsHp: shipHpsLhs,
        rhsHp: shipHpsRhs,
        rounds: round,
    };
};
