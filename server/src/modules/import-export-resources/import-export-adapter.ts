// adapters/git-sync.adapter.ts

import { ExportResourcesDto } from '@dto/export-resources.dto';
import * as fs from 'fs';
import * as path from 'path';
import simpleGit, { SimpleGit } from 'simple-git';
import { ImportExportResourcesService } from '@ee/import-export-resources/service';

export interface GitSyncConfig {
  repoUrl: string;
  branch?: string;
  token?: string;
  commitMessage?: string;
}

export class GitSyncAdapter {
  private readonly basePath = '/Users/rohanlahori/Desktop/git-sync-poc';
  protected readonly importExportResourcesService: ImportExportResourcesService;

  /**
   * Main export adapter - receives the old format and handles splitting + git sync
   */
  async exportToGit(
    appData: any, // Your existing { appV2: appToExport } format
    appId: string,
    appName: string,
    repoPath: string,
    exportResourcesDto: ExportResourcesDto
  ): Promise<void> {
    try {
      // console.log('🔄 Starting export to Git...');

      // // Step 1: Split the single object into file structure
      // const files = this.splitIntoFiles(appData);

      // // Step 2: Setup Git repository
      // const repoPath = await this.setupGitRepo(appId, config);

      // // Step 3: Write files to local folder structure
      // await this.writeFilesToFolders(files, repoPath);

      // // Step 4: Commit and push
      // await this.commitAndPush(repoPath, appName, config);

      console.log('✅ Export to Git completed successfully');
    } catch (error) {
      console.error('❌ Export to Git failed:', error);
      throw error;
    }
  }

  /**
   * Main import adapter - reads from git and merges back to old format
   */
  async importFromGit(appId: string, config: GitSyncConfig): Promise<any> {
    try {
      console.log('🔄 Starting import from Git...');

      // Step 1: Setup/Pull Git repository
      const repoPath = await this.setupGitRepo(appId, config);

      // Step 2: Read all files from folder structure
      const files = await this.readFilesFromFolders(repoPath);

      // Step 3: Merge files back to single object (old format)
      const appData = this.mergeIntoSingleObject(files);

      console.log('✅ Import from Git completed successfully');
      return appData;
    } catch (error) {
      console.error('❌ Import from Git failed:', error);
      throw error;
    }
  }

  /**
   * Split single object into file structure
   * Converts: { appV2: { components: [...], pages: [...] } }
   * To: { 'components.json': [...], 'pages.json': [...] }
   */
  private splitIntoFiles(appData: any): Record<string, any> {
    const app = appData.appV2 || appData;

    return {
      'app.json': {
        id: app.id,
        name: app.name,
        type: app.type,
        slug: app.slug,
        isPublic: app.isPublic,
        isMaintenanceOn: app.isMaintenanceOn,
        // Add other metadata fields
      },
      'components.json': app.components || [],
      'pages.json': app.pages || [],
      'events.json': app.events || [],
      'queries.json': app.dataQueries || [],
      'dataSources.json': app.dataSources || [],
      'versions.json': app.appVersions || [],
      'environments.json': app.appEnvironments || [],
      'dataSourceOptions.json': app.dataSourceOptions || [],
      'schema.json': app.schemaDetails || {
        multiPages: true,
        multiEnv: true,
        globalDataSources: true,
      },
      ...(app.type === 'FRONT_END' &&
        app.modules && {
          'modules.json': app.modules,
        }),
    };
  }

  /**
   * Merge files back into single object (reverse of split)
   * Converts: { 'components.json': [...], 'pages.json': [...] }
   * To: { appV2: { components: [...], pages: [...] } }
   */
  private mergeIntoSingleObject(files: Record<string, any>): any {
    const appData: any = {
      ...files.app,
      components: files.components || [],
      pages: files.pages || [],
      events: files.events || [],
      dataQueries: files.queries || [],
      dataSources: files.dataSources || [],
      appVersions: files.versions || [],
      appEnvironments: files.environments || [],
      dataSourceOptions: files.dataSourceOptions || {},
      schemaDetails: files.schema || {},
    };

    if (files.modules) {
      appData.modules = files.modules;
    }

    return { appV2: appData };
  }

  /**
   * Setup git repository (clone or pull)
   */
  private async setupGitRepo(appId: string, config: GitSyncConfig): Promise<string> {
    const repoPath = path.join(this.basePath, `app-${appId}`);
    const git: SimpleGit = simpleGit();
    const branch = config.branch || 'main';

    // Add token to URL if provided
    let repoUrlWithAuth = config.repoUrl;
    if (config.token) {
      const isGitLab = config.repoUrl.includes('gitlab');
      const protocol = config.repoUrl.split('://')[0];
      const repoPathUrl = config.repoUrl.split('://')[1];

      repoUrlWithAuth = isGitLab
        ? `${protocol}://oauth2:${config.token}@${repoPathUrl}`
        : `${protocol}://${config.token}@${repoPathUrl}`;
    }

    // Clone or pull
    if (!fs.existsSync(path.join(repoPath, '.git'))) {
      console.log('📥 Cloning repository...');
      await git.clone(repoUrlWithAuth, repoPath);
      git.cwd(repoPath);
    } else {
      console.log('📂 Using existing repository...');
      git.cwd(repoPath);
      await git.pull('origin', branch);
    }

    // Checkout branch
    try {
      await git.checkout(branch);
    } catch {
      await git.checkoutLocalBranch(branch);
    }

    return repoPath;
  }

  /**
   * Write files to folder structure
   * Each key becomes a folder, each item/object becomes a file
   */
  private async writeFilesToFolders(files: Record<string, any>, repoPath: string): Promise<number> {
    let fileCount = 0;

    for (const [fileName, content] of Object.entries(files)) {
      const folderName = fileName.replace('.json', '');
      const folderPath = path.join(repoPath, folderName);

      // Create folder
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      if (Array.isArray(content)) {
        // Write each array item as separate file
        for (let i = 0; i < content.length; i++) {
          const item = content[i];
          const itemFileName = item.id || item.name || `item-${i}`;
          const filePath = path.join(folderPath, `${itemFileName}.json`);

          fs.writeFileSync(filePath, JSON.stringify(item, null, 2), 'utf8');
          fileCount++;

          if (fileCount % 50 === 0) {
            console.log(`  ✓ Written ${fileCount} files...`);
          }
        }
      } else {
        // Write single object
        const filePath = path.join(folderPath, `${folderName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
        fileCount++;
      }
    }

    console.log(`✓ Written ${fileCount} files locally`);
    return fileCount;
  }

  /**
   * Read files from folder structure
   * Reverse of writeFilesToFolders
   */
  private async readFilesFromFolders(repoPath: string): Promise<Record<string, any>> {
    const files: Record<string, any> = {};

    const folders = [
      'app',
      'components',
      'pages',
      'events',
      'queries',
      'dataSources',
      'versions',
      'environments',
      'dataSourceOptions',
      'schema',
      'modules',
    ];

    for (const folderName of folders) {
      const folderPath = path.join(repoPath, folderName);

      if (!fs.existsSync(folderPath)) {
        console.log(`⚠ Skipping missing folder: ${folderName}`);
        continue;
      }

      const jsonFiles = fs.readdirSync(folderPath).filter((f) => f.endsWith('.json'));

      if (jsonFiles.length === 0) {
        continue;
      }

      // If single file with same name as folder, it's an object
      if (jsonFiles.length === 1 && jsonFiles[0] === `${folderName}.json`) {
        const filePath = path.join(folderPath, jsonFiles[0]);
        const content = fs.readFileSync(filePath, 'utf8');
        files[folderName] = JSON.parse(content);
        console.log(`✓ Read: ${folderName}/${jsonFiles[0]}`);
      } else {
        // Multiple files = array
        files[folderName] = [];
        for (const file of jsonFiles) {
          const filePath = path.join(folderPath, file);
          const content = fs.readFileSync(filePath, 'utf8');
          files[folderName].push(JSON.parse(content));
          console.log(`✓ Read: ${folderName}/${file}`);
        }
      }
    }

    return files;
  }

  /**
   * Commit and push changes
   */
  private async commitAndPush(repoPath: string, appName: string, config: GitSyncConfig): Promise<void> {
    const git: SimpleGit = simpleGit(repoPath);
    const branch = config.branch || 'main';

    console.log('📦 Staging all changes...');
    await git.add('.');

    console.log('💾 Creating commit...');
    const commitMessage = config.commitMessage || `Update app ${appName} - ${new Date().toISOString()}`;
    await git.commit(commitMessage);

    console.log('📤 Pushing to remote...');
    await git.push('origin', branch);
  }
}
