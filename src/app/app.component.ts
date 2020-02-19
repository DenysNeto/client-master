import { Component } from '@angular/core';
import { RegistryService } from './services/registry.service';
import { IdbService } from './services/indexed-db.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {

  initInput = false;
  constructor(private RegistryService: RegistryService, private idbService: IdbService) {
  }

  ngOnInit() {



    this.idbService.dataInitializationFinished.subscribe(() => {
      setTimeout(() => { this.initInput = true }, 1000)
        ;

    })

  }

}



