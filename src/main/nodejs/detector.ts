import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SystemNodeInfo {
  installed: boolean;
  version?: string;
  nodePath?: string;
  npmPath?: string;
  npmVersion?: string;
}

export class NodeDetector {
  /**
   * 检测系统中的 Node.js 安装情况
   */
  async detectSystemNode(): Promise<SystemNodeInfo> {
    try {
      // 尝试运行 node --version
      const nodeResult = await this.checkCommand('node --version');

      if (!nodeResult.success) {
        return { installed: false };
      }

      // 获取 Node.js 路径
      const nodePathResult = await this.checkCommand(
        process.platform === 'win32' ? 'where node' : 'which node'
      );

      // 获取 npm 版本
      const npmResult = await this.checkCommand('npm --version');

      // 获取 npm 路径
      const npmPathResult = await this.checkCommand(
        process.platform === 'win32' ? 'where npm' : 'which npm'
      );

      return {
        installed: true,
        version: nodeResult.output?.trim(),
        nodePath: nodePathResult.output?.trim().split('\n')[0], // Windows 可能返回多行
        npmVersion: npmResult.output?.trim(),
        npmPath: npmPathResult.output?.trim().split('\n')[0],
      };
    } catch (error) {
      console.error('[NodeDetector] Error detecting system node:', error);
      return { installed: false };
    }
  }

  /**
   * 检查 Node.js 版本是否满足最低要求
   */
  async checkVersionRequirement(minVersion: string): Promise<boolean> {
    const systemNode = await this.detectSystemNode();

    if (!systemNode.installed || !systemNode.version) {
      return false;
    }

    try {
      const current = this.parseVersion(systemNode.version);
      const required = this.parseVersion(minVersion);

      return this.compareVersions(current, required) >= 0;
    } catch (error) {
      console.error('[NodeDetector] Error checking version requirement:', error);
      return false;
    }
  }

  /**
   * 执行命令并返回结果
   */
  private async checkCommand(command: string): Promise<{ success: boolean; output?: string }> {
    try {
      const { stdout } = await execAsync(command, {
        timeout: 5000,
        windowsHide: true,
      });
      return { success: true, output: stdout };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * 解析版本号字符串 (v18.19.0 -> [18, 19, 0])
   */
  private parseVersion(versionStr: string): number[] {
    const cleaned = versionStr.replace(/^v/, ''); // 移除 'v' 前缀
    return cleaned.split('.').map(n => parseInt(n, 10) || 0);
  }

  /**
   * 比较两个版本号
   * @returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
   */
  private compareVersions(v1: number[], v2: number[]): number {
    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0;
      const num2 = v2[i] || 0;

      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  }

  /**
   * 获取推荐的 Node.js 版本（从 nodejs.org API）
   */
  async getRecommendedVersion(): Promise<string | null> {
    try {
      const https = await import('https');

      return new Promise((resolve, reject) => {
        https.get('https://nodejs.org/dist/index.json', (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              const versions = JSON.parse(data);
              // 找到第一个 LTS 版本
              const ltsVersion = versions.find((v: any) => v.lts);
              resolve(ltsVersion ? ltsVersion.version : null);
            } catch (error) {
              reject(error);
            }
          });
        }).on('error', reject);
      });
    } catch (error) {
      console.error('[NodeDetector] Error getting recommended version:', error);
      return null;
    }
  }
}
