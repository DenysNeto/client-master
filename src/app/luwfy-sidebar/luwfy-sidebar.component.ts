import {Component, OnInit, ViewChild} from '@angular/core';
import {BlocksService} from '../services/blocks.service';
import {GroupTypes} from '../luwfy-canvas/shapes-interface';
import {Group} from 'konva/types/Group';
import {ContainerKonvaSizes} from '../luwfy-canvas/sizes';

@Component({
  selector: 'app-luwfy-sidebar',
  templateUrl: './luwfy-sidebar.component.html',
  styleUrls: ['./luwfy-sidebar.component.scss']
})
export class LuwfySidebarComponent implements OnInit {

  blocksArr: Group[] = [];

  constructor(private blocksService: BlocksService) {
  }

  ngOnInit() {
    this.blocksService.subjectArray.subscribe(data => data.forEach(flow => {
      flow.children.forEach(elem => {
        if (elem.attrs.type === GroupTypes.Block && elem.attrs.name === 'debug') {
          if (!this.getBlock(elem._id)) {
            this.blocksArr.push(elem);
          }
        }
      });
    }));
  }

  getBlock(id) {
    return this.blocksArr.find(block => block._id === id);
  }

  focusOnBlock(block: Group) {
    let oldStrokeColor = block.findOne('Rect').attrs.stroke;
    let newX = block.getAbsolutePosition().x - (ContainerKonvaSizes.width / 2);
    let newY = block.getAbsolutePosition().y - (ContainerKonvaSizes.height / 2);
    block.getStage().content.parentElement.parentElement.scroll(newX, newY);
    block.findOne('Rect').attrs.stroke = 'red';
    block.getLayer().draw();
    setTimeout(() => {
      block.findOne('Rect').attrs.stroke = oldStrokeColor;
      block.getLayer().draw();
    }, 300);
  }
}
