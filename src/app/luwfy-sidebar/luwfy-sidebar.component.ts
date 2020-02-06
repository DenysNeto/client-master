import { Component, OnInit } from '@angular/core';
import { BlocksService } from '../services/blocks.service';
import { GroupTypes } from '../luwfy-canvas/shapes-interface';
import { Group } from 'konva/types/Group';
import { ContainerKonvaSizes } from '../luwfy-canvas/sizes';

@Component({
  selector: 'app-luwfy-sidebar',
  templateUrl: './luwfy-sidebar.component.html',
  styleUrls: ['./luwfy-sidebar.component.scss']
})
export class LuwfySidebarComponent implements OnInit {

  flowboardsArr: Group[];
  blocksArr: Group[];
  debuggingBlock: Group[];

  constructor(private blocksService: BlocksService) {
  }

  ngOnInit() {
    this.blocksService.subjectArray.subscribe(data => {
      this.flowboardsArr = [];
      this.blocksArr = [];
      this.debuggingBlock = [];
      if (data) {
        this.flowboardsArr = data;
        this.flowboardsArr.forEach(flow => {
          flow.children.toArray().forEach(elem => {
            if (elem.attrs.type === GroupTypes.Block && elem.attrs.name === 'debug') {
              if (!this.getBlock(elem._id)) {
                this.blocksArr.push(elem as Group);
                this.addBlockOnDebuggingPanel();
              }
            }
          })
        })
      }
    });
  }

  getBlock(id) {
    return this.blocksArr.find(block => block._id === id);
  }

  addBlockOnDebuggingPanel() {
    this.debuggingBlock = [];
    this.blocksArr.forEach(block => {
      if (block.attrs.showOnPanel) {
        this.debuggingBlock.push(block);
      }
    });
  }

  focusOnBlock(block: Group) {
    let oldStrokeColor = block.findOne('Rect').attrs.stroke;
    let newX = block.getAbsolutePosition().x - (ContainerKonvaSizes.width / 2);
    let newY = block.getAbsolutePosition().y - (ContainerKonvaSizes.height / 2);
    block.getStage().content.parentElement.parentElement.parentElement.scroll(newX, newY);
    block.findOne('Rect').attrs.stroke = 'red';
    block.getLayer().draw();
    setTimeout(() => {
      block.findOne('Rect').attrs.stroke = oldStrokeColor;
      block.getLayer().draw();
    }, 300);
  }

  onShowAllBlocks() {
    this.flowboardsArr.forEach(flowboard => flowboard.attrs.showOnPanel = true);
    this.blocksArr.forEach(block => {
      block.attrs.showOnPanel = true;
    });
    this.addBlockOnDebuggingPanel();
  }

  onShowChoseOfBlock() {
    this.addBlockOnDebuggingPanel();
  }

  onShowChoseOfFlowboards(flowboard: Group) {
    flowboard.children.each(shape => {
      shape.attrs.showOnPanel = flowboard.attrs.showOnPanel;
    });
    this.addBlockOnDebuggingPanel();
  }
}
