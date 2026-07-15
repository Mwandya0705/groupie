const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace root
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Resolve lucide's CJS build wherever npm hoisted it (apps/mobile OR workspace root).
// Hardcoding the workspace-root path breaks when hoisting changes (e.g. after `expo install`).
const lucideCjs = require.resolve('lucide-react-native/dist/cjs/lucide-react-native.js');

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Allow Metro to resolve (sub)dependencies hierarchically
config.resolver.disableHierarchicalLookup = false;

// 4. Alias Node.js built-ins
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  http: require.resolve('empty-module'),
  https: require.resolve('empty-module'),
  url: require.resolve('empty-module'),
  buffer: require.resolve('buffer'),
  'lucide-react-native': lucideCjs,
};

config.resolver.sourceExts = ['mjs', ...config.resolver.sourceExts, 'cjs'];
config.resolver.unstable_enablePackageExports = true;
config.resolver.resolverMainFields = ['main', 'browser', 'native'];

// 5. Force redirect lucide-react-native to CJS to avoid ESM/.mjs bugs
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'lucide-react-native') {
    return {
      filePath: lucideCjs,
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
