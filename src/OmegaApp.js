import './App.css';
import React, { Component } from 'react';
import { ethers } from 'ethers';
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
        this.state = {
            mode: Modes.MainScreen,
        };
    }

    shipSelectionDone(selection) {
        const trainingResult = GameEngine(selection, this.state.trainingOpponentSelection);

        this.setState({
            mode: Modes.CommanderSelection,
            trainingSelfSelection: selection,
            trainingResult,
        });
    }

    commanderSelectionDone(commander) {
        this.setState({
            mode: Modes.Combat,
            trainingSelfCommander: commander,
        });
    }

    commanderPreviewDone() {
        this.setState({
            mode: Modes.MainScreen,
        });
    }

    training() {
        const trainingOpponentSelection = [25, 18, 16, 6];
        const selectionToCp = (selection) => {
            return _.reduce(selection, (memo, num, index) => {
                return memo + (num || 0) * Ships[index].stats.cp;
            }, 0);
        };

        this.setState({
            mode: Modes.ShipSelection,
            trainingOpponentSelection,
            trainingCp: selectionToCp(trainingOpponentSelection),
        });
    }

    commanders() {
        this.setState({
            mode: Modes.CommanderPreview,
        });
    }

    defend() {

    }

    attack() {

    }

    leaderboard() {

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
                            <div className="mainMenuItem disabled" onClick={this.defend.bind(this)}>
                                RANKED DEFENCE
                            </div>
                            <div className="mainMenuItem disabled" onClick={this.attack.bind(this)}>
                                RANKED ATTACK
                            </div>
                            <div className="mainMenuItem disabled" onClick={this.leaderboard.bind(this)}>
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
                <div id="omegaLoadingScreen" style={{display: 'none'}}>
                    <div className="logo"/>
                    <div className="progressOuter progress-line"/>
                </div>
            </div>
        );
    }

    componentDidMount() {
        //this._initWeb3();
    }

    _initWeb3() {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        window.ethereum.send('eth_requestAccounts');
        this.setState({
            provider,
            signer,
        });

        this._checkBlockNumber(provider);
    }

    _checkBlockNumber(provider) {
        provider = provider || this.state.provider;
        provider.getBlockNumber().then((blockNumber) => {
            this.setState({
                blockNumber,
            });
        });
    }
}

