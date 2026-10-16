import nextConfig from "eslint-config-next";

const eslintConfig = [{ ignores: ["lib/generated/**"] }, ...nextConfig];

export default eslintConfig;
