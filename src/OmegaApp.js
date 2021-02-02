import './App.css';
import React, { Component } from 'react';
import Web3 from 'web3';
import { ethers } from 'ethers';
import * as TrinitySDK from "@elastosfoundation/trinity-dapp-sdk";
import { ShipSelection } from './scenes/ShipSelection';
import { CommanderSelection } from './scenes/CommanderSelection';
import { Combat } from './scenes/Combat';
import { GameEngine } from './definitions/GameEngine';
import { Ships } from './definitions/Ships';
import _ from 'underscore';


const Modes = {
    MainScreen: 0,
    ShipSelection: 1,
    CommanderSelection: 2,
    CommanderPreview: 3,
    Combat: 4,
}

export default class OmegaApp extends Component {
    constructor(props) {
        super(props);

        this.defaultLoadedState = {
            mode: Modes.MainScreen,
            loading: false,
            trainingSelfSelection: null,
            trainingResult: null,
            trainingSelfCommander: null,
            trainingOpponentSelection: null,
            trainingCp: null,
        };

        this.defaultUnloadedState = {
            ownAccount: null,
            web3Loaded: false,
            gameEngineContract: null,
            gameManagerContract: null,
        };

        this.state = {
            ...this.defaultLoadedState,
            ...this.defaultUnloadedState,
        };
    }

    shipSelectionDone(selection) {
        const trainingResult = !this.state.settingDefence &&
            GameEngine(selection, this.state.trainingOpponentSelection);

        this.setState({
            mode: Modes.CommanderSelection,
            trainingSelfSelection: selection,
            trainingResult,
        });
    }

    async commanderSelectionDone(commander) {
        if (this.state.settingDefence) {
            this.setState({
                loading: true,
            });

            console.log(this.state.trainingSelfSelection);

            await this.state.gameManagerContract.registerDefence(
                this.state.trainingSelfSelection,
                commander,
                this.state.ownAccount
            );

            this.setState(this.defaultLoadedState);
        } else {
            this.setState({
                mode: Modes.Combat,
                trainingSelfCommander: commander,
            });
        }
    }

    commanderPreviewDone() {
        this.setState({
            mode: Modes.MainScreen,
        });
    }

    _selectionToCp(selection) {
        return _.reduce(selection, (memo, num, index) => {
            return memo + (num || 0) * Ships[index].stats.cp;
        }, 0);
    }

    training() {
        const trainingOpponentSelection = [25, 18, 16, 6];

        this.setState({
            mode: Modes.ShipSelection,
            trainingOpponentSelection,
            trainingCp: this._selectionToCp(trainingOpponentSelection),
        });
    }

    commanders() {
        this.setState({
            mode: Modes.CommanderPreview,
        });
    }

    defend() {
        const trainingOpponentSelection = [25, 18, 16, 6];

        this.setState({
            mode: Modes.ShipSelection,
            settingDefence: true,
            trainingOpponentSelection,
            trainingCp: this._selectionToCp(trainingOpponentSelection),
        });
    }

    async attack() {
        const defendersPromise = this.state.gameManagerContract.getAllDefenders();
        defendersPromise.then((defenders) => {
            debugger;
        });



        // const result = await this.state.gameEngineContract.fight(
        //     this.state.ownAccount,
        //     this.state.ownAccount,
        //     [10, 10, 10, 10],
        //     [10, 10, 10, 10],
        //     0,
        //     0);

        // const _parseMoves = (moves) => {
        //     return _.map(moves, (move) => {
        //         return {
        //             moveType: move.moveType,
        //             round: move.round.toNumber(),
        //             source: move.source.toNumber(),
        //             target: move.target.toNumber(),
        //             damage: move.damage.toNumber(),
        //             targetPosition: move.targetPosition.toNumber(),
        //         };
        //     });
        // };

        // const _parseHp = (hp) => {
        //     return _.map(hp, (hpInst) => {
        //         return hpInst.toNumber();
        //     });
        // }

        // const _parseRounds = (rounds) => {
        //     return rounds.toNumber();
        // }

        // const resultJson = {
        //     lhs: _parseMoves(result[0]),
        //     rhs: _parseMoves(result[1]),
        //     lhsHp: _parseHp(result[2]),
        //     rhsHp: _parseHp(result[3]),
        //     rounds: _parseRounds(result[4]),
        // };

        // console.log(resultJson);

        // this.setState({
        //     mode: Modes.Combat,
        //     trainingSelfSelection: [10, 10, 10, 10],
        //     trainingSelfCommander: 0,
        //     trainingOpponentSelection: [10, 10, 10, 10],
        //     trainingCp: this._selectionToCp([10, 10, 10, 10]),
        //     trainingResult: resultJson,
        // });
    }

    leaderboard() {
        const leaderboardPromise = this.state.gameManagerContract.getLeaderboard();
        leaderboardPromise.then((leaderboard) => {

        });
    }

    render() {
        return (
            <div className="App">
                {this.state.mode === Modes.MainScreen &&
                    <div className="mainScreen ui">
                        <div className="mainTitle">
                        </div>
                        <div className="mainMenu">
                            <div className="mainMenuItem" onClick={this.training.bind(this)}>
                                TRAINING
                            </div>
                            <div className="mainMenuItem" onClick={this.commanders.bind(this)}>
                                COMMANDERS
                            </div>
                            <div className="mainMenuItem" onClick={this.defend.bind(this)}>
                                RANKED DEFENCE
                            </div>
                            <div className="mainMenuItem" onClick={this.attack.bind(this)}>
                                RANKED ATTACK
                            </div>
                            <div className="mainMenuItem" onClick={this.leaderboard.bind(this)}>
                                LEADERBOARD
                            </div>
                        </div>
                        <div className="versionBox uiElement">
                            Version: 0.0.1 (c) celrisen.eth
                        </div>
                    </div>
                }
                {this.state.mode === Modes.ShipSelection &&
                    <ShipSelection maxCp={this.state.trainingCp} onDone={this.shipSelectionDone.bind(this)}/>
                }
                {this.state.mode === Modes.CommanderSelection &&
                    <CommanderSelection onDone={this.commanderSelectionDone.bind(this)}/>
                }
                {this.state.mode === Modes.CommanderPreview &&
                    <CommanderSelection onDone={this.commanderPreviewDone.bind(this)}/>
                }
                {this.state.mode === Modes.Combat &&
                    <Combat selectionLhs={this.state.trainingSelfSelection}
                        selectionRhs={this.state.trainingOpponentSelection}
                        commanderLhs={this.state.trainingSelfCommander}
                        commanderRhs={0}
                        result={this.state.trainingResult}
                    />
                }
                <div
                    id="omegaLoadingScreen"
                    style={this.state.web3Loaded && !this.state.loading ? {display: 'none'} : {}}>
                    <div className="logo"/>
                    <div className="progressOuter progress-line"/>
                </div>
            </div>
        );
    }

    componentDidMount() {
        this._initWeb3();
    }

    async _initWeb3() {
        // const provider = new TrinitySDK.Ethereum.Web3.Providers.TrinityWeb3Provider();
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        // const provider = new Web3(window.ethereum);
        const accounts = await window.ethereum.send('eth_requestAccounts');

        this.setState({
            web3: provider,
            ownAccount: accounts.result[0],
            signer,
        }, () => {
            this._loadContracts(signer);
        });
    }

    _loadContracts(signer) {
        const gameEngineJson = require('./abi/GameEngine.json');
        const gameEngineContractAddress = '0x78A83DdB7698FEF62C8E403eB18CBa7C620C4335';
        const gameEngineContract = new ethers.Contract(gameEngineContractAddress, gameEngineJson, signer);

        const gameManagerJson = require('./abi/GameManager.json');
        const gameManagerContractAddress = '0xd6b5Cff06eC1F15145C291a493fa5674B0Efa830';
        const gameManagerContract = new ethers.Contract(gameManagerContractAddress, gameManagerJson, signer);

        this.setState({
            gameEngineContract,
            gameManagerContract,
            web3Loaded: true,
        });
    }
}

