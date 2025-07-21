const fs = require('fs');

let openapi;
try {
  openapi = JSON.parse(fs.readFileSync('openapi.json', 'utf-8'));
} catch (error) {
  console.error('Error: openapi.json not found or invalid. Please export it from API Gateway first.');
  process.exit(1);
}

const outputDir = 'frontend/src/__tests__/api';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function generateTestFile(path, operation, operationId) {
  const testContent = `
  import { ${operationId} } from '../../api';
  import axios from 'axios';
  import MockAdapter from 'axios-mock-adapter';

  describe('${path} ${operation.toUpperCase()}', () => {
    let mock;

    beforeAll(() => {
      mock = new MockAdapter(axios);
    });

    afterEach(() => {
      mock.reset();
    });

    afterAll(() => {
      mock.restore();
    });

    it('should call ${path} successfully', async () => {
      mock.on${operation.toUpperCase()}('${path}').reply(200, { success: true });

      const response = await ${operationId}();
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ success: true });
    });
  });
  `;
  const testFilePath = `${outputDir}/${operationId}.test.ts`;
  fs.writeFileSync(testFilePath, testContent);
}

Object.keys(openapi.paths).forEach((path) => {
  Object.keys(openapi.paths[path]).forEach((operation) => {
    const rawOpId = openapi.paths[path][operation].operationId || `${operation}${path.replace(/[^a-zA-Z0-9]/g, '')}`;
    const operationId = rawOpId.replace(/[^a-zA-Z0-9]/g, '');
    generateTestFile(path, operation, operationId);
  });
});

console.log('Generated Jest test files');
