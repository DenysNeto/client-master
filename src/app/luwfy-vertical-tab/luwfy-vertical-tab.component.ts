import {Component, OnInit} from '@angular/core';
import {RegistryService} from '../services/registry.service';
import {BlocksService} from '../services/blocks.service';
import {InputBlocksInterface} from '../luwfy-canvas/shapes-interface';

@Component({
  selector: 'luwfy-vertical-tab',
  templateUrl: './luwfy-vertical-tab.component.html',
  styleUrls: ['./luwfy-vertical-tab.component.scss']
})
export class LuwfyVerticalTabComponent implements OnInit {

  blocksArr: InputBlocksInterface[];

  constructor(private registryService: RegistryService, private blocksService: BlocksService) {
  }

  ngOnInit() {
    this.blocksArr = this.blocksService.getBlocks() as InputBlocksInterface[];
  }

  dragEvent(event: any) {
    let emptyImage = document.createElement('img');
    event.dataTransfer.setDragImage(emptyImage, 0, 0);
    this.registryService.setCurrentDraggableItem(event.target.id);
  }
}
