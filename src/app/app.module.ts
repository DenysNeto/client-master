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
import {MatButtonModule, MatMenuModule, MatTabsModule} from '@angular/material';
import { LuwfySidebarComponent } from './luwfy-sidebar/luwfy-sidebar.component';

@NgModule({
  declarations: [
    AppComponent,
    CanvasComponent,
    LufyTabsComponent,
    LuwfyVerticalTabComponent,
    LuwfySidebarComponent
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        KonvaModule,
        BrowserAnimationsModule,
        PopupsModule,
        MatButtonModule,
        MatTabsModule,
        MatMenuModule
    ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
