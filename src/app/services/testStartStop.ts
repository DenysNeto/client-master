import {Injectable} from '@angular/core';

export interface TestData {
  name: string,
  startTime: number
}

@Injectable({
  providedIn: 'root'
})

export class TestStartStop {

  private functionsStack: TestData[] = [];

  startStopTest(name, time, doTest = false) {
    let actualFunc = this.functionsStack.find(elem => elem.name === name);
    if (!actualFunc && doTest) {
      this.functionsStack.push({name: name, startTime: time});
      console.log('Start: ', name);
    } else if (actualFunc) {
      console.warn('Name: ', actualFunc.name, 'Time work: ', time - actualFunc.startTime + 'ms');
      this.functionsStack.splice(this.functionsStack.findIndex(elem => elem.name === actualFunc.name),1);
    }
  }
}
