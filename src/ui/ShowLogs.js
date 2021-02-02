import './ShowLogs.css';
import React from 'react';
import _ from 'underscore';


// props.opponents, props.onDone
export const ShowLogs = (props) => {
    const selectLog = (log) => {
        props.onDone(log);
    };

    const renderLog = (log, ind) => {
        return (
            <div
                key={ind}
                className="mainMenuItem"
                onClick={() => { selectLog(log) }}
            >
                <span className="address">{log.args[0]}</span>
                <span className="vs"> vs </span>
                <span className="address">{log.args[1]}</span>
            </div>
        );
    };

    return (
        <div className="ShowLogs">
            <div className="ui">
                <div className="mainTitle">
                </div>
                <div className="mainMenu">
                    {_.map(props.logs, renderLog)}
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
