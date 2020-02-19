import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { KonvaModule } from 'ng2-konva';
import { CanvasComponent } from './luwfy-canvas/luwfy-canvas.component';
import { LufyTabsComponent } from './luwfy-tabs/luwfy-tabs.component';
import { LuwfyVerticalTabComponent } from './luwfy-vertical-tab/luwfy-vertical-tab.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PopupsModule } from './popups/popups.module';
import { LuwfySidebarComponent } from './luwfy-sidebar/luwfy-sidebar.component';
import { ClipboardModule } from 'ngx-clipboard';
import { LuwfyJsonEditorComponent } from './luwfy-sidebar/json-editor/luwfy-json-editor.component';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule } from '@angular/forms';
import { LocalNotificationComponent } from './popups/local-notification/local-notification.component';
import { HttpClientModule } from '@angular/common/http';
import { EditorCodeComponent } from './popups/editor-code/editor-code.component';

@NgModule({
  declarations: [
    AppComponent,
    CanvasComponent,
    LufyTabsComponent,
    LuwfyVerticalTabComponent,
    LuwfySidebarComponent,
    LuwfyJsonEditorComponent,
    LocalNotificationComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
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
