import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LuwfySidebarComponent } from './luwfy-sidebar.component';

describe('LuwfySidebarComponent', () => {
  let component: LuwfySidebarComponent;
  let fixture: ComponentFixture<LuwfySidebarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LuwfySidebarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LuwfySidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
