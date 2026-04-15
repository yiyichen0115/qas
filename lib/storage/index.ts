import type {
  FormConfig,
  FormCategory,
  DocumentType,
  FieldTypeConfig,
  WorkflowConfig,
  PageConfig,
  Role,
  User,
  Application,
  Document,
  ApprovalRecord,
  DocumentReply,
  DocumentSequence,
  KnowledgeArticle,
  AIConversation,
  PredefinedField,
  AIDocumentRule,
} from '@/lib/types'

const STORAGE_KEYS = {
  FORMS: 'lowcode_forms',
  FORM_CATEGORIES: 'lowcode_form_categories', // 改为存储单据类型
  DOCUMENT_TYPES: 'lowcode_document_types',
  FIELD_TYPES: 'lowcode_field_types',
  PREDEFINED_FIELDS: 'lowcode_predefined_fields',
  WORKFLOWS: 'lowcode_workflows',
  PAGES: 'lowcode_pages',
  ROLES: 'lowcode_roles',
  USERS: 'lowcode_users',
  APPLICATIONS: 'lowcode_applications',
  DOCUMENTS: 'lowcode_documents',
  APPROVALS: 'lowcode_approvals',
  REPLIES: 'lowcode_replies',
  SEQUENCES: 'lowcode_sequences',
  CURRENT_USER: 'lowcode_current_user',
  KNOWLEDGE_ARTICLES: 'lowcode_knowledge_articles',
  AI_CONVERSATIONS: 'lowcode_ai_conversations',
  AI_DOCUMENT_RULES: 'lowcode_ai_document_rules',
} as const

// 通用存储操作
function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

// ==================== 表单配置存储 ====================

export const formStorage = {
  getAll: (): FormConfig[] => getItem(STORAGE_KEYS.FORMS, []),
  
  getById: (id: string): FormConfig | undefined => {
    const forms = formStorage.getAll()
    return forms.find(f => f.id === id)
  },
  
  save: (form: FormConfig): void => {
    const forms = formStorage.getAll()
    const index = forms.findIndex(f => f.id === form.id)
    if (index >= 0) {
      forms[index] = { ...form, updatedAt: new Date().toISOString() }
    } else {
      forms.push({ ...form, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    }
    setItem(STORAGE_KEYS.FORMS, forms)
  },
  
  delete: (id: string): void => {
    const forms = formStorage.getAll().filter(f => f.id !== id)
    setItem(STORAGE_KEYS.FORMS, forms)
  },
}

// ==================== 流程配置存储 ====================

export const workflowStorage = {
  getAll: (): WorkflowConfig[] => getItem(STORAGE_KEYS.WORKFLOWS, []),
  
  getById: (id: string): WorkflowConfig | undefined => {
    const workflows = workflowStorage.getAll()
    return workflows.find(w => w.id === id)
  },
  
  getByCategoryId: (categoryId: string): WorkflowConfig[] => {
    return workflowStorage.getAll().filter(w => w.categoryId === categoryId)
  },
  
  getByFormId: (formId: string): WorkflowConfig | undefined => {
    return workflowStorage.getAll().find(w => w.formId === formId)
  },
  
  getPublishedByCategoryId: (categoryId: string): WorkflowConfig[] => {
    return workflowStorage.getAll().filter(w => w.categoryId === categoryId && w.status === 'published')
  },
  
  save: (workflow: WorkflowConfig): void => {
    const workflows = workflowStorage.getAll()
    const index = workflows.findIndex(w => w.id === workflow.id)
    if (index >= 0) {
      workflows[index] = { ...workflow, updatedAt: new Date().toISOString() }
    } else {
      workflows.push({ ...workflow, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    }
    setItem(STORAGE_KEYS.WORKFLOWS, workflows)
  },
  
  delete: (id: string): void => {
    const workflows = workflowStorage.getAll().filter(w => w.id !== id)
    setItem(STORAGE_KEYS.WORKFLOWS, workflows)
  },
}

// ==================== 页面配置存储 ====================

export const pageStorage = {
  getAll: (): PageConfig[] => getItem(STORAGE_KEYS.PAGES, []),
  
  getById: (id: string): PageConfig | undefined => {
    const pages = pageStorage.getAll()
    return pages.find(p => p.id === id)
  },
  
  save: (page: PageConfig): void => {
    const pages = pageStorage.getAll()
    const index = pages.findIndex(p => p.id === page.id)
    if (index >= 0) {
      pages[index] = { ...page, updatedAt: new Date().toISOString() }
    } else {
      pages.push({ ...page, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    }
    setItem(STORAGE_KEYS.PAGES, pages)
  },
  
  delete: (id: string): void => {
    const pages = pageStorage.getAll().filter(p => p.id !== id)
    setItem(STORAGE_KEYS.PAGES, pages)
  },
}

// ==================== 角色存储 ====================

export const roleStorage = {
  getAll: (): Role[] => getItem(STORAGE_KEYS.ROLES, getDefaultRoles()),
  
  getById: (id: string): Role | undefined => {
    const roles = roleStorage.getAll()
    return roles.find(r => r.id === id)
  },
  
  save: (role: Role): void => {
    const roles = roleStorage.getAll()
    const index = roles.findIndex(r => r.id === role.id)
    if (index >= 0) {
      roles[index] = { ...role, updatedAt: new Date().toISOString() }
    } else {
      roles.push({ ...role, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    }
    setItem(STORAGE_KEYS.ROLES, roles)
  },
  
  delete: (id: string): void => {
    const roles = roleStorage.getAll().filter(r => r.id !== id)
    setItem(STORAGE_KEYS.ROLES, roles)
  },
}

// ==================== 用户存储 ====================

export const userStorage = {
  getAll: (): User[] => getItem(STORAGE_KEYS.USERS, getDefaultUsers()),
  
  getById: (id: string): User | undefined => {
    const users = userStorage.getAll()
    return users.find(u => u.id === id)
  },
  
  save: (user: User): void => {
    const users = userStorage.getAll()
    const index = users.findIndex(u => u.id === user.id)
    if (index >= 0) {
      users[index] = { ...user, updatedAt: new Date().toISOString() }
    } else {
      users.push({ ...user, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    }
    setItem(STORAGE_KEYS.USERS, users)
  },
  
  delete: (id: string): void => {
    const users = userStorage.getAll().filter(u => u.id !== id)
    setItem(STORAGE_KEYS.USERS, users)
  },
  
  getCurrentUser: (): User | null => getItem(STORAGE_KEYS.CURRENT_USER, null),
  
  setCurrentUser: (user: User | null): void => {
    setItem(STORAGE_KEYS.CURRENT_USER, user)
  },
}

// ==================== 应用存储 ====================

export const appStorage = {
  getAll: (): Application[] => getItem(STORAGE_KEYS.APPLICATIONS, []),
  
  getById: (id: string): Application | undefined => {
    const apps = appStorage.getAll()
    return apps.find(a => a.id === id)
  },
  
  save: (app: Application): void => {
    const apps = appStorage.getAll()
    const index = apps.findIndex(a => a.id === app.id)
    if (index >= 0) {
      apps[index] = { ...app, updatedAt: new Date().toISOString() }
    } else {
      apps.push({ ...app, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    }
    setItem(STORAGE_KEYS.APPLICATIONS, apps)
  },
  
  delete: (id: string): void => {
    const apps = appStorage.getAll().filter(a => a.id !== id)
    setItem(STORAGE_KEYS.APPLICATIONS, apps)
  },
}

// ==================== 单据存储 ====================

export const documentStorage = {
  getAll: (): Document[] => getItem(STORAGE_KEYS.DOCUMENTS, []),
  
  getByDocumentTypeId: (documentTypeId: string): Document[] => {
    return documentStorage.getAll().filter(d => d.documentTypeId === documentTypeId || d.formId === documentTypeId)
  },
  
  // 保持向后兼容
  getByFormId: (formId: string): Document[] => {
    return documentStorage.getByDocumentTypeId(formId)
  },
  
  getByAppId: (appId: string): Document[] => {
    return documentStorage.getAll().filter(d => d.appId === appId)
  },
  
  getById: (id: string): Document | undefined => {
    const docs = documentStorage.getAll()
    return docs.find(d => d.id === id)
  },
  
  getByStatus: (status: string): Document[] => {
    return documentStorage.getAll().filter(d => d.status === status)
  },
  
  getByUser: (userId: string): Document[] => {
    return documentStorage.getAll().filter(d => d.createdBy === userId)
  },
  
  save: (doc: Document): void => {
    const docs = documentStorage.getAll()
    const index = docs.findIndex(d => d.id === doc.id)
    if (index >= 0) {
      docs[index] = { ...doc, updatedAt: new Date().toISOString() }
    } else {
      docs.push({ ...doc, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    }
    setItem(STORAGE_KEYS.DOCUMENTS, docs)
  },
  
  delete: (id: string): void => {
    const docs = documentStorage.getAll().filter(d => d.id !== id)
    setItem(STORAGE_KEYS.DOCUMENTS, docs)
  },
}

// ==================== 审批记录存储 ====================

export const approvalStorage = {
  getAll: (): ApprovalRecord[] => getItem(STORAGE_KEYS.APPROVALS, []),
  
  getByDocumentId: (documentId: string): ApprovalRecord[] => {
    return approvalStorage.getAll().filter(a => a.documentId === documentId)
  },
  
  save: (record: ApprovalRecord): void => {
    const records = approvalStorage.getAll()
    records.push({ ...record, createdAt: new Date().toISOString() })
    setItem(STORAGE_KEYS.APPROVALS, records)
  },
}

// ==================== 字段类型存储 ====================

export const fieldTypeStorage = {
  getAll: (): FieldTypeConfig[] => getItem(STORAGE_KEYS.FIELD_TYPES, getDefaultFieldTypes()),
  
  getEnabled: (): FieldTypeConfig[] => {
    return fieldTypeStorage.getAll().filter(f => f.enabled).sort((a, b) => a.order - b.order)
  },
  
  getByCategory: (category: string): FieldTypeConfig[] => {
    return fieldTypeStorage.getEnabled().filter(f => f.category === category)
  },
  
  getById: (id: string): FieldTypeConfig | undefined => {
    return fieldTypeStorage.getAll().find(f => f.id === id)
  },
  
  save: (fieldType: FieldTypeConfig): void => {
    const fieldTypes = fieldTypeStorage.getAll()
    const index = fieldTypes.findIndex(f => f.id === fieldType.id)
    if (index >= 0) {
      fieldTypes[index] = { ...fieldType, updatedAt: new Date().toISOString() }
    } else {
      fieldTypes.push({ ...fieldType, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    }
    setItem(STORAGE_KEYS.FIELD_TYPES, fieldTypes)
  },
  
  saveAll: (fieldTypes: FieldTypeConfig[]): void => {
    setItem(STORAGE_KEYS.FIELD_TYPES, fieldTypes)
  },
  
  delete: (id: string): void => {
    const fieldTypes = fieldTypeStorage.getAll()
    const fieldType = fieldTypes.find(f => f.id === id)
    if (fieldType?.isSystem) {
      throw new Error('系统内置字段类型不能删除')
    }
    setItem(STORAGE_KEYS.FIELD_TYPES, fieldTypes.filter(f => f.id !== id))
  },
  
  reset: (): void => {
    setItem(STORAGE_KEYS.FIELD_TYPES, getDefaultFieldTypes())
  },
}

// ==================== 单据类型存储（原表单分类） ====================

export const documentTypeStorage = {
  getAll: (): DocumentType[] => getItem(STORAGE_KEYS.DOCUMENT_TYPES, []),
  
  getPublished: (): DocumentType[] => {
    return documentTypeStorage.getAll().filter(dt => dt.status === 'published')
  },
  
  getById: (id: string): DocumentType | undefined => {
    const types = documentTypeStorage.getAll()
    return types.find(t => t.id === id)
  },
  
  getByCode: (code: string): DocumentType | undefined => {
    return documentTypeStorage.getAll().find(t => t.code === code)
  },
  
  save: (docType: DocumentType): void => {
    const types = documentTypeStorage.getAll()
    const index = types.findIndex(t => t.id === docType.id)
    if (index >= 0) {
      types[index] = { ...docType, updatedAt: new Date().toISOString() }
    } else {
      types.push({ ...docType, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    }
    setItem(STORAGE_KEYS.DOCUMENT_TYPES, types)
  },
  
  delete: (id: string): void => {
    const types = documentTypeStorage.getAll().filter(t => t.id !== id)
    setItem(STORAGE_KEYS.DOCUMENT_TYPES, types)
  },
}

// 保持向后兼容 - categoryStorage 别名
export const categoryStorage = {
  getAll: (): DocumentType[] => documentTypeStorage.getAll(),
  getById: (id: string) => documentTypeStorage.getById(id),
  save: (category: DocumentType) => documentTypeStorage.save(category),
  delete: (id: string) => documentTypeStorage.delete(id),
}

// ==================== 单据回复存储 ====================

export const replyStorage = {
  getAll: (): DocumentReply[] => getItem(STORAGE_KEYS.REPLIES, []),
  
  getByDocumentId: (documentId: string): DocumentReply[] => {
    return replyStorage.getAll().filter(r => r.documentId === documentId)
  },
  
  save: (reply: DocumentReply): void => {
    const replies = replyStorage.getAll()
    replies.push({ ...reply, createdAt: new Date().toISOString() })
    setItem(STORAGE_KEYS.REPLIES, replies)
  },
  
  delete: (id: string): void => {
    const replies = replyStorage.getAll().filter(r => r.id !== id)
    setItem(STORAGE_KEYS.REPLIES, replies)
  },
}

// ==================== 单号序列存储 ====================

export const sequenceStorage = {
  getAll: (): DocumentSequence[] => getItem(STORAGE_KEYS.SEQUENCES, []),
  
  getByFormId: (formId: string): DocumentSequence | undefined => {
    return sequenceStorage.getAll().find(s => s.formId === formId)
  },
  
  generateNumber: (formId: string, rule: { prefix: string, dateFormat?: string, sequenceLength: number, resetCycle?: string }): string => {
    const sequences = sequenceStorage.getAll()
    let seq = sequences.find(s => s.formId === formId)
    
    const now = new Date()
    let dateStr = ''
    
    if (rule.dateFormat) {
      const year = now.getFullYear().toString()
      const month = (now.getMonth() + 1).toString().padStart(2, '0')
      const day = now.getDate().toString().padStart(2, '0')
      
      switch (rule.dateFormat) {
        case 'YYYYMMDD':
          dateStr = `${year}${month}${day}`
          break
        case 'YYMMDD':
          dateStr = `${year.slice(-2)}${month}${day}`
          break
        case 'YYYY':
          dateStr = year
          break
        case 'YYMM':
          dateStr = `${year.slice(-2)}${month}`
          break
        case 'YYYYMM':
          dateStr = `${year}${month}`
          break
      }
    }
    
    // 检查是否需要重置序号
    const todayStr = now.toISOString().split('T')[0]
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
    const currentYear = now.getFullYear().toString()
    
    let shouldReset = false
    if (seq) {
      const lastDate = new Date(seq.lastResetDate)
      const lastDateStr = lastDate.toISOString().split('T')[0]
      const lastMonth = `${lastDate.getFullYear()}-${(lastDate.getMonth() + 1).toString().padStart(2, '0')}`
      const lastYear = lastDate.getFullYear().toString()
      
      switch (rule.resetCycle) {
        case 'daily':
          shouldReset = todayStr !== lastDateStr
          break
        case 'monthly':
          shouldReset = currentMonth !== lastMonth
          break
        case 'yearly':
          shouldReset = currentYear !== lastYear
          break
      }
    }
    
    let nextNumber = 1
    if (seq && !shouldReset) {
      nextNumber = seq.currentNumber + 1
    }
    
    // 更新序列
    const updatedSeq: DocumentSequence = {
      formId,
      prefix: rule.prefix,
      currentNumber: nextNumber,
      lastResetDate: todayStr,
    }
    
    const seqIndex = sequences.findIndex(s => s.formId === formId)
    if (seqIndex >= 0) {
      sequences[seqIndex] = updatedSeq
    } else {
      sequences.push(updatedSeq)
    }
    setItem(STORAGE_KEYS.SEQUENCES, sequences)
    
    // 生成单号
    const seqStr = nextNumber.toString().padStart(rule.sequenceLength, '0')
    return `${rule.prefix}${dateStr}${seqStr}`
  },
}

// ==================== 默认数据 ====================

function getDefaultFieldTypes(): FieldTypeConfig[] {
  const now = new Date().toISOString()
  return [
    // 基础字���
    { id: 'ft_text', type: 'text', label: '单行文本', icon: 'Type', category: 'basic', enabled: true, order: 1, isSystem: true, description: '用于输入简短的文本内容', createdAt: now, updatedAt: now },
    { id: 'ft_number', type: 'number', label: '数字', icon: 'Hash', category: 'basic', enabled: true, order: 2, isSystem: true, description: '用于输入数值', createdAt: now, updatedAt: now },
    { id: 'ft_textarea', type: 'textarea', label: '多行文本', icon: 'AlignLeft', category: 'basic', enabled: true, order: 3, isSystem: true, description: '用于输入较长的文本内容', createdAt: now, updatedAt: now },
    { id: 'ft_date', type: 'date', label: '日期', icon: 'Calendar', category: 'basic', enabled: true, order: 4, isSystem: true, description: '用于选择日期', createdAt: now, updatedAt: now },
    { id: 'ft_datetime', type: 'datetime', label: '日期时间', icon: 'Clock', category: 'basic', enabled: true, order: 5, isSystem: true, description: '用于选择日期和时间', createdAt: now, updatedAt: now },
    { id: 'ft_select', type: 'select', label: '下拉选择', icon: 'ChevronDown', category: 'basic', enabled: true, order: 6, isSystem: true, description: '从预设选项中选择一个', createdAt: now, updatedAt: now },
    { id: 'ft_radio', type: 'radio', label: '单��', icon: 'Circle', category: 'basic', enabled: true, order: 7, isSystem: true, description: '单选按钮组', createdAt: now, updatedAt: now },
    { id: 'ft_checkbox', type: 'checkbox', label: '多选', icon: 'CheckSquare', category: 'basic', enabled: true, order: 8, isSystem: true, description: '多选复选框组', createdAt: now, updatedAt: now },
    { id: 'ft_switch', type: 'switch', label: '开关', icon: 'ToggleLeft', category: 'basic', enabled: true, order: 9, isSystem: true, description: '是/否开关', createdAt: now, updatedAt: now },
    // 高级字段
    { id: 'ft_file', type: 'file', label: '文件上传', icon: 'Upload', category: 'advanced', enabled: true, order: 10, isSystem: true, description: '上传文件附件', createdAt: now, updatedAt: now },
    { id: 'ft_richtext', type: 'richtext', label: '富文本', icon: 'FileText', category: 'advanced', enabled: true, order: 11, isSystem: true, description: '支持格式化的文本编辑器', createdAt: now, updatedAt: now },
    { id: 'ft_subtable', type: 'subtable', label: '子表格', icon: 'Table', category: 'advanced', enabled: true, order: 12, isSystem: true, description: '嵌套的表格数据', createdAt: now, updatedAt: now },
    { id: 'ft_signature', type: 'signature', label: '电子签名', icon: 'PenTool', category: 'advanced', enabled: true, order: 13, isSystem: true, description: '手写签名', createdAt: now, updatedAt: now },
    { id: 'ft_cascade', type: 'cascade', label: '级联选择', icon: 'List', category: 'advanced', enabled: true, order: 14, isSystem: true, description: '多级联动选择', createdAt: now, updatedAt: now },
    { id: 'ft_formula', type: 'formula', label: '公式计算', icon: 'Calculator', category: 'advanced', enabled: true, order: 15, isSystem: true, description: '自动计算字段', createdAt: now, updatedAt: now },
    // 布局元素
    { id: 'ft_divider', type: 'divider', label: '分割线', icon: 'Minus', category: 'layout', enabled: true, order: 16, isSystem: true, description: '用于分隔表单区域', createdAt: now, updatedAt: now },
    { id: 'ft_description', type: 'description', label: '说明文字', icon: 'Info', category: 'layout', enabled: true, order: 17, isSystem: true, description: '显示说明信息', createdAt: now, updatedAt: now },
  ]
}

function getDefaultCategories(): FormCategory[] {
  return [
    {
      id: 'cat_office',
      name: '行政办公',
      code: 'office',
      icon: 'FileText',
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cat_hr',
      name: '人事管理',
      code: 'hr',
      icon: 'Users',
      order: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cat_finance',
      name: '财务管理',
      code: 'finance',
      icon: 'Wallet',
      order: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cat_project',
      name: '项目管理',
      code: 'project',
      icon: 'Briefcase',
      order: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]
}

function getDefaultRoles(): Role[] {
  return [
    {
      id: 'role_admin',
      name: '系统管理员',
      code: 'admin',
      description: '拥有系统所有权限',
      permissions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'role_user',
      name: '普通用户',
      code: 'user',
      description: '普通用户权限',
      permissions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'role_approver',
      name: '审批人',
      code: 'approver',
      description: '具有审批权限',
      permissions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]
}

function getDefaultUsers(): User[] {
  return [
    {
      id: 'user_admin',
      username: 'admin',
      name: '管理员',
      email: 'admin@example.com',
      department: '技术部',
      roles: ['role_admin'],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user_zhangsan',
      username: 'zhangsan',
      name: '张三',
      email: 'zhangsan@example.com',
      department: '销售部',
      roles: ['role_user'],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user_lisi',
      username: 'lisi',
      name: '李四',
      email: 'lisi@example.com',
      department: '财务部',
      roles: ['role_approver'],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]
}

// ==================== 知识资料库存储 ====================

export const knowledgeStorage = {
  getAll: (): KnowledgeArticle[] => getItem(STORAGE_KEYS.KNOWLEDGE_ARTICLES, getDefaultKnowledgeArticles()),
  
  getPublished: (): KnowledgeArticle[] => {
    return knowledgeStorage.getAll().filter(a => a.status === 'published')
  },
  
  getById: (id: string): KnowledgeArticle | undefined => {
    return knowledgeStorage.getAll().find(a => a.id === id)
  },
  
  getByCategory: (category: string): KnowledgeArticle[] => {
    return knowledgeStorage.getPublished().filter(a => a.category === category)
  },
  
  search: (query: string): KnowledgeArticle[] => {
    const keywords = query.toLowerCase().split(/\s+/)
    return knowledgeStorage.getPublished().filter(article => {
      const searchText = [
        article.title,
        article.content,
        ...article.tags,
        ...article.keywords,
      ].join(' ').toLowerCase()
      return keywords.some(kw => searchText.includes(kw))
    })
  },
  
  getRelatedToDocumentType: (documentTypeId: string): KnowledgeArticle[] => {
    return knowledgeStorage.getPublished().filter(a => 
      a.relatedDocumentTypes?.includes(documentTypeId)
    )
  },
  
  save: (article: KnowledgeArticle): void => {
    const articles = knowledgeStorage.getAll()
    const index = articles.findIndex(a => a.id === article.id)
    if (index >= 0) {
      articles[index] = { ...article, updatedAt: new Date().toISOString() }
    } else {
      articles.push({ ...article, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    }
    setItem(STORAGE_KEYS.KNOWLEDGE_ARTICLES, articles)
  },
  
  delete: (id: string): void => {
    const articles = knowledgeStorage.getAll().filter(a => a.id !== id)
    setItem(STORAGE_KEYS.KNOWLEDGE_ARTICLES, articles)
  },
  
  incrementViewCount: (id: string): void => {
    const articles = knowledgeStorage.getAll()
    const index = articles.findIndex(a => a.id === id)
    if (index >= 0) {
      articles[index].viewCount++
      setItem(STORAGE_KEYS.KNOWLEDGE_ARTICLES, articles)
    }
  },
  
  incrementHelpful: (id: string): void => {
    const articles = knowledgeStorage.getAll()
    const index = articles.findIndex(a => a.id === id)
    if (index >= 0) {
      articles[index].helpful++
      setItem(STORAGE_KEYS.KNOWLEDGE_ARTICLES, articles)
    }
  },
}

// ==================== AI对话存储 ====================

export const aiConversationStorage = {
  getAll: (): AIConversation[] => getItem(STORAGE_KEYS.AI_CONVERSATIONS, []),
  
  getByUserId: (userId: string): AIConversation[] => {
    return aiConversationStorage.getAll().filter(c => c.userId === userId)
  },
  
  getById: (id: string): AIConversation | undefined => {
    return aiConversationStorage.getAll().find(c => c.id === id)
  },
  
  save: (conversation: AIConversation): void => {
    const conversations = aiConversationStorage.getAll()
    const index = conversations.findIndex(c => c.id === conversation.id)
    if (index >= 0) {
      conversations[index] = { ...conversation, updatedAt: new Date().toISOString() }
    } else {
      conversations.push({ ...conversation, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    }
    setItem(STORAGE_KEYS.AI_CONVERSATIONS, conversations)
  },
  
  delete: (id: string): void => {
    const conversations = aiConversationStorage.getAll().filter(c => c.id !== id)
    setItem(STORAGE_KEYS.AI_CONVERSATIONS, conversations)
  },
}

// ==================== 默认知识库数据 ====================

function getDefaultKnowledgeArticles(): KnowledgeArticle[] {
  const now = new Date().toISOString()
  return [
    {
      id: 'kb_001',
      title: '求援反馈单填写指南',
      category: 'manual',
      content: `# 求援反馈单填写指南

## 一、什么情况下需要提交求援反馈单？

1. 遇到无法独立解决的技术故障
2. 需要主机厂技术支持的复杂问题
3. 涉及质量问题需要上报的情况

## 二、填写要点

### 1. VIN码
- 必须填写17位完整VIN码
- 系统会自动带出车型信息

### 2. 故障描述
- 详细描述故障现象
- 包含故障码（如有）
- 说明已尝试的诊断步骤

### 3. 附件
- 建议上传故障照片
- 诊断报告截图

## 三、常见问题

**Q: VIN码带不出信息怎么办？**
A: 请检查VIN码是否正确，如确认无误请联系系统管理员。

**Q: 提交后多久能收到回复？**
A: 一般24小时内会收到初步回复。`,
      tags: ['求援', '填写指南', '操作手册'],
      keywords: ['求援', '反馈单', '如何填写', '提交', 'VIN', '故障'],
      relatedDocumentTypes: ['doctype_support_feedback'],
      viewCount: 156,
      helpful: 42,
      status: 'published',
      createdBy: 'user_admin',
      createdByName: '管理员',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'kb_002',
      title: '电池故障常见问题排查',
      category: 'troubleshooting',
      content: `# 电池故障常见问题排查

## 故障码 P181900 - 单体电压过高

### 可能原因
1. BMS检测异常
2. 单体电池老化
3. 充电系统问题

### 排查步骤
1. 使用诊断仪读取详细故障信息
2. 检查电池包连接状态
3. 查看充电记录

### 解决方案
- 如果是偶发性故障，清除故障码后观察
- 如果反复出现，需要上报求援反馈

## 故障码 P182A00 - 电池温度异常

### 可能原因
1. 冷却系统故障
2. 温度传感器异常
3. 环境温度过高

### 排查步骤
1. 检查冷却液液位
2. 检查冷却风扇工作状态
3. 查看温度传感器数据`,
      tags: ['电池', '故障排查', 'BMS', '故障码'],
      keywords: ['电池', 'P181900', 'P182A00', '故障码', '单体电压', '温度异常', 'BMS'],
      relatedDocumentTypes: ['doctype_support_feedback'],
      viewCount: 89,
      helpful: 28,
      status: 'published',
      createdBy: 'user_admin',
      createdByName: '管理员',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'kb_003',
      title: '充电故障诊断流程',
      category: 'troubleshooting',
      content: `# 充电故障诊断流程

## 客户报修：车辆无法充电

### 第一步：确认故障现象
- 是完全无法充电还是充电慢？
- 是快充还是慢充有问题？
- 故障是否稳定复现？

### 第二步：检查外部因素
1. 充电桩是否正常
2. 充电枪与车辆连接是否良好
3. 充电桩电源是否正常

### 第三步：车辆端检查
1. 读取故障码
2. 检查充电口
3. 检查高压系统状态

### 第四步：根据故障码处理
- 参考故障码对应的处理方案
- 如无法解决，提交求援反馈单`,
      tags: ['充电', '故障诊断', '诊断流程'],
      keywords: ['充电', '无法充电', '充电慢', '充电故障', '快充', '慢充'],
      relatedDocumentTypes: ['doctype_support_feedback'],
      viewCount: 67,
      helpful: 19,
      status: 'published',
      createdBy: 'user_admin',
      createdByName: '管理员',
      createdAt: now,
      updatedAt: now,
    },
  ]
}

// ==================== 预定义字段存储 ====================

export const predefinedFieldStorage = {
  getAll: (): PredefinedField[] => getItem(STORAGE_KEYS.PREDEFINED_FIELDS, getDefaultPredefinedFields()),
  
  getEnabled: (): PredefinedField[] => {
    return predefinedFieldStorage.getAll().filter(f => f.enabled)
  },
  
  getByCategory: (category: string): PredefinedField[] => {
    return predefinedFieldStorage.getEnabled().filter(f => f.category === category)
  },
  
  getById: (id: string): PredefinedField | undefined => {
    return predefinedFieldStorage.getAll().find(f => f.id === id)
  },
  
  save: (field: PredefinedField): void => {
    const fields = predefinedFieldStorage.getAll()
    const index = fields.findIndex(f => f.id === field.id)
    if (index >= 0) {
      fields[index] = { ...field, updatedAt: new Date().toISOString() }
    } else {
      fields.push({ ...field, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    }
    setItem(STORAGE_KEYS.PREDEFINED_FIELDS, fields)
  },
  
  delete: (id: string): void => {
    const fields = predefinedFieldStorage.getAll().filter(f => f.id !== id)
    setItem(STORAGE_KEYS.PREDEFINED_FIELDS, fields)
  },
}

// ==================== 默认预定义字段 ====================

function getDefaultPredefinedFields(): PredefinedField[] {
  const now = new Date().toISOString()
  return [
    // 车辆相关字段
    {
      id: 'pf_vin',
      name: 'VIN码',
      code: 'vin_code',
      category: 'vehicle',
      fieldConfig: {
        type: 'text',
        label: 'VIN码',
        name: 'vin',
        required: true,
        placeholder: '请输入17位VIN码',
        maxLength: 17,
        minLength: 17,
        pattern: '^[A-HJ-NPR-Z0-9]{17}$',
        description: '车辆识别代号，自动联动车辆信息',
        width: 'third',
        linkage: {
          sourceField: 'vin',
          sourceType: 'vin',
          targetMappings: [
            { targetField: 'vehicle_platform', sourceProperty: 'platformName' },
            { targetField: 'vehicle_config', sourceProperty: 'configName' },
            { targetField: 'vehicle_code', sourceProperty: 'vehicleCode' },
            { targetField: 'vsn_code', sourceProperty: 'vsnCode' },
            { targetField: 'engine_batch', sourceProperty: 'engineBatchNo' },
            { targetField: 'production_date', sourceProperty: 'productionDate' },
            { targetField: 'sales_date', sourceProperty: 'salesDate' },
          ],
        },
      },
      description: '17位车辆识别码，支持自动联动车辆信息',
      enabled: true,
      order: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pf_vehicle_platform',
      name: '车型平台',
      code: 'vehicle_platform',
      category: 'vehicle',
      fieldConfig: {
        type: 'text',
        label: '车型平台',
        name: 'vehicle_platform',
        required: false,
        disabled: true,
        description: '由VIN码自动带出',
        width: 'third',
      },
      description: '车型平台名称，由VIN码自动联动',
      enabled: true,
      order: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pf_vehicle_config',
      name: '车辆配置',
      code: 'vehicle_config',
      category: 'vehicle',
      fieldConfig: {
        type: 'text',
        label: '车辆配置',
        name: 'vehicle_config',
        required: false,
        disabled: true,
        description: '由VIN码自动带出',
        width: 'third',
      },
      description: '车辆配置名称，由VIN码自动联动',
      enabled: true,
      order: 3,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pf_vehicle_code',
      name: '车架代码',
      code: 'vehicle_code',
      category: 'vehicle',
      fieldConfig: {
        type: 'text',
        label: '车架代码',
        name: 'vehicle_code',
        required: false,
        disabled: true,
        description: '由VIN码自动带出',
        width: 'third',
      },
      description: '车架代码，由VIN码自动联动',
      enabled: true,
      order: 4,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pf_vsn_code',
      name: 'VSN号',
      code: 'vsn_code',
      category: 'vehicle',
      fieldConfig: {
        type: 'text',
        label: 'VSN号',
        name: 'vsn_code',
        required: false,
        disabled: true,
        description: '由VIN码自动带出',
        width: 'third',
      },
      description: 'VSN编号，由VIN码自动联动',
      enabled: true,
      order: 5,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pf_mileage',
      name: '行驶里程',
      code: 'mileage',
      category: 'vehicle',
      fieldConfig: {
        type: 'number',
        label: '行驶里程(km)',
        name: 'mileage',
        required: false,
        min: 0,
        placeholder: '请输入行驶里程',
        width: 'third',
      },
      description: '车辆行驶里程数',
      enabled: true,
      order: 6,
      createdAt: now,
      updatedAt: now,
    },
    // 经销商相关字段
    {
      id: 'pf_dealer_code',
      name: '经销商代码',
      code: 'dealer_code',
      category: 'dealer',
      fieldConfig: {
        type: 'text',
        label: '经销商代码',
        name: 'dealer_code',
        required: true,
        placeholder: '请输入经销商代码',
        description: '输入代码自动带出经销商信息',
        width: 'third',
        linkage: {
          sourceField: 'dealer_code',
          sourceType: 'dealer_code',
          targetMappings: [
            { targetField: 'dealer_name', sourceProperty: 'name' },
            { targetField: 'dealer_province', sourceProperty: 'province' },
            { targetField: 'dealer_city', sourceProperty: 'city' },
            { targetField: 'dealer_contact', sourceProperty: 'contactPerson' },
            { targetField: 'dealer_phone', sourceProperty: 'phone' },
          ],
        },
      },
      description: '经销商编码，支持自动联动经销商信息',
      enabled: true,
      order: 10,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pf_dealer_name',
      name: '经销商名称',
      code: 'dealer_name',
      category: 'dealer',
      fieldConfig: {
        type: 'text',
        label: '经销商名称',
        name: 'dealer_name',
        required: false,
        disabled: true,
        description: '由经销商代码自动带出',
        width: 'third',
      },
      description: '经销商名称，由经销商代码自动联动',
      enabled: true,
      order: 11,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pf_dealer_province',
      name: '经销商省份',
      code: 'dealer_province',
      category: 'dealer',
      fieldConfig: {
        type: 'text',
        label: '省份',
        name: 'dealer_province',
        required: false,
        disabled: true,
        description: '由经销商代码自动带出',
        width: 'third',
      },
      description: '经销商所在省份',
      enabled: true,
      order: 12,
      createdAt: now,
      updatedAt: now,
    },
    // 故障相关字段
    {
      id: 'pf_fault_code',
      name: '故障码',
      code: 'fault_code',
      category: 'fault',
      fieldConfig: {
        type: 'text',
        label: '故障码',
        name: 'fault_code',
        required: false,
        placeholder: '请输入故障码',
        width: 'third',
      },
      description: '车辆故障码',
      enabled: true,
      order: 20,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pf_fault_description',
      name: '故障描述',
      code: 'fault_description',
      category: 'fault',
      fieldConfig: {
        type: 'textarea',
        label: '故障描述',
        name: 'fault_description',
        required: true,
        placeholder: '请详细描述故障现象',
        rows: 4,
        width: 'full',
      },
      description: '详细的故障现象描述',
      enabled: true,
      order: 21,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pf_fault_type',
      name: '故障类型',
      code: 'fault_type',
      category: 'fault',
      fieldConfig: {
        type: 'select',
        label: '故障类型',
        name: 'fault_type',
        required: true,
        options: [
          { label: '三电系统', value: 'battery' },
          { label: '底盘系统', value: 'chassis' },
          { label: '车身系统', value: 'body' },
          { label: '智能驾驶', value: 'adas' },
          { label: '座舱系统', value: 'cockpit' },
          { label: '其他', value: 'other' },
        ],
        width: 'third',
      },
      description: '故障分类',
      enabled: true,
      order: 22,
      createdAt: now,
      updatedAt: now,
    },
    // 业务通用字段
    {
      id: 'pf_quality_category',
      name: '质量信息类别',
      code: 'quality_category',
      category: 'business',
      fieldConfig: {
        type: 'select',
        label: '质量信息类别',
        name: 'quality_category',
        required: true,
        options: [
          { label: '技术求援', value: 'TECH_SUPPORT' },
          { label: '质量反馈', value: 'QUALITY_FEEDBACK' },
          { label: '配件问题', value: 'PARTS_ISSUE' },
          { label: '工艺问题', value: 'PROCESS_ISSUE' },
        ],
        width: 'third',
      },
      description: '质量信息分类',
      enabled: true,
      order: 30,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pf_support_type',
      name: '支持类型',
      code: 'support_type',
      category: 'business',
      fieldConfig: {
        type: 'select',
        label: '支持类型',
        name: 'support_type',
        required: true,
        options: [
          { label: '技术咨询', value: 'CONSULT' },
          { label: '远程诊断', value: 'REMOTE_DIAG' },
          { label: '现场支持', value: 'ONSITE' },
          { label: '配件支持', value: 'PARTS' },
        ],
        width: 'third',
      },
      description: '需要的支持类型',
      enabled: true,
      order: 31,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pf_risk_level',
      name: '风险等级',
      code: 'risk_level',
      category: 'business',
      fieldConfig: {
        type: 'radio',
        label: '风险等级',
        name: 'risk_level',
        required: true,
        options: [
          { label: '低', value: 'LOW' },
          { label: '中', value: 'MEDIUM' },
          { label: '高', value: 'HIGH' },
          { label: '紧急', value: 'CRITICAL' },
        ],
        width: 'half',
      },
      description: '问题风险等级评估',
      enabled: true,
      order: 32,
      createdAt: now,
      updatedAt: now,
    },
    // 通用字段
    {
      id: 'pf_contact_name',
      name: '联系人',
      code: 'contact_name',
      category: 'common',
      fieldConfig: {
        type: 'text',
        label: '联系人',
        name: 'contact_name',
        required: true,
        placeholder: '请输入联系人姓名',
        width: 'third',
      },
      description: '联系人姓名',
      enabled: true,
      order: 40,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pf_contact_phone',
      name: '联系电话',
      code: 'contact_phone',
      category: 'common',
      fieldConfig: {
        type: 'text',
        label: '联系电话',
        name: 'contact_phone',
        required: true,
        placeholder: '请输入联系电话',
        pattern: '^1[3-9]\\d{9}$',
        width: 'third',
      },
      description: '联系人电话',
      enabled: true,
      order: 41,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pf_attachment',
      name: '附件上传',
      code: 'attachment',
      category: 'common',
      fieldConfig: {
        type: 'file',
        label: '附件',
        name: 'attachments',
        required: false,
        multiple: true,
        accept: '.jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx',
        maxSize: 10,
        description: '支持图片、PDF、Office文档，单文件最大10MB',
        width: 'full',
      },
      description: '文件附件上传',
      enabled: true,
      order: 42,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pf_remark',
      name: '备注',
      code: 'remark',
      category: 'common',
      fieldConfig: {
        type: 'textarea',
        label: '备注',
        name: 'remark',
        required: false,
        placeholder: '请输入备注信息',
        rows: 3,
        width: 'full',
      },
      description: '备注信息',
      enabled: true,
      order: 43,
      createdAt: now,
      updatedAt: now,
    },
  ]
}

// ==================== AI 问答规则存储 ====================

export const aiDocumentRuleStorage = {
  getAll: (): AIDocumentRule[] => getItem(STORAGE_KEYS.AI_DOCUMENT_RULES, getDefaultAIDocumentRules()),
  
  getEnabled: (): AIDocumentRule[] => {
    return aiDocumentRuleStorage.getAll()
      .filter(r => r.enabled)
      .sort((a, b) => a.priority - b.priority)
  },
  
  getById: (id: string): AIDocumentRule | undefined => {
    return aiDocumentRuleStorage.getAll().find(r => r.id === id)
  },
  
  save: (rule: AIDocumentRule): void => {
    const rules = aiDocumentRuleStorage.getAll()
    const index = rules.findIndex(r => r.id === rule.id)
    if (index >= 0) {
      rules[index] = { ...rule, updatedAt: new Date().toISOString() }
    } else {
      rules.push({ ...rule, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    }
    setItem(STORAGE_KEYS.AI_DOCUMENT_RULES, rules)
  },
  
  delete: (id: string): void => {
    const rules = aiDocumentRuleStorage.getAll().filter(r => r.id !== id)
    setItem(STORAGE_KEYS.AI_DOCUMENT_RULES, rules)
  },
  
  // 根据用户输入匹配规则
  matchRules: (userInput: string): AIDocumentRule[] => {
    const enabledRules = aiDocumentRuleStorage.getEnabled()
    const matchedRules: AIDocumentRule[] = []
    
    for (const rule of enabledRules) {
      let isMatch = false
      const conditionResults: boolean[] = []
      
      for (const condition of rule.matchConditions) {
        const values = condition.value.split(',').map(v => v.trim().toLowerCase())
        const inputLower = userInput.toLowerCase()
        
        let conditionMatch = false
        for (const value of values) {
          switch (condition.matchMode) {
            case 'contains':
              conditionMatch = inputLower.includes(value)
              break
            case 'exact':
              conditionMatch = inputLower === value
              break
            case 'startsWith':
              conditionMatch = inputLower.startsWith(value)
              break
            case 'endsWith':
              conditionMatch = inputLower.endsWith(value)
              break
            case 'regex':
              try {
                conditionMatch = new RegExp(value, 'i').test(userInput)
              } catch {
                conditionMatch = false
              }
              break
          }
          if (conditionMatch) break
        }
        conditionResults.push(conditionMatch)
      }
      
      if (rule.matchLogic === 'and') {
        isMatch = conditionResults.every(r => r)
      } else {
        isMatch = conditionResults.some(r => r)
      }
      
      if (isMatch) {
        matchedRules.push(rule)
      }
    }
    
    return matchedRules
  },
}

// ==================== 默认 AI 问答规则 ====================

function getDefaultAIDocumentRules(): AIDocumentRule[] {
  const now = new Date().toISOString()
  return [
    {
      id: 'rule_tech_support',
      name: '技术求援规则',
      description: '当用户提到故障、报错、无法解决等关键词时，建议创建技术求援单',
      enabled: true,
      priority: 1,
      matchConditions: [
        {
          id: 'cond_1',
          type: 'keyword',
          value: '故障,报错,无法,不能,失败,异常,求援,求助,帮助',
          matchMode: 'contains',
        },
      ],
      matchLogic: 'or',
      action: {
        type: 'suggest_document',
        documentTypeId: 'doctype_support_feedback',
        guideMessage: '根据您描述的问题，建议您提交一份技术求援单，我们的技术团队会尽快为您处理。',
        fieldMappings: [
          { sourceKey: 'vin', targetField: 'vin', extractPattern: '[A-HJ-NPR-Z0-9]{17}' },
          { sourceKey: 'fault_code', targetField: 'fault_code', extractPattern: '[PBCUpbcu][0-9A-Fa-f]{4,6}' },
          { sourceKey: 'description', targetField: 'fault_description' },
        ],
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'rule_battery_issue',
      name: '电池问题规则',
      description: '当用户提到电池、充电、续航等问题时，先提供诊断建议，必要时建议创建单据',
      enabled: true,
      priority: 2,
      matchConditions: [
        {
          id: 'cond_2',
          type: 'keyword',
          value: '电池,充电,续航,电量,BMS,充不进,充电慢',
          matchMode: 'contains',
        },
      ],
      matchLogic: 'or',
      action: {
        type: 'show_guide',
        guideMessage: '关于电池/充电问题，请先确认：\n1. 充电桩是否正常工作\n2. 充电枪连接是否牢固\n3. 是否有相关故障码\n\n如果以上检查都正常但问题仍存在，建议提交技术求援单。',
        relatedArticleIds: ['kb_002', 'kb_003'],
        documentTypeId: 'doctype_support_feedback',
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'rule_fault_code',
      name: '故障码查询规则',
      description: '当用户输入故障码格式时，自动识别并提供相关信息',
      enabled: true,
      priority: 3,
      matchConditions: [
        {
          id: 'cond_3',
          type: 'entity',
          value: '[PBCUpbcu][0-9A-Fa-f]{4,6}',
          matchMode: 'regex',
        },
      ],
      matchLogic: 'or',
      action: {
        type: 'show_guide',
        guideMessage: '检测到您输入了故障码，我会帮您查找相关的诊断信息和处理方案。',
        relatedArticleIds: ['kb_002'],
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'rule_parts_inquiry',
      name: '配件咨询规则',
      description: '当用户咨询配件相关问题时的处理规则',
      enabled: true,
      priority: 4,
      matchConditions: [
        {
          id: 'cond_4',
          type: 'keyword',
          value: '配件,零件,更换,订购,库存',
          matchMode: 'contains',
        },
      ],
      matchLogic: 'or',
      action: {
        type: 'show_guide',
        guideMessage: '关于配件问题，您可以：\n1. 在备件目录中查询配件信息\n2. 联系配件部门咨询库存\n3. 如需紧急配件支持，可提交配件申请单',
      },
      createdAt: now,
      updatedAt: now,
    },
  ]
}
