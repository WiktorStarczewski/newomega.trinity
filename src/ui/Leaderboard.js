import './Leaderboard.css';
import React from 'react';
import _ from 'underscore';


// props.opponents, props.onDone
export const Leaderboard = (props) => {
    const renderEntry = (entry, ind) => {
        return (
            <div
                key={ind}
                className="mainMenuItem"
            >
                <div className="name">{entry.name}</div>
                <div className="address">Address: {entry.player}</div>
                <div className="wins">Wins: {entry.wins.toNumber()}</div>
                <div className="losses">Losses: {entry.losses.toNumber()}</div>
            </div>
        );
    };

    return (
        <div className="Leaderboard">
            <div className="ui">
                <div className="mainTitle">
                </div>
                <div className="mainMenu">
                    {_.map(props.leaderboard, renderEntry)}
                </div>
                <div className="versionBox uiElement">
                    Version: 0.0.1 (c) celrisen.eth
                </div>
                <div className="ethBalance uiElement">

                </div>
                <a className="miniLogoBox" href="/">
                </a>
            </div>
        </div>
    );
};
