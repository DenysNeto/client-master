import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-import-window',
  templateUrl: './import-window.component.html',
  styleUrls: ['./import-window.component.scss']
})
export class ImportWindowComponent implements OnInit {

  viewerData: string;
  dataToImport: string;

  constructor(public dialogRef: MatDialogRef<ImportWindowComponent>) { }

  ngOnInit() {
  }

  onGetFile(event) {
    let fReader = new FileReader();
    fReader.readAsText(event.target.files[0]);
    fReader.onloadend = event => this.setDataToViewer(event);
  }

  onChangeText(event) {
    this.dataToImport = event;
  }

  setDataToViewer(data) {
    this.viewerData = data.target.result;
  }

  onClose() {
    this.dialogRef.close();
  }
}
