// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0 <0.9.0;
pragma experimental ABIEncoderV2;

struct Move {
  uint8 moveType;
  uint8 round;
  uint8 source;
  uint8 target;
  int8 targetPosition;
  uint32 damage;
}

struct FightResult {
  uint8[] selectionLhs;
  uint8[] selectionRhs;
  uint8 commanderLhs;
  uint8 commanderRhs;
  Move[] lhs;
  Move[] rhs;
  bool lhsDead;
  bool rhsDead;
  uint8 rounds;
  uint seed;
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
}

struct FightStateInternal {
  uint8 round;
  uint8 loggedLhsMoves;
  uint8 loggedRhsMoves;
  Move[] lhsMoves;
  Move[] rhsMoves;
  uint8 currentShip;
  bool lhsHasTarget;
  bool rhsHasTarget;
  uint8 lhsTarget;
  uint8 rhsTarget;
  uint32 lhsDamage;
  uint32 rhsDamage;
  bool lhsDeadShip;
  bool rhsDeadShip;
  int32[] shipHpsLhs;
  int32[] shipHpsRhs;
}

struct PlayerDefence {
  address player;
  bool isInitialised;
  uint8[] defenceSelection;
  uint8 commander;
  bytes32 name;
}

struct LeaderboardEntry {
  address player;
  bytes32 name;
  uint32 wins;
  uint32 losses;
}

library GameEngineLibrary {
  uint8 constant private BOARD_SIZE = 15;
  uint8 constant private MAX_ROUNDS = 20;
  uint8 constant private MAX_SHIPS = 4;

  function abs(int16 value) private pure returns (int16) {
    if (value >= 0) {
      return value;
    } else {
      return -1 * value;
    }
  }

  function min(uint32 lhs, uint32 rhs) private pure returns (uint32) {
    return lhs < rhs ? lhs : rhs;
  }

  function max(uint32 lhs, uint32 rhs) private pure returns (uint32) {
    return lhs > rhs ? lhs : rhs;
  }

  function minI(int8 lhs, int8 rhs) private pure returns (int8) {
    return lhs < rhs ? lhs : rhs;
  }

  function maxI(int8 lhs, int8 rhs) private pure returns (int8) {
    return lhs > rhs ? lhs : rhs;
  }

  function isDead(int32[] memory shipHps) private pure returns (bool) {
    bool isTargetDead = true;

    for (uint i = 0; i < MAX_SHIPS; i++) {
      if (shipHps[i] > 0) {
        isTargetDead = false;
      }
    }

    return isTargetDead;
  }

  function getTarget(Ship[] memory Ships, uint8 currentShip,
    int8[] memory shipPositionsOwn, int8[] memory shipPositionsEnemy,
    int32[] memory shipHpsEnemy) internal pure returns (bool, uint8) {

    int16 position = shipPositionsOwn[currentShip];
    uint8 minDistanceIndex = MAX_SHIPS;

    for (int8 enemyShipI = int8(MAX_SHIPS - 1); enemyShipI >= 0; enemyShipI--) {
      uint8 enemyShip = uint8(enemyShipI);

      if (uint16(abs(position - shipPositionsEnemy[enemyShip])) <=
        Ships[currentShip].range && shipHpsEnemy[enemyShip] > 0) {
        minDistanceIndex = enemyShip;
        break;
      }
    }

    return (minDistanceIndex < MAX_SHIPS, minDistanceIndex);
  }

  function calculateDamage(uint16[] memory variables, Ship[] memory Ships, uint8 source, uint8 target, uint32 sourceHp) internal pure returns (uint32) {
    uint16 attack = Ships[source].attack.base + variables[source];
    uint16 sourceShipsCount = uint16((sourceHp / Ships[source].hp) + 1);
    uint32 capDamage = sourceShipsCount * Ships[target].hp;
    uint32 damage = (attack - Ships[target].defence) * uint32(sourceShipsCount);

    return min(max(0, damage), capDamage);
  }

  function logShoot(uint16 index, uint8 round, Move[] memory moves, uint8 source, uint8 target, uint32 damage) private pure {
    moves[index] = Move({
      moveType: 1,
      round: round,
      source: source,
      target: target,
      damage: damage,
      targetPosition: 0
    });
  }

  function logMove(uint16 index, uint8 round, Move[] memory moves, uint8 source, int8 targetPosition) private pure {
    moves[index] = Move({
      moveType: 2,
      round: round,
      source: source,
      targetPosition: targetPosition,
      target: 0,
      damage: 0
    });
  }

  function fight(uint seed, bool logMoves, Ship[] memory Ships, uint8[] memory selectionLhs, uint8[] memory selectionRhs, uint8 commanderLhs, uint8 commanderRhs) internal pure returns (FightResult memory) {
    require(selectionLhs.length == 4, 'Selection needs to have 4 elements');
    require(selectionRhs.length == 4, 'Selection needs to have 4 elements');

    int8[] memory shipPositionsLhs = new int8[](MAX_SHIPS);
    shipPositionsLhs[0] = 10;
    shipPositionsLhs[1] = 11;
    shipPositionsLhs[2] = 12;
    shipPositionsLhs[3] = 13;

    int8[] memory shipPositionsRhs = new int8[](MAX_SHIPS);
    shipPositionsRhs[0] = -10;
    shipPositionsRhs[1] = -11;
    shipPositionsRhs[2] = -12;
    shipPositionsRhs[3] = -13;

    FightStateInternal memory fightState;
    fightState.shipHpsLhs = new int32[](MAX_SHIPS);
    fightState.shipHpsRhs = new int32[](MAX_SHIPS);
    uint16[] memory variablesLhs = new uint16[](MAX_SHIPS);
    uint16[] memory variablesRhs = new uint16[](MAX_SHIPS);

    for (uint16 i = 0; i < MAX_SHIPS; i++) {
      fightState.shipHpsLhs[i] = int32(int16(Ships[i].hp * selectionLhs[i]));
      fightState.shipHpsRhs[i] = int32(int16(Ships[i].hp * selectionRhs[i]));
      variablesLhs[i] = uint16(seed % Ships[i].attack.variable);
      variablesRhs[i] = uint16((seed / 2) % Ships[i].attack.variable);
    }

    if (logMoves) {
      fightState.lhsMoves = new Move[](MAX_ROUNDS * MAX_SHIPS);
      fightState.rhsMoves = new Move[](MAX_ROUNDS * MAX_SHIPS);
    }

    for (fightState.round = 0; fightState.round < MAX_ROUNDS && !isDead(fightState.shipHpsLhs) && !isDead(fightState.shipHpsRhs); fightState.round++) {
      for (fightState.currentShip = 0; fightState.currentShip < MAX_SHIPS; fightState.currentShip++) {
        fightState.lhsHasTarget = false;
        fightState.rhsHasTarget = false;
        fightState.lhsDeadShip = fightState.shipHpsLhs[fightState.currentShip] <= 0;
        fightState.rhsDeadShip = fightState.shipHpsRhs[fightState.currentShip] <= 0;

        if (!fightState.lhsDeadShip) {
          (fightState.lhsHasTarget, fightState.lhsTarget) = getTarget(
            Ships, fightState.currentShip, shipPositionsLhs,
            shipPositionsRhs, fightState.shipHpsRhs);

          if (fightState.lhsHasTarget) {
            fightState.lhsDamage = calculateDamage(variablesLhs,
              Ships,
              fightState.currentShip,
              fightState.lhsTarget,
              uint32(fightState.shipHpsLhs[fightState.currentShip]));

            if (logMoves) {
              logShoot(fightState.loggedLhsMoves++, fightState.round, fightState.lhsMoves,
                fightState.currentShip, fightState.lhsTarget, fightState.lhsDamage);
            }
          } else {
            if (logMoves) {
              logMove(fightState.loggedLhsMoves++, fightState.round, fightState.lhsMoves,
                fightState.currentShip, shipPositionsLhs[fightState.currentShip] -
                int8(uint8(Ships[fightState.currentShip].speed)));
            }
          }
        }

        if (!fightState.rhsDeadShip) {
          (fightState.rhsHasTarget, fightState.rhsTarget) = getTarget(
            Ships, fightState.currentShip, shipPositionsRhs,
            shipPositionsLhs, fightState.shipHpsLhs);

          if (fightState.rhsHasTarget) {
            fightState.rhsDamage = calculateDamage(variablesRhs,
              Ships,
              fightState.currentShip,
              fightState.rhsTarget,
              uint32(fightState.shipHpsRhs[fightState.currentShip]));
            fightState.shipHpsLhs[uint8(fightState.rhsTarget)] -= int32(fightState.rhsDamage);

            if (logMoves) {
              logShoot(fightState.loggedRhsMoves++, fightState.round, fightState.rhsMoves,
                fightState.currentShip, fightState.rhsTarget, fightState.rhsDamage);
            }
          } else {
            shipPositionsRhs[fightState.currentShip] +=
              int8(uint8(Ships[fightState.currentShip].speed));

            if (logMoves) {
              logMove(fightState.loggedRhsMoves++, fightState.round, fightState.rhsMoves,
                fightState.currentShip, shipPositionsRhs[fightState.currentShip]);
            }
          }
        }

        if (!fightState.lhsDeadShip) {
          if (fightState.lhsHasTarget) {
            fightState.shipHpsRhs[uint8(fightState.lhsTarget)] -= int32(fightState.lhsDamage);
          } else {
            shipPositionsLhs[fightState.currentShip] -=
              int8(uint8(Ships[fightState.currentShip].speed));
          }
        }
      }
    }

    return FightResult({
      selectionLhs: selectionLhs,
      selectionRhs: selectionRhs,
      commanderLhs: commanderLhs,
      commanderRhs: commanderRhs,
      lhs: fightState.lhsMoves,
      rhs: fightState.rhsMoves,
      lhsDead: isDead(fightState.shipHpsLhs),
      rhsDead: isDead(fightState.shipHpsRhs),
      rounds: fightState.round,
      seed: seed
    });
  }
}

contract NewOmega {
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
    uint16 defence, uint16 speed, uint16 range) public restricted {
    Ship memory newShip = Ship({
      cp: cp,
      hp: hp,
      attack: ShipVariableStat({
        base: attackBase,
        variable: attackVariable
      }),
      defence: defence,
      speed: speed,
      range: range
    });

    shipsMapping[index] = newShip;
    Ships.push(newShip);
  }

  function getShips() public view restricted returns (Ship[] memory) {
    return Ships;
  }

  function replay(uint seed, uint8[] memory selectionLhs, uint8[] memory selectionRhs, uint8 commanderLhs, uint8 commanderRhs) public view returns (FightResult memory) {
      require(selectionLhs.length == 4, 'Selection needs to have 4 elements');
      require(selectionRhs.length == 4, 'Selection needs to have 4 elements');

      return GameEngineLibrary.fight(seed, true, Ships, selectionLhs, selectionRhs, commanderLhs, commanderRhs);
  }

  event FightComplete(
    address indexed attacker,
    address indexed defender,
    FightResult result
  );

  mapping(address => PlayerDefence) playerDefenceMapping;
  address[] playerDefenders;

  function getAllDefenders() public view returns (PlayerDefence[] memory) {
    PlayerDefence[] memory ret = new PlayerDefence[](playerDefenders.length);

    for (uint i = 0; i < playerDefenders.length; i++) {
      ret[i] = playerDefenceMapping[playerDefenders[i]];
    }

    return ret;
  }

  function registerDefence(uint8[] memory defence, uint8 commander, bytes32 name) public {
    PlayerDefence memory newDefence = PlayerDefence({
      player: msg.sender,
      defenceSelection: defence,
      commander: commander,
      name: name,
      isInitialised: true
    });
    if (!playerDefenceMapping[msg.sender].isInitialised) {
      playerDefenders.push(msg.sender);
    }
    playerDefenceMapping[msg.sender] = newDefence;
  }

  function getOwnDefence() public view returns (PlayerDefence memory) {
    require(playerDefenceMapping[msg.sender].isInitialised, 'Defence not registered');
    return playerDefenceMapping[msg.sender];
  }

  function attack(address enemy, uint8[] memory selection, uint8 commander) public {
    require(playerDefenceMapping[enemy].isInitialised, 'Can only attack a registered defence');

    uint seed = 12345678; //uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, msg.sender)));

    FightResult memory result = GameEngineLibrary.fight(seed, false, Ships, selection,
      playerDefenceMapping[enemy].defenceSelection,
      commander, playerDefenceMapping[enemy].commander);

    emit FightComplete(msg.sender, enemy, result);
  }
}
