import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {KonvaModule} from 'ng2-konva';
import {CanvasComponent} from './luwfy-canvas/luwfy-canvas.component';
import {LufyTabsComponent} from './luwfy-tabs/luwfy-tabs.component';
import {LuwfyVerticalTabComponent} from './luwfy-vertical-tab/luwfy-vertical-tab.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {PopupsModule} from './popups/popups.module';
import {LuwfySidebarComponent} from './luwfy-sidebar/luwfy-sidebar.component';
import {ClipboardModule} from 'ngx-clipboard';
import {LuwfyJsonEditorComponent} from './luwfy-sidebar/json-editor/luwfy-json-editor.component';
import {EditorCodeComponent} from './editor-code/editor-code.component';
import {CodemirrorModule} from '@ctrl/ngx-codemirror';
import {MaterialModule} from 'src/app/material.module';
import {FormsModule} from '@angular/forms';
import { LocalNotificationComponent } from './popups/local-notification/local-notification.component';

@NgModule({
  declarations: [
    AppComponent,
    CanvasComponent,
    LufyTabsComponent,
    LuwfyVerticalTabComponent,
    LuwfySidebarComponent,
    LuwfyJsonEditorComponent,
    EditorCodeComponent,
    LocalNotificationComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    KonvaModule,
    BrowserAnimationsModule,
    PopupsModule,
    ClipboardModule,
    CodemirrorModule,
    MaterialModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
