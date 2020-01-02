import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LuwfyVerticalTabComponent } from './luwfy-vertical-tab.component';

describe('LuwfyVerticalTabComponent', () => {
  let component: LuwfyVerticalTabComponent;
  let fixture: ComponentFixture<LuwfyVerticalTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LuwfyVerticalTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LuwfyVerticalTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
