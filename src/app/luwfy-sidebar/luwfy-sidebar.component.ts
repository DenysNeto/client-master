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

  private flowboards;
  blocksArr: Group[] = [];

  constructor(private blocksService: BlocksService) {
  }

  ngOnInit() {
    this.flowboards = this.blocksService.getFlowboards();
  }

  getBlocks() {
    this.flowboards.forEach(flow => {
      flow.children.forEach(elem => {
        if (elem.attrs.type === GroupTypes.Block && elem.attrs.name === 'debug') {
          this.blocksArr.push(elem);
        }
      });
    });
  }

}
