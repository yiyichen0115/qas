// AC问答平台 - 基础数据配置
// 这些数据可以作为下拉选项等使用

export interface BaseDataItem {
  id: string
  code: string
  name: string
  parentId?: string
  order?: number
  enabled?: boolean
}

// 质量信息类别
export const qualityCategories: BaseDataItem[] = [
  { id: 'qc_1', code: 'CUSTOMER_REPAIR', name: '客户报修', order: 1, enabled: true },
  { id: 'qc_2', code: 'ACTIVE_SERVICE', name: '主动服务', order: 2, enabled: true },
  { id: 'qc_3', code: 'RECALL', name: '召回', order: 3, enabled: true },
  { id: 'qc_4', code: 'QUALITY_FEEDBACK', name: '质量反馈', order: 4, enabled: true },
]

// 故障类型
export const faultTypes: BaseDataItem[] = [
  { id: 'ft_1', code: 'POWERTRAIN', name: '动力总成', order: 1, enabled: true },
  { id: 'ft_2', code: 'BATTERY', name: '动力电池', order: 2, enabled: true },
  { id: 'ft_3', code: 'MOTOR', name: '驱动电机', order: 3, enabled: true },
  { id: 'ft_4', code: 'CHARGING', name: '充电系统', order: 4, enabled: true },
  { id: 'ft_5', code: 'BMS', name: 'BMS系统', order: 5, enabled: true },
  { id: 'ft_6', code: 'CHASSIS', name: '底盘系统', order: 6, enabled: true },
  { id: 'ft_7', code: 'BODY', name: '车身附件', order: 7, enabled: true },
  { id: 'ft_8', code: 'ELECTRIC', name: '电器系统', order: 8, enabled: true },
]

// 维修来源
export const serviceSources: BaseDataItem[] = [
  { id: 'ss_1', code: 'CUSTOMER', name: '客户报修', order: 1, enabled: true },
  { id: 'ss_2', code: 'DEALER', name: '经销商上报', order: 2, enabled: true },
  { id: 'ss_3', code: 'REMOTE_DIAG', name: '远程诊断', order: 3, enabled: true },
  { id: 'ss_4', code: 'ACTIVE_WARN', name: '主动预警', order: 4, enabled: true },
]

// 车型平台
export const vehiclePlatforms: BaseDataItem[] = [
  { id: 'vp_1', code: 'E50', name: 'E50-宏光MINIEV', order: 1, enabled: true },
  { id: 'vp_2', code: 'E10', name: 'E10-宏光MINI', order: 2, enabled: true },
  { id: 'vp_3', code: 'E300', name: 'E300-宝骏E300', order: 3, enabled: true },
  { id: 'vp_4', code: 'KiWi', name: 'KiWi EV', order: 4, enabled: true },
  { id: 'vp_5', code: 'ASTA', name: '五菱星光', order: 5, enabled: true },
  { id: 'vp_6', code: 'YUNDUO', name: '云朵', order: 6, enabled: true },
]

// 车辆配置
export const vehicleConfigs: BaseDataItem[] = [
  { id: 'vc_1', code: 'LV1', name: '基础版', parentId: 'E50', order: 1, enabled: true },
  { id: 'vc_2', code: 'LV2', name: 'WT-马卡龙款(LV2)', parentId: 'E50', order: 2, enabled: true },
  { id: 'vc_3', code: 'LV3', name: '高配版', parentId: 'E50', order: 3, enabled: true },
  { id: 'vc_4', code: 'GAMEBOY', name: 'GAMEBOY版', parentId: 'E50', order: 4, enabled: true },
]

// 用户行为
export const userBehaviors: BaseDataItem[] = [
  { id: 'ub_1', code: 'NORMAL_REPAIR', name: '正常维修', order: 1, enabled: true },
  { id: 'ub_2', code: 'EMERGENCY', name: '紧急救援', order: 2, enabled: true },
  { id: 'ub_3', code: 'INSPECTION', name: '检测诊断', order: 3, enabled: true },
  { id: 'ub_4', code: 'REPLACE', name: '更换配件', order: 4, enabled: true },
]

// 支持类型
export const supportTypes: BaseDataItem[] = [
  { id: 'st_1', code: 'TECH_SUPPORT', name: '技术支援', order: 1, enabled: true },
  { id: 'st_2', code: 'PARTS_SUPPLY', name: '配件供应', order: 2, enabled: true },
  { id: 'st_3', code: 'REMOTE_DIAG', name: '远程诊断', order: 3, enabled: true },
  { id: 'st_4', code: 'ONSITE', name: '现场支持', order: 4, enabled: true },
]

// 风险等级
export const riskLevels: BaseDataItem[] = [
  { id: 'rl_1', code: 'LOW', name: '低风险', order: 1, enabled: true },
  { id: 'rl_2', code: 'MEDIUM', name: '中风险', order: 2, enabled: true },
  { id: 'rl_3', code: 'HIGH', name: '高风险', order: 3, enabled: true },
  { id: 'rl_4', code: 'CRITICAL', name: '严重风险', order: 4, enabled: true },
]

// 主动服务预警类型
export const activeServiceWarnings: BaseDataItem[] = [
  { id: 'asw_1', code: 'BATTERY_CONSISTENCY', name: '动力电池-单体一致性差', order: 1, enabled: true },
  { id: 'asw_2', code: 'BATTERY_VOLTAGE', name: '动力电池-电压异常', order: 2, enabled: true },
  { id: 'asw_3', code: 'BATTERY_TEMP', name: '动力电池-温度异常', order: 3, enabled: true },
  { id: 'asw_4', code: 'CHARGING_FAIL', name: '充电桩-无法充电', order: 4, enabled: true },
  { id: 'asw_5', code: 'BMS_ALARM', name: 'BMS-告警', order: 5, enabled: true },
]

// 经销商数据
export interface Dealer {
  id: string
  code: string
  name: string
  address: string
  province: string
  city: string
  contactPerson?: string
  phone?: string
  landline?: string
  enabled: boolean
}

export const dealers: Dealer[] = [
  {
    id: 'dealer_1',
    code: '644118604',
    name: '东莞市申通汽车有限公司(授权)',
    address: '广东省东莞市东莞市大岭山镇美长路大岭山段475号103室五菱汽车有限公司',
    province: '广东省',
    city: '东莞市',
    contactPerson: '刘龙恒',
    phone: '13366967701',
    enabled: true,
  },
  {
    id: 'dealer_2',
    code: '644118605',
    name: '广州市威菱汽车销售服务有限公司',
    address: '广东省广州市白云区石井街道庆丰一路自编8号',
    province: '广东省',
    city: '广州市',
    contactPerson: '张伟',
    phone: '13800138000',
    enabled: true,
  },
]

// 配件/物料数据
export interface Part {
  id: string
  code: string // 物料图号/配件编码
  name: string // 物料名称
  category: string // 分类
  unit: string // 单位
  price: number // 单价
  enabled: boolean
}

export const parts: Part[] = [
  { id: 'part_1', code: '26136411', name: '方向盘开关总成', category: '电器系统', unit: '个', price: 128.50, enabled: true },
  { id: 'part_2', code: '23746055P', name: '顶盖总成', category: '车身附件', unit: '个', price: 856.00, enabled: true },
  { id: 'part_3', code: '250755456', name: '前保险杠', category: '车身附件', unit: '个', price: 320.00, enabled: true },
  { id: 'part_4', code: '24551890', name: '后视镜左', category: '车身附件', unit: '个', price: 185.00, enabled: true },
  { id: 'part_5', code: '24551891', name: '后视镜右', category: '车身附件', unit: '个', price: 185.00, enabled: true },
  { id: 'part_6', code: '23884562', name: '前大灯左', category: '电器系统', unit: '个', price: 420.00, enabled: true },
  { id: 'part_7', code: '23884563', name: '前大灯右', category: '电器系统', unit: '个', price: 420.00, enabled: true },
  { id: 'part_8', code: '24109876', name: '雨刮电机', category: '电器系统', unit: '个', price: 265.00, enabled: true },
  { id: 'part_9', code: '25789012', name: '空调压缩机', category: '空调系统', unit: '个', price: 1580.00, enabled: true },
  { id: 'part_10', code: '26345678', name: '电池管理系统(BMS)', category: 'BMS系统', unit: '套', price: 2350.00, enabled: true },
  { id: 'part_11', code: '27890123', name: '驱动电机总成', category: '动力系统', unit: '个', price: 5680.00, enabled: true },
  { id: 'part_12', code: '28456789', name: '充电口总成', category: '充电系统', unit: '个', price: 356.00, enabled: true },
]

// 根据配件编码获取配件信息
export function getPartByCode(code: string): Part | undefined {
  return parts.find(p => p.code === code && p.enabled)
}

// 获取配件选项列表
export function getPartOptions(): { label: string; value: string; data: Part }[] {
  return parts
    .filter(p => p.enabled)
    .map(p => ({ label: `${p.code} - ${p.name}`, value: p.code, data: p }))
}

// 故障码库
export interface FaultCode {
  id: string
  code: string
  description: string
  level: 'info' | 'warning' | 'error' | 'critical'
  category: string
}

export const faultCodes: FaultCode[] = [
  { id: 'fc_1', code: 'P181900', description: '单体电压高于三级告警门限值', level: 'critical', category: 'BMS' },
  { id: 'fc_2', code: 'P181901', description: '单体电压低于三级告警门限值', level: 'critical', category: 'BMS' },
  { id: 'fc_3', code: 'P181800', description: '电池温度过高告警', level: 'error', category: 'BMS' },
  { id: 'fc_4', code: 'P181801', description: '电池温度过低告警', level: 'warning', category: 'BMS' },
  { id: 'fc_5', code: 'P182000', description: '充电系统通信故障', level: 'error', category: 'CHARGING' },
]

// VIN车辆信息 - 用于根据VIN自动带出相关信息
export interface VehicleInfo {
  id: string
  vin: string // VIN码
  vehicleCode: string // 车架代码
  platformCode: string // 车型平台代码
  platformName: string // 车型平台名称
  configCode: string // 配置代码
  configName: string // 配置名称
  vsnCode: string // VSN号
  engineBatchNo: string // 发动机批次号
  productionDate: string // 生产日期
  salesDate: string // 销售日期
  mileage?: number // 行驶里程
  dealerCode?: string // 经销商编码
}

export const vehicleInfoList: VehicleInfo[] = [
  {
    id: 'vi_1',
    vin: 'LK6ADA618NG260511',
    vehicleCode: 'LZW7004EVJEAMA',
    platformCode: 'E50',
    platformName: 'E50-宏光MINIEV',
    configCode: 'LV2',
    configName: 'WT-马卡龙款(LV2)',
    vsnCode: 'D72Y121U9G',
    engineBatchNo: 'TZ155X020',
    productionDate: '2022-05-27',
    salesDate: '2022-09-06',
    mileage: 8926,
    dealerCode: '644118604',
  },
  {
    id: 'vi_2',
    vin: 'LK6ADA618NG260512',
    vehicleCode: 'LZW7004EVJEAMA',
    platformCode: 'E50',
    platformName: 'E50-宏光MINIEV',
    configCode: 'LV1',
    configName: '基础版',
    vsnCode: 'D72Y121U9H',
    engineBatchNo: 'TZ155X021',
    productionDate: '2022-06-15',
    salesDate: '2022-10-01',
    mileage: 5200,
    dealerCode: '644118605',
  },
  {
    id: 'vi_3',
    vin: 'LK6ADA618NG260513',
    vehicleCode: 'LZW7004EVJEAMB',
    platformCode: 'KiWi',
    platformName: 'KiWi EV',
    configCode: 'GAMEBOY',
    configName: 'GAMEBOY版',
    vsnCode: 'D72Y121U9I',
    engineBatchNo: 'TZ155X022',
    productionDate: '2023-01-10',
    salesDate: '2023-03-20',
    mileage: 3500,
    dealerCode: '644118604',
  },
]

// 根据VIN获取车辆信息
export function getVehicleByVin(vin: string): VehicleInfo | undefined {
  return vehicleInfoList.find(v => v.vin.toUpperCase() === vin.toUpperCase())
}

// 获取基础数据的辅助函数
export function getBaseDataOptions(dataList: BaseDataItem[]): { label: string; value: string }[] {
  return dataList
    .filter(item => item.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(item => ({ label: item.name, value: item.code }))
}

export function getDealerOptions(): { label: string; value: string }[] {
  return dealers
    .filter(d => d.enabled)
    .map(d => ({ label: `${d.code} - ${d.name}`, value: d.id }))
}

export function getDealerById(id: string): Dealer | undefined {
  return dealers.find(d => d.id === id)
}

export function getDealerByCode(code: string): Dealer | undefined {
  return dealers.find(d => d.code === code)
}
