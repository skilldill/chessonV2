/// <reference types="vitest/config" />
/// <reference types="vitest" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
// https://vitejs.dev/config/
import path from 'node:path';
import { fileURLToPath } from 'node:url';
var dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig(function () { return __awaiter(void 0, void 0, void 0, function () {
    var config;
    return __generator(this, function (_a) {
        config = {
            plugins: [
                react(),
                tailwindcss(),
                // Fix for Storybook MDX file:// imports
                {
                    name: 'fix-storybook-mdx-imports',
                    resolveId: function (source) {
                        // Handle file:// protocol imports from MDX files
                        if (source.startsWith('file://./node_modules/')) {
                            return source.replace('file://./node_modules/', '');
                        }
                        if (source.startsWith('file://')) {
                            // Convert file:// URLs to regular paths
                            var url = new URL(source);
                            return url.pathname;
                        }
                    },
                    transform: function (code, id) {
                        if (code.includes('file://')) {
                            // Replace file:// protocol imports with regular module imports
                            return code.replace(/from\s+["']file:\/\/\.\/node_modules\/([^"']+)["']/g, function (match, modulePath) {
                                return "from \"".concat(modulePath, "\"");
                            });
                        }
                    },
                },
            ],
            resolve: {
                alias: {
                    // Fix for Storybook MDX imports
                    '@storybook/addon-docs/dist/mdx-react-shim.js': path.resolve(dirname, 'node_modules/@storybook/addon-docs/dist/mdx-react-shim.js'),
                },
            },
            server: {
                proxy: {
                    '/api': {
                        target: 'http://localhost:4000',
                        changeOrigin: true,
                        secure: false,
                    },
                    '/ws': {
                        target: 'ws://localhost:4000',
                        ws: true,
                        changeOrigin: true,
                    },
                },
            },
        };
        return [2 /*return*/, config];
    });
}); });
