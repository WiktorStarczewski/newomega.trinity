// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0 <0.9.0;
pragma experimental ABIEncoderV2;

//import "hardhat/console.sol";

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
  bool hasTarget;
  uint8 target;
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
      uint16 distance = uint16(abs(position - shipPositionsEnemy[enemyShip]));

      if (distance <= Ships[currentShip].range && shipHpsEnemy[enemyShip] > 0) {
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

//    console.log('pre.init ', gasleft());

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

    int32[] memory shipHpsLhs = new int32[](MAX_SHIPS);
    int32[] memory shipHpsRhs = new int32[](MAX_SHIPS);
    uint16[] memory variables = new uint16[](MAX_SHIPS);

    for (uint16 i = 0; i < MAX_SHIPS; i++) {
      shipHpsLhs[i] = int32(int16(Ships[i].hp * selectionLhs[i]));
      shipHpsRhs[i] = int32(int16(Ships[i].hp * selectionRhs[i]));
      variables[i] = uint16(seed % Ships[i].attack.variable);
    }

    FightStateInternal memory fightState;
    if (logMoves) {
      fightState.lhsMoves = new Move[](MAX_ROUNDS * MAX_SHIPS);
      fightState.rhsMoves = new Move[](MAX_ROUNDS * MAX_SHIPS);
    }

//    console.log('post.init ', gasleft());

    for (fightState.round = 0; fightState.round < MAX_ROUNDS && !isDead(shipHpsLhs) && !isDead(shipHpsRhs); fightState.round++) {

//      console.log(fightState.round, ' / ', gasleft());

      for (fightState.currentShip = 0; fightState.currentShip < MAX_SHIPS; fightState.currentShip++) {
        if (shipHpsLhs[fightState.currentShip] > 0) {
//          console.log('pre.getTarget ', gasleft());
          (fightState.hasTarget, fightState.target) = getTarget(
            Ships, fightState.currentShip, shipPositionsLhs,
            shipPositionsRhs, shipHpsRhs);
//          console.log('post.getTarget ', gasleft());
          if (fightState.hasTarget) {
//            console.log('pre.calculateDamage ', gasleft());
            uint32 damage = calculateDamage(variables, Ships, fightState.currentShip, fightState.target,
              uint32(shipHpsLhs[fightState.currentShip]));
//            console.log('post.calculateDamage ', gasleft());
//            console.log('pre.subtraction ', gasleft());
            shipHpsRhs[uint8(fightState.target)] -= int32(damage);
//            console.log('post.subtraction ', gasleft());
            if (logMoves) {
              logShoot(fightState.loggedLhsMoves++, fightState.round, fightState.lhsMoves, fightState.currentShip, fightState.target, damage);
            }
          } else {
//            console.log('pre.moveShips ', gasleft());
            shipPositionsLhs[fightState.currentShip] = maxI(shipPositionsLhs[fightState.currentShip] -
              int8(uint8(Ships[fightState.currentShip].speed)), -13);
//            console.log('post.moveShips ', gasleft());
            if (logMoves) {
              logMove(fightState.loggedLhsMoves++, fightState.round, fightState.lhsMoves,
                fightState.currentShip, shipPositionsLhs[fightState.currentShip]);
            }
          }
        }
      }

      for (fightState.currentShip = 0; fightState.currentShip < MAX_SHIPS; fightState.currentShip++) {
        if (shipHpsRhs[fightState.currentShip] > 0) {
          (fightState.hasTarget, fightState.target) = getTarget(
            Ships, fightState.currentShip, shipPositionsRhs,
            shipPositionsLhs, shipHpsLhs);
          if (fightState.hasTarget) {
            uint32 damage = calculateDamage(variables, Ships, fightState.currentShip, fightState.target,
              uint32(shipHpsRhs[fightState.currentShip]));
            shipHpsLhs[uint8(fightState.target)] -= int32(damage);
            if (logMoves) {
              logShoot(fightState.loggedRhsMoves++, fightState.round, fightState.rhsMoves, fightState.currentShip, fightState.target, damage);
            }
          } else {
            shipPositionsRhs[fightState.currentShip] = minI(shipPositionsRhs[fightState.currentShip] +
              int8(uint8(Ships[fightState.currentShip].speed)), 13);
            if (logMoves) {
              logMove(fightState.loggedRhsMoves++, fightState.round, fightState.rhsMoves, fightState.currentShip, shipPositionsRhs[fightState.currentShip]);
            }
          }
        }
      }
    }

//    console.log('returning result ', gasleft());

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

    uint seed = 12345678; //uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, msg.sender)));

//    console.log('pre.fight ', gasleft());

    FightResult memory result = GameEngineLibrary.fight(seed, false, Ships, selection,
      playerDefenceMapping[enemy].defenceSelection,
      commander, playerDefenceMapping[enemy].commander);

//    console.log('    ### POSTFIGHT ### ', gasleft());

//    console.log('pre.winloss ', gasleft());

    if (result.lhsDead) {
      playerDataMapping[enemy].wins++;
      playerDataMapping[msg.sender].losses++;
    } else if (result.rhsDead) {
      playerDataMapping[msg.sender].wins++;
      playerDataMapping[enemy].losses++;
    }

//    console.log('post.winloss ', gasleft());

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
