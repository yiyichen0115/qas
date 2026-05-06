'use client'
// Base Data Management Page - v3

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Car, Building2, AlertTriangle, Zap, Settings, Database, FileText, Info } from 'lucide-react'
import {
  vehiclePlatforms,
  vehicleConfigs,
  vehicleInfoList,
  dealers,
  faultCodes,
  qualityCategories,
  faultTypes,
  supportTypes,
  userBehaviors,
  riskLevels,
  activeServiceWarnings,
  serviceSources,
  type BaseDataItem,
  type Dealer,
  type FaultCode,
  type VehicleInfo,
} from '@/lib/base-data'
import { fieldGroupStorage } from '@/lib/storage'
import type { FieldGroup, FormField } from '@/lib/types'

type DataCategory = 'form_basic' | 'vehicles' | 'dealers' | 'faults' | 'business'

export default function BaseDataPage() {
  const [activeTab, setActiveTab] = useState<DataCategory>('form_basic')
  const [basicInfoGroup, setBasicInfoGroup] = useState<FieldGroup | null>(null)

  // 加载基础信息字段组
  useEffect(() => {
    // 初始化系统字段组
    fieldGroupStorage.initSystemGroups()
    // 获取基础信息字段组
    const group = fieldGroupStorage.getByCode('basic_info')
    setBasicInfoGroup(group || null)
  }, [])

  // 格式化字段类型显示
  const formatFieldType = (type: string) => {
    const typeMap: Record<string, string> = {
      text: '文本',
      number: '数字',
      textarea: '多行文本',
      date: '日期',
      datetime: '日期时间',
      select: '下拉选择',
      radio: '单选',
      checkbox: '多选',
      switch: '开关',
      file: '文件',
      richtext: '富文本',
      subtable: '子表格',
      signature: '签名',
      cascade: '级联选择',
      formula: '公式',
      divider: '分割线',
      description: '描述',
      related_documents: '关联单据',
    }
    return typeMap[type] || type
  }

  // 格式化虚拟字段来源
  const formatSourceField = (sourceField: string) => {
    const fieldMap: Record<string, string> = {
      documentNumber: '单据号',
      documentTypeName: '单据类型名称',
      statusName: '状态名称',
      createdByName: '创建人名称',
      createdByOrg: '创建人组织',
      createdByPosition: '创建人岗位',
      createdAt: '创建时间',
      submittedAt: '提交时间',
      updatedAt: '更新时间',
      latestReplyAt: '最新回复时间',
    }
    return fieldMap[sourceField] || sourceField
  }

  return (
    <MainLayout>
      <div className="flex flex-1 flex-col">
        <PageHeader
          title="基础数据管理"
          description="管理系统中使用的基础数据，包括车型、经销商、故障码等"
        />

        <div className="flex-1 space-y-6 p-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DataCategory)}>
            <TabsList className="grid w-full max-w-3xl grid-cols-5">
              <TabsTrigger value="form_basic" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                表单基础信息
              </TabsTrigger>
              <TabsTrigger value="vehicles" className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                车辆信息
              </TabsTrigger>
              <TabsTrigger value="dealers" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                经销商
              </TabsTrigger>
              <TabsTrigger value="faults" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                故障信息
              </TabsTrigger>
              <TabsTrigger value="business" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                业务配置
              </TabsTrigger>
            </TabsList>

            {/* 表单基础信息 */}
            <TabsContent value="form_basic" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        表单基础信息字段组
                      </CardTitle>
                      <CardDescription className="mt-2">
                        系统内置的基础信息字段组，包含所有单据类型通用的基础字段。这些字段会自动显示在每个单据中。
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">系统内置</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {basicInfoGroup ? (
                    <>
                      {/* 字段组信息 */}
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-lg border bg-muted/30 p-4">
                          <div className="text-sm text-muted-foreground">字段组名称</div>
                          <div className="mt-1 font-medium">{basicInfoGroup.name}</div>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-4">
                          <div className="text-sm text-muted-foreground">字段组代码</div>
                          <div className="mt-1 font-mono text-sm">{basicInfoGroup.code}</div>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-4">
                          <div className="text-sm text-muted-foreground">包含字段数</div>
                          <div className="mt-1 font-medium">{basicInfoGroup.fields.length} 个字段</div>
                        </div>
                      </div>

                      {/* 字段列表 */}
                      <div>
                        <h4 className="mb-4 flex items-center gap-2 font-medium">
                          <Info className="h-4 w-4" />
                          字段列表
                        </h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[150px]">字段标签</TableHead>
                              <TableHead className="w-[150px]">字段名称</TableHead>
                              <TableHead className="w-[100px]">字段类型</TableHead>
                              <TableHead className="w-[150px]">数据来源</TableHead>
                              <TableHead className="w-[100px]">宽度</TableHead>
                              <TableHead>说明</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {basicInfoGroup.fields.map((field: FormField) => (
                              <TableRow key={field.id}>
                                <TableCell className="font-medium">{field.label}</TableCell>
                                <TableCell className="font-mono text-sm">{field.name}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{formatFieldType(field.type)}</Badge>
                                </TableCell>
                                <TableCell>
                                  {field.virtualField ? (
                                    <span className="text-sm text-muted-foreground">
                                      Document.{field.virtualField.sourceField}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">
                                    {field.width === 'third' ? '1/3' : field.width === 'half' ? '1/2' : '全宽'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {field.virtualField ? (
                                    <>
                                      虚拟字段，映射自 <code className="rounded bg-muted px-1">{formatSourceField(field.virtualField.sourceField)}</code>
                                    </>
                                  ) : (
                                    field.description || '-'
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* 使用说明 */}
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
                        <h4 className="mb-2 font-medium text-blue-900 dark:text-blue-100">使用说明</h4>
                        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                          <li>1. 这些字段会自动在所有配置了基础信息字段组的单据类型中显示</li>
                          <li>2. 字段值从 Document 数据结构中自动读取，无需手动填写</li>
                          <li>3. PAC单据、LAC索赔单、回货单等都已配置使用此字段组</li>
                          <li>4. 在表单设计中可以通过引用字段组 <code className="rounded bg-blue-100 px-1 dark:bg-blue-900">system_basic_info</code> 来使用</li>
                        </ul>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground">基础信息字段组尚未初始化</p>
                      <Button
                        className="mt-4"
                        onClick={() => {
                          fieldGroupStorage.initSystemGroups()
                          const group = fieldGroupStorage.getByCode('basic_info')
                          setBasicInfoGroup(group || null)
                        }}
                      >
                        初始化字段组
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 字段映射说明表 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Document 字段映射表</CardTitle>
                  <CardDescription>
                    基础信息字段组中的虚拟字段与 Document 数据结构的对应关系
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>显示字段</TableHead>
                        <TableHead>Document 属性</TableHead>
                        <TableHead>数据类型</TableHead>
                        <TableHead>说明</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">单据号</TableCell>
                        <TableCell className="font-mono text-sm">documentNumber</TableCell>
                        <TableCell><Badge variant="outline">string</Badge></TableCell>
                        <TableCell className="text-muted-foreground">系统自动生成的唯一单据编号</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">单据类型</TableCell>
                        <TableCell className="font-mono text-sm">documentTypeName</TableCell>
                        <TableCell><Badge variant="outline">string</Badge></TableCell>
                        <TableCell className="text-muted-foreground">单据所属的类型名称，如PAC单据、LAC索赔单</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">单据状态</TableCell>
                        <TableCell className="font-mono text-sm">statusName</TableCell>
                        <TableCell><Badge variant="outline">string</Badge></TableCell>
                        <TableCell className="text-muted-foreground">当前单据状态的显示名称，如草稿、待处理、已关闭</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">提交人</TableCell>
                        <TableCell className="font-mono text-sm">createdByName</TableCell>
                        <TableCell><Badge variant="outline">string</Badge></TableCell>
                        <TableCell className="text-muted-foreground">创建/提交单据的用户姓名</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">提交人组织</TableCell>
                        <TableCell className="font-mono text-sm">createdByOrg</TableCell>
                        <TableCell><Badge variant="outline">string</Badge></TableCell>
                        <TableCell className="text-muted-foreground">提交人所属的组织/服务站/经销商</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">提交人岗位</TableCell>
                        <TableCell className="font-mono text-sm">createdByPosition</TableCell>
                        <TableCell><Badge variant="outline">string</Badge></TableCell>
                        <TableCell className="text-muted-foreground">提交人的岗位/职位信息</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">创建时间</TableCell>
                        <TableCell className="font-mono text-sm">createdAt</TableCell>
                        <TableCell><Badge variant="outline">datetime</Badge></TableCell>
                        <TableCell className="text-muted-foreground">单据创建的时间戳</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">提交时间</TableCell>
                        <TableCell className="font-mono text-sm">submittedAt</TableCell>
                        <TableCell><Badge variant="outline">datetime</Badge></TableCell>
                        <TableCell className="text-muted-foreground">单据正式提交的时间戳</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">更新时间</TableCell>
                        <TableCell className="font-mono text-sm">updatedAt</TableCell>
                        <TableCell><Badge variant="outline">datetime</Badge></TableCell>
                        <TableCell className="text-muted-foreground">单据最后更新的时间戳</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">最新回复时间</TableCell>
                        <TableCell className="font-mono text-sm">latestReplyAt</TableCell>
                        <TableCell><Badge variant="outline">datetime</Badge></TableCell>
                        <TableCell className="text-muted-foreground">单据收到最新回复的时间戳</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 车辆信息 */}
            <TabsContent value="vehicles" className="mt-6 space-y-6">
              {/* VIN车辆信息表 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    VIN车辆信息
                  </CardTitle>
                  <CardDescription>共 {vehicleInfoList.length} 条记录 - 输入VIN码可自动带出以下信息</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>VIN码</TableHead>
                        <TableHead>车架代码</TableHead>
                        <TableHead>车型平台</TableHead>
                        <TableHead>配置</TableHead>
                        <TableHead>VSN号</TableHead>
                        <TableHead>发动机批次</TableHead>
                        <TableHead>生产日期</TableHead>
                        <TableHead>销售日期</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicleInfoList.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-sm">{item.vin}</TableCell>
                          <TableCell className="font-mono text-sm">{item.vehicleCode}</TableCell>
                          <TableCell>{item.platformName}</TableCell>
                          <TableCell>{item.configName}</TableCell>
                          <TableCell className="font-mono text-sm">{item.vsnCode}</TableCell>
                          <TableCell className="font-mono text-sm">{item.engineBatchNo}</TableCell>
                          <TableCell>{item.productionDate}</TableCell>
                          <TableCell>{item.salesDate}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Database className="h-4 w-4" />
                      车型平台
                    </CardTitle>
                    <CardDescription>共 {vehiclePlatforms.length} 条记录</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>代码</TableHead>
                          <TableHead>名称</TableHead>
                          <TableHead>状态</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vehiclePlatforms.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-sm">{item.code}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>
                              <Badge variant={item.enabled ? 'default' : 'secondary'}>
                                {item.enabled ? '启用' : '禁用'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Database className="h-4 w-4" />
                      车辆配置
                    </CardTitle>
                    <CardDescription>共 {vehicleConfigs.length} 条记录</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>代码</TableHead>
                          <TableHead>名称</TableHead>
                          <TableHead>所属平台</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vehicleConfigs.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-sm">{item.code}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.parentId}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 经销商 */}
            <TabsContent value="dealers" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    经销商列表
                  </CardTitle>
                  <CardDescription>共 {dealers.length} 家经销商</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>编码</TableHead>
                        <TableHead>名称</TableHead>
                        <TableHead>省份</TableHead>
                        <TableHead>城市</TableHead>
                        <TableHead>联系人</TableHead>
                        <TableHead>电话</TableHead>
                        <TableHead>状态</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dealers.map((dealer) => (
                        <TableRow key={dealer.id}>
                          <TableCell className="font-mono text-sm">{dealer.code}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{dealer.name}</TableCell>
                          <TableCell>{dealer.province}</TableCell>
                          <TableCell>{dealer.city}</TableCell>
                          <TableCell>{dealer.contactPerson || '-'}</TableCell>
                          <TableCell>{dealer.phone || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={dealer.enabled ? 'default' : 'secondary'}>
                              {dealer.enabled ? '启用' : '禁用'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 故障信息 */}
            <TabsContent value="faults" className="mt-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertTriangle className="h-4 w-4" />
                      故障类型
                    </CardTitle>
                    <CardDescription>共 {faultTypes.length} 种类型</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>代码</TableHead>
                          <TableHead>名称</TableHead>
                          <TableHead>状态</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {faultTypes.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-sm">{item.code}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>
                              <Badge variant={item.enabled ? 'default' : 'secondary'}>
                                {item.enabled ? '启用' : '禁用'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Zap className="h-4 w-4" />
                      故障码库
                    </CardTitle>
                    <CardDescription>共 {faultCodes.length} 个故障码</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>故障码</TableHead>
                          <TableHead>描述</TableHead>
                          <TableHead>级别</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {faultCodes.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-sm">{item.code}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{item.description}</TableCell>
                            <TableCell>
                              <Badge variant={
                                item.level === 'critical' ? 'destructive' :
                                item.level === 'error' ? 'destructive' :
                                item.level === 'warning' ? 'outline' : 'secondary'
                              }>
                                {item.level}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4" />
                    主动服务预警类型
                  </CardTitle>
                  <CardDescription>共 {activeServiceWarnings.length} 种预警</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {activeServiceWarnings.map((item) => (
                      <Badge key={item.id} variant="outline" className="px-3 py-1">
                        {item.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 业务配置 */}
            <TabsContent value="business" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">质量信息类别</CardTitle>
                    <CardDescription>{qualityCategories.length} 项</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {qualityCategories.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-lg border p-2">
                          <span className="text-sm">{item.name}</span>
                          <Badge variant="outline" className="font-mono text-xs">{item.code}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">维修来源</CardTitle>
                    <CardDescription>{serviceSources.length} 项</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {serviceSources.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-lg border p-2">
                          <span className="text-sm">{item.name}</span>
                          <Badge variant="outline" className="font-mono text-xs">{item.code}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">用户行为</CardTitle>
                    <CardDescription>{userBehaviors.length} 项</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {userBehaviors.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-lg border p-2">
                          <span className="text-sm">{item.name}</span>
                          <Badge variant="outline" className="font-mono text-xs">{item.code}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">支持类型</CardTitle>
                    <CardDescription>{supportTypes.length} 项</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {supportTypes.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-lg border p-2">
                          <span className="text-sm">{item.name}</span>
                          <Badge variant="outline" className="font-mono text-xs">{item.code}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">风险等级</CardTitle>
                    <CardDescription>{riskLevels.length} 项</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {riskLevels.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-lg border p-2">
                          <span className="text-sm">{item.name}</span>
                          <Badge variant={
                            item.code === 'CRITICAL' ? 'destructive' :
                            item.code === 'HIGH' ? 'destructive' :
                            item.code === 'MEDIUM' ? 'outline' : 'secondary'
                          } className="font-mono text-xs">{item.code}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  )
}
