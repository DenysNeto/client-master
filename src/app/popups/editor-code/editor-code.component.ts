import { Component, Input, OnInit, OnChanges, Output, EventEmitter } from '@angular/core';
import * as CodeMirror from 'codemirror';
import { themesArray } from './codeEditorHints';

@Component({
  selector: 'app-editor-code',
  templateUrl: './editor-code.component.html',
  styleUrls: ['./editor-code.component.scss']
})

export class EditorCodeComponent implements OnInit, OnChanges {

  @Input() content: string;
  @Input() isReadOnly: boolean;
  @Output() changeDataImport = new EventEmitter<string>();

  editor: any;
  kodLanguage: any;
  startMode = "application/ld+json";
  themeOptions = [];

  constructor() { }

  ngOnInit() {
    this.themeOptions = themesArray;
    this.editor = CodeMirror(document.getElementById('codeeditor'), {
      value: this.content || '// Type code here',
      mode: this.kodLanguage || this.startMode,
      theme: this.themeOptions[0],
      lineNumbers: true,
      autoCloseBrackets: true,
      extraKeys: { 'Ctrl-Space': 'autocomplete' },
      readOnly: this.isReadOnly
    });
    this.editor.setSize("100%", "95%");
    this.editor.on('change', () => this.changeDataImport.emit(this.editor.getValue()));
  }



  ngOnChanges(changes: import("@angular/core").SimpleChanges): void {
    if (changes['content'] && this.content) {
      this.editor.setOption('value', this.content);
    }
  }

  onChangeTheme(event) {
    const selectedMode = event.srcElement.value;
    this.editor.setOption('theme', selectedMode);
  }
}
