import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { visualizer } from 'rollup-plugin-visualizer';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { resolve } from 'path';
import fs from 'fs';
import { createHash } from 'crypto';

// Custom plugin for edition-based module replacement
function editionResolver() {
  const edition = process.env.TOOLJET_EDITION || 'ce';
  const emptyModulePath = resolve(__dirname, 'src/modules/emptyModule.js');

  return {
    name: 'edition-resolver',
    resolveId(id, importer) {
      // Handle @ee/ imports
      if (id.startsWith('@ee/')) {
        if (edition === 'ce') {
          console.log(`[Edition Resolver] Replacing EE module: ${id} -> empty module (CE edition)`);
          return emptyModulePath;
        }
        // For EE and Cloud editions, resolve normally
        return null;
      }

      // Handle @cloud/ imports  
      if (id.startsWith('@cloud/')) {
        if (['ce', 'ee'].includes(edition)) {
          console.log(`[Edition Resolver] Replacing Cloud module: ${id} -> empty module (${edition} edition)`);
          return emptyModulePath;
        }
        // For Cloud edition, resolve normally
        return null;
      }

      // Handle relative imports within EE/Cloud directories
      if (importer && importer.includes('/ee/') && edition === 'ce') {
        console.log(`[Edition Resolver] Replacing EE relative import: ${id} -> empty module`);
        return emptyModulePath;
      }

      if (importer && importer.includes('/cloud/') && ['ce', 'ee'].includes(edition)) {
        console.log(`[Edition Resolver] Replacing Cloud relative import: ${id} -> empty module`);
        return emptyModulePath;
      }

      return null;
    },
    
    load(id) {
      // Ensure the empty module is properly loaded
      if (id === emptyModulePath) {
        return fs.readFileSync(emptyModulePath, 'utf-8');
      }
      return null;
    }
  };
}

// Hash function for SVG prefix (equivalent to webpack's string-hash)
function hash(str) {
  return createHash('md5').update(str).digest('hex').substring(0, 8);
}

export default defineConfig(({ command, mode }) => {
  // Load environment variables
  const env = loadEnv(mode, '../', '');

  // Read version
  const versionPath = resolve(__dirname, '.version');
  const version = fs.readFileSync(versionPath, 'utf-8').trim();

  const isDev = command === 'serve';
  const edition = env.TOOLJET_EDITION || 'ce';

  // API URL configuration
  const API_URL = {
    production: env.TOOLJET_SERVER_URL || (env.SERVE_CLIENT !== 'false' ? '__REPLACE_SUB_PATH__' : ''),
    development: `http://localhost:${env.TOOLJET_SERVER_PORT || 3000}`,
  };

  const stripTrailingSlash = (str) => str?.replace(/\/+$/, '') || '';

  const plugins = [
    react({
      fastRefresh: isDev,
      babel: {
        plugins: [
          [
            'import',
            {
              libraryName: 'lodash',
              libraryDirectory: '',
              camel2DashComponentName: false,
            },
            'lodash',
          ],
        ].filter(Boolean),
      },
    }),
    svgr({
      svgrOptions: {
        plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
        svgoConfig: {
          plugins: [
            {
              name: 'prefixIds',
              params: {
                prefix: (_, info) => `svg-${hash(info.path)}`,
              },
            },
          ],
        },
      },
      include: '**/*.svg',
    }),
    editionResolver(),
  ];

  // Add Sentry plugin conditionally
  if (env.APM_VENDOR === 'sentry' && env.SENTRY_AUTH_TOKEN) {
    plugins.push(
      sentryVitePlugin({
        authToken: env.SENTRY_AUTH_TOKEN,
        org: env.SENTRY_ORG,
        project: env.SENTRY_PROJECT,
        url: env.SENTRY_URL,
        release: {
          name: `tooljet-${version}`,
          deploy: {
            env: mode,
          },
        },
        sourcemaps: {
          include: ['./build/assets'],
          ignore: ['node_modules'],
          urlPrefix: env.ASSET_PATH ? `${env.ASSET_PATH}/assets` : '/assets',
        },
        telemetry: env.SENTRY_TELEMETRY !== 'false',
        silent: mode === 'production',
      })
    );
  } else if (env.APM_VENDOR === 'sentry') {
    console.warn('[Sentry] APM_VENDOR is set to sentry but SENTRY_AUTH_TOKEN is missing');
  }

  // Add bundle analyzer in analyze mode
  if (process.env.ANALYZE) {
    plugins.push(
      visualizer({
        filename: 'build/stats.html',
        title: `ToolJet Bundle Analysis - ${version}`,
        open: true,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap', // 'treemap', 'sunburst', 'network'
        sourcemap: true,
        projectRoot: process.cwd(),
        exclude: [
          {
            file: '**/node_modules/**',
            size: 1024 * 10, // Exclude small node_modules files (< 10KB)
          },
        ],
      })
    );
  }

  return {
    plugins,

    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@ee': resolve(__dirname, 'ee'),
        '@cloud': resolve(__dirname, 'cloud'),
        '@assets': resolve(__dirname, 'assets'),
        '@white-label': resolve(__dirname, 'src/_helpers/white-label'),
        'config': resolve(__dirname, 'src/config.js'),
      },
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.wasm', '.tar', '.data'],
    },

    server: {
      port: 8082,
      host: '0.0.0.0',
      open: false,
    },

    build: {
      outDir: 'build',
      sourcemap: isDev ? 'inline' : 'hidden',
      minify: isDev ? false : 'esbuild',
      target: ['es2022', 'edge88', 'firefox78', 'chrome87', 'safari14'],
      chunkSizeWarningLimit: 2000,
      cssCodeSplit: true,
      
      // Rollup options for advanced optimization
      rollupOptions: {
        output: {
          // Strategic chunking for optimal caching
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              // Core React libraries
              if (id.includes('react') && !id.includes('react-bootstrap') && !id.includes('react-dom')) {
                return 'react-core';
              }
              if (id.includes('react-dom')) {
                return 'react-core';
              }
              if (id.includes('react-router')) {
                return 'react-core';
              }
              
              // UI Libraries
              if (id.includes('react-bootstrap') || id.includes('bootstrap') || id.includes('@radix-ui')) {
                return 'ui-components';
              }
              
              // Utilities and helpers
              if (id.includes('lodash') || id.includes('moment') || id.includes('axios') || 
                  id.includes('uuid') || id.includes('classnames') || id.includes('humps')) {
                return 'utils';
              }
              
              // Code editor and syntax highlighting
              if (id.includes('@codemirror') || id.includes('react-syntax-highlighter')) {
                return 'code-editor';
              }
              
              // Data visualization
              if (id.includes('plotly') || id.includes('react-circular-progressbar')) {
                return 'visualization';
              }
              
              // Form and input components
              if (id.includes('react-datepicker') || id.includes('react-select') || 
                  id.includes('react-phone-input') || id.includes('react-currency-input') ||
                  id.includes('react-color')) {
                return 'forms';
              }
              
              // Rich text and content
              if (id.includes('react-markdown') || id.includes('draft-js') || id.includes('@mdxeditor')) {
                return 'rich-content';
              }
              
              // File handling
              if (id.includes('papaparse') || id.includes('xlsx') || id.includes('jspdf') || id.includes('react-pdf')) {
                return 'file-processing';
              }
              
              // Drag and drop
              if (id.includes('react-dnd') || id.includes('@dnd-kit') || id.includes('react-beautiful-dnd')) {
                return 'dnd';
              }
              
              // State management
              if (id.includes('zustand') || id.includes('immer') || id.includes('rxjs')) {
                return 'state-management';
              }
              
              // Icons
              if (id.includes('@tabler/icons')) {
                return 'icons';
              }
              
              // Everything else goes to vendor
              return 'vendor';
            }
          },
          
          // Optimize asset naming for better caching
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const extType = info[info.length - 1];
            
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/woff2?|eot|ttf|otf/i.test(extType)) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
          
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        },
        
        // External dependencies (if any needed)
        external: [],
        
        // Tree shaking configuration
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          unknownGlobalSideEffects: false,
        },
      },
      
      // CSS optimization
      cssMinify: !isDev,
      
      // Enable/disable compression reporting
      reportCompressedSize: !isDev,
      
      // Memory management for large builds
      emptyOutDir: true,
    },

    esbuild: {
      loader: 'jsx',
      include: /.*\.(jsx?|tsx?)$/,
      exclude: [],
    },

    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @import "@/_styles/colors.scss";
            @import "@/_styles/mixins.scss";
          `,
        },
      },
      postcss: {
        plugins: [require('tailwindcss'), require('autoprefixer')],
      },
    },

    define: {
      // Global config equivalent to webpack externals
      global: JSON.stringify({
        // Core API configuration
        apiUrl: `${stripTrailingSlash(API_URL[mode]) || ''}/api`,
        ENVIRONMENT: mode,
        SERVER_IP: env.SERVER_IP,
        
        // Feature flags with proper defaults
        COMMENT_FEATURE_ENABLE: env.COMMENT_FEATURE_ENABLE === 'false' ? false : true,
        ENABLE_MULTIPLAYER_EDITING: env.ENABLE_MULTIPLAYER_EDITING === 'false' ? false : true,
        ENABLE_MARKETPLACE_DEV_MODE: env.ENABLE_MARKETPLACE_DEV_MODE === 'true' || mode === 'development',
        ENABLE_WORKFLOW_SCHEDULING: env.ENABLE_WORKFLOW_SCHEDULING === 'true',
        
        // ToolJet specific configuration
        TOOLJET_SERVER_URL: env.TOOLJET_SERVER_URL,
        TOOLJET_EDITION: edition,
        TOOLJET_VERSION: version,
        TOOLJET_HOST: env.TOOLJET_HOST,
        
        // Database and file upload limits
        TOOLJET_DB_BULK_UPLOAD_MAX_CSV_FILE_SIZE_MB: 
          parseInt(env.TOOLJET_DB_BULK_UPLOAD_MAX_CSV_FILE_SIZE_MB) || 5,
        
        // External service URLs
        TOOLJET_MARKETPLACE_URL: 
          env.TOOLJET_MARKETPLACE_URL || 'https://tooljet-plugins-production.s3.us-east-2.amazonaws.com',
        
        // Authentication and security
        DISABLE_PASSWORD_LOGIN: env.DISABLE_PASSWORD_LOGIN === 'true',
        SSO_DISABLE_SIGNUPS: env.SSO_DISABLE_SIGNUPS === 'true',
        
        // Development and debugging
        NODE_ENV: mode,
        DEBUG: env.DEBUG === 'true' || mode === 'development',
        
        // Sub-path configuration (for deployment)
        SUB_PATH: env.SUB_PATH || '',
        ASSET_PATH: env.ASSET_PATH || '',
        
        // License and subscription
        LICENSE_URL: env.LICENSE_URL,
        
        // Telemetry and monitoring
        POSTHOG_PROJECT_API_KEY: env.POSTHOG_PROJECT_API_KEY,
        POSTHOG_API_HOST: env.POSTHOG_API_HOST,
        APM_VENDOR: env.APM_VENDOR,
        
        // Sentry configuration for runtime
        SENTRY_DSN: env.SENTRY_DSN,
        SENTRY_ENVIRONMENT: env.SENTRY_ENVIRONMENT || mode,
        SENTRY_RELEASE: `tooljet-${version}`,
        SENTRY_DEBUG: env.SENTRY_DEBUG === 'true' || mode === 'development',
        
        // White labeling
        WHITE_LABEL_TEXT: env.WHITE_LABEL_TEXT,
        WHITE_LABEL_LOGO: env.WHITE_LABEL_LOGO,
        
        // Email configuration
        DISABLE_MULTI_WORKSPACE: env.DISABLE_MULTI_WORKSPACE === 'true',
        
        // Redis and session configuration
        ENABLE_REDIS_SESSION_STORE: env.ENABLE_REDIS_SESSION_STORE === 'true',
        
        // Check for required environment variables
        _envVarsLoaded: true,
        _buildTime: new Date().toISOString(),
      }),

      // Process environment variables for runtime access
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.ASSET_PATH': JSON.stringify(env.ASSET_PATH || ''),
      'process.env.SERVE_CLIENT': JSON.stringify(env.SERVE_CLIENT),
      'process.env.TOOLJET_EDITION': JSON.stringify(edition),
      'process.env.DEBUG': JSON.stringify(env.DEBUG || (mode === 'development' ? 'true' : 'false')),
      
      // Build-time constants
      '__DEV__': mode === 'development',
      '__PROD__': mode === 'production',
      '__VERSION__': JSON.stringify(version),
      '__BUILD_TIME__': JSON.stringify(new Date().toISOString()),
    },

    assetsInclude: ['**/*.wasm', '**/*.tar', '**/*.data', '**/*.html'],
    publicDir: 'assets',

    optimizeDeps: {
      // Pre-bundle heavy dependencies for faster dev startup
      include: [
        'lodash',
        'moment', 
        'axios',
        'react',
        'react-dom',
        'react-router-dom',
        'plotly.js-dist-min',
        'react-plotly.js',
        'zustand',
        'classnames',
        'uuid',
        'humps',
        'immer',
        'bootstrap',
        'react-bootstrap',
        '@radix-ui/react-avatar',
        '@radix-ui/react-checkbox',
        '@radix-ui/react-select',
        '@tabler/icons-react'
      ],
      
      // Exclude packages that shouldn't be pre-bundled
      exclude: [
        '@tooljet/plugins',
        // Large packages that are better lazy-loaded
        '@codemirror/autocomplete',
        '@codemirror/commands'
      ],
      
      // Force pre-bundling of specific packages
      force: ['react', 'react-dom'],
      
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
        // Optimize for faster builds
        target: 'es2022',
        minify: false, // Keep false for faster dev builds
      },
    },
  };
});
