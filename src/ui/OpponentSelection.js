import './OpponentSelection.css';
import React from 'react';
import _ from 'underscore';
import { ethers } from 'ethers';


// props.opponents, props.onDone
export const OpponentSelection = (props) => {
    const selectOpponent = (opponent) => {
        props.onDone(opponent);
    };

    const renderOpponent = (opponent, ind) => {
        return (
            <div
                key={ind}
                className="mainMenuItem"
                onClick={() => { selectOpponent(opponent) }}
            >
                {ethers.utils.parseBytes32String(opponent.name)}
            </div>
        );
    };

    const opponents = _.clone(props.opponents).reverse();

    return (
        <div className="OpponentSelection">
            <div className="ui">
                <div className="mainTitle">
                </div>
                <div className="mainMenu">
                    {_.map(opponents, renderOpponent)}
                </div>
                <div className="uiElement cancelBox bottomBox" onClick={props.onCancel}>
                    BACK
                </div>
            </div>
        </div>
    );
};
