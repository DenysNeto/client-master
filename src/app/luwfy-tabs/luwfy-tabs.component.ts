import { Component, OnInit } from '@angular/core';
import { RegistryService } from '../services/registry.service';

@Component({
  selector: 'luwfy-tabs',
  templateUrl: './luwfy-tabs.component.html',
  styleUrls: ['./luwfy-tabs.component.scss']
})
export class LufyTabsComponent implements OnInit {

  constructor(private RegistryService: RegistryService) { }

  tabs = [];
  active_tab = null;

  acivateTab(id) {
    this.RegistryService.acivateTab(id);
  }

  ngOnInit() {
    // listinging to all changes in tabs
    this.RegistryService.tabs.subscribe(tabs => {
      this.tabs = tabs;
    });
     // listinging to all changes in active tab
    this.RegistryService.activeTab.subscribe(tab_id => {
      this.active_tab = tab_id;
    });
  }

}
