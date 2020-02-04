import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ModalPropComponent} from './modal-prop/modal-prop.component';
import {MatDialogModule, MatIconModule, MatMenuModule, MatTabsModule} from '@angular/material';

@NgModule({
  declarations: [ModalPropComponent],
  imports: [
    CommonModule,
    MatDialogModule,
    MatTabsModule,
    MatMenuModule,
    MatIconModule
  ],
  exports: [MatDialogModule],
  entryComponents: [ModalPropComponent]
})
export class PopupsModule {
}
