// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0 <0.9.0;
pragma experimental ABIEncoderV2;

struct Move {
  string moveType;
  uint round;
  uint source;
  uint target;
  int targetPosition;
  uint damage;
}

struct FightResult {
  Move[] lhs;
  Move[] rhs;
  int[] lhsHp;
  int[] rhsHp;
  bool lhsDead;
  bool rhsDead;
  uint rounds;
}

struct ShipVariableStat {
  uint base;
  uint variable;
}

struct Ship {
  uint cp;
  uint hp;
  ShipVariableStat attack;
  uint defence;
  uint speed;
  uint range;
  uint agility;
}

struct FightStateInternal {
  uint round;
  uint loggedLhsMoves;
  uint loggedRhsMoves;
  Move[] lhsMoves;
  Move[] rhsMoves;
  uint currentShip;
}

library GameEngineLibrary {
  uint constant private BOARD_SIZE = 15;
  uint constant private MAX_ROUNDS = 50;
  uint constant private MAX_SHIPS = 4;
  uint constant private maxInt = 2**53 - 1;

  function abs(int value) private pure returns (int) {
    if (value >= 0) {
      return value;
    } else {
      return -1 * value;
    }
  }

  function min(int lhs, int rhs) private pure returns (int) {
    return lhs < rhs ? lhs : rhs;
  }

  function max(int lhs, int rhs) private pure returns (int) {
    return lhs > rhs ? lhs : rhs;
  }

  function isDead(int[] memory shipHps) private pure returns (bool) {
    bool isTargetDead = true;

    for (uint i = 0; i < MAX_SHIPS; i++) {
      if (shipHps[i] > 0) {
        isTargetDead = false;
      }
    }

    return isTargetDead;
  }

  function getTarget(Ship[] memory Ships, uint currentShip, int[] memory shipPositionsOwn, int[] memory shipPositionsEnemy,
    int[] memory shipHpsEnemy) private pure returns (int) {

    int position = shipPositionsOwn[currentShip];
    uint minDistance = maxInt;
    uint minDistanceIndex = 0;

    for (uint enemyShip = 0; enemyShip < MAX_SHIPS; enemyShip++) {
      int positionTarget = shipPositionsEnemy[enemyShip];
      uint distance = uint(abs(position - positionTarget));

      if (shipHpsEnemy[enemyShip] > 0 && distance <= Ships[currentShip].range) {
        if (distance < minDistance) {
          minDistance = distance;
          minDistanceIndex = enemyShip;
        }
      }
    }

    delete position;
    return (minDistance == maxInt) ? -1 : int(minDistanceIndex);
  }

  function getRandomInt(uint maxValue) private view returns (uint) {
    return uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, msg.sender))) % maxValue;
  }

  function calculateDamage(Ship[] memory Ships, uint source, uint target, uint sourceHp, uint sourceMaxHp) private view returns (uint) {
    uint attack = Ships[source].attack.base +
      getRandomInt(Ships[source].attack.variable);
    uint defence = Ships[target].defence;
    uint accuracy = 100 - Ships[target].agility;
    uint damage = (attack - defence) * accuracy * uint(sourceHp) / uint(sourceMaxHp);
    uint sourceShipsCount = (sourceHp / Ships[source].hp) + 1;
    uint capDamage = sourceShipsCount * Ships[target].hp;

    delete attack;
    delete defence;
    delete accuracy;
    delete sourceShipsCount;

    return uint(min(max(0, int(damage)), int(capDamage)));
  }

  function isPositionFree(int position, int[] memory shipPositionsLhs, int[] memory shipPositionsRhs,
    int[] memory shipHpsLhs, int[] memory shipHpsRhs) private pure returns (bool) {
    if (uint(abs(position)) > BOARD_SIZE) {
      return false;
    }

    bool positionTaken = false;
    for (uint i = 0; i < MAX_SHIPS; i++) {
      if ((shipPositionsLhs[i] == position && shipHpsLhs[i] > 0) ||
        (shipPositionsRhs[i] == position && shipHpsRhs[i] > 0)) {
        positionTaken = true;
      }
    }

    return !positionTaken;
  }

  function moveShips(Ship[] memory Ships, bool isLhs, uint source, int direction, int[] memory shipPositionsLhs, int[] memory shipPositionsRhs, int[] memory shipHpsLhs, int[] memory shipHpsRhs) public pure returns (int) {
    int speed = int(Ships[source].speed);
    int newPosition = isLhs ? shipPositionsLhs[source] : shipPositionsRhs[source];

    for (int speedCheck = speed; speedCheck > 0; speedCheck--) {
      int proposedPosition = isLhs
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

  function logShoot(uint index, uint round, Move[] memory moves, uint source, uint target, uint damage) private pure {
    moves[index] = Move({
      moveType: 'shoot',
      round: round,
      source: source,
      target: target,
      damage: damage,
      targetPosition: 0
    });
  }

  function logMove(uint index, uint round, Move[] memory moves, uint source, int targetPosition) private pure {
    moves[index] = Move({
      moveType: 'move',
      round: round,
      source: source,
      targetPosition: targetPosition,
      target: 0,
      damage: 0
    });
  }

  function fight(Ship[] memory Ships, uint[] memory selectionLhs, uint[] memory selectionRhs, uint commanderLhs, uint commanderRhs) public view returns (FightResult memory) {
    require(selectionLhs.length == 4, 'Selection needs to have 4 elements');
    require(selectionRhs.length == 4, 'Selection needs to have 4 elements');

    int[] memory shipPositionsLhs = new int[](4);
    shipPositionsLhs[0] = 10;
    shipPositionsLhs[1] = 11;
    shipPositionsLhs[2] = 12;
    shipPositionsLhs[3] = 13;

    int[] memory shipPositionsRhs = new int[](4);
    shipPositionsRhs[0] = -10;
    shipPositionsRhs[1] = -11;
    shipPositionsRhs[2] = -12;
    shipPositionsRhs[3] = -13;

    uint[] memory shipMaxHpLhs = new uint[](MAX_SHIPS);
    uint[] memory shipMaxHpRhs = new uint[](MAX_SHIPS);
    int[] memory shipHpsLhs = new int[](MAX_SHIPS);
    int[] memory shipHpsRhs = new int[](MAX_SHIPS);

    for (uint i = 0; i < MAX_SHIPS; i++) {
      shipMaxHpLhs[i] = (Ships[i].hp * selectionLhs[i]);
      shipHpsLhs[i] = int(shipMaxHpLhs[i]);
      shipMaxHpRhs[i] = (Ships[i].hp * selectionRhs[i]);
      shipHpsRhs[i] = int(shipMaxHpRhs[i]);
    }

    FightStateInternal memory fightState;
    fightState.lhsMoves = new Move[](MAX_ROUNDS * MAX_SHIPS);
    fightState.rhsMoves = new Move[](MAX_ROUNDS * MAX_SHIPS);

    for (fightState.round = 0; fightState.round < MAX_ROUNDS && !isDead(shipHpsLhs) && !isDead(shipHpsRhs); fightState.round++) {
      for (fightState.currentShip = 0; fightState.currentShip < MAX_SHIPS; fightState.currentShip++) {
        if (shipHpsLhs[fightState.currentShip] > 0) {
          int target = getTarget(Ships, fightState.currentShip, shipPositionsLhs, shipPositionsRhs, shipHpsRhs);
          if (target >= 0) {
            uint damage = calculateDamage(Ships, fightState.currentShip, uint(target),
              uint(shipHpsLhs[fightState.currentShip]), shipMaxHpLhs[fightState.currentShip]);
            shipHpsRhs[uint(target)] -= int(damage);
            logShoot(fightState.loggedLhsMoves++, fightState.round, fightState.lhsMoves, fightState.currentShip, uint(target), damage);
          } else {
            shipPositionsLhs[fightState.currentShip] = moveShips(Ships, true, fightState.currentShip, -1, shipPositionsLhs,
              shipPositionsRhs, shipHpsLhs, shipHpsRhs);
            logMove(fightState.loggedLhsMoves++, fightState.round, fightState.lhsMoves, fightState.currentShip, shipPositionsLhs[fightState.currentShip]);
          }
        }
      }

      for (fightState.currentShip = 0; fightState.currentShip < MAX_SHIPS; fightState.currentShip++) {
        if (shipHpsRhs[fightState.currentShip] > 0) {
          int target = getTarget(Ships, fightState.currentShip, shipPositionsRhs, shipPositionsLhs, shipHpsLhs);
          if (target >= 0) {
            uint damage = calculateDamage(Ships, fightState.currentShip, uint(target),
              uint(shipHpsRhs[fightState.currentShip]), shipMaxHpRhs[fightState.currentShip]);
            shipHpsLhs[uint(target)] -= int(damage);
            logShoot(fightState.loggedRhsMoves++, fightState.round, fightState.rhsMoves, fightState.currentShip, uint(target), damage);
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
    delete shipMaxHpLhs;
    delete shipMaxHpRhs;

    return FightResult({
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

  function addShip(uint index, uint cp, uint hp, uint attackBase, uint attackVariable,
    uint defence, uint speed, uint range, uint agility) public restricted returns (uint) {
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

  function fight(uint[] memory selectionLhs, uint[] memory selectionRhs, uint commanderLhs, uint commanderRhs) public view returns (FightResult memory) {
    require(selectionLhs.length == 4, 'Selection needs to have 4 elements');
    require(selectionRhs.length == 4, 'Selection needs to have 4 elements');

    return GameEngineLibrary.fight(Ships, selectionLhs, selectionRhs, commanderLhs, commanderRhs);
  }
}
