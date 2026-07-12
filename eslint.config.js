// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'node_modules/**',
      'Mistella-admin/**',
      'supabase/functions/**',
      '.expo/**',
      'dist/**',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // 未使用変数はアンダースコア始まりを許可（分割代入での除外パターン用）
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      // useEffect 内フェッチは React Query 移行(M2)で構造ごと解消するため、それまで warn に降格
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
]);
