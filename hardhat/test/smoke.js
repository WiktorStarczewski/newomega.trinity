// import { ethers, BigNumber } from 'ethers';

const { expect } = require("chai");
const { BigNumber } = require("ethers");

describe("NewOmega", function() {
    it("Should run successfully", async () => {
        const accounts = await ethers.getSigners();

        const NewOmega = await hre.ethers.getContractFactory('NewOmega');
        const newOmega = await NewOmega.deploy();
        await newOmega.deployed();

        await newOmega.addShip(0, 1, 100, 60, 10, 2, 4, 4);
        await newOmega.addShip(1, 3, 180, 100, 20, 12, 3, 6);
        await newOmega.addShip(2, 4, 200, 90, 30, 15, 2, 6);
        await newOmega.addShip(3, 10, 340, 70, 50, 20, 1, 8);

        await newOmega.registerDefence([10,10,10,10], 0, ethers.utils.formatBytes32String('test1'));

        newOmega.on('FightComplete', async (attacker, defender, result) => {
            // console.log(result);

            // const leaderboard = await newOmega.getLeaderboard();

            // console.log('  # leaderboard # ', leaderboard);
        });

        // gameManager.events.FightComplete().watch((error, result) => {
        //     if (!error) {
        //         console.log(result);
        //     }
        // });

        const getRandomInt = (min, max) => {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min) + min);
        }
        const seed = 1337; //getRandomInt(0, Number.MAX_SAFE_INTEGER);

        console.log('Seed ', seed);

        const result = await newOmega.replay(BigNumber.from(seed), [15,15,15,15], [15,15,15,15], 0, 0);

        // const result = await newOmega.attack(accounts[0].address, [10,10,10,10], 0);

        await new Promise((resolve, reject) => {
            setTimeout(resolve, 5000);
        })

        console.log('###RESULT ', result);

        // const result2 = await result.wait();

//        console.log('$$$RESULT2 ', result2);
    }).timeout(600000);
});
