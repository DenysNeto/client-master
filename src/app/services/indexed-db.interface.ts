import { CircleTypes } from '../luwfy-canvas/shapes-interface';

export enum DataStorages {
    PALLETE_ELEMENTS = 'pallete_elements',
    FLOW_BLOCKS = 'flow_blocks',
    FLOW_PORTS = 'flow_ports',
    FLOW_RELATIONS = 'flow_relations',
    BOARDS = 'boards',
    EVENTS = 'events',
    FORMS = 'forms',
    CATEGORIES = 'categories',
    IMAGES = 'images',
    COLORS = 'colors'
}

export enum DataState {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    DELETED = 'deleted',
    HIDDEN = 'hidden'
}

export interface FlowBlock {
    id: number,
    boardId: number,
    paletteElementId: number,
    location: {
        x: number,
        y: number
    }
    formId: number,
    name: number,
    description: string,
    state: DataState,
    sizes: {
        width: number,
        height: number
    }
}

export interface FlowPort {
    id: number,
    type: CircleTypes,
    location: {
        x: number,
        y: number
    },
    flowBlockId: number,
    state: DataState,
    colorId: number
}

export interface FlowRelation {
    id: number,
    startPortId: number,
    endPortId: number,
    colorId: number,
    state: DataState,
    name: string,
    description: string
}

export interface Board {
    id: number,
    name: string,
    location: {
        x: number,
        y: number
    },
    state: DataState,
    description: string,
    colorId: number,
    imageId: number,
    formId: number,
    sizes: {
        width: number,
        height: number
    }
}

export interface PaletteElement {
    id: number,
    name: string,
    imageId: number,
    colorId: number,
    description: string,
    formId: number,
    state: DataState
}

export interface Form {
    id: number,
    keys: number,
    defaultValues: any,
    values: any,
    state: DataState
}

export interface Category {
    id: number,
    name: number,
    description: string,
    formId: number,
    state: DataState
}

export interface Image {
    id: number,
    name: string,
    description: string,
    state: DataState,
    formId: number
}

export interface Colors {
    id: number,
    name: string,
    value: any,
    description: string,
    formId: number,
    state: DataState
}