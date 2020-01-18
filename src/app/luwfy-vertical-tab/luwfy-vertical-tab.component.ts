import { Component, OnInit } from '@angular/core';
import { RegistryService } from '../services/registry.service';
import { BlocksService } from '../services/blocks.service';
import { ICurrentLineToDraw, InputBlocksInterface } from '../luwfy-canvas/shapes-interface';
import { BehaviorSubject, Subject } from 'rxjs';
import { CanvasService } from '../services/canvas.service';

@Component ( {
    selector   : 'luwfy-vertical-tab',
    templateUrl: './luwfy-vertical-tab.component.html',
    styleUrls  : [ './luwfy-vertical-tab.component.scss' ],
} )
export class LuwfyVerticalTabComponent implements OnInit {
    
    blocksArr: InputBlocksInterface[];
    
    constructor ( private registryService: RegistryService, private blocksService: BlocksService, private canvasService: CanvasService ) {
    }
    
    ngOnInit () {
        this.blocksArr = this.blocksService.getBlocks () as InputBlocksInterface[];
    }
    
    dragEvent ( event: any ) {
        let emptyImage = document.createElement ( 'img' );
        event.dataTransfer.setDragImage ( emptyImage, 0, 0 );
        this.registryService.setCurrentDraggableItem ( event.target.id );
    }
    
    dragFinish ( event: any ) {
        this.canvasService.dragFinished.next ( true );
        
    }
}
