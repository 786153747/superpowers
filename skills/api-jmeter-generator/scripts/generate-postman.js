#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DEFAULT_AUTH = {
  loginPath: '/login',
  method: 'POST',
  body: {
    username: 'admin',
    password: 'admin123',
  },
  tokenExtract: '$.token',
  headerName: 'Authorization',
  headerPrefix: 'Bearer ',
};

function formatValue(value) {
  if (value == null) {
    return '';
  }
  return String(value);
}

function isPostmanVariable(value) {
  return /^\{\{[^{}]+\}\}$/.test(value);
}

function normalizeAuth(auth) {
  return {
    ...DEFAULT_AUTH,
    ...(auth || {}),
    body: {
      ...DEFAULT_AUTH.body,
      ...((auth && auth.body) || {}),
    },
  };
}

function replacePathParams(apiPath, params) {
  let resolvedPath = apiPath || '';
  if (!params || params.type !== 'path' || !Array.isArray(params.fields)) {
    return resolvedPath;
  }

  for (const field of params.fields) {
    const token = `{${field.name}}`;
    const value = formatValue(field.value);
    const replacement = isPostmanVariable(value) ? value : encodeURIComponent(value);
    resolvedPath = resolvedPath.split(token).join(replacement);
  }

  return resolvedPath;
}

function buildQueryString(fields) {
  if (!Array.isArray(fields) || fields.length === 0) {
    return '';
  }

  return fields
    .map((field) => {
      const key = encodeURIComponent(formatValue(field.name));
      const rawValue = formatValue(field.value);
      const value = isPostmanVariable(rawValue) ? rawValue : encodeURIComponent(rawValue);
      return `${key}=${value}`;
    })
    .join('&');
}

function buildRawUrl(baseUrl, api) {
  const resolvedPath = replacePathParams(api.path, api.params);
  const queryString = api.params && api.params.type === 'query'
    ? buildQueryString(api.params.fields)
    : '';

  const trimmedBaseUrl = String(baseUrl || '').replace(/\/+$/, '');
  const normalizedPath = resolvedPath.startsWith('/') ? resolvedPath : `/${resolvedPath}`;
  const rawUrl = `${trimmedBaseUrl}${normalizedPath}`;
  return queryString ? `${rawUrl}?${queryString}` : rawUrl;
}

function buildRequestBody(contentType, payload) {
  const language = contentType && contentType.includes('json') ? 'json' : 'text';
  return {
    mode: 'raw',
    raw: JSON.stringify(payload || {}, null, 2),
    options: {
      raw: {
        language,
      },
    },
  };
}

function parseSimpleJsonPath(expression) {
  if (typeof expression !== 'string') {
    return null;
  }

  const source = expression.trim();
  if (source === '$') {
    return [];
  }
  if (!source.startsWith('$')) {
    return null;
  }

  const segments = [];
  let index = 1;

  while (index < source.length) {
    const char = source[index];

    if (char === '.') {
      index += 1;
      const start = index;
      while (index < source.length && /[A-Za-z0-9_$]/.test(source[index])) {
        index += 1;
      }
      if (start === index) {
        return null;
      }
      segments.push(source.slice(start, index));
      continue;
    }

    if (char === '[') {
      index += 1;
      if (index >= source.length) {
        return null;
      }

      if (source[index] === '\'' || source[index] === '"') {
        const quote = source[index];
        index += 1;
        let value = '';
        while (index < source.length && source[index] !== quote) {
          if (source[index] === '\\' && index + 1 < source.length) {
            value += source[index + 1];
            index += 2;
          } else {
            value += source[index];
            index += 1;
          }
        }
        if (index >= source.length || source[index] !== quote) {
          return null;
        }
        index += 1;
        if (index >= source.length || source[index] !== ']') {
          return null;
        }
        index += 1;
        segments.push(value);
        continue;
      }

      const start = index;
      while (index < source.length && /[0-9]/.test(source[index])) {
        index += 1;
      }
      if (start === index || index >= source.length || source[index] !== ']') {
        return null;
      }
      segments.push(Number(source.slice(start, index)));
      index += 1;
      continue;
    }

    return null;
  }

  return segments;
}

function buildScriptPrelude() {
  return [
    'let responseJson = null;',
    'try {',
    '  responseJson = pm.response.json();',
    '} catch (error) {',
    '  responseJson = null;',
    '}',
    '',
    'function getByPath(root, path) {',
    '  return path.reduce(function (value, segment) {',
    '    if (value === undefined || value === null) {',
    '      return undefined;',
    '    }',
    '    return value[segment];',
    '  }, root);',
    '}',
    '',
  ];
}

function buildLoginEvents(auth) {
  const lines = [
    'pm.test("Login status is 200", function () {',
    '  pm.response.to.have.status(200);',
    '});',
    '',
    ...buildScriptPrelude(),
  ];

  const tokenPath = parseSimpleJsonPath(auth.tokenExtract);
  if (tokenPath) {
    lines.push(`const tokenValue = getByPath(responseJson, ${JSON.stringify(tokenPath)});`);
    lines.push('pm.test("Token extracted", function () {');
    lines.push('  pm.expect(tokenValue).to.not.equal(undefined);');
    lines.push('  pm.expect(tokenValue).to.not.equal(null);');
    lines.push('});');
    lines.push('if (tokenValue !== undefined && tokenValue !== null && tokenValue !== "") {');
    lines.push('  pm.collectionVariables.set("token", String(tokenValue));');
    lines.push('}');
  } else {
    lines.push(`// Unsupported tokenExtract JSONPath: ${auth.tokenExtract}`);
  }

  return [
    {
      listen: 'test',
      script: {
        type: 'text/javascript',
        exec: lines,
      },
    },
  ];
}

function buildAssertionEvents(api) {
  if (!Array.isArray(api.assertions) || api.assertions.length === 0) {
    return undefined;
  }

  const hasJsonAssertions = api.assertions.some((assertion) => assertion.type === 'jsonpath');
  const lines = [];

  for (const assertion of api.assertions) {
    if (assertion.type === 'status') {
      const statusCode = Number(assertion.value);
      lines.push(`pm.test("Status is ${assertion.value}", function () {`);
      if (Number.isFinite(statusCode)) {
        lines.push(`  pm.response.to.have.status(${statusCode});`);
      } else {
        lines.push(`  pm.expect(String(pm.response.code)).to.eql(${JSON.stringify(formatValue(assertion.value))});`);
      }
      lines.push('});');
      lines.push('');
    }
  }

  if (hasJsonAssertions) {
    lines.push(...buildScriptPrelude());
  }

  let valueIndex = 0;
  for (const assertion of api.assertions) {
    if (assertion.type !== 'jsonpath') {
      continue;
    }

    const pathSegments = parseSimpleJsonPath(assertion.path);
    if (!pathSegments) {
      lines.push(`// Unsupported JSONPath assertion: ${assertion.path}`);
      lines.push('');
      continue;
    }

    const variableName = `value${valueIndex}`;
    valueIndex += 1;
    lines.push(`const ${variableName} = getByPath(responseJson, ${JSON.stringify(pathSegments)});`);

    if (assertion.condition === 'exists') {
      lines.push(`pm.test("JSONPath ${assertion.path} exists", function () {`);
      lines.push(`  pm.expect(${variableName}).to.not.equal(undefined);`);
      lines.push(`  pm.expect(${variableName}).to.not.equal(null);`);
      lines.push('});');
      lines.push('');
      continue;
    }

    lines.push(`pm.test("JSONPath ${assertion.path} equals ${formatValue(assertion.value)}", function () {`);
    lines.push(`  pm.expect(String(${variableName})).to.eql(${JSON.stringify(formatValue(assertion.value))});`);
    lines.push('});');
    lines.push('');
  }

  return [
    {
      listen: 'test',
      script: {
        type: 'text/javascript',
        exec: lines,
      },
    },
  ];
}

function buildCollectionVariables(baseUrl, auth) {
  const variables = [
    {
      key: 'baseUrl',
      value: formatValue(baseUrl),
    },
    {
      key: 'token',
      value: '',
    },
  ];

  const body = auth.body || {};
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string' && !variables.some((item) => item.key === key)) {
      variables.push({
        key,
        value,
      });
    }
  }

  return variables;
}

function buildLoginBody(authBody) {
  if (!authBody || typeof authBody !== 'object' || Array.isArray(authBody)) {
    return buildRequestBody('application/json', authBody);
  }

  const payload = {};
  for (const [key, value] of Object.entries(authBody)) {
    payload[key] = typeof value === 'string' ? `{{${key}}}` : value;
  }

  return buildRequestBody('application/json', payload);
}

function buildApiRequest(api, auth, baseUrl) {
  const headers = [];
  if (api.contentType) {
    headers.push({
      key: 'Content-Type',
      value: api.contentType,
      type: 'text',
    });
  }

  if (auth.headerName) {
    headers.push({
      key: auth.headerName,
      value: `${auth.headerPrefix || ''}{{token}}`,
      type: 'text',
    });
  }

  const request = {
    method: api.method,
    header: headers,
    url: buildRawUrl('{{baseUrl}}', api),
    description: api.controller ? `Controller: ${api.controller}` : undefined,
  };

  if (api.params && api.params.type === 'body') {
    request.body = buildRequestBody(api.contentType, api.params.json);
  }

  const item = {
    name: api.id ? `${api.id}: ${api.name}` : (api.name || api.path),
    request,
  };

  const events = buildAssertionEvents(api);
  if (events) {
    item.event = events;
  }

  return item;
}

function buildPostmanCollection(data) {
  const auth = normalizeAuth(data.auth);
  const variables = buildCollectionVariables(data.baseUrl || 'http://localhost:8080', auth);
  const items = [];

  items.push({
    name: 'Login',
    request: {
      method: auth.method,
      header: [
        {
          key: 'Content-Type',
          value: 'application/json',
          type: 'text',
        },
      ],
      url: `{{baseUrl}}${auth.loginPath}`,
      body: buildLoginBody(auth.body),
      description: 'Login request used to capture the token into {{token}}.',
    },
    event: buildLoginEvents(auth),
  });

  for (const api of data.apis || []) {
    items.push(buildApiRequest(api, auth, data.baseUrl));
  }

  return {
    info: {
      name: `${data.projectName || 'API'} Collection`,
      description: 'Generated from api.json by api-jmeter-generator.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    variable: variables,
    item: items,
  };
}

function generatePostman(jsonPath, outputPath) {
  const absJsonPath = path.resolve(jsonPath);
  const data = JSON.parse(fs.readFileSync(absJsonPath, 'utf-8'));
  const resolvedOutputPath = path.resolve(
    outputPath || path.join(path.dirname(absJsonPath), 'postman.json')
  );
  const collection = buildPostmanCollection(data);
  fs.writeFileSync(resolvedOutputPath, `${JSON.stringify(collection, null, 2)}\n`, 'utf-8');

  return {
    outputPath: resolvedOutputPath,
    apiCount: Array.isArray(data.apis) ? data.apis.length : 0,
    requestCount: Array.isArray(collection.item) ? collection.item.length : 0,
  };
}

function main() {
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    console.error('Usage: node scripts/generate-postman.js <json-file-path> [output-path]');
    process.exit(1);
  }

  const absJsonPath = path.resolve(jsonPath);
  if (!fs.existsSync(absJsonPath)) {
    console.error(`File not found: ${absJsonPath}`);
    process.exit(1);
  }

  const outputPath = process.argv[3];
  const result = generatePostman(absJsonPath, outputPath);
  console.log(`Generated Postman collection: ${result.outputPath}`);
  console.log(`API count: ${result.apiCount}`);
  console.log(`Requests in collection: ${result.requestCount}`);
}

if (require.main === module) {
  main();
}

module.exports = {
  buildPostmanCollection,
  generatePostman,
};
