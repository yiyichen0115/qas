# 单据管理系统数据库表结构设计

## 概述
基于当前单据关联和系统功能设计的MySQL关系型数据库表结构，支持单据管理、工作流、权限控制、AI功能等核心业务。

## 数据库设计原则

1. **规范化设计**：遵循第三范式，减少数据冗余
2. **性能优化**：合理设计索引，提升查询性能
3. **扩展性**：预留扩展字段，支持业务发展
4. **数据完整性**：合理使用外键约束，保证数据一致性
5. **审计追踪**：记录关键操作的历史数据

## 核心业务表

### 1. 单据类型表 (document_types)
```sql
CREATE TABLE document_types (
    id VARCHAR(50) PRIMARY KEY COMMENT '单据类型ID，如doctype_lac',
    name VARCHAR(100) NOT NULL COMMENT '单据类型名称',
    code VARCHAR(50) NOT NULL UNIQUE COMMENT '类型代码，如LAC',
    icon VARCHAR(50) COMMENT '图标名称',
    description TEXT COMMENT '类型描述',

    -- 单号规则配置
    number_prefix VARCHAR(20) COMMENT '单号前缀',
    number_date_format VARCHAR(20) COMMENT '日期格式：YYYYMMDD/YYMMDD',
    number_sequence_length INT DEFAULT 4 COMMENT '流水号位数',
    number_reset_cycle ENUM('daily', 'monthly', 'yearly', 'never') DEFAULT 'daily' COMMENT '重置周期',

    -- 功能配置
    layout ENUM('vertical', 'horizontal', 'grid') DEFAULT 'vertical',
    enable_reply BOOLEAN DEFAULT TRUE COMMENT '是否启用回复',
    allow_manual_create BOOLEAN DEFAULT TRUE COMMENT '是否允许手动创建',
    parent_doc_type_id VARCHAR(50) COMMENT '父单据类型ID',

    -- 状态和排序
    status ENUM('draft', 'published') DEFAULT 'draft',
    sort_order INT DEFAULT 0,

    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50) COMMENT '创建人ID',
    updated_by VARCHAR(50) COMMENT '更新人ID',

    INDEX idx_code (code),
    INDEX idx_status (status),
    INDEX idx_parent (parent_doc_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='单据类型配置表';
```

### 2. 表单字段配置表 (form_fields)
```sql
CREATE TABLE form_fields (
    id VARCHAR(50) PRIMARY KEY COMMENT '字段ID',
    doc_type_id VARCHAR(50) NOT NULL COMMENT '所属单据类型ID',
    parent_field_id VARCHAR(50) COMMENT '父字段ID（用于子表字段）',

    -- 字段基本信息
    field_type ENUM(
        'text', 'number', 'textarea', 'date', 'datetime',
        'select', 'radio', 'checkbox', 'switch', 'file',
        'richtext', 'subtable', 'signature', 'cascade',
        'formula', 'divider', 'description', 'related_documents'
    ) NOT NULL COMMENT '字段类型',
    field_name VARCHAR(100) NOT NULL COMMENT '字段名称',
    field_label VARCHAR(100) NOT NULL COMMENT '字段标签',
    placeholder VARCHAR(200) COMMENT '占位符',

    -- 验证规则
    is_required BOOLEAN DEFAULT FALSE,
    default_value TEXT COMMENT '默认值',
    min_length INT COMMENT '最小长度',
    max_length INT COMMENT '最大长度',
    min_value DECIMAL(20,6) COMMENT '最小值',
    max_value DECIMAL(20,6) COMMENT '最大值',
    pattern VARCHAR(200) COMMENT '正则表达式',

    -- 显示配置
    width ENUM('full', 'half', 'third') DEFAULT 'third',
    is_hidden BOOLEAN DEFAULT FALSE,
    is_disabled BOOLEAN DEFAULT FALSE,
    description TEXT COMMENT '字段描述',
    sort_order INT DEFAULT 0,

    -- 选项配置（用于select、radio等）
    options JSON COMMENT '选项配置：[{label, value}]',

    -- 联动配置
    linkage_config JSON COMMENT '字段联动配置',

    -- 关联单据配置
    related_doc_config JSON COMMENT '关联单据配置',

    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_doc_type (doc_type_id),
    INDEX idx_parent (parent_field_id),
    INDEX idx_order (doc_type_id, sort_order),

    FOREIGN KEY (doc_type_id) REFERENCES document_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='表单字段配置表';
```

### 3. 单据实例表 (documents)
```sql
CREATE TABLE documents (
    id VARCHAR(50) PRIMARY KEY COMMENT '单据ID',
    document_number VARCHAR(100) NOT NULL UNIQUE COMMENT '单据编号',
    document_type_id VARCHAR(50) NOT NULL COMMENT '单据类型ID',
    app_id VARCHAR(50) COMMENT '应用ID',

    -- 单据数据
    form_data JSON NOT NULL COMMENT '表单数据',
    status VARCHAR(50) NOT NULL DEFAULT 'draft' COMMENT '单据状态',
    current_node_id VARCHAR(50) COMMENT '当前工作流节点ID',
    workflow_id VARCHAR(50) COMMENT '工作流ID',

    -- 人员信息
    created_by VARCHAR(50) NOT NULL COMMENT '创建人ID',
    created_by_name VARCHAR(100) NOT NULL COMMENT '创建人姓名',
    updated_by VARCHAR(50) COMMENT '更新人ID',

    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP COMMENT '提交时间',
    completed_at TIMESTAMP COMMENT '完成时间',

    -- 扩展字段
    source_document_id VARCHAR(50) COMMENT '源单据ID',
    source_document_number VARCHAR(100) COMMENT '源单据号',
    tags JSON COMMENT '标签数组',
    attributes JSON COMMENT '扩展属性',

    INDEX idx_type (document_type_id),
    INDEX idx_status (status),
    INDEX idx_created_by (created_by),
    INDEX idx_created_at (created_at),
    INDEX idx_number (document_number),
    INDEX idx_source (source_document_id),

    FULLTEXT idx_form_data (form_data) WITH PARSER json,

    FOREIGN KEY (document_type_id) REFERENCES document_types(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='单据实例表';
```

### 4. 工作流配置表 (workflows)
```sql
CREATE TABLE workflows (
    id VARCHAR(50) PRIMARY KEY COMMENT '工作流ID',
    name VARCHAR(100) NOT NULL COMMENT '工作流名称',
    category_id VARCHAR(50) NOT NULL COMMENT '关联单据类型ID',
    description TEXT COMMENT '工作流描述',

    -- 流程配置
    nodes JSON NOT NULL COMMENT '流程节点配置',
    edges JSON NOT NULL COMMENT '流程连线配置',
    events JSON COMMENT '流程事件配置',
    statuses JSON COMMENT '状态配置',

    -- 状态管理
    status ENUM('draft', 'published') DEFAULT 'draft',
    version INT DEFAULT 1 COMMENT '版本号',

    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50) COMMENT '创建人ID',

    INDEX idx_category (category_id),
    INDEX idx_status (status),

    FOREIGN KEY (category_id) REFERENCES document_types(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作流配置表';
```

### 5. 审批记录表 (approvals)
```sql
CREATE TABLE approvals (
    id VARCHAR(50) PRIMARY KEY COMMENT '审批记录ID',
    document_id VARCHAR(50) NOT NULL COMMENT '单据ID',
    node_id VARCHAR(50) NOT NULL COMMENT '节点ID',
    node_name VARCHAR(100) NOT NULL COMMENT '节点名称',

    -- 审批人信息
    approver_id VARCHAR(50) NOT NULL COMMENT '审批人ID',
    approver_name VARCHAR(100) NOT NULL COMMENT '审批人姓名',
    approver_role VARCHAR(50) COMMENT '审批人角色',

    -- 审批结果
    action ENUM('approve', 'reject', 'return', 'transfer') NOT NULL COMMENT '审批动作',
    comment TEXT COMMENT '审批意见',
    attachments JSON COMMENT '附件列表',

    -- 审批时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '审批时间',

    -- 扩展信息
    next_approver_id VARCHAR(50) COMMENT '转单人ID',
    process_duration INT COMMENT '处理时长（秒）',

    INDEX idx_document (document_id),
    INDEX idx_approver (approver_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at),

    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审批记录表';
```

### 6. 单据回复表 (document_replies)
```sql
CREATE TABLE document_replies (
    id VARCHAR(50) PRIMARY KEY COMMENT '回复ID',
    document_id VARCHAR(50) NOT NULL COMMENT '单据ID',
    parent_id VARCHAR(50) COMMENT '父回复ID（用于回复的回复）',

    -- 回复人信息
    user_id VARCHAR(50) NOT NULL COMMENT '回复人ID',
    user_name VARCHAR(100) NOT NULL COMMENT '回复人姓名',
    user_avatar VARCHAR(200) COMMENT '回复人头像',

    -- 回复内容
    content TEXT NOT NULL COMMENT '回复内容',
    attachments JSON COMMENT '附件列表',

    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '回复时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- 状态
    is_deleted BOOLEAN DEFAULT FALSE COMMENT '是否已删除',

    INDEX idx_document (document_id),
    INDEX idx_user (user_id),
    INDEX idx_parent (parent_id),
    INDEX idx_created_at (created_at),

    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='单据回复表';
```

## 用户权限表

### 7. 用户表 (users)
```sql
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY COMMENT '用户ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    email VARCHAR(100) UNIQUE COMMENT '邮箱',
    phone VARCHAR(20) COMMENT '手机号',

    -- 基本信息
    name VARCHAR(100) NOT NULL COMMENT '姓名',
    avatar VARCHAR(200) COMMENT '头像URL',
    department VARCHAR(100) COMMENT '部门',
    position VARCHAR(100) COMMENT '职位',

    -- 状态信息
    status ENUM('active', 'inactive', 'locked') DEFAULT 'active' COMMENT '用户状态',
    last_login_at TIMESTAMP COMMENT '最后登录时间',
    last_login_ip VARCHAR(50) COMMENT '最后登录IP',

    -- 扩展信息
    attributes JSON COMMENT '扩展属性',
    preferences JSON COMMENT '用户偏好设置',

    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50) COMMENT '创建人ID',

    INDEX idx_status (status),
    INDEX idx_department (department),
    INDEX idx_last_login (last_login_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
```

### 8. 角色表 (roles)
```sql
CREATE TABLE roles (
    id VARCHAR(50) PRIMARY KEY COMMENT '角色ID',
    name VARCHAR(100) NOT NULL COMMENT '角色名称',
    code VARCHAR(50) NOT NULL UNIQUE COMMENT '角色代码',
    description TEXT COMMENT '角色描述',

    -- 角色类型
    role_type ENUM('system', 'custom') DEFAULT 'custom' COMMENT '角色类型',
    level INT DEFAULT 0 COMMENT '角色等级（数字越大权限越高）',

    -- 状态管理
    status ENUM('active', 'inactive') DEFAULT 'active',
    sort_order INT DEFAULT 0,

    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_code (code),
    INDEX idx_status (status),
    INDEX idx_type_level (role_type, level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';
```

### 9. 用户角色关联表 (user_roles)
```sql
CREATE TABLE user_roles (
    id VARCHAR(50) PRIMARY KEY COMMENT '关联ID',
    user_id VARCHAR(50) NOT NULL COMMENT '用户ID',
    role_id VARCHAR(50) NOT NULL COMMENT '角色ID',

    -- 有效期
    expired_at TIMESTAMP NULL COMMENT '过期时间（NULL表示永久）',

    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) COMMENT '授权人ID',

    UNIQUE KEY uk_user_role (user_id, role_id),
    INDEX idx_user (user_id),
    INDEX idx_role (role_id),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';
```

### 10. 权限表 (permissions)
```sql
CREATE TABLE permissions (
    id VARCHAR(50) PRIMARY KEY COMMENT '权限ID',
    parent_id VARCHAR(50) COMMENT '父权限ID',
    name VARCHAR(100) NOT NULL COMMENT '权限名称',
    code VARCHAR(100) NOT NULL UNIQUE COMMENT '权限代码',
    description TEXT COMMENT '权限描述',

    -- 权限类型
    resource_type ENUM('page', 'button', 'field', 'data', 'api') NOT NULL COMMENT '资源类型',
    action_type ENUM('view', 'create', 'edit', 'delete', 'export', 'import', 'approve') NOT NULL COMMENT '操作类型',

    -- 资源标识
    resource_id VARCHAR(100) COMMENT '资源ID',
    resource_path VARCHAR(200) COMMENT '资源路径',

    -- 层级结构
    level INT DEFAULT 0 COMMENT '层级深度',
    sort_order INT DEFAULT 0 COMMENT '排序',

    -- 状态
    status ENUM('active', 'inactive') DEFAULT 'active',

    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_parent (parent_id),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表';
```

### 11. 角色权限关联表 (role_permissions)
```sql
CREATE TABLE role_permissions (
    id VARCHAR(50) PRIMARY KEY COMMENT '关联ID',
    role_id VARCHAR(50) NOT NULL COMMENT '角色ID',
    permission_id VARCHAR(50) NOT NULL COMMENT '权限ID',

    -- 权限条件（用于数据权限控制）
    conditions JSON COMMENT '权限条件',

    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) COMMENT '授权人ID',

    UNIQUE KEY uk_role_permission (role_id, permission_id),
    INDEX idx_role (role_id),
    INDEX idx_permission (permission_id),

    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';
```

## 基础数据表

### 12. 配件基础库表 (parts)
```sql
CREATE TABLE parts (
    id VARCHAR(50) PRIMARY KEY COMMENT '配件ID',
    part_number VARCHAR(100) NOT NULL UNIQUE COMMENT '配件编号',
    part_name VARCHAR(200) NOT NULL COMMENT '配件名称',

    -- 配件分类
    category VARCHAR(100) COMMENT '配件分类',
    specification VARCHAR(200) COMMENT '规格型号',
    unit VARCHAR(20) COMMENT '单位',

    -- 价格信息
    price DECIMAL(10,2) COMMENT '单价',
    currency VARCHAR(10) DEFAULT 'CNY' COMMENT '货币',

    -- 供应商信息
    supplier VARCHAR(100) COMMENT '供应商',
    supplier_code VARCHAR(50) COMMENT '供应商代码',

    -- 适用车型
    applicable_models JSON COMMENT '适用车型数组',

    -- 状态
    status ENUM('active', 'inactive') DEFAULT 'active',

    -- 扩展信息
    attributes JSON COMMENT '扩展属性',
    images JSON COMMENT '图片数组',

    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50) COMMENT '创建人ID',

    INDEX idx_number (part_number),
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_supplier (supplier),
    FULLTEXT idx_name (part_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配件基础库表';
```

### 13. 车辆基础库表 (vehicles)
```sql
CREATE TABLE vehicles (
    id VARCHAR(50) PRIMARY KEY COMMENT '车辆ID',
    vin VARCHAR(50) NOT NULL UNIQUE COMMENT 'VIN码',

    -- 车型信息
    platform VARCHAR(100) COMMENT '车型平台',
    model VARCHAR(100) COMMENT '车型',
    year INT COMMENT '年份',

    -- 生产信息
    production_date DATE COMMENT '生产日期',
    engine_number VARCHAR(50) COMMENT '发动机号',
    color VARCHAR(50) COMMENT '颜色',

    -- 销售信息
    dealer_code VARCHAR(50) COMMENT '经销商代码',
    dealer_name VARCHAR(200) COMMENT '经销商名称',
    sale_date DATE COMMENT '销售日期',

    -- 状态
    status ENUM('active', 'inactive') DEFAULT 'active',

    -- 扩展信息
    attributes JSON COMMENT '扩展属性',

    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_vin (vin),
    INDEX idx_model (model),
    INDEX idx_dealer (dealer_code),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='车辆基础库表';
```

### 14. 订单基础库表 (orders)
```sql
CREATE TABLE orders (
    id VARCHAR(50) PRIMARY KEY COMMENT '订单ID',
    order_number VARCHAR(100) NOT NULL UNIQUE COMMENT '订单号',
    delivery_number VARCHAR(100) COMMENT '发货号',

    -- 仓库信息
    warehouse VARCHAR(100) COMMENT '发货仓库',

    -- 经销商信息
    dealer_code VARCHAR(50) COMMENT '经销商代码',
    dealer_name VARCHAR(200) COMMENT '经销商名称',

    -- 时间信息
    order_date DATE COMMENT '订单日期',
    delivery_date DATE COMMENT '发货日期',

    -- 订单金额
    total_amount DECIMAL(12,2) COMMENT '订单总金额',
    currency VARCHAR(10) DEFAULT 'CNY' COMMENT '货币',

    -- 状态
    status ENUM('pending', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',

    -- 扩展信息
    attributes JSON COMMENT '扩展属性',

    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_number (order_number),
    INDEX idx_delivery (delivery_number),
    INDEX idx_dealer (dealer_code),
    INDEX idx_status (status),
    INDEX idx_dates (order_date, delivery_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单基础库表';

-- 订单明细表 (order_items)
CREATE TABLE order_items (
    id VARCHAR(50) PRIMARY KEY COMMENT '明细ID',
    order_id VARCHAR(50) NOT NULL COMMENT '订单ID',

    -- 配件信息
    part_number VARCHAR(100) NOT NULL COMMENT '配件编号',
    part_name VARCHAR(200) NOT NULL COMMENT '配件名称',

    -- 数量和价格
    quantity INT NOT NULL COMMENT '数量',
    unit_price DECIMAL(10,2) COMMENT '单价',
    total_price DECIMAL(12,2) COMMENT '小计',

    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_order (order_id),
    INDEX idx_part (part_number),

    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单明细表';
```

## 系统配置表

### 15. 应用配置表 (applications)
```sql
CREATE TABLE applications (
    id VARCHAR(50) PRIMARY KEY COMMENT '应用ID',
    name VARCHAR(100) NOT NULL COMMENT '应用名称',
    description TEXT COMMENT '应用描述',
    icon VARCHAR(50) COMMENT '图标',

    -- 关联配置
    document_type_id VARCHAR(50) NOT NULL COMMENT '关联单据类型ID',
    workflow_id VARCHAR(50) COMMENT '关联工作流ID',
    page_id VARCHAR(50) COMMENT '关联页面ID',

    -- 状态
    status ENUM('draft', 'published') DEFAULT 'draft',

    -- 排序
    sort_order INT DEFAULT 0,

    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_doc_type (document_type_id),
    INDEX idx_status (status),

    FOREIGN KEY (document_type_id) REFERENCES document_types(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='应用配置表';
```

### 16. 页面配置表 (page_configs)
```sql
CREATE TABLE page_configs (
    id VARCHAR(50) PRIMARY KEY COMMENT '页面配置ID',
    name VARCHAR(100) NOT NULL COMMENT '页面名称',
    page_type ENUM('list', 'form', 'detail', 'kanban', 'dashboard') NOT NULL COMMENT '页面类型',

    -- 关联配置
    document_type_id VARCHAR(50) COMMENT '关联单据类型ID',
    workflow_id VARCHAR(50) COMMENT '关联工作流ID',

    -- 页面配置
    layout_config JSON COMMENT '布局配置',
    columns JSON COMMENT '列表列配置',
    filters JSON COMMENT '筛选条件配置',
    actions JSON COMMENT '操作按钮配置',

    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_type (page_type),
    INDEX idx_doc_type (document_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='页面配置表';
```

## AI功能表

### 17. AI对话记录表 (ai_conversations)
```sql
CREATE TABLE ai_conversations (
    id VARCHAR(50) PRIMARY KEY COMMENT '对话ID',
    user_id VARCHAR(50) NOT NULL COMMENT '用户ID',
    user_name VARCHAR(100) NOT NULL COMMENT '用户姓名',

    -- 对话内容
    messages JSON NOT NULL COMMENT '消息数组',

    -- 对话结果
    is_resolved BOOLEAN DEFAULT FALSE COMMENT '是否已解决',
    created_document_id VARCHAR(50) COMMENT '创建的单据ID',

    -- 元数据
    session_id VARCHAR(100) COMMENT '会话ID',
    source ENUM('web', 'mobile', 'api') DEFAULT 'web' COMMENT '来源',

    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user (user_id),
    INDEX idx_session (session_id),
    INDEX idx_created_at (created_at),

    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI对话记录表';
```

### 18. 知识库文章表 (knowledge_articles)
```sql
CREATE TABLE knowledge_articles (
    id VARCHAR(50) PRIMARY KEY COMMENT '文章ID',
    title VARCHAR(200) NOT NULL COMMENT '文章标题',
    category ENUM('manual', 'faq', 'troubleshooting', 'specification', 'notice', 'other') NOT NULL COMMENT '分类',

    -- 内容
    content TEXT NOT NULL COMMENT '文章内容（Markdown格式）',

    -- 标签和关键词
    tags JSON COMMENT '标签数组',
    keywords JSON COMMENT '关键词数组',
    related_document_types JSON COMMENT '关联的单据类型ID数组',

    -- 统计信息
    view_count INT DEFAULT 0 COMMENT '查看次数',
    helpful_count INT DEFAULT 0 COMMENT '有帮助次数',

    -- 状态
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',

    -- 作者信息
    created_by VARCHAR(50) NOT NULL COMMENT '创建人ID',
    created_by_name VARCHAR(100) NOT NULL COMMENT '创建人姓名',

    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at TIMESTAMP COMMENT '发布时间',

    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_created_by (created_by),
    FULLTEXT idx_title_content (title, content),

    FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识库文章表';
```

### 19. AI文档规则表 (ai_document_rules)
```sql
CREATE TABLE ai_document_rules (
    id VARCHAR(50) PRIMARY KEY COMMENT '规则ID',
    name VARCHAR(100) NOT NULL COMMENT '规则名称',
    description TEXT COMMENT '规则描述',

    -- 规则配置
    match_conditions JSON NOT NULL COMMENT '匹配条件',
    match_logic ENUM('and', 'or') DEFAULT 'and' COMMENT '匹配逻辑',
    priority INT DEFAULT 0 COMMENT '优先级（数字越小优先级越高）',

    -- 触发动作
    action_type ENUM('suggest_document', 'auto_fill', 'show_guide', 'escalate') NOT NULL COMMENT '动作类型',
    action_config JSON NOT NULL COMMENT '动作配置',

    -- 状态
    enabled BOOLEAN DEFAULT TRUE COMMENT '是否启用',

    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50) COMMENT '创建人ID',

    INDEX idx_enabled_priority (enabled, priority),
    INDEX idx_action_type (action_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI文档规则表';
```

## 日志审计表

### 20. 操作日志表 (operation_logs)
```sql
CREATE TABLE operation_logs (
    id VARCHAR(50) PRIMARY KEY COMMENT '日志ID',
    user_id VARCHAR(50) COMMENT '操作用户ID',
    user_name VARCHAR(100) COMMENT '操作用户姓名',
    user_ip VARCHAR(50) COMMENT '操作IP地址',

    -- 操作信息
    operation_type VARCHAR(50) NOT NULL COMMENT '操作类型',
    resource_type VARCHAR(50) NOT NULL COMMENT '资源类型',
    resource_id VARCHAR(50) COMMENT '资源ID',
    resource_name VARCHAR(200) COMMENT '资源名称',

    -- 操作详情
    action VARCHAR(50) NOT NULL COMMENT '操作动作',
    description TEXT COMMENT '操作描述',
    request_data JSON COMMENT '请求数据',
    response_data JSON COMMENT '响应数据',

    -- 结果
    status ENUM('success', 'failure') DEFAULT 'success',
    error_message TEXT COMMENT '错误信息',

    -- 时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',

    INDEX idx_user (user_id),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_action (action),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';
```

### 21. 数据变更历史表 (data_change_history)
```sql
CREATE TABLE data_change_history (
    id VARCHAR(50) PRIMARY KEY COMMENT '变更记录ID',
    table_name VARCHAR(100) NOT NULL COMMENT '表名',
    record_id VARCHAR(50) NOT NULL COMMENT '记录ID',

    -- 变更信息
    operation_type ENUM('insert', 'update', 'delete') NOT NULL COMMENT '操作类型',
    old_data JSON COMMENT '变更前数据',
    new_data JSON COMMENT '变更后数据',
    changed_fields JSON COMMENT '变更字段列表',

    -- 操作人信息
    operated_by VARCHAR(50) NOT NULL COMMENT '操作人ID',
    operated_by_name VARCHAR(100) NOT NULL COMMENT '操作人姓名',
    operated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',

    -- 备注
    remark TEXT COMMENT '变更备注',

    INDEX idx_table_record (table_name, record_id),
    INDEX idx_operated_by (operated_by),
    INDEX idx_operated_at (operated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据变更历史表';
```

## 辅助表

### 22. 单号序列表 (document_sequences)
```sql
CREATE TABLE document_sequences (
    id VARCHAR(50) PRIMARY KEY COMMENT '序列ID',
    document_type_id VARCHAR(50) NOT NULL UNIQUE COMMENT '单据类型ID',
    prefix VARCHAR(20) NOT NULL COMMENT '单号前缀',

    -- 序列信息
    current_number INT NOT NULL DEFAULT 0 COMMENT '当前流水号',
    last_reset_date DATE COMMENT '上次重置日期',

    -- 重置周期
    reset_cycle ENUM('daily', 'monthly', 'yearly', 'never') DEFAULT 'daily' COMMENT '重置周期',

    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_doc_type (document_type_id),

    FOREIGN KEY (document_type_id) REFERENCES document_types(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='单号序列表';
```

### 23. 附件表 (attachments)
```sql
CREATE TABLE attachments (
    id VARCHAR(50) PRIMARY KEY COMMENT '附件ID',
    file_name VARCHAR(255) NOT NULL COMMENT '文件名',
    file_size INT NOT NULL COMMENT '文件大小（字节）',
    file_type VARCHAR(100) NOT NULL COMMENT '文件类型（MIME类型）',
    file_path VARCHAR(500) NOT NULL COMMENT '文件存储路径',
    file_url VARCHAR(500) COMMENT '文件访问URL',

    -- 关联信息
    related_type VARCHAR(50) NOT NULL COMMENT '关联类型：document/reply/conversation等',
    related_id VARCHAR(50) NOT NULL COMMENT '关联记录ID',

    -- 上传信息
    uploaded_by VARCHAR(50) NOT NULL COMMENT '上传人ID',
    uploaded_by_name VARCHAR(100) NOT NULL COMMENT '上传人姓名',

    -- 状态
    status ENUM('active', 'deleted') DEFAULT 'active',

    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_related (related_type, related_id),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_status (status),

    FOREIGN KEY (uploaded_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='附件表';
```

### 24. 通知表 (notifications)
```sql
CREATE TABLE notifications (
    id VARCHAR(50) PRIMARY KEY COMMENT '通知ID',
    title VARCHAR(200) NOT NULL COMMENT '通知标题',
    content TEXT NOT NULL COMMENT '通知内容',

    -- 接收人信息
    receiver_id VARCHAR(50) NOT NULL COMMENT '接收人ID',
    receiver_type ENUM('user', 'role') DEFAULT 'user' COMMENT '接收人类型',

    -- 通知类型
    notification_type ENUM('system', 'approval', 'reminder', 'mention') NOT NULL COMMENT '通知类型',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal' COMMENT '优先级',

    -- 关联信息
    related_type VARCHAR(50) COMMENT '关联类型',
    related_id VARCHAR(50) COMMENT '关联记录ID',

    -- 状态
    is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读',
    read_at TIMESTAMP COMMENT '阅读时间',

    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_receiver (receiver_id),
    INDEX idx_read_status (receiver_id, is_read),
    INDEX idx_created_at (created_at),

    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表';
```

## 索引优化建议

### 1. 复合索引设计
```sql
-- 单据查询优化
CREATE INDEX idx_doc_type_status_created ON documents(document_type_id, status, created_at DESC);
CREATE INDEX idx_doc_type_user_created ON documents(document_type_id, created_by, created_at DESC);

-- 审批记录查询优化
CREATE INDEX idx_approval_doc_created ON approvals(document_id, created_at DESC);
CREATE INDEX idx_approval_user_created ON approvals(approver_id, created_at DESC);

-- 关联单据查询优化
CREATE INDEX idx_doc_source_created ON documents(source_document_id, created_at DESC);
```

### 2. 全文索引设计
```sql
-- 知识库全文搜索
ALTER TABLE knowledge_articles ADD FULLTEXT INDEX ft_search (title, content, keywords);

-- 单据数据全文搜索
ALTER TABLE documents ADD FULLTEXT INDEX ft_form_data (form_data);
```

## 分区策略建议

### 1. 时间范围分区（适用于大数据量表）
```sql
-- 操作日志表按月分区
ALTER TABLE operation_logs PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at)) (
    PARTITION p202401 VALUES LESS THAN (202402),
    PARTITION p202402 VALUES LESS THAN (202403),
    -- ... 其他月份分区
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

### 2. 哈希分区（适用于高并发写入表）
```sql
-- 操作日志按用户ID哈希分区
ALTER TABLE operation_logs PARTITION BY HASH(user_id) PARTITIONS 8;
```

## 数据字典

### 表名与功能对应表
| 表名 | 功能说明 | 主要用途 |
|------|----------|----------|
| document_types | 单据类型配置 | 定义LAC、回货单等单据类型 |
| form_fields | 表单字段配置 | 配置单据表单字段 |
| documents | 单据实例 | 存储所有单据数据 |
| workflows | 工作流配置 | 定义审批流程 |
| approvals | 审批记录 | 记录审批历史 |
| document_replies | 单据回复 | 单据沟通记录 |
| users | 用户信息 | 用户基础数据 |
| roles | 角色信息 | 角色权限配置 |
| permissions | 权限配置 | 系统权限定义 |
| parts | 配件基础库 | 配件主数据 |
| vehicles | 车辆基础库 | 车辆主数据 |
| orders | 订单基础库 | 订单主数据 |
| knowledge_articles | 知识库 | AI知识库文章 |
| ai_conversations | AI对话记录 | 用户与AI的对话历史 |

### 字段类型说明
- **VARCHAR(50)**: ID字段，使用UUID或短ID
- **VARCHAR(100-200)**: 名称、描述等文本字段
- **TEXT**: 长文本内容，如文章内容、备注
- **JSON**: 复杂结构数据，如配置、选项、数组
- **TIMESTAMP**: 时间戳，自动记录创建和更新时间
- **DECIMAL(10,2)**: 金额字段，精确到分
- **ENUM**: 枚举类型，限制可选值

### 状态字段约定
- **status**: 主状态，如draft、published、active等
- **is_deleted**: 逻辑删除标记（软删除）
- **created_at/updated_at**: 审计时间戳
- **created_by/updated_by**: 审计用户ID

## 数据迁移策略

### 1. 从LocalStorage迁移到MySQL
```javascript
// 示例代码：迁移单据数据
const migrateDocuments = async () => {
  const localDocs = documentStorage.getAll()

  for (const doc of localDocs) {
    await db.insert('documents', {
      id: doc.id,
      document_number: doc.documentNumber,
      document_type_id: doc.documentTypeId,
      form_data: JSON.stringify(doc.formData),
      status: doc.status,
      created_by: doc.createdBy,
      created_by_name: doc.createdByName,
      created_at: doc.createdAt,
      updated_at: doc.updatedAt
    })
  }
}
```

### 2. 增量同步策略
- 使用触发器记录数据变更
- 定时任务同步增量数据
- 版本号控制避免数据冲突

## 性能优化建议

### 1. 查询优化
```sql
-- 使用覆盖索引减少回表
CREATE INDEX idx_doc_list ON documents(document_type_id, status, document_number, created_at);

-- 分页查询优化
SELECT * FROM documents
WHERE document_type_id = 'doctype_lac'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;

-- 避免SELECT *，只查询需要的字段
SELECT id, document_number, status, created_at
FROM documents
WHERE document_type_id = 'doctype_lac';
```

### 2. 缓存策略
- 热点数据缓存到Redis
- 配置数据缓存，减少数据库查询
- 使用查询结果缓存，提升重复查询性能

### 3. 连接池配置
```javascript
// 数据库连接池配置
const poolConfig = {
  host: 'localhost',
  user: 'app_user',
  password: 'password',
  database: 'document_system',
  waitForConnections: true,
  connectionLimit: 100,      // 最大连接数
  queueLimit: 0,            // 队列限制
  enableKeepAlive: true,    // 保持连接
  keepAliveInitialDelay: 0  // 保活延迟
}
```

## 安全性设计

### 1. 数据加密
- 密码使用bcrypt加密存储
- 敏感数据字段加密存储
- 传输层使用SSL/TLS加密

### 2. 权限控制
- 基于RBAC的权限模型
- 数据行级权限控制
- API接口权限验证

### 3. SQL注入防护
- 使用参数化查询
- 输入数据验证和清理
- 最小权限原则

## 总结

这套数据库表结构设计：

1. **完整覆盖业务功能**：支持单据管理、工作流、权限控制、AI功能等核心业务
2. **规范化的表设计**：遵循数据库设计范式，减少数据冗余
3. **性能优化考虑**：合理的索引设计、分区策略、缓存方案
4. **扩展性良好**：预留扩展字段，支持业务发展需求
5. **安全性保障**：数据加密、权限控制、审计追踪

基于此结构，可以构建一个高性能、可扩展的单据管理系统，支持当前所有功能需求，并为未来发展预留充足空间。