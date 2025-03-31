import { Injectable } from '@angular/core';
import * as prettier from 'prettier/standalone';
import sqlPlugin from 'prettier-plugin-sql';

@Injectable({
  providedIn: 'root',
})
export class SqlFormatterService {
  uppercaseKeywords: boolean = false;

  constructor() {}

  async formatSQL(sqlQuery: string): Promise<string> {
    try {
      const formattedSQL = await prettier.format(sqlQuery, {
        parser: 'sql',
        plugins: [sqlPlugin],
        sqlFormatOptions: {
          language: 'sql', // Options: sql, mysql, postgresql
          keywordCase: this.uppercaseKeywords ? 'upper' : 'lower', // Options: lowercase, uppercase
          indentStyle: 'standard', // Options: standard, tabularLeft, tabularRight
          logicalOperatorNewline: 'before', // Options: before, after
          linesBetweenQueries: 2,
          useTabs: true,
        //   dataTypeCase: this.uppercaseKeywords ? 'upper' : 'lower',
          functionCase: 'preserve',
          identifierCase: 'preserve',
          // indentStyle: 'tabularLeft',
        //   indentStyle: 'tabularLeft',
        //   logicalOperatorNewline: 'after',
        },
      });
      return formattedSQL;
    } catch (error) {
      console.error('Error formatting SQL:', error);
      return sqlQuery; // Return original query if formatting fails
    }
  }
}
