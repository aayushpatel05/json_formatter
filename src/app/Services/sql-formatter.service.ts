import { Injectable } from '@angular/core';
import { format } from 'sql-formatter';
@Injectable({
  providedIn: 'root',
})
export class SqlFormatterService {
  format(sqlInput: string, arg1: { uppercaseKeywords: boolean; tabSize: number; indentStyle: string; indentSize: number; }) {
    throw new Error('Method not implemented.');
  }
  uppercaseKeywords: boolean = false;

  constructor() { }

  async formatSQL(sqlQuery: string): Promise<string> {
    try {
      const formattedSQL = await format(sqlQuery, {
        language: 'sql',
        keywordCase: this.uppercaseKeywords ? 'upper' : 'lower',
        dataTypeCase: this.uppercaseKeywords ? 'upper' : 'lower',
        functionCase: 'preserve',
        identifierCase: 'preserve',
        indentStyle: 'tabularLeft',
        logicalOperatorNewline: 'after',
        expressionWidth: 50,
        linesBetweenQueries: 1,
        denseOperators: false,
      });
      return formattedSQL;
    } catch (error) {
      console.error('Error formatting SQL:', error);
      return sqlQuery; // Return original query if formatting fails
    }
  }
}
