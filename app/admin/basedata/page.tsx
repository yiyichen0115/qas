'use client'
// Base Data Management Page - v2

import { useState } from 'react'
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
import { Car, Building2, AlertTriangle, Zap, Settings, Database } from 'lucide-react'
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

type DataCategory = 'vehicles' | 'dealers' | 'faults' | 'business'

export default function BaseDataPage() {
  const [activeTab, setActiveTab] = useState<DataCategory>('vehicles')

  return (
    <MainLayout>
      <div className="flex flex-1 flex-col">
        <PageHeader
          title="基础数据管理"
          description="管理系统中使用的基础数据，包括车型、经销商、故障码等"
        />

        <div className="flex-1 space-y-6 p-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DataCategory)}>
            <TabsList className="grid w-full max-w-2xl grid-cols-4">
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
