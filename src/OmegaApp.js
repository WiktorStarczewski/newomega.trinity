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
            ethBalance: 0,
            blockNumber: 0,
            newOmegaContract: null,
            hasUnseenFights: false,
            playerName: window.localStorage.getItem('OmegaPlayerName') || 'Anonymous',
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

            try {
                const tx = await this.state.newOmegaContract.registerDefence(
                    this.state.trainingSelfSelection,
                    commander,
                    ethers.utils.formatBytes32String(this.state.playerName)
                );

                await tx.wait();
            } catch (error) {
            }

            this.setState(this.defaultLoadedState);
        } else if (this.state.settingAttack) {
            this.setState({
                loading: true,
            });

            try {
                const tx = await this.state.newOmegaContract.attack(
                    this.state.trainingOpponent,
                    this.state.trainingSelfSelection,
                    commander
                );

                await tx.wait();
            } catch (error) {
            }

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

    handlePlayerNameChange(e) {
        window.localStorage.setItem('OmegaPlayerName', e.target.value);
        this.setState({
            playerName: e.target.value,
        });
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

    attachBlockchainEvents(provider, newOmegaContract, ownAccount) {
        const filter = newOmegaContract.filters.FightComplete();
        filter.attacker = ownAccount;

        provider.on(filter, () => {
            this.setState({
                hasUnseenFights: true,
            });
        });

        provider.on('block', (blockNumber) => {
            this._checkBalance(provider, ownAccount);
            this.setState({
                blockNumber,
            });
        });
    }

    async showLogs() {
        const filterAttacker = this.state.newOmegaContract.filters.FightComplete();
        filterAttacker.fromBlock = this.state.provider.getBlockNumber().then((b) => b - 100000);
        filterAttacker.toBlock = 'latest';
        filterAttacker.attacker = this.state.ownAccount;

        const filterDefender = this.state.newOmegaContract.filters.FightComplete();
        filterAttacker.fromBlock = this.state.provider.getBlockNumber().then((b) => b - 100000);
        filterAttacker.toBlock = 'latest';
        filterAttacker.defender = this.state.ownAccount;

        this.setState({
            loading: true,
        });

        let logsAttacker, logsDefender;

        try {
            logsAttacker = await this.state.provider.getLogs(filterAttacker);
            logsDefender = await this.state.provider.getLogs(filterDefender);
        } catch (error) {
            return this.setState(this.defaultLoadedState);
        }

        const logs = logsAttacker.concat(logsDefender);
        const logsParsed = _.map(logs, (log) => {
            return this.state.newOmegaContract.interface.parseLog(log);
        });

        let defenders;

        try {
            defenders = await this.state.newOmegaContract.getAllDefenders();
        } catch (error) {
            return this.setState(this.defaultLoadedState);
        }

        this.setState({
            mode: Modes.ShowLogs,
            logs: logsParsed,
            loading: false,
            hasUnseenFights: false,
            defenders,
        });
    }

    async logSelectionDone(log) {
        const metaResult = log.args[2];

        this.setState({
            loading: true,
        });

        let result;

        try {
            result = await this.state.newOmegaContract.replay(
                metaResult.seed,
                metaResult.selectionLhs,
                metaResult.selectionRhs,
                metaResult.commanderLhs,
                metaResult.commanderRhs);
        } catch (error) {
            return this.setState(this.defaultLoadedState);
        }

        const _parseHp = (hp) => {
            return _.map(hp, (hpInst) => {
                return hpInst.toNumber();
            });
        }

        const resultJson = {
            lhs: result.lhs,
            rhs: result.rhs,
            lhsHp: _parseHp(result.lhsHp),
            rhsHp: _parseHp(result.rhsHp),
            rounds: result.rounds,
            selectionLhs: result.selectionLhs,
            selectionRhs: result.selectionRhs,
            commanderLhs: result.commanderLhs,
            commanderRhs: result.commanderRhs,
            lhsDead: result.lhsDead,
            rhsDead: result.rhsDead,
        };

        this.setState({
            mode: Modes.Combat,
            trainingSelfSelection: resultJson.selectionLhs,
            trainingSelfCommander: resultJson.commanderLhs,
            trainingOpponentSelection: resultJson.selectionRhs,
            trainingResult: resultJson,
            loading: false,
        });
    }

    async attack() {
        this.setState({
            loading: true,
        });

        let defenders;

        try {
            defenders = await this.state.newOmegaContract.getAllDefenders();
        } catch (error) {
            return this.setState(this.defaultLoadedState);
        }

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

        let leaderboard;

        try {
            leaderboard = await this.state.newOmegaContract.getLeaderboard();
        } catch (error) {
            return this.setState(this.defaultLoadedState);
        }

        this.setState({
            mode: Modes.Leaderboard,
            leaderboard,
            loading: false,
        });
    }

    render() {
        const logsClassName = `mainMenuItem ${this.state.hasUnseenFights ? 'unread' : ''}`;
        const ethBalanceString = this._formatBalance(ethers.utils.formatEther(this.state.ethBalance));

        return (
            <div className="App">
                {this.state.mode === Modes.MainScreen &&
                    <div className="mainScreen ui">
                        <div className="mainTitle">
                        </div>
                        <div className="playerName">
                            <input autoCorrect="off" type="text" className="playerNameInput" value={this.state.playerName}
                                onChange={this.handlePlayerNameChange.bind(this)}/>
                        </div>
                        <div className="mainMenu">
                            <div className="mainMenuItem" onClick={this.training.bind(this)}>
                                TRAINING
                            </div>
                            <div className="mainMenuItem" onClick={this.commanders.bind(this)}>
                                ACADEMY
                            </div>
                            <div className={logsClassName} onClick={this.showLogs.bind(this)}>
                                LOGS
                            </div>
                            <div className="mainMenuItem" onClick={this.defend.bind(this)}>
                                DEFENCE
                            </div>
                            <div className="mainMenuItem" onClick={this.attack.bind(this)}>
                                ATTACK
                            </div>
                            <div className="mainMenuItem" onClick={this.leaderboard.bind(this)}>
                                RANKING
                            </div>
                        </div>
                        <div className="versionBox uiElement bottomElement">
                            Version: 0.0.1 (c) celrisen.eth
                        </div>
                        <div className="ethBalance uiElement bottomElement">
                            Ξ{ethBalanceString} Block: {this.state.blockNumber}
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
                    <ShowLogs logs={this.state.logs}
                        opponents={this.state.defenders} onDone={this.logSelectionDone.bind(this)}/>
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

    _formatBalance(balance) {
        return parseFloat(balance, 10).toFixed(4).toString();
    }

    async _initWeb3() {
        // const provider = new TrinitySDK.Ethereum.Web3.Providers.TrinityWeb3Provider();
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        // const provider = new Web3(window.ethereum);
        const accounts = await window.ethereum.send('eth_requestAccounts');
        const ownAccount = accounts.result[0];

        await this._checkBalance(provider, ownAccount);
        this.setState({
            provider,
            ownAccount,
            signer,
        }, () => {
            this._loadContracts(provider, signer, ownAccount);
        });
    }

    async _checkBalance(provider, ownAccount) {
        const ethBalance = await provider.getBalance(ownAccount);
        this.setState({
            ethBalance,
        });
    }

    _loadContracts(provider, signer, ownAccount) {
        const newOmegaJson = require('./abi/NewOmega.json');
        const newOmegaAddress = '0xd4BCEB5e9C0c887B6a15239aAB3734EC741c3571';
        const newOmegaContract = new ethers.Contract(newOmegaAddress, newOmegaJson, signer);

        this.attachBlockchainEvents(provider, newOmegaContract, ownAccount);
        this.setState({
            newOmegaContract,
            web3Loaded: true,
        });
    }
}

