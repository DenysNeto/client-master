import { theme } from "./theme";
import { CircleTypes } from './shapes-interface';
import { NotificationTypes } from '../popups/local-notification/local-notification.service';
import ShapeCreator from './ShapesCreator';
import { DataStorages, FlowBlock, FlowPort, DataState } from '../services/indexed-db.interface';


const ShapesClipboard = {
    // function add selected block to array with other blocks
    selectedBlock(event, selectedBlocks) {
        if (selectedBlocks.length > 0) {
            if (selectedBlocks[0].parent._id !== event.parent.parent._id) {
                return 0;
            }
        }
        selectedBlocks.push(event.parent);
        event.parent.children.each(elem => {
            if (elem.className === 'Rect' && elem.attrs.main_stroke) {
                elem.setAttr('stroke', theme.choose_group_color);
            }
            elem.setAttr('draggable', false);
        });
    },

    copySelectedBlocks(currentCopiedGroup, copiedBlocks) {
        currentCopiedGroup.removeChildren();
        let allElemPaths = [];
        let allClonedPaths = [];
        let allElemOutputs = [];
        let allClonedOutputs = [];
        let allElemInputs = [];
        let allClonedInputs = [];
        let clonedBlocks = [];

        copiedBlocks.forEach(elem => {
            elem.find('Path').forEach(path => allElemPaths.push(path));
            elem.find('Circle').filter(circle => circle.attrs.type === CircleTypes.Output).forEach(output => allElemOutputs.push(output));
            elem.find('Circle').filter(circle => circle.attrs.type === CircleTypes.Input).forEach(input => allElemInputs.push(input));
            let clone = elem.clone();
            clone._id = ShapeCreator.randomIdNumber();
            clone.attrs.flowId = elem.parent._id;
            clonedBlocks.push(clone);
            this.returnColorAfterSelect(elem);
        });

        clonedBlocks.forEach(elem => {
            elem.find('Path').forEach(path => allClonedPaths.push(path));
            elem.find('Circle').filter(circle => circle.attrs.type === CircleTypes.Output).forEach(output => {
                output._id = ShapeCreator.randomIdNumber();
                allClonedOutputs.push(output);
            });
            elem.find('Circle').filter(circle => circle.attrs.type === CircleTypes.Input).forEach(input => {
                input._id = ShapeCreator.randomIdNumber();
                allClonedInputs.push(input);
            });
        })

        allElemPaths.forEach((path, indexPath) => {
            if (path) {
                allElemOutputs.forEach((output, indexOutput) => {
                    if (output) {
                        if (path.attrs.start_info.start_circle_id === output._id) {
                            allClonedPaths[indexPath].attrs.start_info.start_circle_id = allClonedOutputs[indexOutput]._id;
                            allClonedPaths[indexPath].attrs.start_info.start_group_id = allClonedOutputs[indexOutput].parent._id;
                        }
                    }
                })
                allElemInputs.forEach((input, indexInput) => {
                    if (input) {
                        if (path.attrs.end_info.end_circle_id === input._id) {
                            allClonedPaths[indexPath].attrs.end_info.end_circle_id = allClonedInputs[indexInput]._id;
                            allClonedPaths[indexPath].attrs.end_info.end_group_id = allClonedInputs[indexInput].parent._id;
                        }
                    }
                })
            }
            // if id input cicle original path equal id input cicle clone path
            // it's mean we don't copy block on end of this path
            // and don't need copy this path
            if (path.attrs.end_info.end_circle_id === allClonedPaths[indexPath].attrs.end_info.end_circle_id) {
                allClonedPaths[indexPath].destroy();
            }
        })
        if (clonedBlocks.length > 0) {
            clonedBlocks.forEach(block => currentCopiedGroup.add(block))
        }
    },

    returnColorAfterSelect(shape) {
        shape.children.each(elem => {
            if (elem.className === 'Rect') {
                elem.setAttr('stroke', shape.attrs.blockData.color);
            }
        })
    },

    setSizeForCopiedGroup(currentCopiedGroup) {
        let biggestX = 0;
        let biggestY = 0;
        currentCopiedGroup.children.each(block => {
            if (biggestX < block.attrs.x) {
                biggestX = block.attrs.x;
            }
            if (biggestY < block.attrs.y) {
                biggestY = block.attrs.y;
            }
        })
        currentCopiedGroup.setAttrs({
            width: biggestX - currentCopiedGroup.children[0].attrs.x + 80,
            height: biggestY - currentCopiedGroup.children[0].attrs.y + 80
        })
    },

    // function call when we click on place where paste objects
    // at first we take position of first shape for calculation 
    // positions for another objects, after we transer all object
    // from copy group in flowboard 
    async pasteOperation(flow, stage, mainLayer, currentCopiedGroup, canvasService, blocksService, localNotificationService, iDBService) {
        let pasteFlowId = currentCopiedGroup.children[0].attrs.flowId;
        if (flow._id === pasteFlowId) {
            let firstShapeX = currentCopiedGroup.children[0].attrs.x;
            let firstShapeY = currentCopiedGroup.children[0].attrs.y;
            let pasteObj;
            while (currentCopiedGroup.getChildren().length > 0) {
                pasteObj = currentCopiedGroup.children[0];
                canvasService.setListenerOnBlock(mainLayer, pasteObj);
                canvasService.setListenerOnIcons(pasteObj);
                let flow = blocksService.getFlowboards().find(flow => flow._id === pasteObj.attrs.flowId);
                pasteObj.setAttrs({
                    x: stage.getStage().getPointerPosition().x - flow.attrs.x + 5 + pasteObj.attrs.x - firstShapeX,
                    y: stage.getStage().getPointerPosition().y - flow.attrs.y + 5 + pasteObj.attrs.y - firstShapeY,
                })
                pasteObj.children[0].setAttr('text', 'copy ' + pasteObj.children[0].attrs.text);
                ShapesClipboard.returnColorAfterSelect(pasteObj);
                flow.add(pasteObj);
                mainLayer.getStage().draw();

                // TODO: save copied flow to DB
                await iDBService.checkIsKeyExist(DataStorages.FLOW_BLOCKS, pasteObj._id)
                    .then(async res => {
                        if (!res) {
                            await iDBService.addData(DataStorages.FLOW_BLOCKS,
                                {
                                    id: pasteObj._id,
                                    boardId: flow._id,
                                    paletteElementId: pasteObj.attrs.name,
                                    location: {
                                        x: pasteObj.attrs.x,
                                        y: pasteObj.attrs.y,
                                    },
                                    formId: 1,
                                    name: pasteObj.attrs.label,
                                    state: DataState.ACTIVE,
                                    sizes: {
                                        width: pasteObj.attrs.width,
                                        height: pasteObj.attrs.height
                                    }
                                } as FlowBlock);

                            pasteObj.children.toArray().forEach(async elem => {
                                if (elem.attrs.type === CircleTypes.Input || elem.attrs.type === CircleTypes.Output || elem.attrs.type === CircleTypes.Error) {
                                    await iDBService.addData(DataStorages.FLOW_PORTS,
                                        {
                                            id: elem._id,
                                            type: elem.attrs.type,
                                            location: {
                                                x: elem.attrs.x,
                                                y: elem.attrs.y
                                            },
                                            flowBlockId: elem.parent._id,
                                            state: DataState.ACTIVE,
                                            colorId: 1
                                        } as FlowPort)
                                }
                            })
                        } else {
                            console.log(`ID: ${pasteObj._id} is allready exist.`);
                        }

                    });
                currentCopiedGroup.setAttr('visible', false);
            }
            blocksService.pushFlowboardsChanges();
            localNotificationService.sendLocalNotification(`Inserted`, NotificationTypes.OK);
        } else {
            localNotificationService.sendLocalNotification(`Choose place inside "${blocksService.getFlowboardName(pasteFlowId)}"`, NotificationTypes.ERROR);
        }
    }
}

export default ShapesClipboard;