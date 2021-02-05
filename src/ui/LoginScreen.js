import './LoginScreen.css';
import React from 'react';
import _ from 'underscore';
import { ethers } from 'ethers';


// props.onDone
export class LoginScreen extends React.Component {
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
        // show textbox
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

    render() {
        return (
            <div className="LoginScreen">
                <div className="ui">
                    <div className="mainTitle">
                    </div>
                    <div className="mainMenu">
                        <div className="mainMenuItem" onClick={this.signUp.bind(this)}>
                            SIGN UP
                        </div>
                        <div className="mainMenuItem" onClick={this.logInFromMnemonic.bind(this)}>
                            LOG IN
                        </div>
                    </div>
                    <div className="versionBox uiElement bottomElement">
                        Version: 0.0.1 (c) celrisen.eth
                    </div>
                </div>
            </div>
        );
    }
};
