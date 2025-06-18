# WebSocket Server Documentation

Tài liệu hướng dẫn chi tiết cho WebSocket Server được xây dựng với Clean Architecture.

## 📚 Danh Sách Tài Liệu

### 1. [Kiến Trúc Hệ Thống](./ARCHITECTURE.md)
- Tổng quan Clean Architecture
- Chi tiết các layers
- Dependency Injection
- Message Processing Pipeline
- Data Flow và Error Handling

### 2. [API Reference](./API_REFERENCE.md)
- WebSocket connection endpoints
- Message formats và types
- Error codes và responses
- Validation schemas
- Client library examples

### 3. [Hướng Dẫn Mở Rộng](./EXTENSION_GUIDE.md)
- Thêm message types mới
- Tạo use cases
- Implement repositories
- Thêm middleware
- Best practices

### 4. [Hướng Dẫn Testing](./TESTING.md)
- Unit testing
- Integration testing
- E2E testing
- Test helpers và utilities
- Performance testing

### 5. [Hướng Dẫn Triển Khai](./DEPLOYMENT.md)
- Development setup
- Production build
- Docker deployment
- Scaling strategies
- Monitoring và security

## 🚀 Quick Start

### Development
```bash
# Install dependencies
bun install

# Run development server
bun run dev
```

### Testing
```bash
# Run all tests
bun test

# Run specific test suite
bun test:unit
bun test:integration
bun test:e2e
```

### Production
```bash
# Build for production
bun run build

# Start production server
bun run start
```

## 📖 Đọc Theo Thứ Tự

Nếu bạn mới bắt đầu với project này, đề nghị đọc theo thứ tự:

1. **ARCHITECTURE.md** - Hiểu tổng quan kiến trúc
2. **API_REFERENCE.md** - Tìm hiểu các API endpoints
3. **EXTENSION_GUIDE.md** - Học cách mở rộng chức năng
4. **TESTING.md** - Viết tests cho code của bạn
5. **DEPLOYMENT.md** - Triển khai lên production

## 🔧 Công Cụ Hỗ Trợ

- **Bun.js**: JavaScript runtime và package manager
- **TypeScript**: Type-safe development
- **Zod**: Runtime validation
- **Winston**: Structured logging
- **Clean Architecture**: Maintainable code structure

## 📝 Đóng Góp

Khi đóng góp vào project:

1. Đọc kỹ tài liệu liên quan
2. Follow Clean Architecture principles
3. Viết tests cho features mới
4. Update documentation khi cần thiết
5. Submit PR với description rõ ràng

## 🤝 Hỗ Trợ

Nếu bạn cần hỗ trợ:

1. Kiểm tra tài liệu đã có
2. Tìm trong existing issues
3. Tạo issue mới với chi tiết đầy đủ
4. Tag đúng loại issue (bug, feature, question)

## 📄 License

[License information here]