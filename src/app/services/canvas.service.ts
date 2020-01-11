import { Injectable } from '@angular/core';
import { StageComponent } from 'ng2-konva';
import { Group } from 'konva/types/Group';
import Konva from 'konva';
import {
    CircleTypes,
    IActiveWrapperBlock,
    ICircleCustom,
    ICurrentLineToDraw,
    IGroupCustom, IPathCustom,
} from '../luwfy-canvas/shapes-interface';
import ShapeCreator from '../luwfy-canvas/ShapesCreator';
import { ShapesSizes as sizes } from '../luwfy-canvas/sizes';
import { theme } from '../luwfy-canvas/theme';
import KonvaUtil from '../luwfy-canvas/konva-util';
import { Layer } from 'konva/types/Layer';
import { Shape, ShapeConfig } from 'konva/types/Shape';
import { Stage } from 'konva/types/Stage';
import { BehaviorSubject, Subject } from 'rxjs';
import { Collection } from 'konva/types/Util';
import { Path } from 'konva/types/shapes/Path';

@Injectable ( {
    providedIn: 'root',
} )
export class CanvasService {
    
    currentLineToDraw: ICurrentLineToDraw = {
        isLineDrawable: false,
        groupId       : 0,
        lineId        : 0,
        line          : new Konva.Path ( {
            attached   : false,
            width      : 1,
            height     : 1,
            strokeWidth: 3,
            opacity    : 1,
            data       : '',
            stroke     : '#999',
        } ),
        prevX         : 0,
        prevY         : 0,
        prevMainX     : 0,
        prevMainY     : 0,
        positionStart : {
            x: 0, y: 0,
        },
        positionEnd   : {
            x: 0, y: 0,
        },
        
        swapOrientation: () => {
            this.currentLineToDraw.positionStart = { x: this.currentLineToDraw.prevX, y: this.currentLineToDraw.prevY };
            this.currentLineToDraw.positionEnd   = {
                x: this.currentLineToDraw.prevMainX,
                y: this.currentLineToDraw.prevMainY,
            };
        },
    };
    
    activeWrapperBlock: IActiveWrapperBlock = {
        
        initial_position: {
            x: 0,
            y: 0,
        },
        now_position    : {
            x: 0, y: 0,
        },
        
        isActive : false,
        isDraw   : false,
        rectangle: new Konva.Rect ( {
            stroke        : 'blue',
            draggable     : false,
            isActive_block: true,
        } ),
        
    };
    
    lineToDraw: Subject<ICurrentLineToDraw>   = new BehaviorSubject<ICurrentLineToDraw> ( this.currentLineToDraw );
    activeBlock: Subject<IActiveWrapperBlock> = new BehaviorSubject<IActiveWrapperBlock> ( this.activeWrapperBlock );
    
    constructor () {
    
    }
    
    deleteShapesFromGroup = ( mainLayer: Layer, currentActiveGroup: any ) => {
        
        let group_children_temp = currentActiveGroup.children;
        
        if ( group_children_temp.length > 0 ) {
            while ( group_children_temp.length ) {
                group_children_temp[ group_children_temp.length - 1 ].children.each ( ( elem ) => {
                    if ( elem.className !== 'Path' ) {
                        elem.setAttr ( 'stroke', theme.rect_border );
                    }
                } );
                group_children_temp[ group_children_temp.length - 1 ].setAttr ( 'draggable', true );
                group_children_temp[ group_children_temp.length - 1 ].setAttr ( 'x',
                    group_children_temp[ group_children_temp.length - 1 ].position ().x + currentActiveGroup.position ().x );
                group_children_temp[ group_children_temp.length - 1 ].setAttr ( 'y',
                    group_children_temp[ group_children_temp.length - 1 ].position ().y + currentActiveGroup.position ().y );
                mainLayer.getStage ().add ( group_children_temp[ group_children_temp.length - 1 ] );
            }
            
            currentActiveGroup.removeChildren ();
            mainLayer.getStage ().draw ();
            
        }
        
    };
    
    setRegularGroupHandlers ( group: IGroupCustom, mainLayer: Layer, activeWrapperBlock: IActiveWrapperBlock, currentActiveGroup: Group ) {
        this.setDragGroupEvents ( group, mainLayer, currentActiveGroup );
        this.setMouseMoveEvents ( group, mainLayer, activeWrapperBlock );
        //  this.setClickEvent(group, mainLayer, activeWrapperBlock, this.currentActiveGroup)
    }
    
    setMouseMoveEvents ( group: IGroupCustom, mainLayer: Layer, activeWrapperBlock: IActiveWrapperBlock ) {
        
        //todo add switch for different types of groups
        
        group.on ( 'mousedown', ( event ) => {
            activeWrapperBlock.isActive = false;
            activeWrapperBlock.isDraw   = false;
            activeWrapperBlock.rectangle.setAttr ( 'visible', false );
        } );
        
        group.on ( 'mouseup', ( event ) => {
            
            if ( this.currentLineToDraw.isLineDrawable ) {
                let input_circle = this.getInputCircleFromGroup ( event.target as Group );
                
                let current_path_group = this.getGroupById ( this.currentLineToDraw.groupId, mainLayer.getStage () );
                
                current_path_group.setAttr ( 'draggable', 'true' );
                
                let current_path = current_path_group.findOne ( ( elem ) => {
                    if ( elem.className === 'Path' && elem.attrs.start_info.start_group_id === this.currentLineToDraw.groupId && elem._id === this.currentLineToDraw.lineId ) {
                        return elem;
                    }
                } );
                
                //event.target.zIndex(1);
                
                let start_circle = current_path_group.findOne ( ( elem ) => {
                    if ( current_path.attrs.start_info && elem._id === current_path.attrs.start_info.start_circle_id ) {
                        return elem;
                        
                    }
                    
                } );
                let deltaX       = event.target.parent.attrs.x - current_path_group.attrs.x;
                let deltaY       = event.target.parent.attrs.y - current_path_group.attrs.y;
                
                current_path.setAttr ( 'data', KonvaUtil.generateLinkPath ( start_circle.attrs.x, start_circle.attrs.y,
                    event.target.parent.attrs.x - current_path_group.attrs.x,
                    event.target.parent.attrs.y - current_path_group.attrs.y + input_circle.attrs.y, this.setParamForLine ( deltaX, deltaY ) ) );
                
                console.log ( '[c] current_path eee', current_path );
                
                current_path.setAttr ( 'custom_id_output', event.target._id );
                
                current_path.setAttr ( 'end_info', {
                    end_group_id : event.target.parent._id,
                    end_circle_id: input_circle._id,
                } );
                
                if ( !current_path.attrs.end_info || current_path.attrs.start_info.start_group_id === current_path.attrs.end_info.end_group_id ) {
                    console.log ( '[c] removing' );
                    current_path.remove ();
                }
                
                this.currentLineToDraw.isLineDrawable = false;
                this.lineToDraw.next ( this.currentLineToDraw );
                console.log ( '[c] CANVAS', current_path );
                // event.target.parent.draw();
                return 0;
                
            }
            
        } );
        
        group.on ( 'mouseenter', ( event ) => {
            if ( event.target.parent.attrs.type && event.target.parent.attrs.type.includes ( 'output' ) ) {
                if ( this.currentLineToDraw.isLineDrawable ) {
                    let current_circle = this.getCircleFromGroup ( event.target.parent as Group );
                    current_circle.setAttr ( 'fill', theme.circle_background_output );
                }
            }
        } );
        
        group.on ( 'mouseleave', ( event ) => {
            if ( event.target.parent.attrs.type && event.target.parent.attrs.type.includes ( 'output' ) ) {
                if ( this.currentLineToDraw.isLineDrawable ) {
                    let current_circle = this.getCircleFromGroup ( event.target.parent as Group );
                    
                }
                
            }
        } );
        
    }
    
    setMouseDownEventForSwitchCircle ( circle: ICircleCustom, mainLayer: Layer ) {
        
        circle.on ( 'mousedown', ( event ) => {
            
            if ( event.target.attrs.type === CircleTypes.Output ) {
                
                let line_temp = ShapeCreator.createLine ( {
                    start_circle_id: event.target._id,
                    start_group_id : event.target.parent._id,
                } );
                
                this.setClickEventForPath ( line_temp );
                
                event.target.parent.add ( line_temp );
                
                event.target.parent.setAttr ( 'draggable', false );
                
                this.currentLineToDraw.isLineDrawable = true;
                this.currentLineToDraw.lineId         = line_temp._id;
                this.currentLineToDraw.groupId        = event.target.parent._id;
                
                console.log ( '[c] circle inside', event.target );
                
                this.currentLineToDraw.prevX = event.target.parent.attrs.x + event.target.attrs.x + 20;
                this.currentLineToDraw.prevY = event.target.parent.attrs.y + event.target.attrs.y;
                
                this.lineToDraw.next ( this.currentLineToDraw );
            }
            
        } );
    }
    
    setClickEventForPath ( path: Path ) {
        path.on ( 'click', ( event ) => {
            console.log ( '[c] click path', event );
            //todo add chooser
            //
            
        } );
        
    }
    
    getInputCircleFromGroup ( component: Group | IGroupCustom ) {
        if ( component ) {
            return component.getStage ().findOne ( ( elem ) => {
                if ( elem.className == 'Circle' || elem.attrs.type === CircleTypes.Input ) {
                    return elem;
                }
                
            } );
            
        } else {
            return null;
        }
        
    }
    
    setClickEvent ( group: IGroupCustom, mainLayer: Layer, activeWrapperBlock: IActiveWrapperBlock, currentActiveGroup: Group ) {
        
        group.on ( 'click', ( event ) => {
            
            event.cancelBubble = true;
            
            if ( event.evt.ctrlKey ) {
                
                event.target.parent.setAttr ( 'x', event.target.parent.position ().x - currentActiveGroup.position ().x );
                event.target.parent.setAttr ( 'y', event.target.parent.position ().y - currentActiveGroup.position ().y );
                
                currentActiveGroup.add ( event.target.parent as Group );
                event.target.parent.children.each ( ( elem ) => {
                    elem.setAttr ( 'stroke', 'yellow' );
                    elem.setAttr ( 'draggable', false );
                    
                } );
                event.target.parent.setAttr ( 'draggable', false );
                
            }
            
        } );
        
    }
    
    setParamForLine ( deltaX: number, deltaY: number ) {
        
        if ( deltaX < 0 ) {
            return 3;
        }
        
        // if ( deltaX < 180 ) {
        //     return 1;
        // }
        
        if ( deltaX < 280 ) {
            return 1;
        } else return 3;
        
    }
    
    setDragGroupEvents ( group: IGroupCustom, mainLayer: Layer, currentActiveGroup ) {
        //todo add switch for different types of groups
        
        group.on ( 'dragstart', ( event ) => {
            if ( this.currentLineToDraw.isLineDrawable ) {
                return 0;
            }
            
            if ( currentActiveGroup.isDraw ) {
                this.deleteShapesFromGroup ( mainLayer, currentActiveGroup );
            }
            this.activeWrapperBlock.isDraw = false;
            this.activeWrapperBlock.rectangle.setAttr ( 'visible', false );
            this.activeBlock.next ( this.activeWrapperBlock );
            
        } );
        group.on ( 'dragmove', ( event ) => {
            if ( !event ) {
                return 0;
            }
            
            let isPathInGroup = this.isPathInGroup ( event.target );
            
            let input_paths: Array<IPathCustom> = this.getAllInputLinesFromGroup ( mainLayer, event.target as Group | IGroupCustom );
            if ( isPathInGroup || input_paths ) {
                
                let output_paths: Collection<IPathCustom> = this.getAllOutputLinesFromGroup ( event.target as Group | IGroupCustom );
                
                if ( output_paths ) {
                    
                    output_paths.each ( ( elem ) => {
                        
                        //start point
                        let temp_start_point_group = this.getGroupById ( elem.attrs.end_info.end_group_id, mainLayer.getStage () );
                        let temp_end_point_circle  = this.getCircleFromGroupById ( event.target.getStage (), elem.attrs.start_info.start_circle_id );
                        
                        let temp_start_circle = this.getCircleFromGroupById ( temp_start_point_group, elem.attrs.end_info.end_circle_id );
                        
                        //end point
                        
                        let deltaX = temp_start_point_group.getAbsolutePosition ().x - event.target.attrs.x + temp_start_circle.attrs.x - temp_end_point_circle.attrs.x;
                        let deltaY = temp_start_point_group.getAbsolutePosition ().y - event.target.attrs.y + temp_start_circle.attrs.y - temp_end_point_circle.attrs.y;
                        console.log ( 'DELTA_1', temp_start_point_group.getAbsolutePosition ().x - event.target.attrs.x + temp_start_circle.attrs.x - temp_end_point_circle.attrs.x );
                        console.log ( 'DELTA_2', temp_start_point_group.getAbsolutePosition ().y - event.target.attrs.y + temp_start_circle.attrs.y - temp_end_point_circle.attrs.y );
                        // this.setParamForLine ( deltaX, deltaY );
                        
                        elem.setAttr ( 'data',
                            KonvaUtil.generateLinkPath ( temp_start_point_group.getAbsolutePosition ().x - event.target.attrs.x + temp_start_circle.attrs.x,
                                temp_start_point_group.getAbsolutePosition ().y - event.target.attrs.y + temp_start_circle.attrs.y,
                                temp_end_point_circle.attrs.x, temp_end_point_circle.attrs.y, (-1) * this.setParamForLine ( deltaX, deltaY ) ) );
                        
                    } );
                    
                }
                
                if ( input_paths ) {
                    
                    console.log ( '[c] input_path' );
                    input_paths.forEach ( ( elem ) => {
                        
                        //start point
                        let temp_start_point_group = this.getGroupById ( elem.attrs.start_info.start_group_id, mainLayer.getStage () );
                        let temp_end_point_circle  = this.getCircleFromGroupById ( event.target.getStage (), elem.attrs.end_info.end_circle_id );
                        
                        let temp_start_point_circle = this.getCircleFromGroupById ( event.target.getStage (), elem.attrs.start_info.start_circle_id );
                        
                        let temp_start_circle = this.getCircleFromGroupById ( temp_start_point_group, elem.attrs.start_info.start_circle_id );
                        
                        let temp_input_circle = event.target.getStage ().findOne ( ( elem ) => {
                            if ( elem.className === 'Circle' && elem.attrs.type === CircleTypes.Input ) {
                                return elem;
                            }
                        } );
                        console.log ( '[c] i', event.target );
                        
                        let deltaX = event.target.attrs.x - temp_start_point_group.attrs.x;
                        let deltaY = temp_start_point_group.getAbsolutePosition ().y - temp_start_point_group.attrs.y + temp_start_circle.attrs.y;
                        // this.setParamForLine (deltaX, deltaY );
                        console.log ( '[c] DELTA_INPUT_X', deltaX );
                        console.log ( '[c] DELTA_INPUT_Y', deltaY );
                        
                        elem.setAttr ( 'data',
                            KonvaUtil.generateLinkPath ( temp_start_point_group.getAbsolutePosition ().x - temp_start_point_group.attrs.x + temp_start_circle.attrs.x,
                                temp_start_point_group.getAbsolutePosition ().y - temp_start_point_group.attrs.y + temp_start_circle.attrs.y,
                                event.target.attrs.x - temp_start_point_group.attrs.x, event.target.attrs.y - temp_start_point_group.attrs.y + temp_input_circle.attrs.y, this.setParamForLine ( deltaX, deltaY ) ) );
                    } );
                    
                }
                
            }
            
        } );
        
    }
    
    setRegularGroupEvents ( group: IGroupCustom ) {
        
        //group
        
    }
    
    createOutputPorts ( number_of_ports: number, temp_group: Group, height: number ) {
        
        if ( number_of_ports === 1 ) {
            temp_group.add ( ShapeCreator.createCircleOutput ( height / 2 ) );
            
        } else if ( number_of_ports === 2 ) {
            temp_group.add ( ShapeCreator.createCircleOutput ( 25 ) );
            temp_group.add ( ShapeCreator.createCircleOutput ( 55 ) );
        } else if ( number_of_ports >= 3 ) {
            let a           = (number_of_ports - 1);
            let margin_temp = (height - a * 30) / 2 - 10;
            let y;
            for ( let i = 0; i < number_of_ports; ) {
                i++;
                if ( i == 1 ) {
                    y = margin_temp + 10;
                    console.log ( '[c] ddd ', y );
                    let temp_circle = ShapeCreator.createCircleOutput ( y );
                    temp_group.add ( temp_circle );
                    temp_circle.zIndex ( 1 );
                    
                } else {
                    y               = margin_temp + i * (20) + (i - 2) * 10;
                    let temp_circle = ShapeCreator.createCircleOutput ( y );
                    temp_group.add ( temp_circle );
                    temp_circle.zIndex ( 1 );
                }
                
            }
        }
        
    };
    
    getAllInputLinesFromGroup ( component: Layer, group: Group | IGroupCustom ): Array<IPathCustom> {
        
        let collection_ports: Array<IPathCustom> = [];
        let all_groups                           = component.getStage ().find ( ( elem ) => {
            if ( !elem.className ) {
                return elem;
                // return elem.find((elem) => {
                //   if (elem.className === 'Path' && elem.attrs.end_info.group_id === group._id) {
                //     return elem;
                //   }
                // });
            }
        } );
        all_groups.each ( ( elem ) => {
            
            elem.getStage ().find ( ( elem ) => {
                if ( elem.className === 'Path' && elem.attrs.end_info && elem.attrs.end_info.end_group_id === group._id ) {
                    collection_ports.push ( elem );
                }
            } );
            
        } );
        console.log ( '[c] ppp', collection_ports );
        return collection_ports;
        
    }
    
    getActiveBlock ( mainLayer: Layer ) {
        return mainLayer.findOne ( ( elem ) => {
            if ( elem.attrs.isActive_block ) {
                return elem;
            }
        } );
        
    }
    
    getAllOutputLinesFromGroup ( group: Group | IGroupCustom ): Collection<IPathCustom> {
        return group.find ( ( elem ) => {
            console.log ( '[c] elem ppp', elem );
            if ( elem.className === 'Path' ) {
                return elem;
            }
            
        } );
        
    };
    
    createDefaultGroup ( number_of_ports: number, mainLayer: Layer, activeWrapperBlock, currentActiveGroup: Group ) {
        
        let temp_group = new Konva.Group ( {
            draggable: true,
            number_of_ports,
        } ) as IGroupCustom;
        
        let height;
        
        if ( number_of_ports >= 3 ) {
            height = sizes.block_height + (number_of_ports - 1) * 30;
        } else {
            height = sizes.block_height;
        }
        
        temp_group.add ( ShapeCreator.createCircleInput ( height / 2 ) );
        
        temp_group.add ( ShapeCreator.createRect ( theme.rect_switch_stroke, height ) );
        
        this.createOutputPorts ( number_of_ports, temp_group, height );
        
        let circles_collection = this.getAllCirclesFromGroup ( temp_group );
        
        circles_collection && circles_collection.each ( ( elem: ICircleCustom ) => {
            
            elem.setAttr ( 'zIndex', 1000 );
            this.setMouseDownEventForSwitchCircle ( elem, mainLayer );
        } );
        
        this.setRegularGroupHandlers ( temp_group, mainLayer, activeWrapperBlock, currentActiveGroup );
        return temp_group;
        
    }
    
    getAllCirclesFromGroup ( component: Group | IGroupCustom ) {
        if ( component ) {
            return component.find ( ( elem ) => {
                if ( elem.className == 'Circle' ) {
                    return elem;
                }
                
            } );
            
        } else {
            return null;
        }
        
    }
    
    getGroupById ( id: number, component: StageComponent ) {
        if ( component ) {
            console.log ( '[c] current group id', id );
            return component.getStage ().findOne ( ( elem ) => {
                
                if ( elem._id === id ) {
                    return elem;
                }
                
            } );
            
        } else {
            return null;
        }
        
    }
    
    getLastPathFromGroup = ( component: Group ) => {
        
        if ( component ) {
            return component.find ( ( elem ) => {
                if ( elem.className == 'Path' && elem.attrs.last_path ) {
                    return elem;
                }
                
            } );
            
        } else {
            return null;
        }
        
    };
    
    getAllPathsFromGroup = ( component: Group ) => {
        
        if ( component ) {
            return component.find ( ( elem ) => {
                if ( elem.className == 'Path' ) {
                    return elem;
                }
                
            } );
            
        } else {
            return null;
        }
        
    };
    
    getRectFromGroup ( component: IGroupCustom ) {
        if ( component ) {
            
            return component.getStage ().findOne ( ( elem ) => {
                console.log ( '[c]', elem.className === 'Rect' );
                
                if ( elem.className === 'Circle' ) {
                    return elem;
                }
            } );
        } else {
            return null;
        }
    }
    
    getCircleFromGroupById ( component: Group, circle_id: number ) {
        if ( component ) {
            
            return component.getStage ().findOne ( ( elem ) => {
                if ( elem.className === 'Circle' && elem._id === circle_id ) {
                    return elem;
                }
            } );
        } else {
            return null;
        }
        
    }
    
    getCircleFromGroup ( component: Group ) {
        if ( component ) {
            
            return component.findOne ( ( elem ) => {
                //  console.log('bbbb', elem.className);
                console.log ( '[c]', elem.className === 'Circle' );
                
                if ( elem.className === 'Circle' ) {
                    return elem;
                }
            } );
        } else {
            return null;
        }
    }
    
    getAllPathsConnectedWithBlock () {
    
    }
    
    getPathFromGroup ( component: StageComponent | any ) {
        if ( component ) {
            return component.findOne ( ( elem ) => {
                if ( elem.className === 'Path' ) {
                    return elem;
                }
            } );
        } else {
            return null;
        }
    }
    
    isPathInGroup ( component: Shape<ShapeConfig> | Stage ) {
        if ( component ) {
            let temp = this.getPathFromGroup ( component );
            return !!temp;
        } else {
            return false;
        }
        
    }
}
