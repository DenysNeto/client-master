import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, BehaviorSubject } from 'rxjs';
import { ICurrentLineToDraw } from '../luwfy-canvas/shapes-interface';


const apiUrl = "https://sandboxcrm.openax.com/fake-api/";
// init
@Injectable({
  providedIn: 'root'
})



export class HttpClientService {

  //TODO  change interfaces
  httpResponsePayload: Subject<any> = new Subject<any>();




  constructor(private http: HttpClient) { 

  }

  getInitialData() {
    //TODO  change interfaces
    this.http.get(`${apiUrl}/init`).subscribe((dataPayload:any) => {
      console.log('dataPayload INIT', dataPayload);
      this.httpResponsePayload.next(dataPayload);
    });
  }

  getFlowData() {
    return this.http.get(`${apiUrl}/flow`).subscribe((dataPayload: any) => {
      console.log('dataPayload FLOW', dataPayload);
      this.httpResponsePayload.next(dataPayload);
    });
  }
  getPaletteData() {
    return this.http.get(`${apiUrl}/palette`).subscribe((dataPayload:any) => {
      console.log('dataPayload PALETTE', dataPayload);
      this.httpResponsePayload.next(dataPayload);
    });
  }





}
