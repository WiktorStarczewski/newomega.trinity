// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "hardhat/console.sol";

struct Move {
  string moveType;
  uint16 round;
  uint16 source;
  uint16 target;
  int16 targetPosition;
  uint64 damage;
}

struct FightResult {
  uint16[] selectionLhs;
  uint16[] selectionRhs;
  uint16 commanderLhs;
  uint16 commanderRhs;
  Move[] lhs;
  Move[] rhs;
  int64[] lhsHp;
  int64[] rhsHp;
  bool lhsDead;
  bool rhsDead;
  uint16 rounds;
}

struct ShipVariableStat {
  uint16 base;
  uint16 variable;
}

struct Ship {
  uint16 cp;
  uint16 hp;
  ShipVariableStat attack;
  uint16 defence;
  uint16 speed;
  uint16 range;
  uint16 agility;
}

struct FightStateInternal {
  uint16 round;
  uint16 loggedLhsMoves;
  uint16 loggedRhsMoves;
  Move[] lhsMoves;
  Move[] rhsMoves;
  uint16 currentShip;
}

library GameEngineLibrary {
  uint constant private BOARD_SIZE = 15;
  uint constant private MAX_ROUNDS = 50;
  uint constant private MAX_SHIPS = 4;
  uint constant private maxInt = 2**53 - 1;

  function abs(int16 value) private pure returns (int16) {
    if (value >= 0) {
      return value;
    } else {
      return -1 * value;
    }
  }

  function min(int64 lhs, int64 rhs) private pure returns (int64) {
    return lhs < rhs ? lhs : rhs;
  }

  function max(int64 lhs, int64 rhs) private pure returns (int64) {
    return lhs > rhs ? lhs : rhs;
  }

  function isDead(int64[] memory shipHps) private pure returns (bool) {
    bool isTargetDead = true;

    for (uint i = 0; i < MAX_SHIPS; i++) {
      if (shipHps[i] > 0) {
        isTargetDead = false;
      }
    }

    return isTargetDead;
  }

  function getTarget(Ship[] memory Ships, uint16 currentShip, int16[] memory shipPositionsOwn, int16[] memory shipPositionsEnemy,
    int64[] memory shipHpsEnemy) private pure returns (int16) {

    int16 position = shipPositionsOwn[currentShip];
    uint minDistance = maxInt;
    uint16 minDistanceIndex = 0;

    for (uint16 enemyShip = 0; enemyShip < MAX_SHIPS; enemyShip++) {
      int16 positionTarget = shipPositionsEnemy[enemyShip];
      uint16 distance = uint16(abs(position - positionTarget));

      if (shipHpsEnemy[enemyShip] > 0 && distance <= Ships[currentShip].range) {
        if (distance < minDistance) {
          minDistance = distance;
          minDistanceIndex = enemyShip;
        }
      }
    }

    delete position;
    return (uint(minDistance) == maxInt) ? -1 : int16(minDistanceIndex);
  }

  function getRandomInt(uint16 maxValue) private view returns (uint16) {
    return uint16(uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, msg.sender))) % maxValue);
  }

  function calculateDamage(Ship[] memory Ships, uint16 source, uint16 target, uint64 sourceHp) private view returns (uint64) {
    uint16 attack = Ships[source].attack.base +
      getRandomInt(Ships[source].attack.variable);
    uint16 defence = Ships[target].defence;
    uint16 accuracy = 100 - Ships[target].agility;
    uint64 damagePerShip = (attack - defence) * accuracy;
    uint16 sourceShipsCount = uint16((sourceHp / Ships[source].hp) + 1);
    uint64 capDamage = uint64(sourceShipsCount) * uint64(Ships[target].hp);
    uint64 damage = damagePerShip * uint64(sourceShipsCount);

    delete attack;
    delete defence;
    delete accuracy;
    delete sourceShipsCount;

    return uint64(min(max(0, int64(damage)), int64(capDamage)));
  }

  function isPositionFree(int16 position, int16[] memory shipPositionsLhs, int16[] memory shipPositionsRhs,
    int64[] memory shipHpsLhs, int64[] memory shipHpsRhs) private pure returns (bool) {
    if (uint16(abs(position)) > BOARD_SIZE) {
      return false;
    }

    bool positionTaken = false;
    for (uint16 i = 0; i < MAX_SHIPS; i++) {
      if ((shipPositionsLhs[i] == position && shipHpsLhs[i] > 0) ||
        (shipPositionsRhs[i] == position && shipHpsRhs[i] > 0)) {
        positionTaken = true;
      }
    }

    return !positionTaken;
  }

  function moveShips(Ship[] memory Ships, bool isLhs, uint16 source, int16 direction, int16[] memory shipPositionsLhs, int16[] memory shipPositionsRhs, int64[] memory shipHpsLhs, int64[] memory shipHpsRhs) public pure returns (int16) {
    int16 speed = int16(Ships[source].speed);
    int16 newPosition = isLhs ? shipPositionsLhs[source] : shipPositionsRhs[source];

    for (int16 speedCheck = speed; speedCheck > 0; speedCheck--) {
      int16 proposedPosition = isLhs
        ? shipPositionsLhs[source] + (direction * speedCheck)
        : shipPositionsRhs[source] + (direction * speedCheck);
      if (isPositionFree(proposedPosition, shipPositionsLhs, shipPositionsRhs, shipHpsLhs, shipHpsRhs)) {
        newPosition = proposedPosition;
        break;
      }
    }

    delete speed;
    return newPosition;
  }

  function logShoot(uint16 index, uint16 round, Move[] memory moves, uint16 source, uint16 target, uint64 damage) private pure {
    moves[index] = Move({
      moveType: 'shoot',
      round: round,
      source: source,
      target: target,
      damage: damage,
      targetPosition: 0
    });
  }

  function logMove(uint16 index, uint16 round, Move[] memory moves, uint16 source, int16 targetPosition) private pure {
    moves[index] = Move({
      moveType: 'move',
      round: round,
      source: source,
      targetPosition: targetPosition,
      target: 0,
      damage: 0
    });
  }

  function fight(Ship[] memory Ships, uint16[] memory selectionLhs, uint16[] memory selectionRhs, uint16 commanderLhs, uint16 commanderRhs) public view returns (FightResult memory) {
    require(selectionLhs.length == 4, 'Selection needs to have 4 elements');
    require(selectionRhs.length == 4, 'Selection needs to have 4 elements');

    int16[] memory shipPositionsLhs = new int16[](MAX_SHIPS);
    shipPositionsLhs[0] = 10;
    shipPositionsLhs[1] = 11;
    shipPositionsLhs[2] = 12;
    shipPositionsLhs[3] = 13;

    int16[] memory shipPositionsRhs = new int16[](MAX_SHIPS);
    shipPositionsRhs[0] = -10;
    shipPositionsRhs[1] = -11;
    shipPositionsRhs[2] = -12;
    shipPositionsRhs[3] = -13;

    int64[] memory shipHpsLhs = new int64[](MAX_SHIPS);
    int64[] memory shipHpsRhs = new int64[](MAX_SHIPS);

    for (uint16 i = 0; i < MAX_SHIPS; i++) {
      shipHpsLhs[i] = int64(Ships[i].hp) * int64(selectionLhs[i]);
      shipHpsRhs[i] = int64(Ships[i].hp) * int64(selectionRhs[i]);
    }

    FightStateInternal memory fightState;
    fightState.lhsMoves = new Move[](MAX_ROUNDS * MAX_SHIPS);
    fightState.rhsMoves = new Move[](MAX_ROUNDS * MAX_SHIPS);

    for (fightState.round = 0; fightState.round < MAX_ROUNDS && !isDead(shipHpsLhs) && !isDead(shipHpsRhs); fightState.round++) {
      for (fightState.currentShip = 0; fightState.currentShip < MAX_SHIPS; fightState.currentShip++) {
        if (shipHpsLhs[fightState.currentShip] > 0) {
          int16 target = getTarget(Ships, fightState.currentShip, shipPositionsLhs, shipPositionsRhs, shipHpsRhs);
          if (target >= 0) {
            uint64 damage = calculateDamage(Ships, fightState.currentShip, uint16(target),
              uint64(shipHpsLhs[fightState.currentShip]));
            shipHpsRhs[uint16(target)] -= int64(damage);
            logShoot(fightState.loggedLhsMoves++, fightState.round, fightState.lhsMoves, fightState.currentShip, uint16(target), damage);
          } else {
            shipPositionsLhs[fightState.currentShip] = moveShips(Ships, true, fightState.currentShip, -1, shipPositionsLhs,
              shipPositionsRhs, shipHpsLhs, shipHpsRhs);
            logMove(fightState.loggedLhsMoves++, fightState.round, fightState.lhsMoves, fightState.currentShip, shipPositionsLhs[fightState.currentShip]);
          }
        }
      }

      for (fightState.currentShip = 0; fightState.currentShip < MAX_SHIPS; fightState.currentShip++) {
        if (shipHpsRhs[fightState.currentShip] > 0) {
          int16 target = getTarget(Ships, fightState.currentShip, shipPositionsRhs, shipPositionsLhs, shipHpsLhs);
          if (target >= 0) {
            uint64 damage = calculateDamage(Ships, fightState.currentShip, uint16(target),
              uint64(shipHpsRhs[fightState.currentShip]));
            shipHpsLhs[uint16(target)] -= int64(damage);
            logShoot(fightState.loggedRhsMoves++, fightState.round, fightState.rhsMoves, fightState.currentShip, uint16(target), damage);
          } else {
            shipPositionsRhs[fightState.currentShip] = moveShips(Ships, false, fightState.currentShip, 1, shipPositionsLhs,
              shipPositionsRhs, shipHpsLhs, shipHpsRhs);
            logMove(fightState.loggedRhsMoves++, fightState.round, fightState.rhsMoves, fightState.currentShip, shipPositionsRhs[fightState.currentShip]);
          }
        }
      }
    }

    delete shipPositionsRhs;
    delete shipPositionsLhs;

    return FightResult({
      selectionLhs: selectionLhs,
      selectionRhs: selectionRhs,
      commanderLhs: commanderLhs,
      commanderRhs: commanderRhs,
      lhs: fightState.lhsMoves,
      rhs: fightState.rhsMoves,
      lhsHp: shipHpsLhs,
      rhsHp: shipHpsRhs,
      lhsDead: isDead(shipHpsLhs),
      rhsDead: isDead(shipHpsRhs),
      rounds: fightState.round
    });
  }
}

contract GameEngine {
  address public owner = msg.sender;

  modifier restricted() {
    require(
      msg.sender == owner,
      "This function is restricted to the contract's owner"
    );
    _;
  }

  mapping(uint => Ship) shipsMapping;
  Ship[] Ships;

  function addShip(uint16 index, uint16 cp, uint16 hp, uint16 attackBase, uint16 attackVariable,
    uint16 defence, uint16 speed, uint16 range, uint16 agility) public restricted {
    Ship memory newShip = Ship({
      cp: cp,
      hp: hp,
      attack: ShipVariableStat({
        base: attackBase,
        variable: attackVariable
      }),
      defence: defence,
      speed: speed,
      range: range,
      agility: agility
    });

    shipsMapping[index] = newShip;
    Ships.push(newShip);
  }

  function getShips() public view restricted returns (Ship[] memory) {
    return Ships;
  }

  function fight(uint16[] memory selectionLhs, uint16[] memory selectionRhs, uint16 commanderLhs, uint16 commanderRhs) public view returns (FightResult memory) {
    require(selectionLhs.length == 4, 'Selection needs to have 4 elements');
    require(selectionRhs.length == 4, 'Selection needs to have 4 elements');

    return GameEngineLibrary.fight(Ships, selectionLhs, selectionRhs, commanderLhs, commanderRhs);
  }
}
