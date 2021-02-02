// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.8 <0.9.0;
pragma experimental ABIEncoderV2;

import "./GameEngine.sol";

struct CommanderData {
    uint experience;
}

struct PlayerDefence {
    address player;
    bool isInitialised;
    uint16[] defenceSelection;
    uint16 commander;
    string name;
}

struct PlayerData {
    address player;
    bool isInitialised;
    CommanderData[] commanders;
    uint wins;
    uint losses;
}

struct LeaderboardEntry {
    address player;
    string name;
    uint wins;
    uint losses;
}

contract GameManager {
    address public owner = msg.sender;
    GameEngine public gameEngine;

    constructor(GameEngine engine) {
        gameEngine = engine;
    }

    modifier restricted() {
        require(
            msg.sender == owner,
            "This function is restricted to the contract's owner"
        );
        _;
    }

    event FightComplete(
        address indexed attacker,
        address indexed defender,
        FightResult result
    );

    mapping(address => PlayerData) playerDataMapping;
    address[] playerData;
    mapping(address => PlayerDefence) playerDefenceMapping;
    PlayerDefence[] playerDefenders;

    function getAllDefenders() public view returns (PlayerDefence[] memory) {
        return playerDefenders;
    }

    function registerDefence(uint16[] memory defence, uint16 commander, string memory name) public {
        PlayerDefence memory newDefence = PlayerDefence({
            player: msg.sender,
            defenceSelection: defence,
            commander: commander,
            name: name,
            isInitialised: true
        });
        if (!playerDefenceMapping[msg.sender].isInitialised) {
            playerDefenders.push(newDefence);
        }
        playerDefenceMapping[msg.sender] = newDefence;
    }

    function getOwnDefence() public view returns (PlayerDefence memory) {
        require(playerDefenceMapping[msg.sender].isInitialised, 'Defence not registered');
        return playerDefenceMapping[msg.sender];
    }

    function attack(address enemy, uint16[] memory selection, uint16 commander) public returns (FightResult memory result) {
        require(playerDefenceMapping[enemy].isInitialised, 'Can only attack a registered defence');
        result = gameEngine.fight(
            selection, playerDefenceMapping[enemy].defenceSelection,
            commander, playerDefenceMapping[enemy].commander);

        if (!playerDataMapping[msg.sender].isInitialised) {
            playerDataMapping[msg.sender].player = msg.sender;
            playerDataMapping[msg.sender].isInitialised = true;
            playerData.push(msg.sender);
        }

        if (!playerDataMapping[enemy].isInitialised) {
            playerDataMapping[enemy].player = enemy;
            playerDataMapping[enemy].isInitialised = true;
            playerData.push(enemy);
        }

        if (!playerDefenceMapping[msg.sender].isInitialised) {
            uint16[] memory defaultDefence = new uint16[](4);
            defaultDefence[0] = 20;
            defaultDefence[1] = 20;
            defaultDefence[2] = 20;
            defaultDefence[3] = 20;
            registerDefence(defaultDefence, 0, 'Anonymous');
        }

        if (result.lhsDead) {
            playerDataMapping[enemy].wins++;
            playerDataMapping[msg.sender].losses++;
        }

        if (result.rhsDead) {
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
