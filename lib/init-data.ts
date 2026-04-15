// AC问答平台 - 初始化数据
// 单据类型 = 表单分类 + 字段配置

import type { DocumentType, WorkflowConfig, ActionButton } from '@/lib/types'
import { 
  qualityCategories, 
  faultTypes, 
  serviceSources, 
  getBaseDataOptions 
} from '@/lib/base-data'

// 使用固定时间戳避免 hydration 问题
const FIXED_TIMESTAMP = '2024-01-01T00:00:00.000Z'

// 求援反馈单 - 单据类型（包含字段配置）
const supportFeedbackDocType: DocumentType = {
  id: 'doctype_support_feedback',
  name: '求援反馈单',
  code: 'support_feedback',
  icon: 'HeadphonesIcon',
  description: '用于服务站向主机厂反馈技术问题，获取维修方案',
  layout: 'vertical',
  numberRule: {
    prefix: 'SF',
    dateFormat: 'YYYYMMDD',
    sequenceLength: 4,
    resetCycle: 'daily',
  },
  workflowEnabled: true,
  enableReply: true,
  status: 'published',
  order: 1,
  createdAt: FIXED_TIMESTAMP,
  updatedAt: FIXED_TIMESTAMP,
  // 操作按钮配置
  actionButtons: [
    {
      id: 'btn_publish_quality',
      name: '发布至质量系统',
      code: 'publish_quality',
      type: 'primary',
      icon: 'Upload',
      position: 'header',
      visibleStatus: ['replied', 'closed'],
      visibleRoles: ['admin', 'engineer'],
      actionType: 'api_call',
      apiUrl: '/api/quality/publish',
      apiMethod: 'POST',
      confirmRequired: true,
      confirmMessage: '确定要发布至质量系统吗？',
      order: 1,
      enabled: true,
    },
    {
      id: 'btn_export',
      name: '导出',
      code: 'export',
      type: 'secondary',
      icon: 'Download',
      position: 'header',
      visibleStatus: ['pending', 'replied', 'closed'],
      actionType: 'export',
      order: 2,
      enabled: true,
    },
    {
      id: 'btn_delete',
      name: '删除',
      code: 'delete',
      type: 'danger',
      icon: 'Trash2',
      position: 'header',
      visibleStatus: ['draft'],
      visibleRoles: ['admin', 'dealer'],
      actionType: 'status_change',
      toStatus: 'cancelled',
      confirmRequired: true,
      confirmMessage: '确定要删除此单据吗？',
      order: 3,
      enabled: true,
    },
    {
      id: 'btn_history',
      name: '历史求援反馈',
      code: 'history_feedback',
      type: 'link',
      position: 'toolbar',
      actionType: 'open_url',
      openUrl: '/runtime/documents?type=support_feedback&vin={vin}',
      openInNewTab: false,
      order: 1,
      enabled: true,
    },
    {
      id: 'btn_remote_diagnostic',
      name: '打开远程诊断平台',
      code: 'remote_diagnostic',
      type: 'primary',
      icon: 'ExternalLink',
      position: 'toolbar',
      actionType: 'open_url',
      openUrl: 'https://diagnostic.example.com?vin={vin}',
      openInNewTab: true,
      order: 2,
      enabled: true,
    },
    {
      id: 'btn_generate_battery_service',
      name: '生成动力电池服务单',
      code: 'generate_battery_service',
      type: 'primary',
      icon: 'FilePlus',
      position: 'toolbar',
      visibleStatus: ['replied', 'closed'],
      actionType: 'generate_doc',
      generateDocTypeId: 'doctype_battery_service',
      confirmRequired: true,
      confirmMessage: '确定要生成动力电池服务单吗？',
      order: 3,
      enabled: true,
    },
    {
      id: 'btn_diagnostic_report',
      name: '诊断报告',
      code: 'diagnostic_report',
      type: 'primary',
      icon: 'FileText',
      position: 'inline',
      actionType: 'open_url',
      openUrl: '/reports/diagnostic/{id}',
      openInNewTab: true,
      order: 1,
      enabled: true,
    },
  ] as ActionButton[],
  fields: [
    // ========== 简介区域 ==========
    { id: 'f_divider_basic', type: 'divider', label: '简介', name: 'divider_basic', required: false },
    
    { 
      id: 'f_quality_category', 
      type: 'select', 
      label: '质量信息类别', 
      name: 'qualityCategory', 
      required: false,
      options: getBaseDataOptions(qualityCategories),
      width: 'third',
    },
    { 
      id: 'f_fault_type', 
      type: 'select', 
      label: '故障类别', 
      name: 'faultType', 
      required: false,
      options: getBaseDataOptions(faultTypes),
      width: 'third',
    },
    { 
      id: 'f_power_system', 
      type: 'text', 
      label: '动力总成', 
      name: 'powerSystem', 
      required: false,
      width: 'third',
    },
    { 
      id: 'f_info_source', 
      type: 'select', 
      label: '信息来源', 
      name: 'infoSource', 
      required: false,
      options: getBaseDataOptions(serviceSources),
      width: 'third',
    },
    { 
      id: 'f_customer_repair', 
      type: 'text', 
      label: '客户报修', 
      name: 'customerRepair', 
      required: false,
      width: 'third',
    },
    { 
      id: 'f_is_public', 
      type: 'radio', 
      label: '是否公开', 
      name: 'isPublic', 
      required: false,
      options: [{ label: '是', value: 'yes' }, { label: '否', value: 'no' }],
      defaultValue: 'no',
      width: 'third',
    },
    
    // ========== 车辆信息区域 ==========
    { id: 'f_divider_vehicle', type: 'divider', label: '车辆信息', name: 'divider_vehicle', required: false },
    
    { 
      id: 'f_vin', 
      type: 'text', 
      label: 'VIN码', 
      name: 'vin', 
      required: true,
      placeholder: '请输入17位VIN码，自动带出车辆信息',
      description: '输入VIN码后自动填充车型平台、配置、VSN等信息',
      maxLength: 17,
      width: 'half',
    },
    { 
      id: 'f_vehicle_code', 
      type: 'text', 
      label: '车型代码', 
      name: 'vehicle_code', 
      required: false,
      description: '根据VIN自动带出',
      width: 'half',
    },
    { 
      id: 'f_vehicle_platform', 
      type: 'text', 
      label: '车型平台', 
      name: 'platform_name', 
      required: false,
      description: '根据VIN自动带出',
      width: 'third',
    },
    { 
      id: 'f_platform_sub', 
      type: 'text', 
      label: '车型平台子项', 
      name: 'platformSub', 
      required: false,
      width: 'third',
    },
    { 
      id: 'f_vehicle_config', 
      type: 'text', 
      label: '车辆配置', 
      name: 'config_name', 
      required: false,
      description: '根据VIN自动带出',
      width: 'third',
    },
    { 
      id: 'f_vsn', 
      type: 'text', 
      label: 'VSN码', 
      name: 'vsn_code', 
      required: false,
      description: '根据VIN自动带出',
      width: 'third',
    },
    { 
      id: 'f_engine_name', 
      type: 'text', 
      label: '发动机名称', 
      name: 'engine_batch_no', 
      required: false,
      description: '根据VIN自动带出',
      width: 'third',
    },
    { 
      id: 'f_engine_number', 
      type: 'text', 
      label: '发动机编号', 
      name: 'engineNumber', 
      required: false,
      width: 'third',
    },
    { 
      id: 'f_transmission', 
      type: 'text', 
      label: '变速器', 
      name: 'transmission', 
      required: false,
      width: 'third',
    },
    { 
      id: 'f_reducer', 
      type: 'text', 
      label: '单级减速器', 
      name: 'reducer', 
      required: false,
      width: 'third',
    },
    { 
      id: 'f_production_date', 
      type: 'date', 
      label: '生产日期', 
      name: 'production_date', 
      required: false,
      description: '根据VIN自动带出',
      width: 'third',
    },
    { 
      id: 'f_invoice_date', 
      type: 'date', 
      label: '开票日期', 
      name: 'invoiceDate', 
      required: false,
      width: 'third',
    },
    { 
      id: 'f_repair_date', 
      type: 'date', 
      label: '维修日期', 
      name: 'repairDate', 
      required: false,
      width: 'third',
    },
    { 
      id: 'f_mileage', 
      type: 'text', 
      label: '行驶里程', 
      name: 'mileage', 
      required: false,
      placeholder: '如: 8926km',
      width: 'third',
    },
    { 
      id: 'f_remark_vehicle', 
      type: 'text', 
      label: '备注', 
      name: 'remarkVehicle', 
      required: false,
      placeholder: '如: E10/E50',
      width: 'third',
    },
    { 
      id: 'f_repair_order', 
      type: 'text', 
      label: '维修工单号', 
      name: 'repairOrderNumber', 
      required: false,
      width: 'third',
    },
    
    // ========== 经销商信息区域 ==========
    { id: 'f_divider_dealer', type: 'divider', label: '经销商信息', name: 'divider_dealer', required: false },
    
    { 
      id: 'f_dealer_code', 
      type: 'text', 
      label: '经销商编码', 
      name: 'dealer_code', 
      required: true,
      placeholder: '输入经销商编码自动带出名称',
      description: '输入编码后自动填充经销商名称和地址',
      width: 'half',
    },
    { 
      id: 'f_dealer_name', 
      type: 'text', 
      label: '经销商名称', 
      name: 'dealer_name', 
      required: false,
      description: '根据经销商编码自动带出',
      width: 'half',
    },
    { 
      id: 'f_dealer_address', 
      type: 'textarea', 
      label: '经销商地址', 
      name: 'dealer_address', 
      required: false,
      description: '根据经销商编码自动带出',
      rows: 2,
      width: 'full',
    },
    { 
      id: 'f_repair_supervisor', 
      type: 'text', 
      label: '维修主管', 
      name: 'repairSupervisor', 
      required: false,
      width: 'third',
    },
    { 
      id: 'f_phone', 
      type: 'text', 
      label: '手机', 
      name: 'phone', 
      required: false,
      width: 'third',
    },
    { 
      id: 'f_landline', 
      type: 'text', 
      label: '固话', 
      name: 'landline', 
      required: false,
      width: 'third',
    },
    
    // ========== 标准化故障信息提报区域 ==========
    { id: 'f_divider_fault', type: 'divider', label: '标准化故障信息提报', name: 'divider_fault', required: false },
    
    { 
      id: 'f_fault_info', 
      type: 'textarea', 
      label: '故障信息', 
      name: 'faultInfo', 
      required: false,
      placeholder: '故障现象、故障码(DTC)、检查、故障',
      description: '请详细描述故障信息',
      rows: 3,
      width: 'full',
    },
    { 
      id: 'f_active_warning', 
      type: 'text', 
      label: '主动服务预警', 
      name: 'activeWarning', 
      required: false,
      placeholder: '如: 动力电池 - 单体一致性差',
      width: 'full',
    },
    { 
      id: 'f_charging_fault', 
      type: 'text', 
      label: '充电时故障', 
      name: 'chargingFault', 
      required: false,
      placeholder: '如: 车辆 - 无法充电',
      width: 'full',
    },
    { 
      id: 'f_bms_fault', 
      type: 'text', 
      label: 'BMS故障', 
      name: 'bmsFault', 
      required: false,
      placeholder: '如: P181900 - 单体电压高于三级故障门限值',
      width: 'full',
    },
  ],
}

// 求援反馈单的工作流配置
const supportFeedbackWorkflow: WorkflowConfig = {
  id: 'wf_support_feedback',
  name: '求援反馈流程',
  categoryId: 'doctype_support_feedback',
  formId: 'doctype_support_feedback',
  description: '服务站求援反馈单处理流程',
  nodes: [
    { id: 'node_start', type: 'start', position: { x: 400, y: 50 }, data: { label: '开始' } },
    { id: 'node_create', type: 'create', position: { x: 400, y: 150 }, data: { label: '服务站创建单据', assignee: '服务站', assigneeRole: 'dealer' } },
    { id: 'node_fill', type: 'fill', position: { x: 400, y: 260 }, data: { label: '填写故障信息', assignee: '服务站', assigneeRole: 'dealer' } },
    { id: 'node_submit', type: 'submit', position: { x: 400, y: 370 }, data: { label: '提交反馈', assignee: '服务站', assigneeRole: 'dealer' } },
    { id: 'node_engineer_reply', type: 'fill', position: { x: 400, y: 480 }, data: { label: '工程师回复', assignee: '主机厂工程师', assigneeRole: 'engineer' } },
    { id: 'node_condition', type: 'condition', position: { x: 400, y: 590 }, data: { label: '问题是否解决' } },
    { id: 'node_close', type: 'approve', position: { x: 250, y: 700 }, data: { label: '服务站确认关闭', assignee: '服务站', assigneeRole: 'dealer' } },
    { id: 'node_supplement', type: 'fill', position: { x: 550, y: 700 }, data: { label: '补充信息', assignee: '服务站', assigneeRole: 'dealer' } },
    { id: 'node_end', type: 'end', position: { x: 250, y: 820 }, data: { label: '流程结束' } },
  ],
  edges: [
    { id: 'edge_1', source: 'node_start', target: 'node_create', animated: true },
    { id: 'edge_2', source: 'node_create', target: 'node_fill' },
    { id: 'edge_3', source: 'node_fill', target: 'node_submit' },
    { id: 'edge_4', source: 'node_submit', target: 'node_engineer_reply' },
    { id: 'edge_5', source: 'node_engineer_reply', target: 'node_condition' },
    { id: 'edge_6', source: 'node_condition', target: 'node_close', label: '已解决' },
    { id: 'edge_7', source: 'node_condition', target: 'node_supplement', label: '需补充' },
    { id: 'edge_8', source: 'node_close', target: 'node_end' },
    { id: 'edge_9', source: 'node_supplement', target: 'node_engineer_reply', label: '重新提交' },
  ],
  events: [
    { id: 'evt_create', type: 'create', name: '创建单据', enabled: true, toStatus: 'draft', permissions: ['dealer'] },
    { id: 'evt_submit', type: 'submit', name: '提交反馈', enabled: true, fromStatus: ['draft', 'supplement'], toStatus: 'pending', permissions: ['dealer'] },
    { id: 'evt_reply', type: 'approve', name: '回复方案', enabled: true, fromStatus: ['pending'], toStatus: 'replied', permissions: ['engineer'] },
    { id: 'evt_supplement', type: 'resubmit', name: '补充信息', enabled: true, fromStatus: ['replied'], toStatus: 'supplement', permissions: ['dealer'] },
    { id: 'evt_close', type: 'complete', name: '确认关闭', enabled: true, fromStatus: ['replied'], toStatus: 'closed', permissions: ['dealer'] },
    { id: 'evt_revoke', type: 'revoke', name: '撤回', enabled: true, fromStatus: ['pending'], toStatus: 'draft', permissions: ['dealer'] },
    { id: 'evt_cancel', type: 'cancel', name: '取消', enabled: true, fromStatus: ['draft'], toStatus: 'cancelled', permissions: ['dealer', 'admin'] },
  ],
  statuses: [
    { id: 'st_draft', code: 'draft', name: '草稿', color: '#6b7280', isInitial: true, isFinal: false, order: 1 },
    { id: 'st_pending', code: 'pending', name: '待回复', color: '#f59e0b', isInitial: false, isFinal: false, order: 2 },
    { id: 'st_replied', code: 'replied', name: '已回复', color: '#3b82f6', isInitial: false, isFinal: false, order: 3 },
    { id: 'st_supplement', code: 'supplement', name: '待补充', color: '#8b5cf6', isInitial: false, isFinal: false, order: 4 },
    { id: 'st_closed', code: 'closed', name: '已关闭', color: '#10b981', isInitial: false, isFinal: true, order: 5 },
    { id: 'st_cancelled', code: 'cancelled', name: '已取消', color: '#9ca3af', isInitial: false, isFinal: true, order: 6 },
  ],
  status: 'published',
  createdAt: FIXED_TIMESTAMP,
  updatedAt: FIXED_TIMESTAMP,
}

// 数据版本号 - 更新此版本号会强制重新初始化
const DATA_VERSION = '14'

// 初始化数据到 localStorage - 只在客户端执行
export function initializeSystemData(): void {
  if (typeof window === 'undefined') return
  
  // 检查版本号，版本不匹配则强制重新初始化
  const currentVersion = localStorage.getItem('ac_platform_version')
  const needsReinit = currentVersion !== DATA_VERSION
  
  // 初始化或更新单据类型
  if (needsReinit) {
    const existingDocTypes = localStorage.getItem('lowcode_document_types')
    const docTypes = existingDocTypes ? JSON.parse(existingDocTypes) : []
    const docTypeIndex = docTypes.findIndex((dt: DocumentType) => dt.id === supportFeedbackDocType.id)
    if (docTypeIndex >= 0) {
      docTypes[docTypeIndex] = supportFeedbackDocType
    } else {
      docTypes.push(supportFeedbackDocType)
    }
    localStorage.setItem('lowcode_document_types', JSON.stringify(docTypes))
    
    // 更新工作流
    const existingWorkflows = localStorage.getItem('lowcode_workflows')
    const workflows = existingWorkflows ? JSON.parse(existingWorkflows) : []
    const workflowIndex = workflows.findIndex((w: WorkflowConfig) => w.id === supportFeedbackWorkflow.id)
    if (workflowIndex >= 0) {
      workflows[workflowIndex] = supportFeedbackWorkflow
    } else {
      workflows.push(supportFeedbackWorkflow)
    }
    localStorage.setItem('lowcode_workflows', JSON.stringify(workflows))
  }
  
  // 初始化单据类型（首次）
  const existingDocTypes = localStorage.getItem('lowcode_document_types')
  if (!existingDocTypes || JSON.parse(existingDocTypes).length === 0) {
    localStorage.setItem('lowcode_document_types', JSON.stringify([supportFeedbackDocType]))
  }
  
  // 初始化工作流（如果不是重新初始化的情况）
  if (!needsReinit) {
    const existingWorkflows = localStorage.getItem('lowcode_workflows')
    const workflows = existingWorkflows ? JSON.parse(existingWorkflows) : []
    const hasWorkflow = workflows.some((w: WorkflowConfig) => w.id === supportFeedbackWorkflow.id)
    if (!hasWorkflow) {
      workflows.push(supportFeedbackWorkflow)
      localStorage.setItem('lowcode_workflows', JSON.stringify(workflows))
    }
  }
  
  // 更新版本号
  localStorage.setItem('ac_platform_version', DATA_VERSION)
}

// 导出单据类型供其他模块使用
export { supportFeedbackDocType, supportFeedbackWorkflow }
