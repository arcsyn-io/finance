import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [".next/**", ".tmp/**", "node_modules/**", "next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: [
      "src/components/**/*.{ts,tsx}",
      "src/modules/**/*.{ts,tsx}",
      "src/hooks/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@supabase/*",
                "@/lib/supabase/*",
                "@/db/*",
                "@/server/*",
                "postgres",
                "drizzle-orm/*",
              ],
              message:
                "UI nao pode acessar Supabase, banco ou camada server diretamente. Use API/Server Action e services server-side.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@supabase/*",
                "@/lib/supabase/*",
                "@/db/*",
                "postgres",
                "drizzle-orm/*",
              ],
              message:
                "Paginas/componentes de app nao devem acessar Supabase ou banco diretamente. Use services server-side ou rotas API.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
