import {Component, OnChanges, Input, OnInit} from '@angular/core';
import {ClipboardService} from 'ngx-clipboard';
import {BlocksService} from '../../services/blocks.service';

export interface Segment {
  key: string;
  value: any;
  type: undefined | string;
  description: string;
  expanded: boolean;
}

@Component({
  selector: 'app-json-editor',
  templateUrl: './luwfy-json-editor.component.html',
  styleUrls: ['./luwfy-json-editor.component.scss']
})
export class LuwfyJsonEditorComponent implements OnInit, OnChanges {
  @Input() json: any;
  @Input() fullObject: any;
  @Input() expanded = false;
  /**
   * @deprecated It will be always true and deleted in version 3.0.0
   */
  @Input() cleanOnChange = true;

  segments: Segment[] = [];

  constructor(private clipboardService: ClipboardService, private blocksService: BlocksService) {
  }

  ngOnInit(): void {
    if (this.fullObject) {
      this.blocksService.dataInBlock = this.fullObject;
    } else {
      this.fullObject = this.blocksService.dataInBlock;
    }
  }

  ngOnChanges() {
    if (this.cleanOnChange) {
      this.segments = [];
    }
    if (typeof this.json === 'object') {
      Object.keys(this.json).forEach(key => {
        this.segments.push(this.parseKeyValue(key, this.json[key]));
      });
    } else {
      this.segments.push(this.parseKeyValue(`(${typeof this.json})`, this.json));
    }
  }

  isExpandable(segment: Segment) {
    return segment.type === 'object' || segment.type === 'array';
  }

  toggle(segment: Segment) {
    if (this.isExpandable(segment)) {
      segment.expanded = !segment.expanded;
    }
  }

  private parseKeyValue(key: any, value: any): Segment {
    const segment: Segment = {
      key: key,
      value: value,
      type: undefined,
      description: '' + value,
      expanded: this.expanded
    };

    switch (typeof segment.value) {
      case 'number': {
        segment.type = 'number';
        break;
      }
      case 'boolean': {
        segment.type = 'boolean';
        break;
      }
      case 'function': {
        segment.type = 'function';
        break;
      }
      case 'string': {
        segment.type = 'string';
        segment.description = '"' + segment.value + '"';
        break;
      }
      case 'undefined': {
        segment.type = 'undefined';
        segment.description = 'undefined';
        break;
      }
      case 'object': {
        // yea, null is object
        if (segment.value === null) {
          segment.type = 'null';
          segment.description = 'null';
        } else if (Array.isArray(segment.value)) {
          segment.type = 'array';
          segment.description = 'Array[' + segment.value.length + '] ' + JSON.stringify(segment.value);
        } else if (segment.value instanceof Date) {
          segment.type = 'date';
        } else {
          segment.type = 'object';
          segment.description = 'Object ' + JSON.stringify(segment.value);
        }
        break;
      }
    }
    return segment;
  }

  onCopyValue(value) {
    if (value) {
      this.clipboardService.copyFromContent(value);
    }
  }

  onCopyPath(key, value) {
    if (key) {
      let res = this.findPath(this.fullObject, key, value, 'data');
      this.clipboardService.copyFromContent(res);
    }
  }

  /** Function for searching path on JS object*/
  findPath(obj, name, val, currentPath?) {
    if (name === currentPath) {
      return currentPath;
    }
    currentPath = currentPath || '';
    let matchingPath;
    if (!obj || typeof obj !== 'object') {
      return;
    }
    if (typeof obj[name] === 'object') {
      if (JSON.stringify(obj[name]) === val.replace('Object', '').trim()) {
        return `${currentPath}.${name}`;
      }
    }
    if (typeof val === 'string') {
      val = val.replace('"', '').replace('"', '');
    }
    if (obj[name] === val) {
      return `${currentPath}.${name}`;
    }
    if(typeof obj[name] === 'number'){
      if (obj[name].toString() === val) {
        return `${currentPath}.${name}`;
      }
    }
    for (const key of Object.keys(obj)) {
      if (key === name && obj[key] === val) {
        matchingPath = currentPath;
      } else {
        matchingPath = this.findPath(obj[key], name, val, `${currentPath}.${key}`);
      }
      if (matchingPath) {
        break;
      }
    }
    return matchingPath;
  }


}
