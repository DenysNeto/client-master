import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { CanvasService } from 'src/app/services/canvas.service';
import { ClipboardService } from 'ngx-clipboard';
import { LocalNotificationService, NotificationTypes } from '../local-notification/local-notification.service';

@Component({
  selector: 'app-export-window',
  templateUrl: './export-window.component.html',
  styleUrls: ['./export-window.component.scss']
})
export class ExportWindowComponent implements OnInit {

  private setting = {
    element: {
      dynamicDownload: null as HTMLElement
    }
  }
  selectedData: string;
  allProjectData: string;
  ifSelect: boolean;
  activeButton: boolean = false;
  viewerData: string = ''

  constructor(
    public dialogRef: MatDialogRef<ExportWindowComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private canvasService: CanvasService,
    private clipboardService: ClipboardService,
    private localNotificationService: LocalNotificationService
  ) { }

  ngOnInit() {
    this.selectedData = this.data.value;
    this.ifSelect = this.data.ifSelect;
    Promise.all(this.canvasService.getAllDataFromIdb()).then(res => {
      let objectsArray = [];
      res.forEach(array => array.forEach(value => objectsArray.push(value)));
      this.allProjectData = JSON.stringify(objectsArray, null, 2);
      if (!this.ifSelect) {
        this.onExportAllProject();
      } else {
        this.viewerData = this.selectedData;
      }
    })
  }

  onExportAllProject() {
    this.activeButton = !this.activeButton;
    this.viewerData = this.allProjectData;
  }

  onExportSelectedData() {
    this.activeButton = !this.activeButton;
    this.viewerData = this.selectedData;
  }

  onCopy() {
    this.clipboardService.copyFromContent(this.viewerData);
    this.localNotificationService.sendLocalNotification(`Copied to clipboard`, NotificationTypes.INFO);
    this.dialogRef.close();
  }

  onDownload() {
    this.dyanmicDownloadByHtmlTag({
      fileName: 'export.json',
      text: this.viewerData
    })
  }

  private dyanmicDownloadByHtmlTag(arg: {
    fileName: string,
    text: string
  }) {
    if (!this.setting.element.dynamicDownload) {
      this.setting.element.dynamicDownload = document.createElement('a');
    }
    const element = this.setting.element.dynamicDownload;
    const fileType = arg.fileName.indexOf('.json') > -1 ? 'text/json' : 'text/plain';
    element.setAttribute('href', `data:${fileType};charset=utf-8,${encodeURIComponent(arg.text)}`);
    element.setAttribute('download', arg.fileName);
    let event = new MouseEvent("click");
    element.dispatchEvent(event);
  }

  onClose() {
    this.dialogRef.close();
  }
}
