import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-import-window',
  templateUrl: './import-window.component.html',
  styleUrls: ['./import-window.component.scss']
})
export class ImportWindowComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public selectedData: any, public dialogRef: MatDialogRef<ImportWindowComponent>) { }

  ngOnInit() {
  }

  onImport() {

  }

  onClose() {
    this.dialogRef.close();
  }
}
