import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable ESLint and TypeScript checks during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Add transpilePackages for better compatibility
  transpilePackages: ['@dfinity/agent', '@dfinity/principal', '@dfinity/candid', 'onesec-bridge'],
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uploadthingy.s3.us-west-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        process: false,
      };
      
      // Exclude Node.js specific modules from client bundle
      config.resolve.alias = {
        ...config.resolve.alias,
        'ws': false,
        'bufferutil': false,
        'utf-8-validate': false,
      // Point WASM file to a stub module to prevent resolution errors
      'forwarding_address_bg.wasm': require.resolve('./webpack-wasm-stub.js'),
      };
      
      // Add a custom resolver to catch WASM file requests
      const originalResolve = config.resolve;
      config.resolve = {
        ...originalResolve,
        plugins: [
          ...(originalResolve.plugins || []),
          {
            apply(resolver: any) {
              resolver.hooks.resolve.tapAsync('WasmResolverPlugin', (request: any, resolveContext: any, callback: any) => {
                if (request.request && (
                  request.request.includes('forwarding_address_bg.wasm') ||
                  request.request.endsWith('.wasm')
                )) {
                  // Resolve to stub file
                  return resolver.doResolve(
                    resolver.hooks.resolve,
                    {
                      ...request,
                      request: require.resolve('./webpack-wasm-stub.js'),
                    },
                    'WASM stub',
                    resolveContext,
                    callback
                  );
                }
                callback();
              });
            },
          },
        ],
      };

      // Custom plugin to transform source code and prevent WASM resolution
      config.plugins.push({
        apply: (compiler: any) => {
          // Prevent WASM file resolution
          compiler.hooks.normalModuleFactory.tap('WasmTransformPlugin', (nmf: any) => {
            nmf.hooks.beforeResolve.tap('WasmTransformPlugin', (data: any) => {
              if (data && data.request && (
                data.request.includes('forwarding_address_bg.wasm') ||
                data.request.endsWith('.wasm')
              )) {
                return false; // Prevent resolution
              }
            });
          });
          
          // Transform source code in the compilation phase using parser hook
          compiler.hooks.compilation.tap('WasmTransformPlugin', (compilation: any, params: any) => {
            // Hook into the parser to transform source before it's parsed
            params.normalModuleFactory.hooks.parser
              .for('javascript/auto')
              .tap('WasmTransformPlugin', (parser: any) => {
                parser.hooks.program.tap('WasmTransformPlugin', (ast: any, comments: any) => {
                  // This runs after source is loaded but we need to transform the raw source
                });
              });
            
            // Transform the source after the module is built
            compilation.hooks.buildModule.tap('WasmTransformPlugin', (module: any) => {
              if (module.resource && module.resource.includes('onesec-bridge/dist/index.es.js')) {
                // Access the source and transform it
                if (module._source && typeof module._source.source === 'function') {
                  const originalSource = module._source.source();
                  if (typeof originalSource === 'string') {
                    let transformed = originalSource;
                    // Replace import.meta.url
                    transformed = transformed.replace(/import\.meta\.url/g, 
                      '(typeof window !== "undefined" ? window.location.href : "")');
                    // Replace WASM URL construction
                    transformed = transformed.replace(/new URL\(\s*\/\*[^*]*\*\/\s*["']forwarding_address_bg\.wasm["'],\s*import\.meta\.url\s*\)/gs,
                      '(typeof window !== "undefined" ? new URL("/_next/static/wasm/forwarding_address_bg.wasm", window.location.origin) : null)');
                    
                    // Update the source
                    module._source._value = transformed;
                    module._source._valueAsString = transformed;
                  }
                }
              }
            });
          });
        },
      });

      // Handle WASM files
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
        layers: true,
      };

      // Configure WASM loader - handle WASM files as assets
      config.module.rules.push({
        test: /\.wasm$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/wasm/[name][ext]',
        },
      });

      // Use NormalModuleReplacementPlugin to replace the problematic WASM import code
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /onesec-bridge\/dist\/index\.es\.js$/,
          (resource) => {
            // This will be handled by the string-replace-loader below
          }
        )
      );

      // Ignore WASM file imports - they will be handled at runtime
      config.plugins.push(
        new webpack.IgnorePlugin({
          checkResource(resource) {
            // Ignore WASM file imports
            return resource && (
              resource.includes('forwarding_address_bg.wasm') || 
              resource.endsWith('.wasm') ||
              resource.includes('forwarding_address_bg')
            );
          },
        })
      );

      // Transform the problematic code in onesec-bridge that uses import.meta.url
      // This must run BEFORE webpack tries to resolve the WASM file
      // Using 'pre' enforce to run before other loaders
      config.module.rules.unshift({
        test: /node_modules\/onesec-bridge\/dist\/index\.es\.js$/,
        enforce: 'pre',
        use: {
          loader: 'string-replace-loader',
          options: {
            multiple: [
              {
                // Replace the exact pattern with comments and newlines - must match exactly
                search: /new URL\(\s*\/\*[^*]*\*\/\s*["']forwarding_address_bg\.wasm["'],\s*import\.meta\.url\s*\)/gs,
                replace: '(typeof window !== "undefined" ? new URL("/_next/static/wasm/forwarding_address_bg.wasm", window.location.origin) : null)',
              },
              {
                // Replace any remaining import.meta.url usage
                search: /import\.meta\.url/g,
                replace: '(typeof window !== "undefined" ? window.location.href : "")',
              },
            ],
          },
        },
      });
    }
    
    return config;
  },
};

export default nextConfig;
