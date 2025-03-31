import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';

import { SafeHtml, DomSanitizer } from '@angular/platform-browser';
import { format } from 'sql-formatter';
import * as ace from 'ace-builds';
import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/theme-sqlserver';

import {
  faCopy,
  faDownload,
  faExpand,
  faBarsStaggered,
  faFolder,
  faTrash,
  faBars,
} from '@fortawesome/free-solid-svg-icons';
import sqlFormatter from '@sqltools/formatter';
import { SqlFormatterService } from '../../Services/sql-formatter.service';
import { HeaderComponent } from "../header/header.component";

@Component({
  selector: 'app-sql-formatter',
  imports: [FontAwesomeModule, CommonModule, FormsModule, HeaderComponent],
  templateUrl: './sql-formatter.component.html',
  styleUrl: './sql-formatter.component.css',
})
export class SqlFormatterComponent implements OnDestroy, AfterViewInit {
  constructor(library: FaIconLibrary, private sanitizer: DomSanitizer, private sqlFormatterService: SqlFormatterService ) {
    library.addIcons(
      faDownload,
      faExpand,
      faCopy,
      faFolder,
      faTrash,
      faBarsStaggered,
      faBars
    );
  }

  // For Full Screen Mode
  @ViewChild('leftBox') leftBox!: ElementRef;
  @ViewChild('rightBox') rightBox!: ElementRef;

  @ViewChild('editor') private editor!: ElementRef<HTMLElement>;
  @ViewChild('outputEditor') private outputEditor!: ElementRef<HTMLElement>;

  inputValue: string = '';
  outputValue: string = '';
  formattedOutput: SafeHtml | string = '';

  tabSize: number = 2;
  searchQuery: string = '';
  searchResults: number[] = [];
  currentSearchIndex: number = -1;
  isLeftFullscreen: boolean = false;
  isRightFullscreen: boolean = false;
  uppercaseKeywords: boolean = true;
  private outputAceEditor: any;
  private inputAceEditor: any;



  ngAfterViewInit() {
    this.initializeInputEditor();
    this.initializeOutputEditor();
  }
  ngOnDestroy() {
    if (this.inputAceEditor) {
      this.inputAceEditor.destroy();
    }
    if (this.outputAceEditor) {
      this.outputAceEditor.destroy();
    }
  }

  private initializeInputEditor() {
    this.inputAceEditor = ace.edit(this.editor.nativeElement);
    this.inputAceEditor.setTheme('ace/theme/sqlserver');
    this.inputAceEditor.session.setMode('ace/mode/sql');
    this.inputAceEditor.setOptions({
      fontSize: '14px',
      showPrintMargin: false,
      wrap: true,
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true,
    });

    // Sync inputValue with editor content
    this.inputAceEditor.on('change', () => {
      this.inputValue = this.inputAceEditor.getValue();
    });
  }
  private initializeOutputEditor() {
    this.outputAceEditor = ace.edit(this.outputEditor.nativeElement);
    this.outputAceEditor.setTheme('ace/theme/sqlserver');
    this.outputAceEditor.session.setMode('ace/mode/sql');
    this.outputAceEditor.setOptions({
      fontSize: '14px',
      showPrintMargin: false,
      wrap: true,
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true,
    });

    // Sync outputValue with editor content
    this.outputAceEditor.on('change', () => {
      this.outputValue = this.outputAceEditor.getValue();
    });
  }

  onSqlConvert() {
    const sqlInput = this.inputValue.trim();
    if (!sqlInput) {
      this.formattedOutput = 'Input is empty';
      this.outputValue = '';
      console.log('No input provided');
      return;
    }

    try {
      this.sqlFormatterService.formatSQL(sqlInput).then((result: string) => {
        this.outputValue = result;
        this.outputAceEditor.setValue(this.outputValue);
        this.outputAceEditor.session.setMode('ace/mode/sql');
        this.outputAceEditor.session.clearAnnotations();
      }).catch((error: any) => {
        this.outputAceEditor.setValue(`Error: ${error.message}`);
        this.outputAceEditor.session.setAnnotations([
          {
            row: 0,
            column: 0,
            text: error.message,
            type: 'error',
          },
        ]);
      });
      // this.outputValue = sqlFormatter.format(sqlInput)
      // this.outputValue = format(sqlInput, {
      //   language: 'tsql',
      //   tabWidth: this.tabSize,
      //   useTabs: true,
      //   keywordCase: this.uppercaseKeywords ? 'upper' : 'lower',
      //   dataTypeCase: this.uppercaseKeywords ? 'upper' : 'lower',
      //   functionCase: 'preserve',
      //   identifierCase: 'preserve',
      //   indentStyle: 'tabularLeft',
      //   logicalOperatorNewline: 'after',
      // });

      // Set formatted SQL to output editor
      this.outputAceEditor.setValue(this.outputValue);
      this.outputAceEditor.session.setMode('ace/mode/sql');

      // Clear any previous error highlights
      this.outputAceEditor.session.clearAnnotations();
    } catch (error: any) {
      this.outputAceEditor.setValue(`Error: ${error.message}`);
      // Add error highlighting
      this.outputAceEditor.session.setAnnotations([
        {
          row: 0,
          column: 0,
          text: error.message,
          type: 'error',
        },
      ]);
    }
  }

  downloadContent() {
    const content = this.outputAceEditor.getValue();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted-sql.txt';
    a.click();
    window.URL.revokeObjectURL(url);
  }
  copyClipboard(target: 'input' | 'output') {
    const content =
      target === 'input'
        ? this.inputAceEditor.getValue()
        : this.outputAceEditor.getValue();

    navigator.clipboard.writeText(content).catch(() => {
      console.error('Failed to copy content');
    });
  }
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          this.inputValue += (reader.result as string) + '\n\n';
          this.inputAceEditor.setValue(this.inputValue);
        };
        reader.readAsText(file);
      });
    }
    input.value = '';
  }

  toggleFullScreen(side: string) {
    const element =
      side === 'left'
        ? this.leftBox.nativeElement
        : this.rightBox.nativeElement;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      element.requestFullscreen().catch((err: any) => {
        console.error('Error enabling fullscreen:', err);
      });
    }
  }
  clearContent(target: 'input' | 'output') {
    if (target === 'input') {
      this.inputAceEditor.setValue('');
      this.inputValue = '';
    } else {
      this.outputAceEditor.setValue('');
      this.outputValue = '';
    }
  }
  sampleData: string = `SELECT 
      CompanyName,
      AddressType,
      AddressLine1
FROM Customer
    JOIN CustomerAddress
        ON (Customer.CustomerID = CustomerAddress.CustomerID)
    JOIN Address
        ON (CustomerAddress.AddressID = Address.AddressID)
WHERE CompanyName = 'ACME Corporation'`;
  onSampleData() {
    this.inputValue = this.sampleData;

    if (this.inputAceEditor) {
      this.inputAceEditor.setValue(this.sampleData);
    }
  }
}
