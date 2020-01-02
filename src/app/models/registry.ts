export interface Registry {
	import()
}

export interface BlockType {
    type: string;
    category?: string;
    color?: string;
    inputs?: number;
    outputs?: number;
    icon?: string;
    align?: string;
    button?: object;
    credentials?: object;
    label?();
    outputLabels?();
    inputLabels?();
    oneditprepare?();
    paletteLabel?();
    oneditsave?();
    oneditcancel?();
    oneditdelete?();
    oneditresize?();
    onpaletteadd?();
    onpaletteremove?();
    defaults: {
	    // name: string;
	    // label: string;
	    // disabled: boolean;
	    // info: string;
    };
}

export interface Block {
	id: string;
	name: string;
	outputs: number;
	type: BlockType;
	wires: [];
	x: number;
	y: number;
	z: string;
}