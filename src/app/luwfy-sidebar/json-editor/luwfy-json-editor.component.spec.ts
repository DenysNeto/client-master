import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LuwfyJsonEditorComponent } from './luwfy-json-editor.component';

describe('JsonEditorComponent', () => {
  let component: LuwfyJsonEditorComponent;
  let fixture: ComponentFixture<LuwfyJsonEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LuwfyJsonEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LuwfyJsonEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
