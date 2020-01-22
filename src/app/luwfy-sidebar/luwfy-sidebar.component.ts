import {Component, OnInit} from '@angular/core';
import {BlocksService} from '../services/blocks.service';
import {GroupTypes} from '../luwfy-canvas/shapes-interface';
import {Group} from 'konva/types/Group';

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
    block.findOne('Rect').attrs.stroke = 'red';
    setTimeout(() => {
      block.findOne('Rect').attrs.stroke = oldStrokeColor;
    }, 200);

  }
}
