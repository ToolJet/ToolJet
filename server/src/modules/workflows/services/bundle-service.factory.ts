import { Injectable } from '@nestjs/common';
import { BundleLanguage } from '../dto/workflow-bundle.dto';
import { JavaScriptBundleGenerationService } from './bundle-generation.service';
import { PythonBundleGenerationService } from './python-bundle-generation.service';

/**
 * Factory for getting the appropriate bundle generation service based on language.
 * CE stub - throws error for all operations since bundle generation is EE-only.
 */
@Injectable()
export class BundleServiceFactory {
  constructor(
    protected readonly jsBundleService: JavaScriptBundleGenerationService,
    protected readonly pythonBundleService: PythonBundleGenerationService,
  ) {}

  getService(language: BundleLanguage): JavaScriptBundleGenerationService | PythonBundleGenerationService {
    if (language === BundleLanguage.JAVASCRIPT) {
      return this.jsBundleService;
    } else if (language === BundleLanguage.PYTHON) {
      return this.pythonBundleService;
    }
    throw new Error(`Unsupported language: ${language}`);
  }

  getJavaScriptService(): JavaScriptBundleGenerationService {
    return this.jsBundleService;
  }

  getPythonService(): PythonBundleGenerationService {
    return this.pythonBundleService;
  }
}
