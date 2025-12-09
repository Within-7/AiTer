/**
 * GenericNpmInstaller
 *
 * Generic npm plugin installer for user-added plugins.
 * Can be instantiated with any npm package name and command name.
 */

import { NpmPluginInstaller } from './NpmPluginInstaller';
import Store from 'electron-store';

export class GenericNpmInstaller extends NpmPluginInstaller {
  constructor(
    store: Store,
    packageName: string,
    commandName: string,
    env?: NodeJS.ProcessEnv,
    npmPath?: string
  ) {
    super({
      store,
      packageName,
      commandName,
      configStoreKey: `plugins.${commandName}.configuration`,
      env,
      npmPath,
    });
  }

  /**
   * Generic validation - accepts any configuration
   */
  async validateConfiguration(_config: Record<string, unknown>): Promise<boolean | string> {
    return true;
  }
}
