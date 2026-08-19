export class RuleEvaluator {
  /**
   * Checks if an action is allowed based on rule string and context.
   * Returns:
   * - { allowed: false } if forbidden
   * - { allowed: true, sqlFilter: string, params: any[] } if allowed
   */
  static evaluate(rule, context) {
    // 1. Admins bypass all collection rules
    if (context.isAdmin) {
      return { allowed: true };
    }

    // 2. null or undefined rule means Admin only
    if (rule === null || rule === undefined) {
      return { allowed: false };
    }

    const trimmed = rule.trim();

    // 3. Empty string, "*", or "true" means public access
    if (trimmed === '' || trimmed === '*' || trimmed === 'true' || trimmed === 'public') {
      return { allowed: true };
    }

    // 4. "false" means completely locked even to authenticated non-admins
    if (trimmed === 'false') {
      return { allowed: false };
    }

    // 5. Parse and compile rule expression
    return this.compileRuleToSQL(trimmed, context);
  }

  /**
   * Compiles rule expressions like `@request.auth.id = user` or `@request.auth.id != ""`
   * into a safe SQL WHERE condition with parameter substitution.
   */
  static compileRuleToSQL(ruleExpr, context) {
    const auth = context.auth;
    const params = [];

    // Replace @request.auth.* macros
    let processed = ruleExpr;

    // Check if rule requires auth when user is not logged in
    if (processed.includes('@request.auth') && !auth) {
      // If rule is "@request.auth.id != ''" and no auth, immediately fail
      if (processed.includes('@request.auth.id != ""') || processed.includes("@request.auth.id != ''")) {
        return { allowed: false };
      }
      // If comparing with empty string or checking null
      processed = processed
        .replace(/@request\.auth\.id/g, "''")
        .replace(/@request\.auth\.\w+/g, "''");
    } else if (auth) {
      processed = processed
        .replace(/@request\.auth\.id/g, () => {
          params.push(auth.id);
          return '?';
        })
        .replace(/@request\.auth\.email/g, () => {
          params.push(auth.email || '');
          return '?';
        })
        .replace(/@request\.auth\.(\w+)/g, (_, field) => {
          params.push(auth[field] !== undefined ? auth[field] : '');
          return '?';
        });
    }

    // Transform logic operators to SQL
    processed = processed
      .replace(/&&/g, ' AND ')
      .replace(/\|\|/g, ' OR ')
      .replace(/==/g, ' = ')
      .replace(/!=/g, ' <> ')
      .replace(/~=/g, ' LIKE ')
      .replace(/~/g, ' LIKE ');

    return { allowed: true, sqlFilter: processed, params };
  }

  /**
   * Parses client filter string like `(status = "active" && price > 50) || name ~ "laptop"`
   * into safe parameterized SQL WHERE clause.
   */
  static parseFilter(filterString, allowedFields) {
    if (!filterString || !filterString.trim()) {
      return { sql: '', params: [] };
    }

    const params = [];
    const fieldsSet = new Set(allowedFields.map(f => f.toLowerCase()));
    // System fields always allowed
    fieldsSet.add('id');
    fieldsSet.add('created');
    fieldsSet.add('updated');

    // Tokenizer regex: matches tokens like (field, operator, string/num literal, parenthesis, logical AND/OR)
    const tokenRegex = /(\(|\)|\&\&|\|\||!=|>=|<=|==|=|>|<|~|!~|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|[a-zA-Z_][a-zA-Z0-9_\.]*|-?\d+(?:\.\d+)?|true|false|null)/gi;
    const tokens = filterString.match(tokenRegex);

    if (!tokens || tokens.length === 0) {
      return { sql: '', params: [] };
    }

    let sql = '';

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i].trim();

      if (token === '&&') {
        sql += ' AND ';
      } else if (token === '||') {
        sql += ' OR ';
      } else if (token === '(' || token === ')') {
        sql += token;
      } else if (token === '=' || token === '==') {
        sql += ' = ';
      } else if (token === '!=') {
        sql += ' != ';
      } else if (token === '>') {
        sql += ' > ';
      } else if (token === '<') {
        sql += ' < ';
      } else if (token === '>=') {
        sql += ' >= ';
      } else if (token === '<=') {
        sql += ' <= ';
      } else if (token === '~') {
        sql += ' LIKE ';
      } else if (token === '!~') {
        sql += ' NOT LIKE ';
      } else if (token.startsWith('"') || token.startsWith("'")) {
        // String literal
        const rawStr = token.slice(1, -1).replace(/\\(["'])/g, '$1');
        // If previous operator was LIKE/NOT LIKE, wrap with %
        const prevOp = tokens[i - 1]?.trim();
        if (prevOp === '~' || prevOp === '!~') {
          params.push(`%${rawStr}%`);
        } else {
          params.push(rawStr);
        }
        sql += '?';
      } else if (/^-?\d+(\.\d+)?$/.test(token)) {
        // Number literal
        params.push(Number(token));
        sql += '?';
      } else if (token.toLowerCase() === 'true') {
        params.push(1);
        sql += '?';
      } else if (token.toLowerCase() === 'false') {
        params.push(0);
        sql += '?';
      } else if (token.toLowerCase() === 'null') {
        sql += 'NULL';
      } else {
        // Identifier / field name
        if (fieldsSet.has(token.toLowerCase())) {
          sql += `"${token}"`;
        } else {
          // If not a recognized field name, treat as literal value
          params.push(token);
          sql += '?';
        }
      }
    }

    return { sql: `(${sql})`, params };
  }
}
