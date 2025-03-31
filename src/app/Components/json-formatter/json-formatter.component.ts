import { AfterViewInit, Component, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { JsonFormatterService } from '../../Services/json-formatter.service';

import JSONEditor from 'jsoneditor';

import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faCopy, faFolder, faTrash, faBarsStaggered, faBars, faExpand, faDownload, faChevronUp, faChevronDown, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { HeaderComponent } from "../header/header.component";

@Component({
  selector: 'app-json-formatter',
  imports: [FontAwesomeModule, CommonModule, FormsModule, HeaderComponent],
  templateUrl: './json-formatter.component.html',
  styleUrl: './json-formatter.component.css',
})

export class JsonFormatterComponent implements AfterViewInit, OnDestroy {

  // constructor
  constructor(library: FaIconLibrary, private jsonService: JsonFormatterService) {
    library.addIcons(faCopy, faFolder, faTrash, faBarsStaggered, faBars, faExpand, faDownload, faChevronUp, faChevronDown, faArrowLeft);
  }

  @ViewChild('editorContainer') editorContainer!: ElementRef;
  @ViewChild('outputEditorContainer') outputEditorContainer!: ElementRef;


  searchQuery: string = '';
  searchResults: { row: number; startCol: number; endCol: number }[] = [];
  currentSearchIndex: number = -1;
  private _inputValue: string = '';
  private _outputValue: string = '';
  private editor: JSONEditor | null = null;
  private outputEditor: JSONEditor | null = null;
  private markers: number[] = []; // Store Ace editor marker IDs


  // get input value methi
  get inputValue(): string {
    return this._inputValue;
  }
  //set input Value
  set inputValue(value: string) {
    this._inputValue = value;
    if (this.editor) {
      this.editor.setText(value);
    }
  }
  //get output value
  get outputValue(): string {
    return this._outputValue;
  }
  //set output Value
  set outputValue(value: string) {
    this._outputValue = value;
    if (this.outputEditor) this.outputEditor.setText(value);
    this.onSearch();
  }

  ngAfterViewInit() {
    // Input Editor (Left Box)
    if (this.editorContainer) {
      this.editor = new JSONEditor(this.editorContainer.nativeElement, {
        mode: 'code',
        mainMenuBar: false,
        navigationBar: false,
      });
      this.editor.setText(this.inputValue);
      this.editor.aceEditor.getSession().on('change', () => {
        try {
          this._inputValue = this.editor!.getText();
        } catch (e: any) {
          this._inputValue = e.message;
        }
      });
    }
    // Output Editor (Right Box)
    if (this.outputEditorContainer) {
      this.outputEditor = new JSONEditor(
        this.outputEditorContainer.nativeElement,
        {
          mode: 'code',
          mainMenuBar: false,
        }
      );
      this.outputEditor.setText(this.outputValue);

      this.outputEditor.aceEditor.getSession().on('change', () => {
        try {
          this._outputValue = this.outputEditor!.getText();
          this.onSearch();
        } catch (e: any) {
          this._outputValue = e.message;
        }
      });
    }
  }

  ngOnDestroy() {
    if (this.editor) {
      this.editor.destroy();
    }
    if (this.outputEditor) {
      this.outputEditor.destroy();
    }
  }

  onConvertJson() {
    this.outputValue = this.jsonService.formatJson(this.inputValue);
  }

  onDecodeAndFormat() {
    this.outputValue = this.jsonService.decodeAndFormat(this.inputValue);
  }

  OnConvertMinify() {
    this.outputValue = this.jsonService.minifyJson(this.inputValue);
  }

  onEncoded() {
    this.outputValue = this.jsonService.encode(this.inputValue);
  }

  onSampleData() {
    this.inputValue = this.jsonService.getSampleData();
    this.onDecodeAndFormat();
  }
  onIcon1Json() {
    this.inputValue = this.jsonService.formatJson(this.inputValue);
  }

  onIcon2Json() {
    this.inputValue = this.jsonService.minifyJson(this.inputValue);
  }

  onIcon3Json() {
    this.outputValue = this.jsonService.formatJson(this.outputValue);
  }

  onIcon4Json() {
    this.outputValue = this.jsonService.minifyJson(this.outputValue);
  }
  onIcon5Json() {
    this.inputValue = this.outputValue;
  }

  onSearch() {
    if (!this.outputEditor || !this.outputValue) return;

    const aceEditor = this.outputEditor.aceEditor;
    const session = aceEditor.getSession();

    // Clear previous markers
    this.markers.forEach((marker) => session.removeMarker(marker));
    this.markers = [];
    this.searchResults = [];

    if (!this.searchQuery.trim()) {
      aceEditor.renderer.updateFull(true);
      return;
    }

    const regex = new RegExp(this.searchQuery, 'gi');
    const lines = this.outputValue.split('\n');

    lines.forEach((line, row) => {
      let match;
      while ((match = regex.exec(line)) !== null) {
        this.searchResults.push({
          row,
          startCol: match.index,
          endCol: match.index + match[0].length,
        });
      }
    });

    // Apply markers
    this.searchResults.forEach((result, index) => {
      const range = new (window as any).ace.Range(
        result.row,
        result.startCol,
        result.row,
        result.endCol
      );
      const marker = session.addMarker(
        range,
        index === this.currentSearchIndex
          ? 'search-highlight-current'
          : 'search-highlight',
        'text',
        true // Add the missing inFront argument
      );
      this.markers.push(marker);
    });

    if (this.searchResults.length > 0) {
      this.currentSearchIndex = 0;
      this.highlightCurrentMatch();
    } else {
      this.currentSearchIndex = -1;
    }

    aceEditor.renderer.updateFull(true); // Force re-render
  }

  navigateSearch(next: boolean) {
    if (this.searchResults.length === 0 || !this.outputEditor) return;

    const aceEditor = this.outputEditor.aceEditor;
    const session = aceEditor.getSession();

    // Clear previous markers
    this.markers.forEach((marker) => session.removeMarker(marker));
    this.markers = [];

    this.currentSearchIndex = next
      ? (this.currentSearchIndex + 1) % this.searchResults.length
      : (this.currentSearchIndex - 1 + this.searchResults.length) %
      this.searchResults.length;

    // Re-apply markers
    this.searchResults.forEach((result, index) => {
      const range = new (window as any).ace.Range(
        result.row,
        result.startCol,
        result.row,
        result.endCol
      );
      const marker = session.addMarker(
        range,
        index === this.currentSearchIndex
          ? 'search-highlight-current'
          : 'search-highlight',
        'text',
        true // Add the missing inFront argument
      );
      this.markers.push(marker);
    });

    this.highlightCurrentMatch();
    aceEditor.renderer.updateFull(true);
  }

  private highlightCurrentMatch() {
    if (this.currentSearchIndex < 0 || !this.outputEditor) return;
    const result = this.searchResults[this.currentSearchIndex];
    const aceEditor = this.outputEditor.aceEditor;
    aceEditor.scrollToLine(result.row, true, true, () => { });
    aceEditor.gotoLine(result.row + 1, result.startCol, true);
  }
  downloadContent() {
    const textContent = this.outputValue || 'No content';
    const isJSON = this.jsonService.checkInput(textContent).isValid;
    const extension = isJSON ? 'json' : 'txt';
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `json_output.${extension}`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async copyClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text || '');
      console.log('Copied to clipboard!');
    } catch (error: any) {
      this.outputValue = error.message;
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const json = JSON.parse(reader.result as string);
            this.inputValue = JSON.stringify(json, null, 2); // Replace instead of +=
          } catch (e: any) {
            this.outputValue = `Error in file ${file.name}: ${e.message}`;
          }
        };
        reader.readAsText(file);
      });
    }
    input.value = '';
  }

  toggleFullScreen(side: string) {
    const leftBox = document.querySelector('.left-box') as HTMLElement;
    const rightBox = document.querySelector('.right-box') as HTMLElement;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => {
        console.error('Error exiting fullscreen:', err);
      });
    } else {
      const element = side === 'left' ? leftBox : rightBox;
      if (element) {
        element.requestFullscreen().catch((err) => {
          console.error('Error attempting to enable fullscreen:', err);
        });
      }
    }
  }

  clearContent(target: 'input' | 'output' | 'both' = 'both') {
    if (target === 'input' || target === 'both') {
      this.inputValue = '';
    }

    if (target === 'output' || target === 'both') {
      this.outputValue = '';
      // Reset search-related states
      this.searchQuery = '';
      this.searchResults = [];
      this.currentSearchIndex = -1;
      // Clear editor markers
      if (this.outputEditor) {
        const session = this.outputEditor.aceEditor.getSession();
        this.markers.forEach((marker) => session.removeMarker(marker));
        this.markers = [];
      }
    }
  }
}
