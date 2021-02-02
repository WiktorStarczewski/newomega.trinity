// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  await hre.run('compile');

  const GameEngineLibrary = await hre.ethers.getContractFactory("GameEngineLibrary");
  const gameEngineLibrary = await GameEngineLibrary.deploy();
  await gameEngineLibrary.deployed();

  console.log('GameEngineLibrary: ', gameEngineLibrary.address);

  // We get the contract to deploy
  const GameEngine = await hre.ethers.getContractFactory("GameEngine", {
      libraries: {
          GameEngineLibrary: gameEngineLibrary.address,
      },
  });
  const gameEngine = await GameEngine.deploy();
  await gameEngine.deployed();

  console.log('GameEngine: ', gameEngine.address);

  const GameManager = await hre.ethers.getContractFactory("GameManager");
  const gameManager = await GameManager.deploy(gameEngine.address);
  await gameManager.deployed();

  console.log('GameManager: ', gameManager.address);

  await gameEngine.addShip(0, 1, 1000, 30, 5, 2, 4, 4, 25);
  await gameEngine.addShip(1, 4, 4000, 100, 20, 12, 3, 7, 15);
  await gameEngine.addShip(2, 5, 5000, 130, 10, 15, 2, 8, 10);
  await gameEngine.addShip(3, 15, 10000, 200, 5, 20, 1, 8, 0);

  console.log('Ships added to GameEngine');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
