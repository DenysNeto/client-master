import { Component, Inject, OnInit } from '@angular/core';
import { BlocksRedactorService } from '../blocks-redactor.service';
import { Group } from 'konva/types/Group';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material';

@Component({
  selector: 'app-modal-prop',
  templateUrl: './modal-prop.component.html',
  styleUrls: ['./modal-prop.component.scss']
})
export class ModalPropComponent implements OnInit {

  private tabs: Group[] = [];
  selected: number;

  constructor(private blocksRedactorService: BlocksRedactorService, @Inject(MAT_DIALOG_DATA) public data: any, private dialog: MatDialog) {
  }

  ngOnInit() {
    this.tabs = this.blocksRedactorService.getAllBlocks();
    let getIndex = this.tabs.findIndex(elem => elem._id === this.data);
    this.selected = getIndex > -1 ? getIndex : this.data;
  }

  onRemove(_id: number) {
    this.blocksRedactorService.removeBlock(_id);
    this.tabs = this.tabs.filter(elem => elem._id !== _id);
    if (this.tabs.length === 0) {
      this.dialog.closeAll();
    }
  }
}
