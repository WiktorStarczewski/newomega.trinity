const Migrations = artifacts.require("Migrations");
const GameEngineLibrary = artifacts.require("GameEngineLibrary");
const GameEngine = artifacts.require("GameEngine");
const GameManager = artifacts.require("GameManager");

async function doDeploy(deployer) {
    // await deployer.deploy(Migrations);
    const gameEngineLibrary = await deployer.deploy(GameEngineLibrary);
    await GameEngine.link('GameEngineLibrary', gameEngineLibrary.address);
    const gameEngine = await deployer.deploy(GameEngine);
    // await GameManager.link('GameEngine', gameEngine.address);
    await deployer.deploy(GameManager, gameEngine.address);
};

module.exports = function (deployer) {
    deployer.then(async () => {
        await doDeploy(deployer);
    });
};
