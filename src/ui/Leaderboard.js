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

    const leaderboard = _.clone(props.leaderboard);
    leaderboard.sort((lhs, rhs) => {
        return rhs.wins.toNumber() - lhs.wins.toNumber();
    });

    return (
        <div className="Leaderboard">
            <div className="ui">
                <div className="mainTitle">
                </div>
                <div className="mainMenu">
                    {_.map(leaderboard, renderEntry)}
                </div>
                <a className="uiElement cancelBox bottomBox" href="/">
                    BACK
                </a>
            </div>
        </div>
    );
};
