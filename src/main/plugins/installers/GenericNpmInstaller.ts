/**
 * GenericNpmInstaller
 *
 * Generic npm plugin installer for user-added plugins.
 * Can be instantiated with any npm package name and command name.
 */

import { NpmPluginInstaller } from './NpmPluginInstaller';
import Store from 'electron-store';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class GenericNpmInstaller extends NpmPluginInstaller {
  constructor(
    store: Store<any>,
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
