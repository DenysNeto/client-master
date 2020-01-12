import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalPropComponent } from './modal-prop.component';

describe('ModalPropComponent', () => {
  let component: ModalPropComponent;
  let fixture: ComponentFixture<ModalPropComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModalPropComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalPropComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
