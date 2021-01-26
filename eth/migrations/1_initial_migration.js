const Migrations = artifacts.require("Migrations");
const GameEngine = artifacts.require("GameEngine");

module.exports = function (deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(GameEngine);
};
