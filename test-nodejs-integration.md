# Node.js Integration Test Plan

## 测试步骤

### 1. 验证 Node.js 文件已下载

```bash
ls -lh resources/nodejs/darwin-arm64/bin/
# 应该看到 node 和 npm 可执行文件
```

### 2. 启动开发模式

```bash
npm run dev
```

### 3. 创建测试项目

在 AiTer 中：
1. 点击 "Add Project"
2. 选择任意目录
3. 打开该项目的终端

### 4. 测试 Node.js 可用性

在终端中执行：

```bash
# 测试 Node.js
node --version
# 期望输出: v20.18.0

# 测试 npm
npm --version
# 期望输出: 10.8.2

# 查看 Node.js 路径
which node
# 期望输出: /Users/xxx/Library/Application Support/AiTer/nodejs/darwin-arm64/bin/node

# 查看 PATH
echo $PATH
# 期望在最前面看到 AiTer 的 Node.js 路径

# 测试 npm 全局安装（可选）
npm install -g cowsay
cowsay "Hello from AiTer!"
```

### 5. 测试 Node.js 执行

创建一个简单的 Node.js 脚本：

```bash
# 在终端中
echo 'console.log("Node.js works in AiTer!")' > test.js
node test.js
# 期望输出: Node.js works in AiTer!

# 测试 npm 包使用
echo 'const os = require("os"); console.log("Platform:", os.platform())' > platform.js
node platform.js
# 期望输出: Platform: darwin
```

### 6. 验证不影响系统 Node.js

在系统终端（非 AiTer）中：

```bash
which node
# 应该显示系统的 Node.js 路径（如 /usr/local/bin/node）

node --version
# 应该显示系统安装的版本（可能不是 v20.18.0）
```

## 预期结果

✅ **成功标准**:
1. AiTer 终端中 `node --version` 返回 v20.18.0
2. AiTer 终端中 `which node` 指向 AiTer 的 Node.js
3. 可以正常执行 Node.js 脚本
4. 系统终端不受影响，仍使用系统 Node.js

❌ **失败情况**:
1. `node: command not found` - Node.js 未正确安装或 PATH 配置错误
2. 版本不是 v20.18.0 - 使用了系统 Node.js 而不是内置版本
3. 权限错误 - 可执行文件权限未正确设置

## 故障排除

### 问题 1: node: command not found

**原因**: Node.js 未安装或 PATH 未配置

**解决**:
```bash
# 检查 Node.js 是否存在
ls ~/Library/Application\ Support/AiTer/nodejs/darwin-arm64/bin/node

# 如果不存在，检查开发模式的资源路径
ls resources/nodejs/darwin-arm64/bin/node

# 检查权限
chmod +x resources/nodejs/darwin-arm64/bin/node
chmod +x resources/nodejs/darwin-arm64/bin/npm
```

### 问题 2: 使用了系统 Node.js

**原因**: PATH 顺序错误

**检查**:
```bash
# 在 AiTer 终端中
echo $PATH
# AiTer 的 Node.js 路径应该在最前面
```

**调试**: 在 src/main/pty.ts 中添加日志：
```typescript
const nodeEnv = this.nodeManager.getTerminalEnv()
console.log('Terminal PATH:', nodeEnv.PATH)
```

### 问题 3: 权限错误

**解决**:
```bash
# macOS/Linux
chmod +x ~/Library/Application\ Support/AiTer/nodejs/darwin-arm64/bin/node
chmod +x ~/Library/Application\ Support/AiTer/nodejs/darwin-arm64/bin/npm
```

## 性能测试

### 测试启动时间

```bash
# 测量 Node.js 启动时间
time node -e "console.log('hello')"

# 测试 npm 包加载性能
time node -e "require('fs'); console.log('done')"
```

### 测试内存占用

在 Activity Monitor (macOS) 或 Task Manager (Windows) 中：
1. 检查 AiTer 的内存使用
2. 创建多个终端
3. 观察内存增长

预期: 每个终端增加约 20-30MB（Node.js 进程）

## 集成测试清单

- [ ] Node.js 文件已下载到 resources/nodejs/
- [ ] 启动开发模式无错误
- [ ] 打开终端 tab
- [ ] 执行 `node --version` 返回正确版本
- [ ] 执行 `which node` 指向 AiTer 内置路径
- [ ] 执行简单 Node.js 脚本成功
- [ ] npm 命令可用
- [ ] 系统终端不受影响
- [ ] 多个终端 tab 都能使用 Node.js
- [ ] 关闭重启 AiTer 后 Node.js 仍然可用

## 打包测试（待 Node.js 下载完成后）

```bash
# 构建 macOS 应用
npm run build:mac

# 检查打包后的应用
ls -lh release/*/AiTer*.dmg

# 安装并测试
# 1. 双击 .dmg 安装
# 2. 启动 AiTer
# 3. 重复上述测试步骤
```
