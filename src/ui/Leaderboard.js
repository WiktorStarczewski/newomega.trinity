import './Leaderboard.css';
import React from 'react';
import _ from 'underscore';
import { ethers } from 'ethers';


// props.opponents, props.onDone
export const Leaderboard = (props) => {
    const renderEntry = (entry, ind) => {
        return (
            <div
                key={ind}
                className="mainMenuItem"
            >
                <div className="name">{ethers.utils.parseBytes32String(entry.name)}</div>
                <div className="address">Address: {entry.player}</div>
                <div className="wins">Wins: {entry.wins}</div>
                <div className="losses">Losses: {entry.losses}</div>
            </div>
        );
    };

    const leaderboard = _.clone(props.leaderboard);
    leaderboard.sort((lhs, rhs) => {
        return rhs.wins - lhs.wins;
    });

    return (
        <div className="Leaderboard">
            <div className="ui">
                <div className="mainTitle">
                </div>
                <div className="mainMenu">
                    {_.map(leaderboard, renderEntry)}
                </div>
                <div className="uiElement cancelBox bottomBox" onClick={props.onCancel}>
                    BACK
                </div>
            </div>
        </div>
    );
};
