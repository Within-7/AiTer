import https from 'https';
import fs from 'fs-extra';
import path from 'path';
import { app } from 'electron';
import { pipeline } from 'stream/promises';
import { createWriteStream, createReadStream } from 'fs';
import { Extract } from 'unzipper';
import * as tar from 'tar';

export interface DownloadProgress {
  percent: number;
  downloaded: number;
  total: number;
  status: 'downloading' | 'extracting' | 'complete' | 'error';
  message?: string;
}

export type ProgressCallback = (progress: DownloadProgress) => void;

export class NodeDownloader {
  private platform: string;
  private arch: string;

  constructor() {
    this.platform = process.platform;
    this.arch = process.arch;
  }

  /**
   * 获取下载 URL
   */
  private getDownloadUrl(version: string): string {
    // 确保版本号以 v 开头
    const ver = version.startsWith('v') ? version : `v${version}`;

    let platform: string;
    let ext: string;

    if (this.platform === 'darwin') {
      platform = 'darwin';
      ext = 'tar.gz';
    } else if (this.platform === 'win32') {
      platform = 'win';
      ext = 'zip';
    } else {
      platform = 'linux';
      ext = 'tar.xz';
    }

    const arch = this.arch === 'arm64' ? 'arm64' : 'x64';
    const filename = `node-${ver}-${platform}-${arch}.${ext}`;

    return `https://nodejs.org/dist/${ver}/${filename}`;
  }

  /**
   * 下载并安装 Node.js
   */
  async download(version: string, onProgress?: ProgressCallback): Promise<boolean> {
    const url = this.getDownloadUrl(version);
    const tempDir = path.join(app.getPath('temp'), 'aiter-nodejs');
    const filename = path.basename(url);
    const downloadPath = path.join(tempDir, filename);

    try {
      // 确保临时目录存在
      await fs.ensureDir(tempDir);

      // 1. 下载文件
      console.log(`[NodeDownloader] Downloading from: ${url}`);
      await this.downloadFile(url, downloadPath, (percent, downloaded, total) => {
        onProgress?.({
          percent,
          downloaded,
          total,
          status: 'downloading',
          message: `Downloading Node.js ${version}...`,
        });
      });

      // 2. 解压文件
      onProgress?.({
        percent: 100,
        downloaded: 0,
        total: 0,
        status: 'extracting',
        message: 'Extracting files...',
      });

      const targetDir = path.join(app.getPath('userData'), 'nodejs', `${this.platform}-${this.arch}`);
      await fs.ensureDir(targetDir);

      if (this.platform === 'win32') {
        await this.extractZip(downloadPath, targetDir);
      } else {
        await this.extractTarGz(downloadPath, targetDir);
      }

      // 3. 设置可执行权限（Unix 系统）
      if (this.platform !== 'win32') {
        const binDir = path.join(targetDir, 'bin');
        const nodePath = path.join(binDir, 'node');
        const npmPath = path.join(binDir, 'npm');

        if (await fs.pathExists(nodePath)) {
          await fs.chmod(nodePath, 0o755);
        }
        if (await fs.pathExists(npmPath)) {
          await fs.chmod(npmPath, 0o755);
        }
      }

      // 4. 清理临时文件
      await fs.remove(tempDir);

      onProgress?.({
        percent: 100,
        downloaded: 0,
        total: 0,
        status: 'complete',
        message: 'Installation complete!',
      });

      console.log('[NodeDownloader] Download and extraction completed');
      return true;
    } catch (error) {
      console.error('[NodeDownloader] Error downloading:', error);
      onProgress?.({
        percent: 0,
        downloaded: 0,
        total: 0,
        status: 'error',
        message: error instanceof Error ? error.message : 'Download failed',
      });

      // 清理失败的下载
      try {
        await fs.remove(tempDir);
      } catch (cleanupError) {
        // 忽略清理错误
      }

      return false;
    }
  }

  /**
   * 下载文件
   */
  private downloadFile(
    url: string,
    destPath: string,
    onProgress?: (percent: number, downloaded: number, total: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = createWriteStream(destPath);
      let downloaded = 0;

      https.get(url, (response) => {
        // 处理重定向
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            file.close();
            this.downloadFile(redirectUrl, destPath, onProgress).then(resolve).catch(reject);
            return;
          }
        }

        if (response.statusCode !== 200) {
          file.close();
          reject(new Error(`Download failed with status ${response.statusCode}`));
          return;
        }

        const total = parseInt(response.headers['content-length'] || '0', 10);

        response.on('data', (chunk) => {
          downloaded += chunk.length;
          const percent = total > 0 ? Math.round((downloaded / total) * 100) : 0;
          onProgress?.(percent, downloaded, total);
        });

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });

        file.on('error', (err) => {
          file.close();
          fs.unlink(destPath).catch(() => {});
          reject(err);
        });
      }).on('error', (err) => {
        file.close();
        fs.unlink(destPath).catch(() => {});
        reject(err);
      });
    });
  }

  /**
   * 解压 ZIP 文件 (Windows)
   */
  private async extractZip(zipPath: string, targetDir: string): Promise<void> {
    const readStream = createReadStream(zipPath);
    await pipeline(readStream, Extract({ path: targetDir }));

    // Windows 的 zip 包含一个根目录，需要移动文件
    const items = await fs.readdir(targetDir);
    if (items.length === 1) {
      const rootDir = path.join(targetDir, items[0]);
      const tempDir = path.join(targetDir, '_temp');

      await fs.move(rootDir, tempDir);
      const files = await fs.readdir(tempDir);

      for (const file of files) {
        await fs.move(path.join(tempDir, file), path.join(targetDir, file));
      }

      await fs.remove(tempDir);
    }
  }

  /**
   * 解压 tar.gz 文件 (macOS/Linux)
   */
  private async extractTarGz(tarPath: string, targetDir: string): Promise<void> {
    await tar.extract({
      file: tarPath,
      cwd: targetDir,
      strip: 1, // 移除顶层目录
    });
  }
}
