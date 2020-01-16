import { TestBed } from '@angular/core/testing';

import { UndoRedoCanvasService } from './undo-redo-canvas.service';

describe('TempService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: UndoRedoCanvasService = TestBed.get(UndoRedoCanvasService);
    expect(service).toBeTruthy();
  });
});
