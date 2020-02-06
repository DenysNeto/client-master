import { Component, OnInit } from '@angular/core';
import { LocalNotificationService, LocalNotification, NotificationTypes } from './local-notification.service';

@Component({
  selector: 'app-local-notification',
  templateUrl: './local-notification.component.html',
  styleUrls: ['./local-notification.component.scss']
})

export class LocalNotificationComponent implements OnInit {

  notification: LocalNotification;
  color = '';
  private showTime;
  constructor(private _localNotificationService: LocalNotificationService) { }

  ngOnInit() {
    this._localNotificationService.sendNotification.subscribe(data => {
      this.stopNotification();
      this.notification = data;
      this.color = this.notification.type === NotificationTypes.INFO ? '#5b64b9' : this.notification.type === NotificationTypes.OK ? 'green'  :'red';
      this.startNotification();
    });
  }

  startNotification() {
    this.showTime = setTimeout(() => {
      this.notification = null;
    }, 3000);
  }

  stopNotification() {
    clearTimeout(this.showTime);
  }
}
