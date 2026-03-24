import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "https://mainnet.intuition.sh/v1/graphql",
  documents: "src/queries/**/*.graphql",
  generates: {
    "src/generated/index.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
      ],
      config: {
        scalars: {
          bigint: "string",
          numeric: "string",
          timestamptz: "string",
          uuid: "string",
        },
        avoidOptionals: false,
        enumsAsTypes: true,
        skipTypename: true,
      },
    },
  },
};

export default config;
