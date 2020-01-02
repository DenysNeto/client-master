import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LufyTabsComponent } from './lufy-tabs.component';

describe('LufyTabsComponent', () => {
  let component: LufyTabsComponent;
  let fixture: ComponentFixture<LufyTabsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LufyTabsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LufyTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
