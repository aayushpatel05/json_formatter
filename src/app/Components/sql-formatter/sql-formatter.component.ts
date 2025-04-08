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
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-sql-formatter',
  imports: [FontAwesomeModule, CommonModule, FormsModule, HeaderComponent],
  templateUrl: './sql-formatter.component.html',
  styleUrl: './sql-formatter.component.css',
})
export class SqlFormatterComponent implements OnDestroy, AfterViewInit {
 
  private outputAceEditor: any;
  private inputAceEditor: any;
  private inputChanges = new Subject<void>();

  inputValue: string = '';
  outputValue: string = '';


  searchQuery: string = '';
  searchResults: number[] = [];
  currentSearchIndex: number = -1;
  isLeftFullscreen: boolean = false;
  isRightFullscreen: boolean = false;
  uppercaseKeywords: boolean = true;


  constructor(library: FaIconLibrary,  private sqlFormatterService: SqlFormatterService) {
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


  ngAfterViewInit() {
    this.initializeInputEditor();
    this.initializeOutputEditor();

    // Format any existing content on init
    if (this.inputValue) {
      this.onSqlConvert();
    }

    // Setup debounced input (if using)
    this.inputChanges.pipe(debounceTime(300)).subscribe(() => {
      this.onSqlConvert();
    });
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
      this.inputChanges.next();
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
 
  tabWidth: number = 5;
  useTabs: boolean = false;
  keywordCase: 'preserve' | 'upper' | 'lower' = 'preserve';
  dataTypeCase: 'preserve' | 'upper' | 'lower' = 'preserve';
  functionCase: 'preserve' | 'upper' | 'lower' = 'preserve';
  identifierCase: 'preserve' | 'upper' | 'lower' = 'preserve';
  indentStyle: 'standard' | 'tabularLeft' | 'tabularRight' = 'standard';
  expressionWidth: number = 50;
  linesBetweenQueries: number = 1;

  onSqlConvert() {
    //main
    const sqlInput = this.inputValue.trim();
    if (!sqlInput) {
      this.outputAceEditor.setValue('Input is empty');
      return;
    }
    const TAB_WIDTH = ' '.repeat(10); // 10 spaces for each indentation level

    try {
      // Step 1: Core formatting with sql-formatter
      let formatted = format(sqlInput, {
        language: 'tsql',
        tabWidth: this.tabWidth,
        useTabs: this.useTabs,
        keywordCase: this.keywordCase,
        dataTypeCase: this.dataTypeCase,
        functionCase: this.functionCase,
        identifierCase: this.identifierCase,
        indentStyle: this.indentStyle,
        logicalOperatorNewline: 'after',
        expressionWidth: this.expressionWidth,
        linesBetweenQueries: this.linesBetweenQueries
      });
      
      this.outputAceEditor.setValue(formatted);
      this.outputAceEditor.session.setMode('ace/mode/sql');
      this.outputAceEditor.session.clearAnnotations();

    } catch (error: any) {
      this.outputAceEditor.setValue(`Error: ${error.message}`);
    }
  }
  resetOptions() {
    this.tabWidth = 5;
    this.useTabs = false;
    this.keywordCase = 'preserve';
    this.dataTypeCase = 'preserve';
    this.functionCase = 'preserve';
    this.identifierCase = 'preserve';
    this.indentStyle = 'standard';
    this.expressionWidth = 50;
    this.linesBetweenQueries = 1;

    // Trigger formatting with new options
    this.onOptionChange();
  }

  onOptionChange() {
    this.onSqlConvert();
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
  sampleData: string = `WITH CUSTOMERORDERS AS ( SELECT c.CustomerID, c.Name AS CustomerName, COUNT(o.OrderID) AS TotalOrders, MAX(o.OrderDate) AS LastOrderDate, SUM(o.TotalAmount) AS TotalSpent, AVG(o.TotalAmount) AS AvgOrderValue FROM Customers c LEFT JOIN Orders o ON c.CustomerID = o.CustomerID GROUP BY c.CustomerID, c.Name ), RankedCustomers AS ( SELECT CustomerID, CustomerName, TotalOrders, LastOrderDate, TotalSpent, AvgOrderValue, RANK() OVER ( ORDER BY TotalSpent DESC ) AS SpendingRank FROM CustomerOrders ) SELECT rc.CustomerID, rc.CustomerName, rc.TotalOrders, rc.LastOrderDate, rc.TotalSpent, rc.AvgOrderValue, rc.SpendingRank, CASE WHEN rc.TotalSpent > 10000 THEN 'VIP' WHEN rc.TotalSpent BETWEEN 5000 AND 10000 THEN 'Regular' ELSE 'New Customer' END AS CustomerCategory FROM RankedCustomers rc ORDER BY rc.SpendingRank;`;
  onSampleData() {
    this.inputValue = this.sampleData;

    if (this.inputAceEditor) {
      this.inputAceEditor.setValue(this.sampleData);
    }
  }

}
