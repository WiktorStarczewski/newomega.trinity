pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;

contract GameEngine {
  address public owner = msg.sender;
  uint private BOARD_SIZE = 15;
  uint private MAX_ROUNDS = 30;
  uint private maxInt = 2**53 - 1;

  modifier restricted() {
    require(
      msg.sender == owner,
      "This function is restricted to the contract's owner"
    );
    _;
  }

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
  }

  mapping(uint => Ship) shipsMapping;
  Ship[] Ships;
  uint shipCount;

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

    return shipCount++;
  }

  function getShips() public view restricted returns (Ship[] memory) {
    return Ships;
  }

  function abs(int value) public pure returns (int) {
    return value >= 0 ? value : -1 * value;
  }

  function min(int lhs, int rhs) private pure returns (int) {
    return lhs < rhs ? lhs : rhs;
  }

  function max(int lhs, int rhs) private pure returns (int) {
    return lhs > rhs ? lhs : rhs;
  }

  function isDead(int[] memory shipHps) private pure returns (bool) {
    bool isTargetDead = true;

    for (uint i = 0; i < shipHps.length; i++) {
      if (shipHps[i] > 0) {
        isTargetDead = false;
      }
    }

    return isTargetDead;
  }

  function getTarget(uint currentShip, int[] memory shipPositionsOwn, int[] memory shipPositionsEnemy,
    int[] memory shipHpsEnemy) private view returns (int) {

    int position = shipPositionsOwn[currentShip];
    uint minDistance = maxInt;
    uint minDistanceIndex = 0;

    for (uint enemyShip = 0; enemyShip < shipPositionsEnemy.length; enemyShip++) {
      int positionTarget = shipPositionsEnemy[enemyShip];
      uint distance = uint(abs(position - positionTarget));

      if (shipHpsEnemy[enemyShip] > 0 && distance <= Ships[currentShip].range) {
        if (distance < minDistance) {
          minDistance = distance;
          minDistanceIndex = enemyShip;
        }
      }
    }

    return minDistance == maxInt ? -1 : int(minDistanceIndex);
  }

  function getRandomInt(uint maxValue) private view returns (uint) {
    return uint(keccak256(abi.encodePacked(block.difficulty, now, msg.sender))) % maxValue;
  }

  function calculateDamage(uint source, uint target, uint sourceHp, uint sourceMaxHp) private view returns (uint) {
    uint attack = Ships[source].attack.base +
      getRandomInt(Ships[source].attack.variable);
    uint defence = Ships[target].defence;
    uint accuracy = 100 - Ships[target].agility;
    uint damage = (attack - defence) * accuracy * uint(sourceHp) / uint(sourceMaxHp);
    uint sourceShipsCount = (sourceHp / Ships[source].hp) + 1;
    uint capDamage = sourceShipsCount * Ships[target].hp;

    return uint(min(max(0, int(damage)), int(capDamage)));
  }

  function isPositionFree(int position, int[] memory shipPositionsLhs, int[] memory shipPositionsRhs,
    int[] memory shipHpsLhs, int[] memory shipHpsRhs) private view returns (bool) {
    if (uint(abs(position)) > BOARD_SIZE) {
      return false;
    }

    bool positionTaken = false;
    for (uint i = 0; i < shipPositionsLhs.length; i++) {
      if ((shipPositionsLhs[i] == position && shipHpsLhs[i] > 0) ||
        (shipPositionsRhs[i] == position && shipHpsRhs[i] > 0)) {
        positionTaken = true;
      }
    }

    return !positionTaken;
  }

  function moveShips(int[] memory shipPositions, uint source, int direction, int[] memory shipPositionsLhs, int[] memory shipPositionsRhs, int[] memory shipHpsLhs, int[] memory shipHpsRhs) private view returns (int) {
    int speed = int(Ships[source].speed);

    for (int speedCheck = speed; speedCheck > 0; speedCheck--) {
      int proposedPosition = shipPositions[source] + direction * speedCheck;
      if (isPositionFree(proposedPosition, shipPositionsLhs, shipPositionsRhs, shipHpsLhs, shipHpsRhs)) {
        shipPositions[source] = proposedPosition;
        break;
      }
    }

    return shipPositions[source];
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

  function fight(address lhs, address rhs, uint[] memory selectionLhs, uint[] memory selectionRhs, uint commanderLhs, uint commanderRhs) public view returns (FightResult memory) {
    require(msg.sender == lhs, 'This function is restricted to the attacker');
    require(selectionLhs.length == 4, 'Selection needs to have 4 elements');
    require(selectionRhs.length == 4, 'Selection needs to have 4 elements');

    int[] memory shipPositionsLhs = new int[](4);
    shipPositionsLhs[0] = 10;
    shipPositionsLhs[1] = 11;
    shipPositionsLhs[2] = 12;
    shipPositionsLhs[3] = 13;

    int[] memory shipPositionsRhs = new int[](4);
    shipPositionsLhs[0] = -10;
    shipPositionsLhs[1] = -11;
    shipPositionsLhs[2] = -12;
    shipPositionsLhs[3] = -13;

    uint[] memory shipMaxHpLhs = new uint[](4);
    uint[] memory shipMaxHpRhs = new uint[](4);
    int[] memory shipHpsLhs = new int[](4);
    int[] memory shipHpsRhs = new int[](4);

    for (uint i = 0; i < selectionLhs.length; i++) {
      shipMaxHpLhs[i] = (Ships[i].hp * selectionLhs[i]);
      shipHpsLhs[i] = int(shipMaxHpLhs[i]);
      shipMaxHpRhs[i] = (Ships[i].hp * selectionRhs[i]);
      shipHpsRhs[i] = int(shipMaxHpRhs[i]);
    }

    Move[] memory lhsMoves = new Move[](MAX_ROUNDS * shipCount);
    Move[] memory rhsMoves = new Move[](MAX_ROUNDS * shipCount);

    FightStateInternal memory fightState;

    for (fightState.round = 0; fightState.round < MAX_ROUNDS && !isDead(shipHpsLhs) && !isDead(shipHpsRhs); fightState.round++) {
      for (uint currentShip = 0; currentShip < shipCount; currentShip++) {
        if (shipHpsLhs[currentShip] > 0) {
          int target = getTarget(currentShip, shipPositionsLhs, shipPositionsRhs, shipHpsRhs);
          if (target >= 0) {
            uint damage = calculateDamage(currentShip, uint(target),
              uint(shipHpsLhs[currentShip]), shipMaxHpLhs[currentShip]);
            shipHpsRhs[uint(target)] -= int(damage);
            logShoot(fightState.loggedLhsMoves++, fightState.round, lhsMoves, currentShip, uint(target), damage);
          } else {
            moveShips(shipPositionsLhs, currentShip, -1, shipPositionsLhs, shipPositionsRhs,
              shipHpsLhs, shipHpsRhs);
            logMove(fightState.loggedLhsMoves++, fightState.round, lhsMoves, currentShip, shipPositionsLhs[currentShip]);
          }
        }
      }

      for (uint currentShip = 0; currentShip < shipCount; currentShip++) {
        if (shipHpsRhs[currentShip] > 0) {
          int target = getTarget(currentShip, shipPositionsRhs, shipPositionsLhs, shipHpsLhs);
          if (target >= 0) {
            uint damage = calculateDamage(currentShip, uint(target),
              uint(shipHpsRhs[currentShip]), shipMaxHpRhs[currentShip]);
            shipHpsLhs[uint(target)] -= int(damage);
            logShoot(fightState.loggedRhsMoves++, fightState.round, rhsMoves, currentShip, uint(target), damage);
          } else {
            moveShips(shipPositionsRhs, currentShip, 1, shipPositionsLhs, shipPositionsRhs,
              shipHpsLhs, shipHpsRhs);
            logMove(fightState.loggedRhsMoves++, fightState.round, rhsMoves, currentShip, shipPositionsRhs[currentShip]);
          }
        }
      }
    }

    return FightResult({
      lhs: lhsMoves,
      rhs: rhsMoves,
      lhsHp: shipHpsLhs,
      rhsHp: shipHpsRhs,
      rounds: fightState.round
    });
  }
}
