// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require('hardhat');

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  await hre.run('compile');

  // const GameEngineLibrary = await hre.ethers.getContractFactory('GameEngineLibrary');
  // const gameEngineLibrary = await GameEngineLibrary.deploy();
  // await gameEngineLibrary.deployed();

  // console.log('GameEngineLibrary: ', gameEngineLibrary.address);

  // We get the contract to deploy
  const NewOmega = await hre.ethers.getContractFactory('NewOmega');
  // , {
  //     libraries: {
  //         GameEngineLibrary: gameEngineLibrary.address,
  //     },
  // });
  const newOmega = await NewOmega.deploy();
  await newOmega.deployed();

  console.log('NewOmega: ', newOmega.address);

  await newOmega.addShip(0, 1, 1000, 30, 5, 2, 6, 6, 25);
  await newOmega.addShip(1, 4, 4000, 100, 20, 12, 4, 8, 15);
  await newOmega.addShip(2, 5, 5000, 130, 10, 15, 3, 10, 10);
  await newOmega.addShip(3, 15, 10000, 200, 5, 20, 2, 12, 0);

  console.log('Ships added to NewOmega');

  await newOmega.registerDefence([15, 15, 15, 15], 0, hre.ethers.utils.formatBytes32String('Celrisen'));

  console.log('Defence registered');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
