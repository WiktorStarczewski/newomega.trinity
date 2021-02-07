import './Leaderboard.css';
import React from 'react';
import _ from 'underscore';
import { ethers } from 'ethers';


// props.logs, props.defenders, props.onDone
export const Leaderboard = (props) => {
    const logsToLeaderboard = () => {
        const playerData = {};

        _.each(props.logs, (log) => {
            const attacker = log.args[0];
            const defender = log.args[1];
            const result = log.args[2];

            playerData[defender] = playerData[defender] || {};
            playerData[attacker] = playerData[attacker] || {};

            if (result.lhsDead) {
                playerData[defender].wins = (playerData[defender].wins || 0) + 1;
                playerData[attacker].losses = (playerData[attacker].losses || 0) + 1;
            } else {
                playerData[attacker].wins = (playerData[attacker].wins || 0) + 1;
                playerData[defender].losses = (playerData[defender].losses || 0) + 1;
            }

            playerData[defender].player = defender;
            playerData[attacker].player = attacker;
        });

        _.each(playerData, (data, player) => {
            const defender = _.findWhere(props.defenders, {
                player,
            });
            data.name = defender ? defender.name : 'Anonymous';
        });

        const sortedValues = _.sortBy(_.values(playerData), 'wins');
        sortedValues.reverse();

        return sortedValues;
    };

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

    const leaderboard = logsToLeaderboard();

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
