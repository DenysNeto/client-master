import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { ICurrentLineToDraw } from '../luwfy-canvas/shapes-interface';

const apiUrl = "https://sandboxcrm.openax.com/fake-api";
// init
@Injectable({
  providedIn: 'root'
})

export class HttpClientService {
  //TODO  change interfaces
  httpResponsePayload: Subject<any> = new Subject<any>();

  constructor(private http: HttpClient) { }

  getInitialData() {
    //TODO  change interfaces
    this.http.get(`${apiUrl}/initStores`).subscribe((dataPayload: any) => {
      this.httpResponsePayload.next(dataPayload);
    }, error => {
      console.log('dataPayload INIT ERROR', error);
    });
  }

  getFlowData() {
    this.http.get(`${apiUrl}/flow`).subscribe((dataPayload: any) => {
      console.log('dataPayload FLOW', dataPayload);
      this.httpResponsePayload.next(dataPayload);
    }, error => {
      console.log('dataPayload INIT ERROR', error);
    });
  }
  getPaletteData() {
    this.http.get(`${apiUrl}/palette`).subscribe((dataPayload: any) => {
      this.httpResponsePayload.next(dataPayload);
    }, error => {
      console.log('dataPayload INIT ERROR', error);
    });
  }
}
