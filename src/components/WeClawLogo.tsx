import React from "react";

interface WeClawLogoProps {
  size?: number;
  className?: string;
}

/**
 * WeClaw 品牌 Logo 组件
 * 深蓝到青色渐变背景，白色 W 形爪子图案，带光晕效果
 */
export const WeClawLogo: React.FC<WeClawLogoProps> = ({ size = 40, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 512 512"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      {/* 背景渐变 */}
      <linearGradient id="wc-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e40af" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
      {/* 光晕滤镜 */}
      <filter id="wc-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="12" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      {/* 柔和阴影 */}
      <filter id="wc-shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(6,182,212,0.4)" />
      </filter>
    </defs>

    {/* 圆角矩形背景 */}
    <rect x="32" y="32" width="448" height="448" rx="96" fill="url(#wc-bg)" filter="url(#wc-shadow)" />

    {/* 光晕层（让图标更有质感） */}
    <ellipse cx="256" cy="180" rx="140" ry="80" fill="rgba(255,255,255,0.08)" filter="url(#wc-glow)" />

    {/* W 形爪子主体 —— 五指向上散开 */}
    {/* 左外爪 */}
    <path
      d="M128 370 L150 220 Q154 200 168 190 Q182 182 190 198 L200 280"
      stroke="white"
      strokeWidth="22"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      opacity="0.95"
    />
    {/* 左内爪 */}
    <path
      d="M200 280 L215 190 Q220 170 234 165 Q248 160 252 178 L256 256"
      stroke="white"
      strokeWidth="22"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      opacity="0.95"
    />
    {/* 中心爪 */}
    <path
      d="M256 256 L260 178 Q264 160 278 165 Q292 170 297 190 L312 280"
      stroke="white"
      strokeWidth="22"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      opacity="0.95"
    />
    {/* 右内爪 */}
    <path
      d="M312 280 L322 198 Q330 182 344 190 Q358 200 362 220 L384 370"
      stroke="white"
      strokeWidth="22"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      opacity="0.95"
    />

    {/* 底部连接横杠（爪掌） */}
    <path
      d="M128 370 Q256 400 384 370"
      stroke="white"
      strokeWidth="22"
      strokeLinecap="round"
      fill="none"
      opacity="0.95"
    />

    {/* 指尖光点 */}
    <circle cx="139" cy="212" r="12" fill="rgba(255,255,255,0.6)" />
    <circle cx="208" cy="175" r="10" fill="rgba(255,255,255,0.5)" />
    <circle cx="256" cy="162" r="11" fill="rgba(255,255,255,0.7)" />
    <circle cx="304" cy="175" r="10" fill="rgba(255,255,255,0.5)" />
    <circle cx="373" cy="212" r="12" fill="rgba(255,255,255,0.6)" />
  </svg>
);

export default WeClawLogo;
