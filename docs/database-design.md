# 数据库设计文档

## 📋 文档信息

- **项目名称**: AI辅助单据管理系统
- **文档版本**: v1.0
- **创建日期**: 2026-04-28
- **存储方式**: LocalStorage (客户端)
- **数据格式**: JSON

---

## 🗄️ 1. 数据存储概述

### 1.1 存储架构

当前系统使用浏览器LocalStorage进行数据存储，所有数据以JSON格式存储在客户端。

**存储键命名规范**: `lowcode_{entity_name}`

**存储位置**: 浏览器LocalStorage
**存储限制**: 5-10MB（取决于浏览器）
**数据格式**: JSON字符串

### 1.2 数据分类

| 分类 | 数据类型 | 存储键 | 说明 |
|------|---------|--------|------|
| 用户数据 | User | lowcode_users | 用户信息 |
| 角色数据 | Role | lowcode_roles | 角色和权限 |
| 单据类型 | DocumentType | lowcode_document_types | 单据类型定义 |
| 单据数据 | Document | lowcode_documents | 业务单据实例 |
| 工作流 | WorkflowConfig | lowcode_workflows | 工作流配置 |
| 审批记录 | ApprovalRecord | lowcode_approvals | 审批历史 |
| 知识库 | KnowledgeArticle | lowcode_knowledge_articles | 知识文章 |
| AI对话 | AIConversation | lowcode_ai_conversations | AI对话记录 |
| 基础数据 | Part/Order/Vehicle | lowcode_parts/orders/vehicles | 业务基础数据 |

---

## 👥 2. 用户和权限数据

### 2.1 用户表 (lowcode_users)

**数据结构**:
```json
{
  "users": [
    {
      "id": "user_admin",
      "username": "admin",
      "name": "管理员",
      "email": "admin@example.com",
      "department": "技术部",
      "roles": ["role_admin"],
      "status": "active",
      "createdAt": "2026-04-28T10:00:00Z",
      "updatedAt": "2026-04-28T10:00:00Z"
    }
  ]
}
```

**字段说明**:

| 字段名 | 类型 | 必填 | 说明 | 约束 |
|-------|------|------|------|------|
| id | string | 是 | 用户唯一标识 | 主键，自动生成 |
| username | string | 是 | 用户名 | 唯一，登录账号 |
| name | string | 是 | 姓名 | 显示名称 |
| email | string | 否 | 邮箱 | 联系方式 |
| department | string | 否 | 部门 | 组织结构 |
| roles | string[] | 是 | 角色ID列表 | 关联角色表 |
| status | string | 是 | 状态 | active/inactive |
| createdAt | string | 是 | 创建时间 | ISO 8601格式 |
| updatedAt | string | 是 | 更新时间 | ISO 8601格式 |

**索引设计**:
- username: 唯一索引
- status: 普通索引

### 2.2 角色表 (lowcode_roles)

**数据结构**:
```json
{
  "roles": [
    {
      "id": "role_admin",
      "name": "系统管理员",
      "code": "admin",
      "description": "拥有系统所有权限",
      "permissions": [],
      "createdAt": "2026-04-28T10:00:00Z",
      "updatedAt": "2026-04-28T10:00:00Z"
    }
  ]
}
```

**字段说明**:

| 字段名 | 类型 | 必填 | 说明 | 约束 |
|-------|------|------|------|------|
| id | string | 是 | 角色唯一标识 | 主键 |
| name | string | 是 | 角色名称 | 显示名称 |
| code | string | 是 | 角色代码 | 唯一标识 |
| description | string | 否 | 角色描述 | 详细说明 |
| permissions | Permission[] | 是 | 权限列表 | 权限对象数组 |
| createdAt | string | 是 | 创建时间 | ISO 8601格式 |
| updatedAt | string | 是 | 更新时间 | ISO 8601格式 |

---

## 📋 3. 单据相关数据

### 3.1 单据类型表 (lowcode_document_types)

**数据结构**:
```json
{
  "documentTypes": [
    {
      "id": "doctype_support_feedback",
      "name": "技术求援单",
      "code": "support_feedback",
      "description": "经销商技术问题求援反馈表",
      "fields": [
        {
          "id": "field_vin",
          "type": "text",
          "label": "VIN码",
          "name": "vin",
          "required": true,
          "placeholder": "请输入17位VIN码",
          "maxLength": 17,
          "minLength": 17,
          "pattern": "^[A-HJ-NPR-Z0-9]{17}$",
          "width": "third",
          "linkage": {
            "sourceField": "vin",
            "sourceType": "vin",
            "targetMappings": [
              {
                "targetField": "vehicle_platform",
                "sourceProperty": "platformName"
              }
            ]
          }
        }
      ],
      "layout": "vertical",
      "numberRule": {
        "prefix": "TECH",
        "dateFormat": "YYYYMMDD",
        "sequenceLength": 4,
        "resetCycle": "monthly"
      },
      "workflowEnabled": true,
      "actionButtons": [],
      "enableReply": true,
      "status": "published",
      "order": 1,
      "createdAt": "2026-04-28T10:00:00Z",
      "updatedAt": "2026-04-28T10:00:00Z"
    }
  ]
}
```

**字段说明**:

| 字段名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| id | string | 是 | 单据类型唯一标识 |
| name | string | 是 | 单据类型名称 |
| code | string | 是 | 单据类型代码 |
| description | string | 否 | 单据类型描述 |
| fields | FormField[] | 是 | 表单字段配置 |
| layout | string | 是 | 布局方式 |
| numberRule | object | 否 | 单号生成规则 |
| workflowEnabled | boolean | 是 | 是否启用工作流 |
| actionButtons | ActionButton[] | 是 | 操作按钮配置 |
| enableReply | boolean | 是 | 是否启用回复 |
| status | string | 是 | 状态 |
| order | number | 是 | 排序 |
| createdAt | string | 是 | 创建时间 |
| updatedAt | string | 是 | 更新时间 |

### 3.2 单据数据表 (lowcode_documents)

**数据结构**:
```json
{
  "documents": [
    {
      "id": "doc_123456",
      "documentNumber": "TECH2026042800001",
      "documentTypeId": "doctype_support_feedback",
      "formId": "doctype_support_feedback",
      "appId": null,
      "formData": {
        "vin": "LK6ADAE15ME534998",
        "vehicle_platform": "宏光MINIEV",
        "vehicle_config": "马卡龙版",
        "fault_code": "P181900",
        "fault_description": "车辆充电时显示电池单体电压过高",
        "fault_type": "battery",
        "contact_name": "张三",
        "contact_phone": "13800138000"
      },
      "status": "pending",
      "currentNodeId": "node_approve_1",
      "workflowId": "workflow_tech_support",
      "createdBy": "user_zhangsan",
      "createdByName": "张三",
      "createdAt": "2026-04-28T10:30:00Z",
      "updatedAt": "2026-04-28T10:30:00Z"
    }
  ]
}
```

**字段说明**:

| 字段名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| id | string | 是 | 单据唯一标识 |
| documentNumber | string | 是 | 单据编号 |
| documentTypeId | string | 是 | 单据类型ID |
| formId | string | 否 | 兼容旧版本 |
| appId | string | 否 | 应用ID |
| formData | object | 是 | 表单数据 |
| status | string | 是 | 单据状态 |
| currentNodeId | string | 否 | 当前流程节点ID |
| workflowId | string | 否 | 工作流ID |
| createdBy | string | 是 | 创建人ID |
| createdByName | string | 是 | 创建人姓名 |
| createdAt | string | 是 | 创建时间 |
| updatedAt | string | 是 | 更新时间 |

### 3.3 工作流配置表 (lowcode_workflows)

**数据结构**:
```json
{
  "workflows": [
    {
      "id": "workflow_tech_support",
      "name": "技术求援审批流程",
      "categoryId": "doctype_support_feedback",
      "description": "技术求援单的标准审批流程",
      "nodes": [
        {
          "id": "node_start",
          "type": "start",
          "position": { "x": 100, "y": 100 },
          "data": {
            "label": "开始"
          }
        },
        {
          "id": "node_approve_1",
          "type": "approve",
          "position": { "x": 300, "y": 100 },
          "data": {
            "label": "技术支持审批",
            "description": "技术支持工程师审批",
            "approvers": {
              "type": "role",
              "value": ["role_tech_support"],
              "multiApprove": "any"
            },
            "timeout": 72,
            "timeoutAction": "notify",
            "permissions": [
              {
                "roleId": "role_tech_support",
                "fieldPermissions": {
                  "vin": { "visible": true, "editable": false },
                  "fault_description": { "visible": true, "editable": true }
                },
                "canView": true,
                "canEdit": false,
                "canApprove": true,
                "canReject": true,
                "canTransfer": true,
                "canComment": true
              }
            ]
          }
        }
      ],
      "edges": [
        {
          "id": "edge_1",
          "source": "node_start",
          "target": "node_approve_1",
          "label": "提交"
        }
      ],
      "events": [
        {
          "id": "event_submit",
          "type": "submit",
          "name": "提交事件",
          "fromStatus": ["draft"],
          "toStatus": "pending",
          "actions": [
            {
              "type": "notify",
              "config": {
                "recipients": {
                  "type": "role",
                  "value": ["role_tech_support"]
                },
                "template": "新的技术求援单待处理"
              }
            }
          ]
        }
      ],
      "statuses": [
        {
          "id": "status_draft",
          "code": "draft",
          "name": "草稿",
          "color": "#gray",
          "isInitial": true,
          "order": 1
        },
        {
          "id": "status_pending",
          "code": "pending",
          "name": "待审批",
          "color": "#blue",
          "order": 2
        },
        {
          "id": "status_approved",
          "code": "approved",
          "name": "已通过",
          "color": "#green",
          "isFinal": true,
          "order": 3
        },
        {
          "id": "status_rejected",
          "code": "rejected",
          "name": "已驳回",
          "color": "#red",
          "order": 4
        }
      ],
      "status": "published",
      "createdAt": "2026-04-28T10:00:00Z",
      "updatedAt": "2026-04-28T10:00:00Z"
    }
  ]
}
```

### 3.4 审批记录表 (lowcode_approvals)

**数据结构**:
```json
{
  "approvals": [
    {
      "id": "approval_123456",
      "documentId": "doc_123456",
      "nodeId": "node_approve_1",
      "nodeName": "技术支持审批",
      "approverId": "user_tech_01",
      "approverName": "技术工程师李四",
      "action": "approve",
      "comment": "已确认故障，同意提供技术支持",
      "createdAt": "2026-04-28T14:30:00Z"
    }
  ]
}
```

---

## 🤖 4. AI相关数据

### 4.1 知识库文章表 (lowcode_knowledge_articles)

**数据结构**:
```json
{
  "knowledgeArticles": [
    {
      "id": "kb_002",
      "title": "电池故障常见问题排查",
      "category": "troubleshooting",
      "content": "# 电池故障常见问题排查\n\n## 故障码 P181900 - 单体电压过高\n\n### 可能原因\n1. BMS检测异常\n2. 单体电池老化\n3. 充电系统问题",
      "tags": ["电池", "故障排查", "BMS", "故障码"],
      "keywords": ["电池", "P181900", "P182A00", "故障码", "单体电压", "温度异常", "BMS"],
      "relatedDocumentTypes": ["doctype_support_feedback"],
      "viewCount": 89,
      "helpful": 28,
      "status": "published",
      "createdBy": "user_admin",
      "createdByName": "管理员",
      "createdAt": "2026-04-28T10:00:00Z",
      "updatedAt": "2026-04-28T10:00:00Z"
    }
  ]
}
```

**字段说明**:

| 字段名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| id | string | 是 | 文章唯一标识 |
| title | string | 是 | 文章标题 |
| category | string | 是 | 文章分类 |
| content | string | 是 | 文章内容 |
| tags | string[] | 是 | 标签列表 |
| keywords | string[] | 是 | 关键词列表 |
| relatedDocumentTypes | string[] | 否 | 关联单据类型 |
| viewCount | number | 是 | 浏览次数 |
| helpful | number | 是 | 有用次数 |
| status | string | 是 | 状态 |
| createdBy | string | 是 | 创建人ID |
| createdByName | string | 是 | 创建人姓名 |
| createdAt | string | 是 | 创建时间 |
| updatedAt | string | 是 | 更新时间 |

### 4.2 AI对话记录表 (lowcode_ai_conversations)

**数据结构**:
```json
{
  "aiConversations": [
    {
      "id": "conv_123456",
      "userId": "user_zhangsan",
      "userName": "张三",
      "messages": [
        {
          "id": "msg_001",
          "role": "user",
          "content": "我的车充电时显示电池故障码P181900，怎么办？",
          "timestamp": "2026-04-28T10:15:00Z"
        },
        {
          "id": "msg_002",
          "role": "assistant",
          "content": "根据您描述的问题，这是关于电池单体电压过高的故障...",
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
          "timestamp": "2026-04-28T10:15:05Z"
        }
      ],
      "resolved": true,
      "createdDocumentId": "doc_123456",
      "createdAt": "2026-04-28T10:15:00Z",
      "updatedAt": "2026-04-28T10:20:00Z"
    }
  ]
}
```

### 4.3 AI规则配置表 (lowcode_ai_document_rules)

**数据结构**:
```json
{
  "aiDocumentRules": [
    {
      "id": "rule_battery_issue",
      "name": "电池问题规则",
      "description": "当用户提到电池、充电、续航等问题时的处理规则",
      "enabled": true,
      "priority": 2,
      "matchConditions": [
        {
          "id": "cond_1",
          "type": "keyword",
          "value": "电池,充电,续航,电量,BMS,充不进,充电慢",
          "matchMode": "contains"
        }
      ],
      "matchLogic": "or",
      "action": {
        "type": "show_guide",
        "guideMessage": "关于电池/充电问题，请先确认：\n1. 充电桩是否正常工作\n2. 充电枪连接是否牢固\n3. 是否有相关故障码\n\n如果以上检查都正常但问题仍存在，建议提交技术求援单。",
        "relatedArticleIds": ["kb_002", "kb_003"],
        "documentTypeId": "doctype_support_feedback"
      },
      "createdAt": "2026-04-28T10:00:00Z",
      "updatedAt": "2026-04-28T10:00:00Z"
    }
  ]
}
```

---

## 📦 5. 基础数据表

### 5.1 配件信息表 (lowcode_parts)

**数据结构**:
```json
{
  "parts": [
    {
      "id": "part_001",
      "partNumber": "23697773",
      "partName": "前蒙皮主体",
      "category": "车身覆盖件",
      "specification": "原厂件",
      "unit": "件",
      "price": 1200,
      "supplier": "原厂供应商",
      "applicableModels": ["宏光MINIEV", "五菱缤果"],
      "status": "active",
      "createdAt": "2026-04-28T10:00:00Z",
      "updatedAt": "2026-04-28T10:00:00Z"
    }
  ]
}
```

### 5.2 订单信息表 (lowcode_orders)

**数据结构**:
```json
{
  "orders": [
    {
      "id": "order_001",
      "orderNumber": "PO202604150001",
      "deliveryNumber": "817589781",
      "warehouse": "柳州中心库",
      "dealerCode": "6331172",
      "dealerName": "浙江杭州宏达4S店",
      "orderDate": "2026-04-15",
      "deliveryDate": "2026-04-18",
      "status": "delivered",
      "items": [
        {
          "id": "item_001",
          "orderId": "order_001",
          "partNumber": "23697773",
          "partName": "前蒙皮主体",
          "quantity": 2,
          "price": 1200,
          "amount": 2400
        }
      ],
      "createdAt": "2026-04-28T10:00:00Z",
      "updatedAt": "2026-04-28T10:00:00Z"
    }
  ]
}
```

### 5.3 车辆信息表 (lowcode_vehicles)

**数据结构**:
```json
{
  "vehicles": [
    {
      "id": "vehicle_001",
      "vin": "LK6ADAE15ME534998",
      "platform": "宏光MINIEV",
      "model": "宏光MINIEV 马卡龙版",
      "productionDate": "2021-09-21",
      "engineNumber": "",
      "color": "白桃粉",
      "dealerCode": "6331172",
      "saleDate": "2021-10-15",
      "status": "active",
      "createdAt": "2026-04-28T10:00:00Z",
      "updatedAt": "2026-04-28T10:00:00Z"
    }
  ]
}
```

---

## 🔗 6. 数据关系图

### 6.1 实体关系图 (ERD)

```
用户 (User) ─────┐
                 │
                 ├──> 角色 (Role) ───> 权限 (Permission)
                 │
                 ├──> 单据 ─────────> 单据类型
                 │    │                    │
                 │    ├──> 工作流 ─────────┘
                 │    ├──> 审批记录 (ApprovalRecord)
                 │    └──> 单据回复 (DocumentReply)
                 │
                 └──> AI对话 (AIConversation)
                      ├──> 知识库文章
                      └──> AI规则

基础数据:
- 配件
- 订单
- 车辆
```

### 6.2 主要关联关系

| 关联类型 | 主实体 | 从实体 | 关联字段 |
|---------|-------|-------|----------|
| 一对多 | User | Document | createdBy |
| 一对多 | DocumentType | Document | documentTypeId |
| 一对多 | Workflow | Document | workflowId |
| 一对多 | Document | ApprovalRecord | documentId |
| 一对多 | Document | DocumentReply | documentId |
| 一对多 | User | AIConversation | userId |
| 一对多 | User | KnowledgeArticle | createdBy |
| 一对多 | DocumentType | KnowledgeArticle | relatedDocumentTypes |

---

## 🔒 7. 数据安全和隐私

### 7.1 数据安全措施

1. **数据验证**: 所有输入数据都经过严格验证
2. **XSS防护**: 对用户输入进行转义处理
3. **数据加密**: 敏感数据在传输时加密
4. **访问控制**: 基于角色的数据访问控制

### 7.2 隐私保护

1. **最小化收集**: 只收集必要的用户信息
2. **数据匿名化**: 支持数据脱敏处理
3. **数据保留**: 定期清理过期数据
4. **用户权利**: 支持用户查看和删除自己的数据

### 7.3 备份策略

由于使用LocalStorage，建议：
1. 定期导出重要数据
2. 跨设备同步数据
3. 实施数据版本控制

---

## 📊 8. 数据统计和分析

### 8.1 关键指标

| 指标 | 说明 | 用途 |
|------|------|------|
| 单据创建数量 | 统计各类型单据的创建数量 | 业务量分析 |
| 审批处理时间 | 统计审批节点的平均处理时间 | 效率分析 |
| AI对话成功率 | 统计AI解决问题的比例 | AI效果评估 |
| 用户活跃度 | 统计用户登录和使用频率 | 用户行为分析 |
| 知识库使用率 | 统计知识文章的查看次数 | 内容质量评估 |

### 8.2 数据查询示例

```typescript
// 查询待审批单据
const pendingDocuments = documents.filter(doc => 
  doc.status === 'pending' && 
  doc.currentNodeId === 'node_approve_1'
);

// 查询用户创建的单据
const userDocuments = documents.filter(doc => 
  doc.createdBy === 'user_zhangsan'
);

// 查询热门知识文章
const popularArticles = knowledgeArticles
  .sort((a, b) => b.viewCount - a.viewCount)
  .slice(0, 10);

// 统计单据类型分布
const docTypeStats = documents.reduce((stats, doc) => {
  stats[doc.documentTypeId] = (stats[doc.documentTypeId] || 0) + 1;
  return stats;
}, {});
```

---

## 🚀 9. 数据迁移策略

### 9.1 版本升级迁移

当数据结构发生变化时：
1. 检查数据版本
2. 备份现有数据
3. 执行迁移脚本
4. 验证数据完整性
5. 清理旧数据

### 9.2 数据导出导入

```typescript
// 数据导出
function exportData() {
  const data = {
    users: userStorage.getAll(),
    documents: documentStorage.getAll(),
    documentTypes: documentTypeStorage.getAll(),
    // ... 其他数据
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_${new Date().toISOString()}.json`;
  a.click();
}

// 数据导入
function importData(jsonData: string) {
  try {
    const data = JSON.parse(jsonData);
    
    // 验证数据格式
    if (!data.users || !data.documents) {
      throw new Error('数据格式不正确');
    }
    
    // 导入数据
    data.users.forEach(user => userStorage.save(user));
    data.documents.forEach(doc => documentStorage.save(doc));
    // ... 其他数据
    
    console.log('数据导入成功');
  } catch (error) {
    console.error('数据导入失败:', error);
  }
}
```

---

## 📈 10. 未来数据库规划

### 10.1 升级到服务端数据库

当前LocalStorage方案的限制：
- 存储容量有限（5-10MB）
- 不支持多用户并发
- 无法跨设备同步
- 安全性较低

未来升级方向：
- **数据库选择**: PostgreSQL/MySQL
- **ORM工具**: Prisma/TypeORM
- **缓存层**: Redis
- **搜索引擎**: Elasticsearch

### 10.2 数据表优化

1. **分区策略**: 按时间或业务类型分区
2. **索引优化**: 为常用查询字段创建索引
3. **数据归档**: 定期归档历史数据
4. **读写分离**: 主从复制提高性能

---

## 📚 11. 相关文档

- [系统功能设计文档](./system-design.md)
- [API接口文档](./api-documentation.md)
- [用户故事文档](./user-stories.md)

---

**文档版本**: v1.0  
**最后更新**: 2026-04-28  
**维护者**: 项目团队