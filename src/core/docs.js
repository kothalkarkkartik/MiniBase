import { SchemaManager } from './schema.js';

export function generateOpenApiSpec(req) {
  const collections = SchemaManager.getAllCollections();
  const host = req?.get?.('host') || 'localhost:8090';
  const protocol = req?.protocol || 'http';
  const baseUrl = `${protocol}://${host}`;

  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'MiniBase BaaS — API Documentation',
      version: '1.0.0',
      description: 'Ultra-lightweight, zero-config Backend-as-a-Service with embedded SQLite WAL engine.',
    },
    servers: [
      { url: baseUrl, description: 'Live MiniBase Server' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Pass your Admin or User JWT token in the Authorization header'
        }
      },
      schemas: {}
    },
    paths: {
      '/api/health': {
        get: {
          tags: ['System'],
          summary: 'Health Check',
          description: 'Returns server operational status, app name, and uptime timestamp.',
          responses: {
            '200': { description: 'Server is healthy' }
          }
        }
      },
      '/api/admins/auth-with-password': {
        post: {
          tags: ['Admin Auth'],
          summary: 'Admin Login',
          description: 'Authenticate as Super-Admin using email and password to receive JWT token.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', example: 'admin@minibase.io' },
                    password: { type: 'string', example: 'admin12345' }
                  },
                  required: ['email', 'password']
                }
              }
            }
          },
          responses: {
            '200': { description: 'Authenticated successfully with token and admin profile.' }
          }
        }
      },
      '/api/admins/register': {
        post: {
          tags: ['Admin Auth'],
          summary: 'Admin Self-Registration',
          description: 'Register a new Super-Admin account.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', example: 'newadmin@minibase.io' },
                    password: { type: 'string', example: 'password12345' }
                  },
                  required: ['email', 'password']
                }
              }
            }
          },
          responses: {
            '201': { description: 'Admin registered successfully' }
          }
        }
      }
    }
  };

  for (const col of collections) {
    const colName = col.name;
    const properties = {
      id: { type: 'string', example: '4xRpAfkehPL8I5u' },
      created: { type: 'string', format: 'date-time' },
      updated: { type: 'string', format: 'date-time' }
    };

    if (col.type === 'auth') {
      properties.email = { type: 'string', format: 'email', example: 'user@example.com' };
      properties.verified = { type: 'integer', example: 0 };
      properties.emailVisibility = { type: 'integer', example: 0 };
    }

    for (const f of col.schema) {
      if (f.type === 'number') {
        properties[f.name] = { type: 'number', example: 100 };
      } else if (f.type === 'bool') {
        properties[f.name] = { type: 'boolean', example: true };
      } else if (f.type === 'json') {
        properties[f.name] = { type: 'object' };
      } else {
        properties[f.name] = { type: 'string', example: `${f.name}_sample` };
      }
    }

    spec.components.schemas[colName] = {
      type: 'object',
      properties
    };

    spec.paths[`/api/collections/${colName}/records`] = {
      get: {
        tags: [colName],
        summary: `List & Filter ${colName}`,
        description: `Query records in "${colName}" with filtering, sorting, pagination, and search.`,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
          { name: 'perPage', in: 'query', schema: { type: 'integer', default: 30 }, description: 'Items per page (max 500)' },
          { name: 'sort', in: 'query', schema: { type: 'string' }, description: 'Sort by fields (e.g. -created,name)' },
          { name: 'filter', in: 'query', schema: { type: 'string' }, description: 'Filter expression (e.g. verified = 1)' }
        ],
        responses: { '200': { description: 'List of records' } }
      },
      post: {
        tags: [colName],
        summary: `Create Record in ${colName}`,
        description: `Insert a new record into "${colName}".`,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ...properties,
                  ...(col.type === 'auth' ? { password: { type: 'string', minLength: 8, example: 'password123' } } : {})
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Record created' } }
      }
    };

    spec.paths[`/api/collections/${colName}/records/{id}`] = {
      get: {
        tags: [colName],
        summary: `Get ${colName} Record`,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Record details' } }
      },
      patch: {
        tags: [colName],
        summary: `Update ${colName} Record`,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties } } }
        },
        responses: { '200': { description: 'Record updated' } }
      },
      delete: {
        tags: [colName],
        summary: `Delete ${colName} Record`,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '204': { description: 'Record deleted' } }
      }
    };

    spec.paths[`/api/collections/${colName}/export`] = {
      get: {
        tags: [colName],
        summary: `Export ${colName} (CSV / JSON)`,
        parameters: [{ name: 'format', in: 'query', schema: { type: 'string', enum: ['csv', 'json'], default: 'csv' } }],
        responses: { '200': { description: 'Downloadable file' } }
      }
    };

    if (col.type === 'auth') {
      spec.paths[`/api/collections/${colName}/auth-with-password`] = {
        post: {
          tags: [colName],
          summary: `Login User (${colName})`,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    identity: { type: 'string', example: 'user@example.com' },
                    password: { type: 'string', example: 'password123' }
                  },
                  required: ['identity', 'password']
                }
              }
            }
          },
          responses: { '200': { description: 'JWT Token and user record' } }
        }
      };
    }
  }

  return spec;
}

