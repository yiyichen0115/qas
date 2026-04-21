/**
 * PAC单据类型初始化脚本
 * 基于提供的图片配置PAC（产品售后问题）单据类型
 * 
 * 运行方式: 在浏览器控制台中执行或导入到页面中执行
 */

import type { DocumentType, FormField, DocumentNumberRule } from '@/lib/types'

// PAC单据类型配置
export const pacDocumentType: DocumentType = {
  id: 'doctype_pac',
  name: 'PAC单据',
  code: 'PAC',
  icon: 'FileQuestion',
  description: '产品售后问题反馈单，用于记录经销商反馈的产品质量问题、配件咨询等',
  
  // 单号规则
  numberRule: {
    prefix: 'PAC',
    dateFormat: 'YYYYMMDD',
    sequenceLength: 4,
    resetCycle: 'daily',
  } as DocumentNumberRule,
  
  // 字段配置
  fields: [
    // ========== 顶部信息区 ==========
    {
      id: 'section_header',
      type: 'divider',
      label: '基本信息',
      name: 'section_header',
      required: false,
      width: 'full',
    },
    {
      id: 'problem_id',
      type: 'text',
      label: '问题编号',
      name: 'problem_id',
      required: true,
      placeholder: '系统自动生成',
      disabled: true,
      width: 'third',
    },
    {
      id: 'submit_time',
      type: 'datetime',
      label: '提问时间',
      name: 'submit_time',
      required: true,
      width: 'third',
    },
    {
      id: 'reply_count',
      type: 'number',
      label: '回复次数',
      name: 'reply_count',
      required: false,
      defaultValue: 0,
      disabled: true,
      width: 'third',
    },
    {
      id: 'is_complaint',
      type: 'radio',
      label: '是否用户投诉',
      name: 'is_complaint',
      required: true,
      options: [
        { label: '是', value: 'yes' },
        { label: '否', value: 'no' },
      ],
      defaultValue: 'no',
      width: 'third',
    },
    
    // ========== 经销商信息区 ==========
    {
      id: 'section_dealer',
      type: 'divider',
      label: '经销商信息',
      name: 'section_dealer',
      required: false,
      width: 'full',
    },
    {
      id: 'dealer_code',
      type: 'text',
      label: '经销商编码',
      name: 'dealer_code',
      required: true,
      placeholder: '请输入经销商编码',
      width: 'third',
      // 可配置联动，根据经销商编码自动填充其他信息
      linkage: {
        sourceField: 'dealer_code',
        sourceType: 'dealer_code',
        targetMappings: [
          { targetField: 'user_name', sourceProperty: 'username' },
          { targetField: 'contact_person', sourceProperty: 'contact' },
          { targetField: 'contact_phone', sourceProperty: 'phone' },
          { targetField: 'contact_email', sourceProperty: 'email' },
          { targetField: 'province', sourceProperty: 'province' },
        ],
      },
    },
    {
      id: 'user_name',
      type: 'text',
      label: '用户名',
      name: 'user_name',
      required: false,
      placeholder: '用户名',
      width: 'third',
    },
    {
      id: 'contact_person',
      type: 'text',
      label: '联系人',
      name: 'contact_person',
      required: true,
      placeholder: '请输入联系人姓名',
      width: 'third',
    },
    {
      id: 'contact_phone',
      type: 'text',
      label: '联系方式',
      name: 'contact_phone',
      required: true,
      placeholder: '请输入联系电话',
      width: 'third',
    },
    {
      id: 'contact_email',
      type: 'text',
      label: '电子邮箱',
      name: 'contact_email',
      required: false,
      placeholder: '请输入电子邮箱',
      width: 'third',
    },
    {
      id: 'province',
      type: 'text',
      label: '省份',
      name: 'province',
      required: false,
      placeholder: '省份',
      width: 'third',
    },
    
    // ========== 问题详情区 ==========
    {
      id: 'section_problem',
      type: 'divider',
      label: '问题详情',
      name: 'section_problem',
      required: false,
      width: 'full',
    },
    {
      id: 'problem_type',
      type: 'select',
      label: '问题类型',
      name: 'problem_type',
      required: true,
      placeholder: '请选择问题类型',
      options: [
        { label: '配件状态咨询', value: 'parts_status' },
        { label: '配件质量问题', value: 'parts_quality' },
        { label: '技术咨询', value: 'technical' },
        { label: '售后服务', value: 'after_sales' },
        { label: '其他', value: 'other' },
      ],
      width: 'third',
    },
    {
      id: 'problem_category_level3',
      type: 'select',
      label: '问题类别三级',
      name: 'problem_category_level3',
      required: false,
      placeholder: '请选择三级分类',
      options: [
        { label: '配件质量问题', value: 'parts_quality' },
        { label: '配件供应问题', value: 'parts_supply' },
        { label: '配件价格问题', value: 'parts_price' },
        { label: '技术支持问题', value: 'tech_support' },
        { label: '其他问题', value: 'other' },
      ],
      width: 'third',
    },
    {
      id: 'problem_category_level4',
      type: 'select',
      label: '问题类别四级',
      name: 'problem_category_level4',
      required: false,
      placeholder: '请选择四级分类',
      options: [
        { label: '外观缺陷', value: 'appearance_defect' },
        { label: '功能故障', value: 'function_fault' },
        { label: '包装问题', value: 'packaging' },
        { label: '其他', value: 'other' },
      ],
      width: 'third',
    },
    {
      id: 'subject',
      type: 'text',
      label: '主题',
      name: 'subject',
      required: true,
      placeholder: '请输入问题主题',
      width: 'full',
      maxLength: 200,
    },
    {
      id: 'problem_description',
      type: 'textarea',
      label: '问题描述',
      name: 'problem_description',
      required: true,
      placeholder: '请详细描述您遇到的问题',
      rows: 4,
      width: 'full',
    },
    {
      id: 'attachments',
      type: 'file',
      label: '附件',
      name: 'attachments',
      required: false,
      accept: 'image/*,.pdf,.doc,.docx',
      multiple: true,
      maxSize: 10,
      width: 'full',
    },
    
    // ========== 车辆信息区 ==========
    {
      id: 'section_vehicle',
      type: 'divider',
      label: '车辆信息',
      name: 'section_vehicle',
      required: false,
      width: 'full',
    },
    {
      id: 'vin',
      type: 'text',
      label: 'VIN',
      name: 'vin',
      required: false,
      placeholder: '请输入17位车辆识别号',
      maxLength: 17,
      pattern: '^[A-HJ-NPR-Z0-9]{17}$',
      width: 'third',
      // VIN联动配置
      linkage: {
        sourceField: 'vin',
        sourceType: 'vin',
        targetMappings: [
          { targetField: 'vehicle_model', sourceProperty: 'model' },
          { targetField: 'production_date', sourceProperty: 'productionDate' },
        ],
      },
    },
    {
      id: 'vehicle_model',
      type: 'text',
      label: '车型',
      name: 'vehicle_model',
      required: false,
      placeholder: '车型',
      width: 'third',
    },
    {
      id: 'production_date',
      type: 'date',
      label: '生产日期',
      name: 'production_date',
      required: false,
      width: 'third',
    },
    
    // ========== 配件信息区 ==========
    {
      id: 'section_parts',
      type: 'divider',
      label: '配件信息',
      name: 'section_parts',
      required: false,
      width: 'full',
    },
    {
      id: 'part_number',
      type: 'text',
      label: '配件编号',
      name: 'part_number',
      required: false,
      placeholder: '请输入配件编号',
      width: 'half',
    },
    {
      id: 'part_name',
      type: 'text',
      label: '配件名称',
      name: 'part_name',
      required: false,
      placeholder: '配件名称',
      width: 'half',
    },
    
    // ========== 订单信息区 ==========
    {
      id: 'section_order',
      type: 'divider',
      label: '订单信息',
      name: 'section_order',
      required: false,
      width: 'full',
    },
    {
      id: 'order_number',
      type: 'text',
      label: '订单号',
      name: 'order_number',
      required: false,
      placeholder: '请输入订单号',
      width: 'third',
    },
    {
      id: 'delivery_number',
      type: 'text',
      label: '发货号',
      name: 'delivery_number',
      required: false,
      placeholder: '请输入发货号',
      width: 'third',
    },
    {
      id: 'warehouse',
      type: 'text',
      label: '发货库',
      name: 'warehouse',
      required: false,
      placeholder: '发货库',
      width: 'third',
    },
  ] as FormField[],
  
  layout: 'vertical',
  workflowEnabled: true,
  enableReply: true, // 启用交流历史/回复功能
  
  // 操作按钮配置
  actionButtons: [
    {
      id: 'btn_submit',
      name: '提交',
      code: 'submit',
      type: 'primary',
      icon: 'Send',
      position: 'footer',
      visibleStatus: ['draft'],
      actionType: 'status_change',
      toStatus: 'pending',
      confirmRequired: true,
      confirmMessage: '确定要提交此单据吗？',
      order: 1,
      enabled: true,
    },
    {
      id: 'btn_reply',
      name: '回复方案',
      code: 'reply',
      type: 'primary',
      icon: 'MessageSquare',
      position: 'footer',
      visibleStatus: ['pending'],
      visibleRoles: ['engineer', 'admin'],
      actionType: 'custom',
      confirmRequired: false,
      order: 2,
      enabled: true,
    },
    {
      id: 'btn_close',
      name: '关闭单据',
      code: 'close',
      type: 'secondary',
      icon: 'CheckCircle',
      position: 'footer',
      visibleStatus: ['pending', 'replied'],
      visibleRoles: ['admin', 'dealer'],
      actionType: 'status_change',
      toStatus: 'closed',
      confirmRequired: true,
      confirmMessage: '确定要关闭此单据吗？关闭后将无法继续处理。',
      order: 3,
      enabled: true,
    },
  ],
  
  status: 'published',
  order: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// 初始化函数 - 可以在客户端调用
export function initPacDocumentType() {
  if (typeof window === 'undefined') {
    console.log('此脚本需要在浏览器环境中运行')
    return
  }
  
  const STORAGE_KEY = 'lowcode_document_types'
  
  try {
    // 获取现有的单据类型
    const existingTypes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    
    // 检查是否已存在PAC类型
    const existingIndex = existingTypes.findIndex(
      (t: DocumentType) => t.code === 'PAC' || t.id === 'doctype_pac'
    )
    
    if (existingIndex >= 0) {
      // 更新现有的
      existingTypes[existingIndex] = {
        ...pacDocumentType,
        createdAt: existingTypes[existingIndex].createdAt,
        updatedAt: new Date().toISOString(),
      }
      console.log('PAC单据类型已更新')
    } else {
      // 添加新的
      existingTypes.push(pacDocumentType)
      console.log('PAC单据类型已创建')
    }
    
    // 保存
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingTypes))
    console.log('PAC单据类型配置完成!')
    console.log('字段数量:', pacDocumentType.fields.length)
    
    return pacDocumentType
  } catch (error) {
    console.error('初始化PAC单据类型失败:', error)
    throw error
  }
}

// 如果直接执行此脚本
if (typeof window !== 'undefined') {
  // 暴露到全局以便在控制台调用
  (window as unknown as { initPacDocumentType: typeof initPacDocumentType }).initPacDocumentType = initPacDocumentType
}

export default pacDocumentType
