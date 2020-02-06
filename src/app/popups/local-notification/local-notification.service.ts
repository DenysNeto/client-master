export enum NotificationTypes{
    OK,
    INFO,
    ERROR
}

export interface LocalNotification{
    text: string,
    type: NotificationTypes
}

import { Injectable } from "@angular/core";
import {Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})

export class LocalNotificationService{

    sendNotification: Subject<LocalNotification>;

    constructor(){
        this.sendNotification = new Subject();
    }

    sendLocalNotification(notificationText, notType){
        this.sendNotification.next({text: notificationText, type: notType});
    }
}