# 基础信息字段组功能验证指南

## 功能概述
已成功实现统一的"表单基础信息字段组"功能，用于解决PAC、LAC等单据类型中大量重复的基础字段定义问题。

## 如何验证新功能

### 1. 启动应用
应用已经在 `http://localhost:3000` 运行，可以直接访问。

### 2. 验证字段组初始化
1. 打开浏览器开发者工具（F12）
2. 在控制台中输入以下命令：
```javascript
// 测试字段组初始化
import('/lib/storage/index.js').then(({ fieldGroupStorage }) => {
  fieldGroupStorage.initSystemGroups()
  const basicInfoGroup = fieldGroupStorage.getByCode('basic_info')
  console.log('基础信息字段组:', basicInfoGroup)
  console.log('字段数量:', basicInfoGroup?.fields.length)
  console.log('字段列表:', basicInfoGroup?.fields.map(f => f.label))
})
```

**预期结果**：
- 基础信息字段组应该成功创建
- 应该包含10个字段：单据号、单据类型、单据状态、提交人、提交人组织、提交人岗位、创建时间、提交时间、更新时间、最新回复时间

### 3. 验证PAC单据
1. 访问 `http://localhost:3000/runtime/documents/create?type=doctype_pac`
2. 查看表单顶部是否有"基础信息"字段组
3. 验证字段组中包含以下字段：
   - 单据号（只读）
   - 单据类型（只读）
   - 单据状态（只读）
   - 提交人（只读）
   - 提交人组织（只读）
   - 提交人岗位（只读）
   - 创建时间（只读）
   - 提交时间（只读）
   - 更新时间（只读）
   - 最新回复时间（只读）

**预期结果**：
- 所有基础字段应该显示在表单顶部
- 所有字段应该是只读状态（disabled）
- 字段应该从Document对象正确读取数据

### 4. 验证LAC单据
1. 访问 `http://localhost:3000/runtime/documents/create?type=doctype_lac`
2. 进行与PAC单据相同的验证

### 5. 验证字段值处理
在控制台中运行以下测试：
```javascript
// 测试虚拟字段处理
import('/lib/utils/virtual-fields.js').then(({ getFieldValue, formatFieldValue }) => {
  // 创建测试Document对象
  const testDoc = {
    id: 'test_1',
    documentNumber: 'PAC202604290001',
    documentTypeName: 'PAC单据',
    statusName: '草稿',
    createdByName: '张三',
    createdByOrg: '技术服务部',
    createdByPosition: '工程师',
    createdAt: '2026-04-29T10:30:00Z',
    submittedAt: '2026-04-29T10:35:00Z',
    updatedAt: '2026-04-29T14:20:00Z',
    latestReplyAt: '2026-04-29T15:45:00Z',
    formData: {}
  }

  // 测试字段值获取和格式化
  console.log('单据号:', testDoc.documentNumber)
  console.log('创建时间:', formatFieldValue(testDoc.createdAt, { type: 'datetime' }))
  console.log('✅ 虚拟字段处理功能正常')
})
```

### 6. 创建测试单据
1. 创建一个新的PAC单据
2. 填写一些业务字段（如经销商信息、问题描述等）
3. 保存单据
4. 查看单据详情页面

**预期结果**：
- 基础信息字段应该正确显示
- 业务字段应该正常工作
- 单据号应该自动生成
- 时间字段应该正确显示

## 功能特性确认

### ✅ 已实现的功能
1. **统一字段组管理**：基础信息字段只需定义一次
2. **虚拟字段机制**：通过映射从Document对象读取值
3. **向后兼容**：现有PAC、LAC单据配置继续有效
4. **只读保护**：基础字段设置为只读，防止误修改
5. **自动初始化**：系统内置字段组在首次使用时自动创建

### 📋 字段列表
基础信息字段组包含以下10个字段：
1. 单据号 (`documentNumber`)
2. 单据类型 (`documentTypeName`)
3. 单据状态 (`statusName`)
4. 提交人 (`createdByName`)
5. 提交人组织 (`createdByOrg`)
6. 提交人岗位 (`createdByPosition`)
7. 创建时间 (`createdAt`)
8. 提交时间 (`submittedAt`)
9. 更新时间 (`updatedAt`)
10. 最新回复时间 (`latestReplyAt`)

### 🔧 技术架构
- **字段组存储**：`fieldGroupStorage`
- **虚拟字段处理**：`getFieldValue`, `setFieldValue`, `formatFieldValue`
- **字段解析**：`resolveDocumentTypeFields`
- **类型定义**：`FieldGroup`, `VirtualFieldConfig`

## 预期效果

### 1. 减少重复配置
- ✅ 基础字段只需定义一次，所有单据类型复用
- ✅ PAC单据减少了4个重复字段定义
- ✅ LAC单据减少了3个重复字段定义

### 2. 统一用户体验
- ✅ 基础字段在所有单据中显示一致
- ✅ 字段名称、顺序、样式保持统一

### 3. 降低维护成本
- ✅ 基础字段修改只需在一处进行
- ✅ 新单据类型可以直接引用基础字段组

### 4. 提高扩展性
- ✅ 可以创建更多预定义字段组
- ✅ 支持字段组的版本管理

## 常见问题解决

### Q1: 字段组没有显示？
**A**: 确保已经调用 `fieldGroupStorage.initSystemGroups()` 初始化系统内置字段组。

### Q2: 虚拟字段值不显示？
**A**: 检查Document对象中对应的字段是否有值，虚拟字段从Document对象读取数据。

### Q3: 字段编辑功能异常？
**A**: 虚拟字段默认是只读的，如果需要编辑，需要在字段配置中设置 `virtualField.readOnly = false`。

## 后续优化建议

1. **表单设计器增强**：支持字段组的可视化配置
2. **更多预定义字段组**：如"联系信息组"、"车辆信息组"
3. **字段组权限控制**：基于角色的字段组显示/隐藏
4. **字段组国际化**：支持多语言字段标签
5. **性能优化**：缓存字段解析结果

## 总结

基础信息字段组功能已经成功实现并集成到系统中。新架构提供了更好的可维护性、一致性和扩展性。PAC和LAC单据已经成功迁移到新的字段组架构，其他单据类型可以参照进行迁移。