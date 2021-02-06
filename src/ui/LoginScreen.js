import './LoginScreen.css';
import React from 'react';
import _ from 'underscore';
import { ethers } from 'ethers';


// props.onDone
export class LoginScreen extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            enteringMnemonic: false,
            mnemonic: '',
        };
    }

    signUp() {
        this.props.onDone({
            finisher: () => {
                const wallet = ethers.Wallet.createRandom();
                localStorage.setItem('OmegaMnemonic', wallet.mnemonic.phrase);
                return wallet;
            },
        });
    }

    logInFromMnemonic() {
        this.logIn(this.state.mnemonic);
    }

    logIn(mnemonic) {
        this.props.onDone({
            finisher: () => {
                const wallet = ethers.Wallet.fromMnemonic(mnemonic);
                localStorage.setItem('OmegaMnemonic', wallet.mnemonic.phrase);
                return wallet;
            },
        });
    }

    componentDidMount() {
        const mnemonic = localStorage.getItem('OmegaMnemonic');

        if (!_.isEmpty(mnemonic)) {
            this.logIn(mnemonic);
        }
    }

    mnemonicInputChanged(e) {
        this.setState({
            mnemonic: e.target.value,
        });
    }

    startMnemonicInput() {
        this.setState({
            enteringMnemonic: true,
        });
    }

    render() {
        return (
            <div className="LoginScreen">
                <div className="ui">
                    <div className="mainTitle">
                    </div>
                    {this.state.enteringMnemonic &&
                        <div className="loginDetails">
                            <textarea className="mnemonicInput"
                                onChange={this.mnemonicInputChanged.bind(this)}
                                value={this.state.mnemonic}
                                placeholder="Enter your 12-word mnemonic for the Ethereum Ropsten network"/>
                        </div>
                    }
                    {!this.state.enteringMnemonic &&
                        <div className="mainMenu">
                            <div className="mainMenuItem" onClick={this.signUp.bind(this)}>
                                SIGN UP
                            </div>
                            <div className="mainMenuItem" onClick={this.startMnemonicInput.bind(this)}>
                                LOG IN
                            </div>
                        </div>
                    }
                    {this.state.enteringMnemonic &&
                        <div className="uiElement doneBox bottomBox"
                            onClick={this.logInFromMnemonic.bind(this)}>
                            LOG IN
                        </div>
                    }
                    <div className="versionBox uiElement bottomElement">
                        Version: 0.0.1 (c) celrisen.eth
                    </div>
                </div>
            </div>
        );
    }
};
