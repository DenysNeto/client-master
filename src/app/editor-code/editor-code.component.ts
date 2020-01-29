import {Component, Input, OnInit} from '@angular/core';
import * as CodeMirror from 'codemirror';
import {BlocksService} from '../services/blocks.service';
import {themesArray} from './codeEditorHints';

@Component({
  selector: 'app-editor-code',
  templateUrl: './editor-code.component.html',
  styleUrls: ['./editor-code.component.scss']
})
export class EditorCodeComponent implements OnInit {
  editor: any;
  content: any;
  kodLanguage: any;
  startMode = 'markdown';
  themeOptions = [];

  constructor(private blocksService: BlocksService) {
    this.content = this.blocksService.getCodData().codText;
    this.kodLanguage = this.blocksService.getCodData().codLanguage;
  }

  ngOnInit() {
    this.themeOptions = themesArray;
    this.editor = CodeMirror(document.getElementById('codeeditor'), {
      value: this.content || '// Type code here',
      mode: this.kodLanguage || this.startMode,
      theme: this.themeOptions[0],
      lineNumbers: true,
      autoCloseBrackets: true,
      extraKeys: {'Ctrl-Space': 'autocomplete'}
    });
  }

  onChangeTheme(event) {
    const selectedMode = event.srcElement.value;
    this.editor.setOption('theme', selectedMode);
  }
}
