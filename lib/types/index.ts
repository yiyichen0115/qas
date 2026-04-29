// ==================== 基础库类型 ====================

// 配件基础库
export interface Part {
  id: string
  partNumber: string // 配件编号
  partName: string // 配件名称
  category?: string // 配件分类
  specification?: string // 规格型号
  unit?: string // 单位
  price?: number // 单价
  supplier?: string // 供应商
  applicableModels?: string[] // 适用车型
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

// 订单基础库
export interface Order {
  id: string
  orderNumber: string // 订单号
  deliveryNumber?: string // 发货号
  warehouse?: string // 发货库
  dealerCode?: string // 经销商编码
  dealerName?: string // 经销商名称
  orderDate?: string // 订单日期
  deliveryDate?: string // 发货日期
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled'
  // 订单明细
  items?: OrderItem[]
  createdAt: string
  updatedAt: string
}

// 订单明细
export interface OrderItem {
  id: string
  orderId: string
  partNumber: string // 配件编号
  partName: string // 配件名称
  quantity: number // 数量
  price?: number // 单价
  amount?: number // 金额
}

// 车辆基础库
export interface Vehicle {
  id: string
  vin: string // VIN码
  platform?: string // 车型平台
  model?: string // 车型
  productionDate?: string // 生产日期
  engineNumber?: string // 发动机号
  color?: string // 颜色
  dealerCode?: string // 经销商编码
  saleDate?: string // 销售日期
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

// ==================== 预定义字段模板 ====================

export interface PredefinedField {
  id: string
  name: string // 字段名称，如"VIN码"
  code: string // 字段代码，如"vin_code"
  category: 'vehicle' | 'dealer' | 'fault' | 'business' | 'common' // 分类
  fieldConfig: Omit<FormField, 'id'> // 字段配置（不含id，创建时动态生成）
  description?: string
  enabled: boolean
  order: number
  createdAt: string
  updatedAt: string
}

// ==================== 字段类型配置 ====================

export interface FieldTypeConfig {
  id: string
  type: string // 字段类型标识
  label: string // 显示名称
  icon: string // 图标名称
  category: 'basic' | 'advanced' | 'layout' | 'custom' // 分类
  enabled: boolean // 是否启用
  order: number // 排序
  isSystem: boolean // 是否系统内置
  description?: string // 描述
  defaultProps?: Record<string, unknown> // 默认属性
  createdAt: string
  updatedAt: string
}

// ==================== 表单相关类型 ====================

export type FieldType =
  | 'text'
  | 'number'
  | 'textarea'
  | 'date'
  | 'datetime'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'switch'
  | 'file'
  | 'richtext'
  | 'subtable'
  | 'signature'
  | 'cascade'
  | 'formula'
  | 'divider'
  | 'description'
  | 'related_documents' // 关联单据列表

export interface SelectOption {
  label: string
  value: string
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom'
  value?: string | number
  message: string
}

export interface CascadeOption {
  label: string
  value: string
  children?: CascadeOption[]
}

export interface CascadeConfig {
  options: CascadeOption[]
  level: number
}

export interface FormulaConfig {
  expression: string
  dependencies: string[]
}

// 字段联动配置
export interface FieldLinkageConfig {
  sourceField: string // 触发联动的字段名
  sourceType: 'vin' | 'dealer_code' | 'custom' // 联动类型
  targetMappings: FieldLinkageMapping[] // 目标字段映射
}

// 关联单据字段配置
export interface RelatedDocumentConfig {
  docTypeId: string // 关联的单据类型ID
  docTypeName: string // 关联的单据类型名称
  linkField: string // 关联字段（在关联单据中的字段名）
  linkSourceField: string // 源字段（当前单据中的字段名）
  displayColumns: RelatedDocumentColumn[] // 显示的列
  actions?: RelatedDocumentAction[] // 可用的操作
  emptyText?: string // 空数据时的提示
  allowCreate?: boolean // 是否允许创建关联单据
  createButtonText?: string // 创建按钮文字
  createButtonIcon?: string // 创建按钮图标
}

export interface RelatedDocumentColumn {
  field: string
  label: string
  width?: string
  format?: 'text' | 'date' | 'datetime' | 'status' | 'number'
}

export interface RelatedDocumentAction {
  code: string
  label: string
  icon?: string
  confirmRequired?: boolean
  confirmMessage?: string
}

export interface FieldLinkageMapping {
  targetField: string // 目标字段名
  sourceProperty: string // 源数据属性
}

export interface FormField {
  id: string
  type: FieldType
  label: string
  name: string
  required: boolean
  placeholder?: string
  defaultValue?: unknown
  rules?: ValidationRule[]
  options?: SelectOption[]
  columns?: FormField[]
  cascadeConfig?: CascadeConfig
  formulaConfig?: FormulaConfig
  width?: 'full' | 'half' | 'third'
  description?: string
  hidden?: boolean
  disabled?: boolean
  // 文本字段属性
  minLength?: number
  maxLength?: number
  pattern?: string
  // 数字字段属性
  min?: number
  max?: number
  precision?: number
  step?: number
  // 多行文本属性
  rows?: number
  // 文件上传属性
  accept?: string
  maxSize?: number
  multiple?: boolean
  // 日期属性
  dateFormat?: string
  // 字段联动配置
  linkage?: FieldLinkageConfig
  // 关联单据配置（仅 related_documents 类型使用）
  relatedDocConfig?: RelatedDocumentConfig
  // 虚拟字段配置
  virtualField?: VirtualFieldConfig
}

// ==================== 操作按钮配置 ====================

export type ActionButtonType = 
  | 'primary'    // 主要按钮（如提交、发布）
  | 'secondary'  // 次要按钮（如导出、打印）
  | 'danger'     // 危险按钮（如删除）
  | 'link'       // 链接按钮（如历史记录查看）
  | 'external'   // 外部链接（如打开第三方系统）

export type ActionButtonPosition = 
  | 'header'     // 页面顶部操作栏
  | 'toolbar'    // 工具栏
  | 'inline'     // 行内按钮
  | 'footer'     // 页面底部

export interface ActionButton {
  id: string
  name: string // 按钮名称
  code: string // 按钮代码（用于程序识别）
  type: ActionButtonType
  icon?: string // 图标名称
  position: ActionButtonPosition
  // 显示条件
  visibleStatus?: string[] // 在哪些状态下可见
  visibleRoles?: string[] // 哪些角色可见
  // 行为配置
  actionType: 'status_change' | 'api_call' | 'open_url' | 'generate_doc' | 'export' | 'custom'
  // 状态变更配置
  toStatus?: string // 目标状态
  // API调用配置
  apiUrl?: string
  apiMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  // URL配置
  openUrl?: string
  openInNewTab?: boolean
  // 生成单据配置
  generateDocTypeId?: string // 生成的单据类型ID
  fieldMapping?: Record<string, string> // 字段映射
  // 确认配置
  confirmRequired?: boolean
  confirmMessage?: string
  // 其他
  order: number
  enabled: boolean
}

// ==================== 单据类型（原表单分类） ====================

export interface DocumentType {
  id: string
  name: string // 单据类型名称，如"求援反馈单"
  code: string // 类型代码，如"support_feedback"
  icon?: string
  description?: string
  // 字段配置（原FormConfig中的fields）
  fields: FormField[]
  // 字段组配置（用于引用预定义字段组）
  fieldGroups?: FieldGroupReference[]
  layout: 'vertical' | 'horizontal' | 'grid'
  // 单号规则
  numberRule?: DocumentNumberRule
  // 流程配置
  workflowEnabled?: boolean
  // 操作按钮配置
  actionButtons?: ActionButton[]
  // 其他设置
  enableReply?: boolean // 是否启用回复
  allowManualCreate?: boolean // 是否允许手动创建（默认true），设为false时只能通过流程自动生成
  parentDocTypeId?: string // 父单据类型ID（用于关联生成的单据）
  status: 'draft' | 'published'
  order: number
  createdAt: string
  updatedAt: string
}

// 保持向后兼容的别名
export type FormCategory = DocumentType

// ==================== 单号规则 ====================

export interface DocumentNumberRule {
  prefix: string // 前缀，如 "PO"
  dateFormat?: 'YYYYMMDD' | 'YYMMDD' | 'YYYY' | 'YYMM' | 'YYYYMM' // 日期格式
  sequenceLength: number // 流水号位数
  resetCycle?: 'daily' | 'monthly' | 'yearly' | 'never' // 重置周期
}

export interface FormConfig {
  id: string
  name: string
  description?: string
  categoryId?: string // 表单分类
  fields: FormField[]
  layout: 'vertical' | 'horizontal' | 'grid'
  numberRule?: DocumentNumberRule // 单号规则
  enableReply?: boolean // 是否启用回复
  status: 'draft' | 'published' // 表单状态
  createdAt: string
  updatedAt: string
}

// ==================== 流程相关类型 ====================

// 流程事件类型
export type FlowEventType =
  | 'create'      // 创建
  | 'submit'      // 提交
  | 'approve'     // 审批
  | 'reject'      // 驳回
  | 'transfer'    // 转单
  | 'revoke'      // 撤回
  | 'resubmit'    // 重新提交
  | 'cancel'      // 取消
  | 'complete'    // 完成
  | 'notify'      // 通知

// 流程事件配置
export interface FlowEvent {
  id: string
  type: FlowEventType
  name: string
  description?: string
  enabled?: boolean // 是否启用，默认为 true
  fromStatus?: string[] // 允许从哪些状态触发此事件
  toStatus?: string // 触发后转换到的状态
  permissions?: string[] // 允许触发此事件的角色
  conditions?: ConditionRule[] // 触发条件
  actions?: FlowEventAction[] // 触发后的动作
}

// 事件动作
export interface FlowEventAction {
  type: 'notify' | 'update_status' | 'call_api' | 'assign' | 'auto_approve'
  config: Record<string, unknown>
}

export type NodeType =
  | 'start'        // 流程开始
  | 'end'          // 流程结束
  | 'create'       // 创建单据节点
  | 'fill'         // 填写信息节点
  | 'submit'       // 提交节点
  | 'approve'      // 审批节点
  | 'review'       // 审核节点（不修改状态，只查看）
  | 'condition'    // 条件分支
  | 'parallel'     // 并行节点
  | 'countersign'  // 会签节点
  | 'notify'       // 通知节点
  | 'subprocess'   // 子流程
  | 'transfer'     // 转单节点
  | 'convert'      // 转换单据类型节点
  | 'action'       // 自定义动作节点

export type ApproverType = 'user' | 'role' | 'department' | 'initiator' | 'superior'

export interface ApproverConfig {
  type: ApproverType
  value: string[]
  multiApprove?: 'any' | 'all' | 'sequence'
}

export interface ConditionRule {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'empty'
  value: string | number
}

export interface ConditionConfig {
  id: string
  name: string
  rules: ConditionRule[]
  logic: 'and' | 'or'
  targetNodeId: string
}

export interface NotificationConfig {
  type: 'email' | 'sms' | 'system'
  recipients: ApproverConfig
  template: string
}

export interface WorkflowNodeData {
  label: string
  description?: string
  approvers?: ApproverConfig
  conditions?: ConditionConfig[]
  notifications?: NotificationConfig
  timeout?: number
  timeoutAction?: 'approve' | 'reject' | 'notify'
  // 权限配置
  permissions?: NodePermission[] // 按角色配置的权限
}

export interface WorkflowNode {
  id: string
  type: NodeType
  position: { x: number; y: number }
  data: WorkflowNodeData
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  label?: string
  conditionId?: string
}

export interface WorkflowConfig {
  id: string
  name: string
  categoryId: string // 关联表单分类
  formId?: string // 可选关联具体表单
  description?: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  events: FlowEvent[] // 流程事件配置
  statuses: DocumentStatusConfig[] // 可配置的单据状态
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
}

// ==================== 页面配置相关类型 ====================

export type PageType = 'list' | 'form' | 'detail' | 'kanban' | 'dashboard'

export type ActionType = 'create' | 'edit' | 'delete' | 'export' | 'import' | 'custom'

export interface PageAction {
  id: string
  type: ActionType
  label: string
  icon?: string
  position: 'toolbar' | 'row' | 'batch'
  permission?: string
  confirm?: boolean
  confirmMessage?: string
  customAction?: string
}

export interface ListColumn {
  field: string
  label: string
  width?: number
  sortable?: boolean
  filterable?: boolean
  hidden?: boolean
  format?: 'text' | 'date' | 'number' | 'status' | 'link'
}

export interface FilterConfig {
  field: string
  label: string
  type: 'text' | 'select' | 'date' | 'dateRange' | 'number'
  options?: SelectOption[]
}

export interface PageConfig {
  id: string
  name: string
  type: PageType
  formId?: string
  workflowId?: string
  columns?: ListColumn[]
  filters?: FilterConfig[]
  actions?: PageAction[]
  layout?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

// ==================== 权限相关类型 ====================

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'import'

export type ResourceType = 'page' | 'button' | 'field' | 'data'

export interface Permission {
  id: string
  resourceId: string
  resourceType: ResourceType
  resourceName: string
  actions: PermissionAction[]
}

export interface Role {
  id: string
  name: string
  code: string
  description?: string
  permissions: Permission[]
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  username: string
  name: string
  email?: string
  avatar?: string
  department?: string
  roles: string[]
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface FieldPermission {
  fieldId: string
  roleId: string
  visible: boolean
  editable: boolean
}

// 节点权限配置
export interface NodePermission {
  roleId: string // 用户组/角色ID
  // 字段权限
  fieldPermissions: Record<string, { visible: boolean; editable: boolean }> // 字段ID -> 权限
  // 节点操作权限
  canView: boolean // 是否可以查看该节点的单据
  canEdit: boolean // 是否可以编辑该节点的单据
  canApprove: boolean // 是否可以审批（仅审批节点）
  canReject: boolean // 是否可以驳回（仅审批节点）
  canReturn: boolean // 是否可以退回到草稿状态
  canTransfer: boolean // 是否可以转单
  canComment: boolean // 是否可以添加评论
}

// 批量字段权限配置
export interface BatchFieldPermission {
  targetRoleIds: string[] // 目标角色ID列表
  fieldPermissions: Record<string, { visible: boolean; editable: boolean }> // 字段权限
}

// ==================== 应用相关类型 ====================

export interface Application {
  id: string
  name: string
  description?: string
  icon?: string
  formId: string
  workflowId?: string
  pageId: string
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
}

// ==================== 单据状态配置 ====================

export interface DocumentStatusConfig {
  id: string
  code: string // 状态代码
  name: string // 显示名称
  color: string // 状态颜色
  isInitial?: boolean // 是否初始状态
  isFinal?: boolean // 是否终态
  order: number
}

// ==================== 单据数据类型 ====================

export type DocumentStatus = string // 改为动态状态

export interface Document {
  id: string
  documentNumber: string // 单号
  documentTypeId: string // 单据类型ID（原formId）
  documentTypeName?: string // 单据类型名称（冗余字段，便于查询）
  formId?: string // 兼容旧数据
  appId?: string

  // ==================== 基础信息字段 ====================
  status: DocumentStatus
  statusName?: string // 状态名称（冗余字段，便于查询）
  currentNodeId?: string
  currentNodeName?: string // 当前节点名称（冗余字段）
  workflowId?: string

  // ==================== 人员信息字段 ====================
  createdBy: string
  createdByName: string
  createdByOrg?: string // 创建人组织（服务站/经销商等）
  createdByOrgCode?: string // 创建人组织代码
  createdByPosition?: string // 创建人岗位
  createdByDepartment?: string // 创建人部门
  createdByPhone?: string // 创建人联系电话
  createdByEmail?: string // 创建人邮箱

  updatedBy?: string
  updatedByName?: string

  // ==================== 时间字段 ====================
  createdAt: string
  submittedAt?: string // 提交时间
  updatedAt: string
  completedAt?: string // 完成时间
  latestReplyAt?: string // 最新回复时间（冗余字段）

  // ==================== 来源信息字段 ====================
  sourceDocumentId?: string
  sourceDocumentNumber?: string
  sourceDocumentType?: string

  // ==================== 业务关键字段 ====================
  // 索赔/回货通用字段
  claimNo?: string // 索赔单号

  // 服务站/组织信息
  serviceStationCode?: string // 服务站代码
  serviceStationName?: string // 服务站名称
  serviceStationAddress?: string // 服务站地址

  // 配件信息字段
  partDrawingNo?: string // 配件图号
  partName?: string // 配件名称
  partQuantity?: number // 配件数量
  partUnit?: string // 配件单位
  partUnitPrice?: number // 配件单价
  partTotalAmount?: number // 配件总金额

  // 车辆信息字段
  vin?: string // VIN码
  vehicleModel?: string // 车型
  vehiclePlatform?: string // 车型平台
  vehicleColor?: string // 车辆颜色
  productionDate?: string // 生产日期

  // 物流信息字段
  shippingWarehouse?: string // 发货仓库
  shippingDate?: string // 发货日期
  deliveryNumber?: string // 发货单号
  estimatedArrivalDate?: string // 预计到达日期

  // 质量信息字段
  qualityStatus?: string // 质量状态
  problemType?: string // 问题类型
  problemLevel?: string // 问题等级

  // ==================== 扩展字段 ====================
  tags?: string[] // 标签数组
  attributes?: Record<string, unknown> // 扩展属性
  priority?: 'low' | 'normal' | 'high' | 'urgent' // 优先级

  // ==================== 原始表单数据 ====================
  formData: Record<string, unknown> // 表单业务数据（保留原有结构，用于特殊业务字段）

  // ==================== 统计字段 ====================
  replyCount?: number // 回复数量
  approvalCount?: number // 审批次数
  viewCount?: number // 查看次数
}

export interface ApprovalRecord {
  id: string
  documentId: string
  nodeId: string
  nodeName: string
  approverId: string
  approverName: string
  action: 'approve' | 'reject' | 'transfer' | 'countersign'
  comment?: string
  createdAt: string
}

// ==================== 单据回复类型 ====================

export interface DocumentReply {
  id: string
  documentId: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  attachments?: string[]
  parentId?: string // 回复的回复
  createdAt: string
}

// ==================== 单号序列存储 ====================

export interface DocumentSequence {
  formId: string
  prefix: string
  currentNumber: number
  lastResetDate: string
}

// ==================== 知识资料库类型 ====================

export type KnowledgeCategory = 'manual' | 'faq' | 'troubleshooting' | 'specification' | 'notice' | 'other'

export interface KnowledgeArticle {
  id: string
  title: string
  category: KnowledgeCategory
  content: string // 支持 Markdown
  tags: string[]
  keywords: string[] // 用于AI搜索匹配
  attachments?: string[]
  relatedDocumentTypes?: string[] // 关联的单据类型ID
  viewCount: number
  helpful: number // 有帮助的次数
  status: 'draft' | 'published' | 'archived'
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
}

// AI 对话记录
export interface AIConversation {
  id: string
  userId: string
  userName: string
  messages: AIMessage[]
  resolved: boolean // 是否已解决
  createdDocumentId?: string // 如果最终创建了单据，记录单据ID
  createdAt: string
  updatedAt: string
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  references?: AIReference[] // AI回答时引用的资料
  suggestedAction?: 'create_document' | 'view_article' | 'contact_support'
  suggestedDocumentTypeId?: string
  timestamp: string
}

export interface AIReference {
  type: 'article' | 'document'
  id: string
  title: string
  excerpt: string
}

// ==================== AI 问答规则配置 ====================

export interface AIDocumentRule {
  id: string
  name: string // 规则名称
  description?: string
  enabled: boolean
  priority: number // 优先级，数字越小优先级越高
  
  // 匹配条件
  matchConditions: AIMatchCondition[]
  matchLogic: 'and' | 'or' // 条件之间的关系
  
  // 触发动作
  action: AIRuleAction
  
  createdAt: string
  updatedAt: string
}

export interface AIMatchCondition {
  id: string
  type: 'keyword' | 'intent' | 'category' | 'entity'
  // keyword: 关键词匹配
  // intent: 意图匹配（如：咨询、投诉、求援��
  // category: 分类匹配（如：电池、充电、底盘）
  // entity: 实体匹配（如：故障码格式）
  value: string // 匹配值，支持多个值用逗号分隔
  matchMode: 'contains' | 'exact' | 'regex' | 'startsWith' | 'endsWith'
}

export interface AIRuleAction {
  type: 'suggest_document' | 'auto_fill' | 'show_guide' | 'escalate'
  // suggest_document: 建议创建单据
  // auto_fill: 自动填充字段
  // show_guide: 显示引导信息
  // escalate: 升级处理
  
  // 建议创建单据时的配置
  documentTypeId?: string
  
  // 自动填充字段映射（从对话中提取的信息映射到单据字段）
  fieldMappings?: AIFieldMapping[]
  
  // 引导信息
  guideMessage?: string
  
  // 相关知识库文章ID
  relatedArticleIds?: string[]
}

export interface AIFieldMapping {
  sourceKey: string // 从对话中提取的信息标识（如：vin、fault_code、description）
  targetField: string // 目标单据字段名
  extractPattern?: string // 提取模式（正则表达式）
}

// ==================== 字段组相关类型 ====================

// 虚拟字段配置
export interface VirtualFieldConfig {
  sourceField: keyof Document // Document中的字段名
  readOnly: boolean
  displayName?: string
  formatType?: 'text' | 'date' | 'datetime' | 'status'
}

// 字段组引用配置
export interface FieldGroupReference {
  fieldGroupId: string
  enabled: boolean
  overrideFields?: Partial<FormField>[]
  customFields?: FormField[]
}

// 字段组类型
export interface FieldGroup {
  id: string
  name: string
  code: string
  description?: string
  fields: FormField[]
  isSystem: boolean
  isPublic: boolean
  category: 'basic' | 'business' | 'system' | 'custom'
  version: string
  createdAt: string
  updatedAt: string
}
