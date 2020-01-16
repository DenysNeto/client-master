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
import {MatButtonModule} from '@angular/material';

@NgModule({
  declarations: [
    AppComponent,
    CanvasComponent,
    LufyTabsComponent,
    LuwfyVerticalTabComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    KonvaModule,
    BrowserAnimationsModule,
    PopupsModule,
    MatButtonModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
