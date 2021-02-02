import './App.css';
import React, { Component } from 'react';
import { ethers } from 'ethers';
import * as TrinitySDK from "@elastosfoundation/trinity-dapp-sdk";
import { ShipSelection } from './scenes/ShipSelection';
import { CommanderSelection } from './scenes/CommanderSelection';
import { Combat } from './scenes/Combat';
import { OpponentSelection } from './ui/OpponentSelection';
import { Leaderboard } from './ui/Leaderboard';
import { ShowLogs } from './ui/ShowLogs';
import { GameEngine } from './definitions/GameEngine';
import { Ships } from './definitions/Ships';
import _ from 'underscore';


const Modes = {
    MainScreen: 0,
    ShipSelection: 1,
    CommanderSelection: 2,
    CommanderPreview: 3,
    Combat: 4,
    OpponentSelection: 5,
    ShowLogs: 6,
    Leaderboard: 7,
};

export default class OmegaApp extends Component {
    constructor(props) {
        super(props);

        this.defaultLoadedState = {
            mode: Modes.MainScreen,
            loading: false,
            trainingSelfSelection: null,
            trainingResult: null,
            trainingSelfCommander: null,
            trainingOpponent: null,
            trainingOpponentSelection: null,
            trainingOpponentCommander: null,
            trainingCp: null,
            defenders: null,
            settingDefence: false,
            settingAttack: false,
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

            await this.state.gameManagerContract.registerDefence(
                this.state.trainingSelfSelection,
                commander,
                this.state.ownAccount
            );

            this.setState(this.defaultLoadedState);
        } else if (this.state.settingAttack) {
            this.setState({
                loading: true,
            });

            await this.state.gameManagerContract.attack(
                this.state.trainingOpponent,
                this.state.trainingSelfSelection,
                commander
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
        this.setState(this.defaultLoadedState);
    }

    opponentSelectionDone(opponent) {
        const trainingOpponentSelection = opponent.defenceSelection;

        this.setState({
            mode: Modes.ShipSelection,
            settingAttack: true,
            trainingOpponent: opponent.player,
            trainingOpponentSelection,
            trainingOpponentCommander: opponent.commander,
            trainingCp: this._selectionToCp(trainingOpponentSelection),
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

    async showLogs() {
        const filter = this.state.gameManagerContract.filters.FightComplete();
        filter.fromBlock = this.state.provider.getBlockNumber().then((b) => b - 10000);
        filter.toBlock = 'latest';
        filter.attacker = this.state.ownAccount;

        this.setState({
            loading: true,
        });

        const logs = await this.state.provider.getLogs(filter);
        const logsParsed = _.map(logs, (log) => {
            return this.state.gameManagerContract.interface.parseLog(log);
        });

        this.setState({
            mode: Modes.ShowLogs,
            logs: logsParsed,
            loading: false,
        });
    }

    logSelectionDone(log) {
        const result = log.args[2];

        const _parseMoves = (moves) => {
            return _.map(moves, (move) => {
                return {
                    ...move,
                    damage: move.damage.toNumber(),
                };
            });
        };

        const _parseHp = (hp) => {
            return _.map(hp, (hpInst) => {
                return hpInst.toNumber();
            });
        }

        const resultJson = {
            lhs: _parseMoves(result.lhs),
            rhs: _parseMoves(result.rhs),
            lhsHp: _parseHp(result.lhsHp),
            rhsHp: _parseHp(result.rhsHp),
            rounds: result.rounds,
            selectionLhs: result.selectionLhs,
            selectionRhs: result.selectionRhs,
            commanderLhs: result.commanderLhs,
            commanderRhs: result.commanderRhs,
        };

        this.setState({
            mode: Modes.Combat,
            trainingSelfSelection: resultJson.selectionLhs,
            trainingSelfCommander: resultJson.commanderLhs,
            trainingOpponentSelection: resultJson.selectionRhs,
            trainingResult: resultJson,
        });
    }

    async attack() {
        this.setState({
            loading: true,
        });

        const defenders = await this.state.gameManagerContract.getAllDefenders();

        this.setState({
            mode: Modes.OpponentSelection,
            defenders,
            loading: false,
        });
    }

    async leaderboard() {
        this.setState({
            loading: true,
        });

        const leaderboard = await this.state.gameManagerContract.getLeaderboard();

        this.setState({
            mode: Modes.Leaderboard,
            leaderboard,
            loading: false,
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
                            <div className="mainMenuItem" onClick={this.showLogs.bind(this)}>
                                LOGS
                            </div>
                            <div className="mainMenuItem" onClick={this.defend.bind(this)}>
                                DEFENCE
                            </div>
                            <div className="mainMenuItem" onClick={this.attack.bind(this)}>
                                ATTACK
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
                {this.state.mode === Modes.OpponentSelection &&
                    <OpponentSelection opponents={this.state.defenders}
                        onDone={this.opponentSelectionDone.bind(this)}
                    />
                }
                {this.state.mode === Modes.ShowLogs &&
                    <ShowLogs logs={this.state.logs} onDone={this.logSelectionDone.bind(this)}/>
                }
                {this.state.mode === Modes.Leaderboard &&
                    <Leaderboard leaderboard={this.state.leaderboard}/>
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
            provider,
            ownAccount: accounts.result[0],
            signer,
        }, () => {
            this._loadContracts(signer);
        });
    }

    _loadContracts(signer) {
        const gameEngineJson = require('./abi/GameEngine.json');
        const gameEngineContractAddress = '0x39a3c0cDddF3f46A1b7462e911508E20230e6034';
        const gameEngineContract = new ethers.Contract(gameEngineContractAddress, gameEngineJson, signer);

        const gameManagerJson = require('./abi/GameManager.json');
        const gameManagerContractAddress = '0xc7ed5147cd9C348fdd3Fa954c3391597873ec010';
        const gameManagerContract = new ethers.Contract(gameManagerContractAddress, gameManagerJson, signer);

        this.setState({
            gameEngineContract,
            gameManagerContract,
            web3Loaded: true,
        });
    }
}

