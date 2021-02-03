import React, { useState } from 'react';
import _ from 'underscore';
import { Engine, Scene } from 'react-babylonjs';
import { Vector3, AssetsManager, Layer, ArcRotateCamera, HemisphericLight } from '@babylonjs/core';
import '@babylonjs/loaders';
import { Ships } from '../definitions/Ships';
import { OmegaLoadingScreen } from '../common/OmegaLoadingScreen';
import './ShipSelection.css';

export const ShipSelection = (props) => {
    const [ currentShip, setCurrentShip ] = useState(0);
    const [ selectedShips, setSelectedShips ] = useState(_.map(Ships, () => { return 0 }));
    const [ currentCp, setCurrentCp ] = useState(0);
    const [ scene, setScene ] = useState(null);
    const [ loadedMeshes, setLoadedMeshes ] = useState([]);
    const [ resourcesLoaded, setResourcesLoaded ] = useState(false);
    const [ notEnoughShips, setNotEnoughShips ] = useState(false);

    const nextShip = () => {
        const newShip = currentShip + 1;
        const newShipSafe = newShip >= Ships.length ? 0 : newShip;
        setCurrentShip(newShipSafe);
        loadCurrentShip(newShipSafe, scene);
    };

    const prevShip = () => {
        const newShip = currentShip - 1;
        const newShipSafe = newShip < 0 ? Ships.length - 1 : newShip;
        setCurrentShip(newShipSafe);
        loadCurrentShip(newShipSafe, scene);
    };

    const getCurrentCP = (selectedShips) => {
        return _.reduce(selectedShips, (memo, num, index) => {
            return memo + (num || 0) * Ships[index].stats.cp;
        }, 0);
    };

    const addShip = () => {
        const cost = Ships[currentShip].stats.cp;
        const currentCp = getCurrentCP(selectedShips);
        if (currentCp + cost <= props.maxCp) {
            selectedShips[currentShip] = (selectedShips[currentShip] || 0) + 1;
            setSelectedShips(selectedShips); // TODO NEEDED?
            setCurrentCp(getCurrentCP(selectedShips));
        }

        setNotEnoughShips(false);
    };

    const removeShip = () => {
        if (selectedShips[currentShip] > 0) {
            selectedShips[currentShip]--;
            setSelectedShips(selectedShips); // TODO NEEDED?
            setCurrentCp(getCurrentCP(selectedShips));
        }
    };

    const onDone = () => {
        props.onDone(selectedShips);
    };

    const afterLoadShip = (scene, newMeshes, shipIndex) => {
        newMeshes[0].position = Vector3.Zero();
        newMeshes[0].rotation = new Vector3(-Math.PI / 12, Math.PI, 0);
        newMeshes[0].scalingDeterminant = 0.001 * Ships[shipIndex].scale;
        newMeshes[0].isVisible = false;
    };

    const loadResources = (scene) => {
        return new Promise((resolve, reject) => {
            const loadedMeshes = [];

            const assetsManager = new AssetsManager(scene);
            _.each(Ships, (ship, index) => {
                const task = assetsManager.addMeshTask(index, '',
                    Ships[index].asset,
                    'scene.gltf');
                task.onSuccess = (task) => {
                    loadedMeshes[index] = task.loadedMeshes;
                    afterLoadShip(scene, task.loadedMeshes, index);
                };
            });

            assetsManager.onFinish = (tasks) => {
                setLoadedMeshes(loadedMeshes);
                resolve(loadedMeshes);
            };

            assetsManager.load();
        });
    };

    const loadCurrentShip = (currentShip, scene, loadedMeshesOverride) => {
        const meshes = loadedMeshesOverride || loadedMeshes;

        _.each(scene.meshes, (mesh) => {
            mesh.isVisible = false;
        });

        _.each(meshes[currentShip], (mesh) => {
            mesh.isVisible = true;
        });
    };

    const onSceneMount = (e) => {
        const { canvas, scene } = e;
        setScene(scene);

        scene.getEngine().loadingScreen = new OmegaLoadingScreen();

        const camera = new ArcRotateCamera('camera1',
            Math.PI / 2, Math.PI / 2, 9.0, Vector3.Zero(), scene);
        camera.minZ = 0.001;
        camera.lowerRadiusLimit = 9.0;
        camera.upperRadiusLimit = 9.0;
        scene.activeCameras.push(camera);
        camera.attachControl(canvas, true);

        const light = new HemisphericLight('light1', Vector3.Up(), scene);
        light.intensity = 0.7;

        const background = new Layer('background',
            '/assets/images/jeremy-perkins-uhjiu8FjnsQ-unsplash.jpg', scene);
        background.isBackground = true;
        background.texture.level = 0;
        background.texture.wAng = .2;

        loadResources(scene).then((loadedMeshes) => {
            setResourcesLoaded(true);
            loadCurrentShip(currentShip, scene, loadedMeshes);
        });

        scene.onBeforeRenderObservable.add(() => {
            const deltaTimeInMillis = scene.getEngine().getDeltaTime();

            _.each(scene.meshes, (mesh) => {
                const rpm = 2;
                mesh.rotation.y +=
                    ((rpm / 60) * Math.PI * 2 * (deltaTimeInMillis / 1000));
                mesh.rotation.z +=
                    ((rpm / 60) * Math.PI * 2 * (deltaTimeInMillis / 1000));
            });
        });
    };

    const checkEnoughShipsAndDone = () => {
        const notEnoughShips = currentCp < props.maxCp;
        setNotEnoughShips(notEnoughShips);
        if (!notEnoughShips) {
            onDone();
        }
    };

    const shipAdderClassName = `addOrRemoveShip addShip ${notEnoughShips ? 'highlightOverModal' : ''}`;

    return (
        <div className="ShipSelection">
            <Engine antialias={true} adaptToDeviceRatio={true} canvasId="ship-selection">
                <Scene onSceneMount={onSceneMount}/>
            </Engine>
            {resourcesLoaded &&
                <div className="ui">
                    <div className="uiElement shipName">
                        {Ships[currentShip].name}
                    </div>
                    <div className="uiElement sideBox shipStats">
                        <div>
                            HP: {Ships[currentShip].stats.hp}
                        </div>
                        <div>
                            Attack: {Ships[currentShip].stats.attack.base} - {Ships[currentShip].stats.attack.base + Ships[currentShip].stats.attack.variable}
                        </div>
                        <div>
                            Defence: {Ships[currentShip].stats.defence}
                        </div>
                        <div>
                            Speed: {Ships[currentShip].stats.speed}
                        </div>
                        <div>
                            Range: {Ships[currentShip].stats.range}
                        </div>
                        <div>
                            Accuracy: {Ships[currentShip].stats.accuracy}
                        </div>
                        <div>
                            Agility: {Ships[currentShip].stats.agility}
                        </div>
                    </div>
                    <div className="uiElement sideBox shipControls">
                        <div className={shipAdderClassName} onClick={addShip}>
                            +
                        </div>
                        <div>
                            Max CP: <span className="maxCp">{props.maxCp}</span>
                        </div>
                        <div>
                            CP Cost: {Ships[currentShip].stats.cp}
                        </div>
                        <div>
                            Used ships: {selectedShips[currentShip] || 0}
                        </div>
                        <div>
                            Used CP: {currentCp}
                        </div>
                        <div className="addOrRemoveShip removeShip" onClick={removeShip}>
                            -
                        </div>
                    </div>
                    <div className="uiElement shipDescription">
                        {Ships[currentShip].description}
                    </div>
                    <div className="uiElement chevron left" onClick={prevShip}/>
                    <div className="uiElement chevron right" onClick={nextShip}/>
                    <div className="uiElement doneBox bottomBox" onClick={checkEnoughShipsAndDone}>
                        DONE
                    </div>
                    <a className="uiElement cancelBox bottomBox" href="/">
                        BACK
                    </a>
                    <div className="omegaTip">
                        <div className="title">
                            Ship Selection
                        </div>
                        <div className="explanation">
                            <div className="tip">
                                1. The amount of ships in a fight is determined by the Command Power (CP) of the Defender fleet.
                            </div>
                            <div className="tip">
                                2. Each ship costs a certain amount of CP.
                            </div>
                            <div className="tip">
                                3. The Attacker selects a fleet, the total CP of which can not exceed the total CP of the Defender.
                            </div>
                        </div>
                    </div>
                </div>
            }
            {notEnoughShips &&
                <div className="modal">
                    <div className="modal-popup">
                        <div className="modal-body">
                            <div className="modal-title">You can still add ships to your fleet, Admiral!</div>
                            <div>Tip: Add ships to your fleet with the + button to the right of ship portrait.</div>
                        </div>
                        <div className="modal-buttons">
                            <div className="modal-button left" onClick={() => { setNotEnoughShips(false); }}>
                                Back
                            </div>
                            <div className="modal-button right" onClick={() => {
                                setNotEnoughShips(false);
                                onDone();
                            }}>
                                Start Anyway
                            </div>
                        </div>
                    </div>
                </div>
            }
        </div>
    );
}
