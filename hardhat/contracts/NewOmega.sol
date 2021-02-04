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
  uint16 agility;
}

struct FightStateInternal {
  uint8 round;
  uint8 loggedLhsMoves;
  uint8 loggedRhsMoves;
  Move[] lhsMoves;
  Move[] rhsMoves;
  uint8 currentShip;
}

struct PlayerDefence {
  address player;
  bool isInitialised;
  uint8[] defenceSelection;
  uint8 commander;
  bytes32 name;
}

struct PlayerData {
  bool isInitialised;
  uint32 wins;
  uint32 losses;
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
  uint constant private maxInt = 2**53 - 1;

  function abs(int16 value) private pure returns (int16) {
    if (value >= 0) {
      return value;
    } else {
      return -1 * value;
    }
  }

  function min(int32 lhs, int32 rhs) private pure returns (int32) {
    return lhs < rhs ? lhs : rhs;
  }

  function max(int32 lhs, int32 rhs) private pure returns (int32) {
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

  function getTarget(Ship[] memory Ships, uint8 currentShip, int8[] memory shipPositionsOwn, int8[] memory shipPositionsEnemy,
    int64[] memory shipHpsEnemy) internal pure returns (int8) {

    int16 position = shipPositionsOwn[currentShip];
    uint minDistance = maxInt;
    uint8 minDistanceIndex = 0;

    for (uint8 enemyShip = 0; enemyShip < MAX_SHIPS; enemyShip++) {
      int8 positionTarget = shipPositionsEnemy[enemyShip];
      uint16 distance = uint16(abs(position - positionTarget));

      if (shipHpsEnemy[enemyShip] > 0 && distance <= Ships[currentShip].range) {
        if (distance < minDistance) {
          minDistance = distance;
          minDistanceIndex = enemyShip;
        }
      }
    }

    delete position;
    return (uint(minDistance) == maxInt) ? -1 : int8(minDistanceIndex);
  }

  function calculateDamage(uint seed, Ship[] memory Ships, uint8 source, uint8 target, uint64 sourceHp) internal pure returns (uint32) {
    uint16 attack = Ships[source].attack.base + uint16(seed % Ships[source].attack.variable);
    uint16 defence = Ships[target].defence;
    uint16 accuracy = 100 - Ships[target].agility;
    uint32 damagePerShip = (attack - defence) * accuracy / 10;
    uint16 sourceShipsCount = uint16((sourceHp / Ships[source].hp) + 1);
    uint32 capDamage = uint32(sourceShipsCount) * uint32(Ships[target].hp);
    uint32 damage = damagePerShip * uint32(sourceShipsCount);

    delete attack;
    delete defence;
    delete accuracy;
    delete sourceShipsCount;

    return uint32(min(max(0, int32(damage)), int32(capDamage)));
  }

  function isPositionFree(int16 position, int8[] memory shipPositionsLhs, int8[] memory shipPositionsRhs,
    int64[] memory shipHpsLhs, int64[] memory shipHpsRhs) private pure returns (bool) {
    if (uint16(abs(position)) > BOARD_SIZE) {
      return false;
    }

    bool positionTaken = false;
    for (uint8 i = 0; i < MAX_SHIPS; i++) {
      if ((shipPositionsLhs[i] == position && shipHpsLhs[i] > 0) ||
        (shipPositionsRhs[i] == position && shipHpsRhs[i] > 0)) {
        positionTaken = true;
      }
    }

    return !positionTaken;
  }

  function moveShips(Ship[] memory Ships, bool isLhs, uint16 source, int16 direction, int8[] memory shipPositionsLhs, int8[] memory shipPositionsRhs, int64[] memory shipHpsLhs, int64[] memory shipHpsRhs) internal pure returns (int8) {
    int16 speed = int16(Ships[source].speed);
    int8 newPosition = isLhs ? shipPositionsLhs[source] : shipPositionsRhs[source];

    for (int16 speedCheck = speed; speedCheck > 0; speedCheck--) {
      int8 proposedPosition = isLhs
        ? shipPositionsLhs[source] + int8(direction * speedCheck)
        : shipPositionsRhs[source] + int8(direction * speedCheck);
      if (isPositionFree(proposedPosition, shipPositionsLhs, shipPositionsRhs, shipHpsLhs, shipHpsRhs)) {
        newPosition = proposedPosition;
        break;
      }
    }

    delete speed;
    return newPosition;
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

    int64[] memory shipHpsLhs = new int64[](MAX_SHIPS);
    int64[] memory shipHpsRhs = new int64[](MAX_SHIPS);

    for (uint16 i = 0; i < MAX_SHIPS; i++) {
      shipHpsLhs[i] = int64(Ships[i].hp) * int64(selectionLhs[i]);
      shipHpsRhs[i] = int64(Ships[i].hp) * int64(selectionRhs[i]);
    }

    FightStateInternal memory fightState;
    if (logMoves) {
      fightState.lhsMoves = new Move[](MAX_ROUNDS * MAX_SHIPS);
      fightState.rhsMoves = new Move[](MAX_ROUNDS * MAX_SHIPS);
    }

    for (fightState.round = 0; fightState.round < MAX_ROUNDS && !isDead(shipHpsLhs) && !isDead(shipHpsRhs); fightState.round++) {
      for (fightState.currentShip = 0; fightState.currentShip < MAX_SHIPS; fightState.currentShip++) {
        if (shipHpsLhs[fightState.currentShip] > 0) {
          int8 target = getTarget(Ships, fightState.currentShip, shipPositionsLhs, shipPositionsRhs, shipHpsRhs);
          if (target >= 0) {
            uint32 damage = calculateDamage(seed, Ships, fightState.currentShip, uint8(target),
              uint64(shipHpsLhs[fightState.currentShip]));
            shipHpsRhs[uint8(target)] -= int64(damage);
            if (logMoves) {
              logShoot(fightState.loggedLhsMoves++, fightState.round, fightState.lhsMoves, fightState.currentShip, uint8(target), damage);
            }
          } else {
            shipPositionsLhs[fightState.currentShip] = moveShips(
              Ships, true, fightState.currentShip, -1, shipPositionsLhs,
              shipPositionsRhs, shipHpsLhs, shipHpsRhs);
            if (logMoves) {
              logMove(fightState.loggedLhsMoves++, fightState.round, fightState.lhsMoves,
                fightState.currentShip, shipPositionsLhs[fightState.currentShip]);
            }
          }
        }
      }

      for (fightState.currentShip = 0; fightState.currentShip < MAX_SHIPS; fightState.currentShip++) {
        if (shipHpsRhs[fightState.currentShip] > 0) {
          int8 target = getTarget(Ships, fightState.currentShip, shipPositionsRhs, shipPositionsLhs, shipHpsLhs);
          if (target >= 0) {
            uint32 damage = calculateDamage(seed, Ships, fightState.currentShip, uint8(target),
              uint64(shipHpsRhs[fightState.currentShip]));
            shipHpsLhs[uint8(target)] -= int64(damage);
            if (logMoves) {
              logShoot(fightState.loggedRhsMoves++, fightState.round, fightState.rhsMoves, fightState.currentShip, uint8(target), damage);
            }
          } else {
            shipPositionsRhs[fightState.currentShip] = moveShips(Ships, false, fightState.currentShip, 1, shipPositionsLhs,
              shipPositionsRhs, shipHpsLhs, shipHpsRhs);
            if (logMoves) {
              logMove(fightState.loggedRhsMoves++, fightState.round, fightState.rhsMoves, fightState.currentShip, shipPositionsRhs[fightState.currentShip]);
            }
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
      lhsDead: isDead(shipHpsLhs),
      rhsDead: isDead(shipHpsRhs),
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

  function replay(uint seed, uint8[] memory selectionLhs, uint8[] memory selectionRhs, uint8 commanderLhs, uint8 commanderRhs) public view returns (FightResult memory) {
      require(selectionLhs.length == 4, 'Selection needs to have 4 elements');
      require(selectionRhs.length == 4, 'Selection needs to have 4 elements');

      return GameEngineLibrary.fight(seed, true, Ships, selectionLhs, selectionRhs, commanderLhs, commanderRhs);
  }

  function fight(uint seed, uint8[] memory selectionLhs, uint8[] memory selectionRhs, uint8 commanderLhs, uint8 commanderRhs) private view returns (FightResult memory) {
      require(selectionLhs.length == 4, 'Selection needs to have 4 elements');
      require(selectionRhs.length == 4, 'Selection needs to have 4 elements');

      return GameEngineLibrary.fight(seed, false, Ships, selectionLhs, selectionRhs, commanderLhs, commanderRhs);
  }

  event FightComplete(
    address indexed attacker,
    address indexed defender,
    FightResult result
  );

  mapping(address => PlayerData) playerDataMapping;
  address[] playerData;
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

    if (!playerDataMapping[msg.sender].isInitialised) {
      PlayerData memory newDataRhs = PlayerData({
        isInitialised: true,
        wins: 0,
        losses: 0
      });

      playerDataMapping[msg.sender] = newDataRhs;
      playerData.push(msg.sender);
    }
  }

  function getOwnDefence() public view returns (PlayerDefence memory) {
    require(playerDefenceMapping[msg.sender].isInitialised, 'Defence not registered');
    return playerDefenceMapping[msg.sender];
  }

  function attack(address enemy, uint8[] memory selection, uint8 commander) public {
    require(playerDefenceMapping[enemy].isInitialised, 'Can only attack a registered defence');

    uint seed = uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, msg.sender)));

    FightResult memory result = fight(
      seed, selection, playerDefenceMapping[enemy].defenceSelection,
      commander, playerDefenceMapping[enemy].commander);

    if (result.lhsDead) {
      playerDataMapping[enemy].wins++;
      playerDataMapping[msg.sender].losses++;
    } else if (result.rhsDead) {
      playerDataMapping[msg.sender].wins++;
      playerDataMapping[enemy].losses++;
    }

    emit FightComplete(msg.sender, enemy, result);
  }

  function getLeaderboard() public view returns (LeaderboardEntry[] memory) {
    LeaderboardEntry[] memory entries = new LeaderboardEntry[](playerData.length);

    for (uint i = 0; i < playerData.length; i++) {
      address playerAddress = playerData[i];

      entries[i] = LeaderboardEntry({
        player: playerAddress,
        name: playerDefenceMapping[playerAddress].name,
        wins: playerDataMapping[playerAddress].wins,
        losses: playerDataMapping[playerAddress].losses
      });
    }

    return entries;
  }
}
