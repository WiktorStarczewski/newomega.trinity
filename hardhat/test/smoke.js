const { expect } = require("chai");

describe("GameEngine", function() {
    it("Should return the new greeting once it's changed", async () => {
        const accounts = await ethers.getSigners();

        const GameEngineLibrary = await hre.ethers.getContractFactory("GameEngineLibrary");
        const gameEngineLibrary = await GameEngineLibrary.deploy();
        await gameEngineLibrary.deployed();

        // We get the contract to deploy
        const GameEngine = await hre.ethers.getContractFactory("GameEngine", {
            libraries: {
                GameEngineLibrary: gameEngineLibrary.address,
            },
        });
        const gameEngine = await GameEngine.deploy();
        await gameEngine.deployed();

        const GameManager = await hre.ethers.getContractFactory("GameManager");
        const gameManager = await GameManager.deploy(gameEngine.address);
        await gameManager.deployed();

        await gameEngine.addShip(0, 1, 1000, 30, 5, 2, 4, 4, 25);
        await gameEngine.addShip(1, 4, 4000, 100, 20, 12, 3, 7, 15);
        await gameEngine.addShip(2, 5, 5000, 130, 10, 15, 2, 8, 10);
        await gameEngine.addShip(3, 15, 10000, 200, 5, 20, 1, 8, 0);

        const gameManagerAsAnother = gameManager.connect(accounts[1]);
        await gameManagerAsAnother.registerDefence([10,10,10,10], 0, 'test1');

        gameManager.on('FightComplete', async (attacker, defender, result) => {
            console.log(result);

            const leaderboard = await gameManager.getLeaderboard();

            console.log('  # leaderboard # ', leaderboard);
        });

        // gameManager.events.FightComplete().watch((error, result) => {
        //     if (!error) {
        //         console.log(result);
        //     }
        // });

        // const result = await gameEngine.fight([5,5,5,5], [6,6,6,6], 0, 0);

        const result = await gameManager.attack(accounts[1].address, [5,5,5,5], 0);

        await new Promise((resolve, reject) => {
            setTimeout(resolve, 5000);
        })

//        console.log('###RESULT ', result);

        // const result2 = await result.wait();

//        console.log('$$$RESULT2 ', result2);
    }).timeout(600000);
});
