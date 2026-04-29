# API接口文档

## 📋 文档信息

- **项目名称**: AI辅助单据管理系统
- **API版本**: v1.0
- **创建日期**: 2026-04-28
- **协议**: HTTP/HTTPS
- **数据格式**: JSON

---

## 🌐 1. API概述

### 1.1 基础信息

- **Base URL**: `/api`
- **认证方式**: 当前版本暂无认证（使用LocalStorage）
- **响应格式**: JSON
- **字符编码**: UTF-8

### 1.2 通用响应格式

**成功响应**:
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

**错误响应**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误信息描述"
  }
}
```

### 1.3 HTTP状态码

| 状态码 | 说明 | 使用场景 |
|-------|------|----------|
| 200 | OK | 请求成功 |
| 201 | Created | 资源创建成功 |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未授权（暂未使用） |
| 403 | Forbidden | 禁止访问（暂未使用） |
| 404 | Not Found | 资源不存在 |
| 500 | Internal Server Error | 服务器内部错误 |

---

## 🤖 2. AI助手API

### 2.1 AI对话接口

#### POST /api/ai/assistant

**功能描述**: 与AI助手进行对话交互

**请求参数**:
```json
{
  "message": "用户输入的消息",
  "conversationId": "对话ID（可选，首次对话不传）",
  "context": {
    "documentTypeId": "当前关联的单据类型ID（可选）",
    "formData": "当前表单数据（可选）"
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "conversationId": "conv_123456",
    "message": {
      "id": "msg_789",
      "role": "assistant",
      "content": "根据您描述的问题，建议您提交技术求援单...",
      "references": [
        {
          "type": "article",
          "id": "kb_002",
          "title": "电池故障常见问题排查",
          "excerpt": "故障码 P181900 - 单体电压过高..."
        }
      ],
      "suggestedAction": "create_document",
      "suggestedDocumentTypeId": "doctype_support_feedback",
      "timestamp": "2026-04-28T10:30:00Z"
    },
    "extractedInfo": {
      "vin": "LK6ADAE15ME534998",
      "faultCode": "P181900",
      "description": "充电时显示电池单体电压过高"
    }
  }
}
```

**错误响应**:
```json
{
  "success": false,
  "error": {
    "code": "AI_SERVICE_ERROR",
    "message": "AI服务暂时不可用，请稍后再试"
  }
}
```

### 2.2 AI生成字段接口

#### POST /api/ai/generate-fields

**功能描述**: AI根据描述自动生成表单字段

**请求参数**:
```json
{
  "documentTypeName": "单据类型名称",
  "description": "业务描述",
  "requirements": [
    "需要包含VIN码字段",
    "需要故障码和故障描述"
  ]
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "fields": [
      {
        "id": "field_1",
        "type": "text",
        "label": "VIN码",
        "name": "vin",
        "required": true,
        "placeholder": "请输入17位VIN码",
        "maxLength": 17,
        "minLength": 17,
        "pattern": "^[A-HJ-NPR-Z0-9]{17}$",
        "width": "third"
      },
      {
        "id": "field_2",
        "type": "text",
        "label": "故障码",
        "name": "fault_code",
        "required": false,
        "placeholder": "请输入故障码",
        "width": "third"
      }
    ],
    "suggestions": [
      "建议添加故障描述字段",
      "建议配置VIN码联动车辆信息"
    ]
  }
}
```

### 2.3 AI生成工作流接口

#### POST /api/ai/generate-workflow

**功能描述**: AI根据业务描述生成工作流模板

**请求参数**:
```json
{
  "documentTypeName": "单据类型名称",
  "businessDescription": "业务流程描述",
  "approvalLevels": [
    {
      "role": "技术支持",
      "description": "技术部门审批"
    },
    {
      "role": "财务",
      "description": "财务部门审批"
    }
  ]
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "workflow": {
      "nodes": [
        {
          "id": "start",
          "type": "start",
          "position": { "x": 100, "y": 100 },
          "data": { "label": "开始" }
        },
        {
          "id": "approve_1",
          "type": "approve",
          "position": { "x": 300, "y": 100 },
          "data": {
            "label": "技术支持审批",
            "approvers": {
              "type": "role",
              "value": ["role_tech_support"]
            }
          }
        }
      ],
      "edges": [
        {
          "id": "e1",
          "source": "start",
          "target": "approve_1"
        }
      ]
    },
    "suggestions": [
      "建议添加超时处理节点",
      "建议添加条件分支，根据紧急程度走不同流程"
    ]
  }
}
```

---

## 📝 3. 注意事项

### 3.1 当前限制

1. **数据存储**: 所有数据存储在客户端LocalStorage，受浏览器存储限制
2. **并发控制**: 不支持多用户并发操作
3. **数据同步**: 不支持跨设备数据同步
4. **安全认证**: 当前版本无用户认证机制

### 3.2 性能考虑

1. **AI响应时间**: AI接口响应时间取决于AI服务提供商
2. **数据量限制**: LocalStorage有5-10MB的存储限制
3. **并发请求**: 建议控制并发请求数量

### 3.3 错误处理

所有API错误都应该在前端进行适当处理，显示友好的错误提示信息。

### 3.4 未来扩展

未来版本计划添加：
1. 服务端API支持
2. 数据库持久化
3. 用户认证和授权
4. WebSocket实时通信
5. 文件上传接口
6. 批量操作接口

---

## 🔧 4. 开发指南

### 4.1 前端调用示例

```typescript
// AI对话调用示例
async function chatWithAI(message: string, conversationId?: string) {
  try {
    const response = await fetch('/api/ai/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversationId,
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error.message);
    }
  } catch (error) {
    console.error('AI对话失败:', error);
    throw error;
  }
}
```

### 4.2 错误处理示例

```typescript
async function safeAPICall() {
  try {
    const response = await fetch('/api/ai/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: '你好' }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    // 显示用户友好的错误提示
    showError('AI服务暂时不可用，请稍后再试');
    console.error('API调用失败:', error);
  }
}
```

### 4.3 类型定义

```typescript
// API响应类型定义
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

// AI对话请求类型
interface AIChatRequest {
  message: string;
  conversationId?: string;
  context?: {
    documentTypeId?: string;
    formData?: Record<string, any>;
  };
}

// AI对话响应类型
interface AIChatResponse {
  conversationId: string;
  message: AIMessage;
  extractedInfo?: Record<string, any>;
}
```

---

## 📚 5. 相关文档

- [系统功能设计文档](./system-design.md)
- [用户故事文档](./user-stories.md)
- [数据库设计文档](./database-design.md) *(待创建)*
- [部署指南](./deployment-guide.md) *(待创建)*

---

## 🔄 6. 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0 | 2026-04-28 | 初始版本，定义基础AI接口 | 项目团队 |

---

**文档版本**: v1.0  
**最后更新**: 2026-04-28  
**维护者**: 项目团队