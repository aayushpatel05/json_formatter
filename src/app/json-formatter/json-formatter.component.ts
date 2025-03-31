import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';
import JSONEditor from 'jsoneditor';
import CryptoJS from 'crypto-js';
import {
  FontAwesomeModule,
  FaIconLibrary,
} from '@fortawesome/angular-fontawesome';
import {
  faCopy,
  faFolder,
  faTrash,
  faBarsStaggered,
  faBars,
  faExpand,
  faDownload,
  faChevronUp,
  faChevronDown,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-json-formatter',
  imports: [FontAwesomeModule, CommonModule, FormsModule],
  templateUrl: './json-formatter.component.html',
  styleUrl: './json-formatter.component.css',
})
export class JsonFormatterComponent implements AfterViewInit, OnDestroy {
  constructor(library: FaIconLibrary, private sanitizer: DomSanitizer) {
    library.addIcons(
      faDownload,
      faExpand,
      faCopy,
      faFolder,
      faTrash,
      faBarsStaggered,
      faBars,
      faChevronUp,
      faChevronDown,
      faArrowLeft
    );
  }

  @ViewChild('editorContainer') editorContainer!: ElementRef;
  @ViewChild('outputEditorContainer') outputEditorContainer!: ElementRef;

  private _inputValue: string = '';
  private _outputValue: string = '';
  formattedOutput: SafeHtml | string = '';

  bol: string = 'text';
  key = '7061737323313233';
  iv = '7061737323313233';

  private editor: JSONEditor | null = null;
  private outputEditor: JSONEditor | null = null;
  private markers: number[] = []; // Store Ace editor marker IDs

  get inputValue(): string {
    return this._inputValue;
  }

  set inputValue(value: string) {
    this._inputValue = value;
    if (this.editor) {
      this.editor.setText(value);
    }
  }

  get outputValue(): string {
    return this._outputValue;
  }

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

  private repairInput(inputValue: string): string {
    let input = inputValue || '';
    try {
      if (typeof input === 'string') {
        if (
          (input.startsWith('"') && input.endsWith('"')) ||
          (input.startsWith("'") && input.endsWith("'"))
        ) {
          input = input.substring(1, input.length - 1);
        } else if (input.startsWith('"') || input.startsWith("'")) {
          input = input.substring(1, input.length);
        } else if (input.endsWith('"') || input.endsWith("'")) {
          input = input.substring(0, input.length - 1);
        }
      }
    } catch (error: any) {
      this.formattedOutput = error.message;
    }
    return input;
  }

  private checkInput(input: string): {
    isValid: boolean;
    parsedValue?: any;
    isBase64?: boolean;
    errorMessage: string;
  } {
    if (!input?.trim()) {
      return { isValid: false, errorMessage: 'Input is empty' };
    }

    let parsedValue;
    let isBase64 = false;
    try {
      const decoded = atob(input);
      try {
        parsedValue = JSON.parse(decoded);
        isBase64 = true;
      } catch {
        parsedValue = decoded;
      }
    } catch {
      try {
        parsedValue = JSON.parse(input);
      } catch (e: any) {
        return { isValid: false, errorMessage: e.message };
      }
    }

    return { isValid: true, parsedValue, isBase64, errorMessage: '' };
  }

  onConvertJson() {
    const repairedInput = this.repairInput(this.inputValue);
    const checkResult = this.checkInput(repairedInput);

    if (!checkResult.isValid) {
      this.outputValue = checkResult.errorMessage;
      return;
    }

    try {
      const parsed = checkResult.parsedValue;
      const formatted = JSON.stringify(parsed, null, 2);
      this.outputValue = formatted;
    } catch (e: any) {
      this.outputValue = e.message;
    }
  }

  onDecodeAndFormat() {
    const repairedInput = this.repairInput(this.inputValue);
    const checkResult = this.checkInput(repairedInput);

    if (!checkResult.isValid) {
      this.outputValue = checkResult.errorMessage;
      return;
    }

    try {
      let finalValue = checkResult.parsedValue;

      if (checkResult.isBase64) {
        const decoded = atob(repairedInput);
        try {
          finalValue = JSON.parse(decoded);
        } catch {
          finalValue = decoded;
        }
      }

      if (typeof finalValue === 'object' && finalValue !== null) {
        const formatted = JSON.stringify(finalValue, null, 2);
        this.outputValue = formatted;
      } else {
        this.outputValue = finalValue;
      }
    } catch (e: any) {
      this.outputValue = `Processing failed: ${e.message}`;
    }
  }

  OnConvertMinify() {
    const repairedInput = this.repairInput(this.inputValue);
    const checkResult = this.checkInput(repairedInput);

    if (!checkResult.isValid) {
      this.outputValue = checkResult.errorMessage;
      return;
    }

    try {
      const parsed = checkResult.parsedValue;
      const minified = JSON.stringify(parsed);
      this.outputValue = minified;
    } catch (e: any) {
      this.outputValue = e.message;
    }
  }

  onEncoded() {
    const repairedInput = this.repairInput(this.inputValue);
    if (!repairedInput.trim()) {
      this.outputValue = 'Input is empty';
      return;
    }

    try {
      const encoded = btoa(repairedInput);
      this.outputValue = encoded;
    } catch (e: any) {
      this.outputValue = e.message;
    }
  }

  //This method is use for encrypt the value.
  encrypt(value: string) {
    if (!value) {
      return;
    }
    try {
      var key = CryptoJS.enc.Utf8.parse(this.key);
      var iv = CryptoJS.enc.Utf8.parse(this.iv);
      var encrypted = CryptoJS.AES.encrypt(
        CryptoJS.enc.Utf8.parse(value),
        key,
        {
          keySize: 128 / 8,
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        }
      );
      //console.log(this.encrypted)

      if (encrypted) {
        this.outputValue = encrypted.toString();
        return encrypted.toString();
      } else {
        return value;
      }
    } catch (e: any) {
      this.outputValue = e.message;
      return value;
    }
  }

  decrypt(value: string) {
    if (!value) {
      return;
    }
    try {
      var key = CryptoJS.enc.Utf8.parse(this.key);
      var iv = CryptoJS.enc.Utf8.parse(this.iv);

      var decrypted = CryptoJS.AES.decrypt(value, key, {
        keySize: 128 / 8,
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }).toString(CryptoJS.enc.Utf8);

      if (decrypted) {
        const decVelue = decrypted.toString();
        try {
          const parsed = JSON.parse(decVelue);
          this.outputValue = JSON.stringify(parsed, null, 2);
        } catch (e) {
          this.outputValue = decVelue;
        }

        return decVelue;
      } else {
        return value;
      }
    } catch (e: any) {
      this.outputValue = e.message;
      return value;
    }
  }

  onFormate() {
    this.searchQuery = '';
    this.searchResults = [];
    this.currentSearchIndex = -1;
    this.onDecodeAndFormat();
  }

  searchQuery: string = '';
  searchResults: { row: number; startCol: number; endCol: number }[] = [];
  currentSearchIndex: number = -1;
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
    aceEditor.scrollToLine(result.row, true, true, () => {});
    aceEditor.gotoLine(result.row + 1, result.startCol, true);
  }
  downloadContent() {
    const textContent = this.outputValue || 'No content';
    const isJSON = this.checkInput(textContent).isValid;
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

  clearScreen() {}

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

  sampleData: string = `{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "isActive": true,
  "roles": [
    "admin",
    "editor"
  ],
  "profile": {
    "age": 30,
    "address": {
      "street": "123 Main St",
      "city": "Anytown",
      "country": "USA"
    }
  },
  "preferences": {
    "theme": "dark",
    "notifications": true
  },
  "createdAt": "2025-02-06T12:00:00Z",
  "updatedAt": "2025-02-06T12:30:00Z"
}`;
  onSampleData() {
    this.inputValue = this.sampleData;
    this.onDecodeAndFormat();
  }
  onIcon1Json() {
    const repairedInput = this.repairInput(this.inputValue);
    const checkResult = this.checkInput(repairedInput);
    if (!checkResult.isValid) {
      this.outputValue = checkResult.errorMessage;
      return;
    }
    this.inputValue = JSON.stringify(checkResult.parsedValue, null, 2);
  }

  onIcon2Json() {
    const repairedInput = this.repairInput(this.inputValue);
    const checkResult = this.checkInput(repairedInput);

    if (!checkResult.isValid) {
      this.outputValue = checkResult.errorMessage;
      return;
    }
    this.inputValue = JSON.stringify(checkResult.parsedValue);
  }

  onIcon3Json() {
    const repairedInput = this.repairInput(this.outputValue);
    const checkResult = this.checkInput(repairedInput);

    this.outputValue = JSON.stringify(checkResult.parsedValue, null, 2);
  }

  onIcon4Json() {
    const repairedInput = this.repairInput(this.outputValue);
    const checkResult = this.checkInput(repairedInput);

    this.outputValue = JSON.stringify(checkResult.parsedValue);
  }
  onIcon5Json() {
    this.inputValue = this.outputValue;
  }
}
