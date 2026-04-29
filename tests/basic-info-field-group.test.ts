/**
 * 基础信息字段组功能测试
 */

import { fieldGroupStorage } from '../lib/storage'
import { resolveDocumentTypeFields } from '../app/runtime/documents/[id]/page'
import { getFieldValue, formatFieldValue } from '../lib/utils/virtual-fields'
import type { Document, FormField } from '../lib/types'

// 测试字段组初始化
export function testFieldGroupInitialization() {
  console.log('=== 测试字段组初始化 ===')

  // 初始化系统内置字段组
  fieldGroupStorage.initSystemGroups()

  // 检查基础信息字段组是否已创建
  const basicInfoGroup = fieldGroupStorage.getByCode('basic_info')
  if (!basicInfoGroup) {
    console.error('❌ 基础信息字段组未创建')
    return false
  }

  console.log('✅ 基础信息字段组已创建')
  console.log('字段组名称:', basicInfoGroup.name)
  console.log('字段数量:', basicInfoGroup.fields.length)
  console.log('字段列表:', basicInfoGroup.fields.map(f => f.label))

  return true
}

// 测试字段解析功能
export function testFieldResolution() {
  console.log('\n=== 测试字段解析功能 ===')

  // 创建一个测试用的DocumentType
  const testDocType = {
    id: 'test_doc_type',
    name: '测试单据类型',
    code: 'TEST',
    fields: [
      {
        id: 'test_field',
        type: 'text',
        label: '测试字段',
        name: 'test_field',
        required: false,
        width: 'third',
      },
    ],
    fieldGroups: [
      {
        fieldGroupId: 'system_basic_info',
        enabled: true,
      },
    ],
    layout: 'vertical' as const,
    status: 'published' as const,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // 解析字段
  const resolvedFields = resolveDocumentTypeFields(testDocType)

  console.log('✅ 字段解析成功')
  console.log('解析后字段数量:', resolvedFields.length)
  console.log('解析后字段列表:', resolvedFields.map(f => ({
    label: f.label,
    type: f.type,
    hasVirtualField: !!f.virtualField
  })))

  // 验证字段组是否正确解析
  const hasDivider = resolvedFields.some(f => f.type === 'divider')
  const hasVirtualFields = resolvedFields.some(f => !!f.virtualField)

  if (!hasDivider) {
    console.error('❌ 字段组的divider未正确添加')
    return false
  }

  if (!hasVirtualFields) {
    console.error('❌ 虚拟字段未正确解析')
    return false
  }

  console.log('✅ 字段组解析验证通过')

  return true
}

// 测试虚拟字段处理
export function testVirtualFieldProcessing() {
  console.log('\n=== 测试虚拟字段处理 ===')

  // 创建测试用的Document对象
  const testDocument: Document = {
    id: 'test_doc_1',
    documentNumber: 'TEST202604290001',
    documentTypeId: 'test_doc_type',
    documentTypeName: '测试单据',
    status: 'pending',
    statusName: '待处理',
    createdBy: 'user_1',
    createdByName: '张三',
    createdByOrg: '技术服务部',
    createdByPosition: '工程师',
    createdAt: '2026-04-29T10:30:00Z',
    submittedAt: '2026-04-29T10:35:00Z',
    updatedAt: '2026-04-29T14:20:00Z',
    latestReplyAt: '2026-04-29T15:45:00Z',
    workflowId: 'workflow_test',
    formData: {
      test_field: '测试值',
    },
  }

  // 获取基础信息字段组
  const basicInfoGroup = fieldGroupStorage.getByCode('basic_info')
  if (!basicInfoGroup) {
    console.error('❌ 基础信息字段组不存在')
    return false
  }

  // 测试虚拟字段值获取
  const docNumberField = basicInfoGroup.fields.find(f => f.id === 'doc_number')
  if (!docNumberField) {
    console.error('❌ 单据号字段不存在')
    return false
  }

  const docNumberValue = getFieldValue(testDocument, docNumberField)
  console.log('✅ 虚拟字段值获取成功')
  console.log('单据号字段值:', docNumberValue)

  if (docNumberValue !== testDocument.documentNumber) {
    console.error('❌ 虚拟字段值不匹配')
    return false
  }

  // 测试字段值格式化
  const submitTimeField = basicInfoGroup.fields.find(f => f.id === 'submitted_at')
  if (submitTimeField) {
    const formattedValue = formatFieldValue(getFieldValue(testDocument, submitTimeField), submitTimeField)
    console.log('✅ 字段值格式化成功')
    console.log('提交时间格式化值:', formattedValue)
  }

  // 测试普通字段值获取
  const testField: FormField = {
    id: 'test_field',
    type: 'text',
    label: '测试字段',
    name: 'test_field',
    required: false,
    width: 'third',
  }

  const testFieldValue = getFieldValue(testDocument, testField)
  console.log('✅ 普通字段值获取成功')
  console.log('测试字段值:', testFieldValue)

  if (testFieldValue !== '测试值') {
    console.error('❌ 普通字段值不匹配')
    return false
  }

  console.log('✅ 虚拟字段处理验证通过')

  return true
}

// 运行所有测试
export function runAllTests() {
  console.log('🧪 开始运行基础信息字段组功能测试...\n')

  const results = {
    fieldGroupInit: testFieldGroupInitialization(),
    fieldResolution: testFieldResolution(),
    virtualFieldProcessing: testVirtualFieldProcessing(),
  }

  console.log('\n📊 测试结果汇总:')
  console.log('字段组初始化:', results.fieldGroupInit ? '✅ 通过' : '❌ 失败')
  console.log('字段解析功能:', results.fieldResolution ? '✅ 通过' : '❌ 失败')
  console.log('虚拟字段处理:', results.virtualFieldProcessing ? '✅ 通过' : '❌ 失败')

  const allPassed = Object.values(results).every(result => result === true)
  console.log('\n' + (allPassed ? '🎉 所有测试通过！' : '⚠️ 部分测试失败，请检查'))

  return allPassed
}

// 如果在浏览器环境中，将测试函数暴露到全局
if (typeof window !== 'undefined') {
  (window as unknown as {
    testFieldGroupInitialization: typeof testFieldGroupInitialization
    testFieldResolution: typeof testFieldResolution
    testVirtualFieldProcessing: typeof testVirtualFieldProcessing
    runAllTests: typeof runAllTests
  }).testFieldGroupInitialization = testFieldGroupInitialization
  ;(window as unknown as {
    testFieldGroupInitialization: typeof testFieldGroupInitialization
    testFieldResolution: typeof testFieldResolution
    testVirtualFieldProcessing: typeof testVirtualFieldProcessing
    runAllTests: typeof runAllTests
  }).testFieldResolution = testFieldResolution
  ;(window as unknown as {
    testFieldGroupInitialization: typeof testFieldGroupInitialization
    testFieldResolution: typeof testFieldResolution
    testVirtualFieldProcessing: typeof testVirtualFieldProcessing
    runAllTests: typeof runAllTests
  }).testVirtualFieldProcessing = testVirtualFieldProcessing
  ;(window as unknown as {
    testFieldGroupInitialization: typeof testFieldGroupInitialization
    testFieldResolution: typeof testFieldResolution
    testVirtualFieldProcessing: typeof testVirtualFieldProcessing
    runAllTests: typeof runAllTests
  }).runAllTests = runAllTests
}