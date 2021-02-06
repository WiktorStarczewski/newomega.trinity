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

  await newOmega.addShip(0, 1, 100, 60, 10, 2, 4, 4);
  await newOmega.addShip(1, 3, 180, 100, 20, 12, 3, 6);
  await newOmega.addShip(2, 4, 200, 90, 30, 15, 2, 6);
  await newOmega.addShip(3, 10, 340, 70, 50, 20, 1, 8);

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
