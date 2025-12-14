# 志愿者服务系统 - Supabase 集成说明

## ✅ 已完成的功能

### 1. 后端服务器 (Supabase Edge Function)
- 位置：`/supabase/functions/server/index.tsx`
- 功能：
   - ✅ 获取所有志愿活动
   - ✅ 获取单个志愿活动详情
   - ✅ 创建新的志愿活动
   - ✅ 更新志愿活动
   - ✅ 删除志愿活动
  - ✅ 提交报名
  - ✅ 获取报名记录
  - ✅ 取消报名
  - ✅ 获取统计数据

### 2. API 服务层
- 位置：`/services/api.ts`
- 提供了完整的 API 调用函数

### 3. 数据存储
- 使用 Supabase 键值存储 (KV Store)
- 数据前缀：
   - `opportunity:` - 志愿活动
  - `registration:` - 报名记录

### 4. 前端集成
- ✅ 从后端动态加载志愿活动
- ✅ 实时报名功能
- ✅ 自动更新可用名额
- ✅ 错误处理和加载状态
- ✅ 表单验证

## 🗄️ 数据库架构

### Opportunity (志愿机会)
```typescript
{
  id: string;              // 唯一标识
  title: string;           // 标题
  organization: string;    // 组织名称
  category: string;        // 分类
  location: string;        // 地点
  date: string;           // 日期
  duration: string;       // 时长
  spotsAvailable: number; // 可用名额
  totalSpots: number;     // 总名额
  description: string;    // 描述
  requirements: string[]; // 要求
  image: string;          // 图片URL
  tags: string[];         // 标签
  createdAt: string;      // 创建时间
}
```

### Registration (报名记录)
```typescript
{
  id: string;            // 唯一标识
  opportunityId: string; // 关联的志愿机会ID
  name: string;          // 姓名
  email: string;         // 电子邮箱
  phone: string;         // 联系电话
  message: string;       // 留言
  registeredAt: string;  // 报名时间
}
```

## 🔧 API 端点

所有端点前缀：`/make-server-725726ab`

### 志愿机会
- `GET /opportunities` - 获取所有机会
- `GET /opportunities/:id` - 获取单个机会
- `POST /opportunities` - 创建新机会
- `PUT /opportunities/:id` - 更新机会
- `DELETE /opportunities/:id` - 删除机会

### 报名
- `POST /registrations` - 提交报名
- `GET /registrations` - 获取所有报名
- `GET /opportunities/:id/registrations` - 获取某机会的报名
- `DELETE /registrations/:id` - 取消报名

### 统计
- `GET /stats` - 获取统计数据

### 健康检查
- `GET /health` - 服务器健康检查

## 🚀 工作流程

1. **用户访问网站**
   - 前端自动从 Supabase 加载志愿机会数据

2. **浏览机会**
   - 用户可以搜索和筛选志愿机会
   - 数据实时从数据库获取

3. **报名参加**
   - 用户填写报名表单
   - 提交到后端服务器
   - 服务器验证并保存到数据库
   - 自动更新可用名额

4. **数据持久化**
   - 所有数据保存在 Supabase KV Store
   - 支持增删改查操作
   - 数据在服务器重启后保留

## 📝 初始数据

系统启动时会自动初始化 6 个示例志愿机会：
1. 社区花园清洁
2. 食物银行分发
3. 老年中心活动
4. 海滩清洁活动
5. 青少年辅导项目
6. 动物收容所支持

## 🔐 安全性

- 使用 Supabase 公开匿名密钥进行 API 调用
- CORS 已配置
- 表单验证在前端和后端都有实现
- 错误信息有详细的上下文日志

## 💡 扩展建议

如果需要进一步扩展，可以考虑：

1. **用户认证**
   - 添加 Supabase Auth
   - 用户登录/注册
   - 个人报名历史

2. **组织管理**
   - 组织可以创建和管理自己的志愿机会
   - 查看报名者信息

3. **通知系统**
   - 邮件确认
   - 活动提醒

4. **评价系统**
   - 志愿者评价
   - 组织评分

5. **数据分析**
   - 报名趋势
   - 热门分类
   - 用户活跃度

## ⚠️ 注意事项

- Figma Make 不适合收集 PII（个人身份信息）或保护敏感数据
- 当前实现仅用于原型和演示目的
- 生产环境需要额外的安全措施和数据保护
