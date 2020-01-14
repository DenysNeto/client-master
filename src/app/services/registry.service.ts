import {Injectable} from '@angular/core';

import {BlockType, Registry, Block} from '../models/registry';

import {BehaviorSubject, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RegistryService {

  // private _blockDefinitions = {};

  private blockDefinitionsSource = new BehaviorSubject<BlockType[]>([]);
  private blockSetSource = new BehaviorSubject<Block[]>([]);
  private tabsSource = new BehaviorSubject<Block[]>([]);
  private subflowsSource = new BehaviorSubject<Block[]>([]);
  private activeTabSource = new BehaviorSubject<string>('');
  private currentTabBlocksSource = new BehaviorSubject<Block[]>([]);

  private _blockDefinitions = this.blockDefinitionsSource.asObservable();
  blockSet = this.blockSetSource.asObservable();
  tabs = this.tabsSource.asObservable();
  subflows = this.subflowsSource.asObservable();
  activeTab = this.activeTabSource.asObservable();
  currentTabBlocks = this.currentTabBlocksSource.asObservable();


  public currentDraggableItem = new BehaviorSubject<string>('');

  public setCurrentDraggableItem(id: string) {
    this.currentDraggableItem.next(id);
  }


  // private _blockDefinitions: BlockType[] = [];
  // public blockSet: Block[] = [];
  // public tabs: Block[] = [];
  // public subflows: Block[] = [];

  constructor() {
    this.registerBlockType('_unknown', {
      label: {value: 'unknown'},
      color: '#ffffff',
    });
    this.registerBlockType('tab', {
      label: {value: ''},
      disabled: {value: false},
      info: {value: ''},
      exclude: true,
    });
    this.registerBlockType('subflow', {
      label: {value: ''},
      disabled: {value: false},
      info: {value: ''},
      exclude: true,
    });

    this.registerBlockType('debug', {
      label: {value: 'debug'},
      color: 'rgb(135, 169, 128)',
      button: {
        align: 'right',
      },
      inputs: 1,
      outputs: 0,
    });
    this.registerBlockType('inject', {
      label: {value: 'inject'},
      color: 'rgb(166, 187, 207)',
      button: {
        align: 'left',
      },
      inputs: 0,
      outputs: 1,
    });
  }

  private getID() {
    return (1 + Math.random() * 4294967295).toString(16);
  }

  public registerBlockType(type, options) {
    this.blockDefinitionsSource.next(this.blockDefinitionsSource.getValue().concat(Object.assign(
      {},
      {
        type: type,
      },
      options,
      {
        defaults: options.defaults || {}
      }
    )));

    // this.blockDefinitionsSource.getValue().push();
  }

  private getTabs() {
    this.tabsSource.next(this.blockSetSource.getValue().filter(t => t.type.type === 'tab'));

    if (!this.activeTabSource.getValue() && this.tabsSource.getValue().length > 0) {
      this.acivateTab(this.tabsSource.getValue()[0].id);
    }
  }

  private getSubflows() {
    this.subflowsSource.next(this.blockSetSource.getValue().filter(t => t.type.type === 'subflow'));
  }

  private getCurrentTabBlocks() {
    let id = this.activeTabSource.getValue();
    if (id) {
      this.currentTabBlocksSource.next(this.blockSetSource.getValue().filter(t => t.z === id));
    }
  }

  public acivateTab(id) {
    this.activeTabSource.next(id);
  }

  private registerBlock(block, is_new?: boolean) {
    var unknown_block_type = this.blockDefinitionsSource.getValue().find(t => t.type === '_unknown');
    var block_type = this.blockDefinitionsSource.getValue().find(t => t.type === block.type);
    var existing_id_in_use = this.blockSetSource.getValue().find(b => b.id === block.id);

    block._type = block.type;
    block.type = block_type || unknown_block_type;

    // if id in use or new block create the id
    if (is_new || existing_id_in_use || !block.id) {
      block.id = this.getID();
    }

    this.blockSetSource.next(this.blockSetSource.getValue().concat([block]));
  }

  public import(blocks) {
    if (!Array.isArray(blocks)) {
      blocks = [blocks];
    }

    blocks.forEach((block) => {
      this.registerBlock(block);
      this.getTabs();
      this.getSubflows();
      this.getCurrentTabBlocks();
    });
  }
}
