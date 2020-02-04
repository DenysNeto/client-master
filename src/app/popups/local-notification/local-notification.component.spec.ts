import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LocalNotificationComponent } from './local-notification.component';

describe('LocalNotificationComponent', () => {
  let component: LocalNotificationComponent;
  let fixture: ComponentFixture<LocalNotificationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LocalNotificationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LocalNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
