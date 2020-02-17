import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { ICurrentLineToDraw } from '../luwfy-canvas/shapes-interface';

import { Subject, BehaviorSubject } from 'rxjs';
import { IdbService } from './indexed-db.service';
// project  id key in localStorage
const PROJECT_ID_KEY = "projectId";
const apiUrl = "https://sandboxcrm.openax.com/luwfy";
const temporaryProjectIdToPost = "2fcd2d98-8f2b-4e8e-b100-6164e7cb791a";
// init
@Injectable({
  providedIn: 'root'
})

export class HttpClientService {
  //TODO  change interfaces
  httpResponsePayload: Subject<any> = new Subject<any>();




  constructor(private http: HttpClient, private idbService: IdbService) {

  }

  getInitialData() {
    let currentProjectId = localStorage.getItem(PROJECT_ID_KEY);
    if (currentProjectId) {
      this.getInitialDataByProjectId(currentProjectId)
    }
    else {
      this.getDefaultInitialData();
    }
  }



  //when the application doesn't has id we got default(initial)  data
  getDefaultInitialData() {
    this.http.get(`${apiUrl}/defaultInstance`).subscribe((dataPayload: any) => {
      if (dataPayload) {
        localStorage.setItem(PROJECT_ID_KEY, `${dataPayload.id}`);
        console.log("getDefaultInitialData", dataPayload.json_b.stores);
        this.httpResponsePayload.next(dataPayload.json_b.stores);
      }


    }, error => {
      console.log('dataPayload GET_DEFAULT_INITIAL_DATA_ERROR', error);

    });


  }
  //when the application  has id we got last updated data from server
  getInitialDataByProjectId(projectId: string) {
    //TODO  change interfaces
    this.http.get(`${apiUrl}/instance/${temporaryProjectIdToPost}`).subscribe((dataPayload: any) => {
      console.log('[GET_INITIAL_DATA_BY_PROJECT_ID]', dataPayload);
      if (dataPayload) {
        this.httpResponsePayload.next(dataPayload.json_b.stores);
        console.log("getInitialDataByProjectId", dataPayload.json_b.stores);
        this.httpResponsePayload.next(dataPayload.json_b.stores);
      }

    }, error => {
      console.log('dataPayload GET_INITIAL_DATA_BY_PROJECT_ID', error);

    });
  }

  // getFlowData() {
  //   this.http.get(`${apiUrl}/flow`).subscribe((dataPayload: any) => {
  //     console.log('dataPayload FLOW', dataPayload);
  //     this.httpResponsePayload.next(dataPayload);
  //   }, error => {
  //     console.log('dataPayload INIT ERROR', error);
  //
  //   });
  // }
  // getPaletteData() {
  //   this.http.get(`${apiUrl}/palette`).subscribe((dataPayload: any) => {
  //
  //     console.log('dataPayload PALETTE', dataPayload);
  //     this.httpResponsePayload.next(dataPayload);
  //   }, error => {
  //     console.log('dataPayload INIT ERROR', error);
  //
  //   });
  // }

  async createDeployPayload() {
    let deployPayload = {
      stores: {

      }
    };
    let storesCollection = await this.idbService.getAllDataObjectsFromDatabase();
    // console.log("storeCollection", storesCollection.length, storesCollection[0],
    //   storesCollection[1], storesCollection[2], storesCollection[3],
    //   storesCollection[4], storesCollection[5], storesCollection[6],
    //   storesCollection[7], storesCollection[8], storesCollection[9], storesCollection[10]);
    if (storesCollection) {

      for (let i = 0; i < storesCollection.length; i++) {
        let currentStoreValues = await this.idbService.getAllData(storesCollection[i])
        deployPayload.stores[storesCollection[i]] = [];
        console.log('[c] VVv');
        currentStoreValues.forEach(currentStoreValue => {
          deployPayload.stores[storesCollection[i]].push(currentStoreValue);
        })
      }
      return deployPayload;
      //console.log('DEPLOY_PAYLOAD', deployPayload);
      // storesCollection.item(objectStore => {
      //   console.log('currentStoreValues', objectStore);
      //   let currentStoreValues = this.idbService.getAllData(objectStore);
      //   console.log('currentStoreValues', currentStoreValues);
      // deployPayload.stores.objectStore.push()

    }
  }


  async  postDataOnDeploy() {
    let currentProjectId = localStorage.getItem(PROJECT_ID_KEY);
    let indexedDbStoragePayload = await this.createDeployPayload();

    if (currentProjectId) {
      this.postDataOnDeployWithProjectId(indexedDbStoragePayload, currentProjectId)
    }
    else {
      this.postDataOnDeployWithoutProjectId(indexedDbStoragePayload);
    }
  }

  postDataOnDeployWithProjectId(postDatapayload, projectId) {
    this.http.post(`${apiUrl}/instance/${temporaryProjectIdToPost}`, postDatapayload).subscribe((dataPayload: any) => {
      console.log('[postDataOnDeployWithProjectId] dataPayload', dataPayload)
    }, error => console.log('ERROR_POST_DATA_ON_DEPLOY_WITH_PROJECT', error))

  }

  postDataOnDeployWithoutProjectId(postDataPayload) {
    this.http.post(`${apiUrl}/instance/`, postDataPayload).subscribe((dataPayload: any) => {
      console.log('[postDataOnDeployWithoutProjectId] dataPayload', dataPayload)
    }, error => console.log('ERROR_POST_DATA_ON_DEPLOY_WITHOUT_PROJECT', error))
  }



}
