import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalPropComponent } from './modal-prop/modal-prop.component';
import { MatDialogModule, MatIconModule, MatMenuModule, MatTabsModule } from '@angular/material';
import { ImportWindowComponent } from './import-window/import-window.component';
import { ExportWindowComponent } from './export-window/export-window.component';

@NgModule({
  declarations: [ModalPropComponent, ImportWindowComponent, ExportWindowComponent],
  imports: [
    CommonModule,
    MatDialogModule,
    MatTabsModule,
    MatMenuModule,
    MatIconModule
  ],
  exports: [MatDialogModule],
  entryComponents: [ModalPropComponent, ImportWindowComponent, ExportWindowComponent]
})
export class PopupsModule {
}
