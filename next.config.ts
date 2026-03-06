import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // 静的ファイルとして出力（Xサーバー等に配置可能）
  trailingSlash: true,
};

export default nextConfig;
