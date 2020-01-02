import {Component, OnInit} from '@angular/core';
import KonvaUtil from './konvaUtils';
import {RegistryService} from '../services/registry.service';
import {$} from 'protractor';

@Component({
  selector: 'luwfy-vertical-tab',
  templateUrl: './luwfy-vertical-tab.component.html',
  styleUrls: ['./luwfy-vertical-tab.component.scss']
})
export class LuwfyVerticalTabComponent implements OnInit {

  KonvaUtil = KonvaUtil;
  values: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

  constructor(private registryService: RegistryService) {


    // this.value  = Array(5).fill().map((x,i)=>i); // [0,1,2,3,4];


  }


  dragEvent(event: any) {
    let emptyImage = document.createElement('img');
    // emptyImage.style.height = '1';
    // emptyImage.style.width = '1';
    event.dataTransfer.setDragImage(emptyImage, 0, 0);
    // event.dataTransfer.dropEffect = "move" ;
    // $('html').addClass("draggable-cursor");
    // event.target.className = "draggable-cursor";
    // event.target.style.cursor = 'grab';
    // console.log('[c] event', event);
    this.registryService.setCurrentDraggableItem(event.target.id);



    // event.dataTransfer.setData('text', event.target.id);
  }



  ngOnInit() {
  }

}
