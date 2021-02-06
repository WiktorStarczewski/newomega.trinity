import React, { useState, useEffect, useRef } from 'react';
import _ from 'underscore';
import { Engine, Scene, Vector3, AssetsManager, Layer, ArcRotateCamera, HemisphericLight } from '@babylonjs/core';
import '@babylonjs/loaders';
import { Commanders, CommanderRaritiesColors, commanderRarityToString } from '../definitions/Commanders';
import { Ships } from '../definitions/Ships';
import { OmegaLoadingScreen } from '../common/OmegaLoadingScreen';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import ArrowLeftIcon from '@material-ui/icons/ArrowLeft';
import './CommanderSelection.css';


export const CommanderSelection = (props) => {
    const [ currentCommander, setCurrentCommander ] = useState(0);
    const [ scene, setScene ] = useState(null);
    const [ loadedMeshes, setLoadedMeshes ] = useState([]);
    const [ resourcesLoaded, setResourcesLoaded ] = useState(false);
    const reactCanvas = useRef(null);

    const nextCommander = () => {
        const newCommander = currentCommander + 1;
        const newCommanderSafe = newCommander >= Commanders.length ? 0 : newCommander;
        setCurrentCommander(newCommanderSafe);
        loadCurrentCommander(newCommanderSafe, scene);
    };

    const prevCommander = () => {
        const newCommander = currentCommander - 1;
        const newCommanderSafe = newCommander < 0 ? Commanders.length - 1 : newCommander;
        setCurrentCommander(newCommanderSafe);
        loadCurrentCommander(newCommanderSafe, scene);
    };

    const onDone = () => {
        props.onDone(currentCommander);
    };

    const afterLoadCommander = (scene, newMeshes, commanderIndex) => {
        newMeshes[0].position = Commanders[commanderIndex].visuals.positionOffset ||
            Vector3.Zero();
        newMeshes[0].rotation = Commanders[commanderIndex].visuals.rotation ||
            new Vector3(0, Math.PI, 0);
        newMeshes[0].scalingDeterminant = 0.001 * Commanders[commanderIndex].scale;
        newMeshes[0].isVisible = false;
    }

    const loadResources = (scene) => {
        return new Promise((resolve, reject) => {
            const loadedMeshes = [];

            const assetsManager = new AssetsManager(scene);
            _.each(Commanders, (commander, index) => {
                const task = assetsManager.addMeshTask(index, '',
                    Commanders[index].asset,
                    'scene.gltf');
                task.onSuccess = (task) => {
                    loadedMeshes[index] = task.loadedMeshes;
                    afterLoadCommander(scene, task.loadedMeshes, index);
                };
            });

            assetsManager.onFinish = (tasks) => {
                setLoadedMeshes(loadedMeshes);
                resolve(loadedMeshes);
            };

            assetsManager.load();
        });
    };

    const loadCurrentCommander = (currentCommander, scene, loadedMeshesOverride) => {
        const meshes = loadedMeshesOverride || loadedMeshes;

        _.each(scene.meshes, (mesh) => {
            mesh.isVisible = false;
        });

        _.each(meshes[currentCommander], (mesh) => {
            mesh.isVisible = true;
        });

        _.invoke(_.filter(scene.animationGroups, (group) => {
            return _.contains(Commanders[currentCommander].visuals.pickAnimations, group.name);
        }), 'play', true);
    };

    const onSceneMount = (canvas, scene) => {
        setScene(scene);

        scene.getEngine().loadingScreen = new OmegaLoadingScreen();

        const camera = new ArcRotateCamera('camera1',
            Math.PI / 2, Math.PI / 2, 9.0, Vector3.Zero(), scene);
        camera.minZ = 0.001;
        camera.upperAlphaLimit = Math.PI / 2;
        camera.lowerAlphaLimit = Math.PI / 2;
        camera.upperBetaLimit = Math.PI / 2;
        camera.lowerBetaLimit = Math.PI / 2;
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
            loadCurrentCommander(currentCommander, scene, loadedMeshes);
        });
    };

    const commanderRarityColor = CommanderRaritiesColors[Commanders[currentCommander].rarity];
    const commanderRarityString = commanderRarityToString(Commanders[currentCommander].rarity);

    const commanderAttackSuffix = _.has(Commanders[currentCommander].stats.attack, 'vs')
        ? ` vs ${Ships[Commanders[currentCommander].stats.attack.vs].name}`
        : '';
    const commanderAttackString = `+${Commanders[currentCommander].stats.attack.modifier}${commanderAttackSuffix}`;

    const commanderDefenceSuffix = _.has(Commanders[currentCommander].stats.defence, 'vs')
        ? ` vs ${Ships[Commanders[currentCommander].stats.defence.vs].name}`
        : '';
    const commanderDefenceString = `+${Commanders[currentCommander].stats.defence.modifier}${commanderDefenceSuffix}`;

    useEffect(() => {
        if (reactCanvas.current) {
            const engine = new Engine(reactCanvas.current, true, null, true);
            const scene = new Scene(engine);

            if (scene.isReady()) {
                onSceneMount(reactCanvas.current, scene);
            } else {
                scene.onReadyObservable.addOnce(scene => onSceneMount(reactCanvas.current, scene));
            }

            engine.runRenderLoop(() => {
                scene.render();
            })

            const resize = () => {
                scene.getEngine().resize();
            }

            if (window) {
                window.addEventListener('resize', resize);
            }

            return () => {
                scene.getEngine().dispose();
                if (window) {
                    window.removeEventListener('resize', resize);
                }
            }
        }
    }, [reactCanvas]);

    return (
        <div className="CommanderSelection">
            <canvas ref={reactCanvas} id="commander-selection"/>
            {resourcesLoaded &&
                <div className="ui">
                    <div className="uiElement commanderName" style={{color: commanderRarityColor}}>
                        {Commanders[currentCommander].name}
                    </div>
                    <div className="uiElement sideBox commanderStats">
                        <div>
                            Rarity: <span style={{color: commanderRarityColor}}>{commanderRarityString}</span>
                        </div>
                        <div>
                            Level: 1
                        </div>
                        <div>
                            Experience: 0/1000
                        </div>
                    </div>
                    <div className="uiElement sideBox commanderControls">
                        <div>
                            Attack:
                            <div>{commanderAttackString}</div>
                        </div>
                        <div>
                            Defence:
                            <div>{commanderDefenceString}</div>
                        </div>
                    </div>
                    <div className="uiElement commanderDescription">
                        {Commanders[currentCommander].description}
                    </div>
                    <div className="uiElement chevron left" onClick={prevCommander}>
                        <ArrowLeftIcon fontSize="large"/>
                    </div>
                    <div className="uiElement chevron right" onClick={nextCommander}>
                        <ArrowRightIcon fontSize="large"/>
                    </div>
                    <div className="uiElement doneBox bottomBox" onClick={onDone}>
                        DONE
                    </div>
                    <div className="uiElement cancelBox bottomBox" onClick={props.onCancel}>
                        BACK
                    </div>
                    <div className="omegaTip">
                        <div className="title">
                            Commander Selection
                        </div>
                        <div className="explanation">
                            <div className="tip">
                                1. Each fleet in a fight is led by a Commander.
                            </div>
                            <div className="tip">
                                2. Commanders have different stats, skills, and rarity levels.
                            </div>
                            <div className="tip">
                                3. By winning in Ranked Combat, Commanders increase their experience and effectiveness.
                            </div>
                        </div>
                    </div>
                </div>
            }
        </div>
    );
}
