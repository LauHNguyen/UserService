const fs = require('fs');
const path = require('path');

// Đọc openapi.json
const openapi = JSON.parse(fs.readFileSync('openapi.json', 'utf-8'));

// Thư mục đầu ra cho các file test
const outputDir = path.join('frontend', 'src', '__tests__', 'api');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Hàm tạo file test cho mỗi endpoint
function generateTestFile(path, operation, operationId) {
  const testContent = `
  import { ${operationId} } from '../api';
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
  const testFilePath = path.join(outputDir, `${operationId}.test.ts`);
  fs.writeFileSync(testFilePath, testContent);
}

// Parse openapi.json và tạo test
Object.keys(openapi.paths).forEach((path) => {
  Object.keys(openapi.paths[path]).forEach((operation) => {
    const operationId = openapi.paths[path][operation].operationId || `${operation}_${path.replace(/\//g, '_')}`;
    generateTestFile(path, operation, operationId);
  });
});

console.log('Generated Jest test files');