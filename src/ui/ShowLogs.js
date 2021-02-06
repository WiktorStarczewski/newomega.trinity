import './ShowLogs.css';
import React from 'react';
import _ from 'underscore';
import { ethers } from 'ethers';


// props.opponents, logs, props.onDone
export const ShowLogs = (props) => {
    const selectLog = (log) => {
        props.onDone(log);
    };

    const addressToName = (address) => {
        const opponent = _.findWhere(props.opponents, {
            player: address,
        });
        return opponent
            ? ethers.utils.parseBytes32String(opponent.name)
            : 'Anonymous';
    }

    const renderLog = (log, ind) => {
        return (
            <div
                key={ind}
                className="mainMenuItem"
                onClick={() => { selectLog(log) }}
            >
                <span className="address">{addressToName(log.args[0])}</span>
                <span className="vs"> VS </span>
                <span className="address">{addressToName(log.args[1])}</span>
            </div>
        );
    };

    const logs = _.clone(props.logs).reverse();

    return (
        <div className="ShowLogs">
            <div className="ui">
                <div className="mainTitle">
                </div>
                <div className="mainMenu">
                    {_.map(logs, renderLog)}
                </div>
                <div className="uiElement cancelBox bottomBox" onClick={props.onCancel}>
                    BACK
                </div>
            </div>
        </div>
    );
};
