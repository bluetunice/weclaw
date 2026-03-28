/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // 重新设计更友好的对话颜色系统 - 浅色系版本
        chat: {
          user: {
            bg: 'linear-gradient(135deg, #e9d5ff 0%, #f3e8ff 50%, #e9d5ff 100%)',  // 用户渐变浅紫色 - 柔和优雅
            bg_fallback: '#e9d5ff',
            text: '#5b21b6',  // 对应 text-violet-800
            border: '#c4b5fd',  // 对应 border-violet-300
            hover: 'linear-gradient(135deg, #ddd6fe 0%, #ede9fe 50%, #ddd6fe 100%)',
            accent: '#a78bfa',
          },
          assistant: {
            bg: 'linear-gradient(135deg, #ccfbf1 0%, #d1fae5 50%, #ccfbf1 100%)',  // 助手渐变浅绿色
            bg_fallback: '#ccfbf1',
            text: '#0f766e',  // 对应 text-teal-800
            border: '#99f6e4',  // 对应 border-teal-200
            hover: 'linear-gradient(135deg, #bbf7d0 0%, #c6f6d5 50%, #bbf7d0 100%)',
            accent: '#5eead4',
          },
          system: {
            bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fef3c7 100%)',  // 系统渐变浅黄色
            bg_fallback: '#fef3c7',
            text: '#78350f',  // 对应 text-amber-900
            border: '#fcd34d',  // 对应 border-amber-200
            hover: 'linear-gradient(135deg, #fef08a 0%, #fde047 50%, #fef08a 100%)',
            accent: '#f59e0b',
          }
        },
        deepseek: {
          blue: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a',
          },
          green: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d',
          },
          gray: {
            50: '#f9fafb',
            100: '#f3f4f6',
            200: '#e5e7eb',
            300: '#d1d5db',
            400: '#9ca3af',
            500: '#6b7280',
            600: '#4b5563',
            700: '#374151',
            800: '#1f2937',
            900: '#111827',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'chat-user': '0 2px 12px rgba(59, 130, 246, 0.15), 0 4px 20px rgba(59, 130, 246, 0.08)',
        'chat-assistant': '0 1px 10px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.06)',
        'chat-user-hover': '0 4px 24px rgba(59, 130, 246, 0.20), 0 8px 28px rgba(59, 130, 246, 0.12)',
        'chat-assistant-hover': '0 3px 18px rgba(0, 0, 0, 0.08), 0 6px 20px rgba(0, 0, 0, 0.10)',
        'code-block': '0 4px 24px rgba(15, 23, 42, 0.08), 0 8px 32px rgba(15, 23, 42, 0.06)',
      },
      borderRadius: {
        'chat-user': '1.125rem 1.125rem 0.25rem 1.125rem',
        'chat-assistant': '0.25rem 1.125rem 1.125rem 1.125rem',
        'chat-lg': '1.25rem',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.22s ease-out',
        'float-up': 'floatUp 0.5s ease-out',
        'bubble-in': 'bubbleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        slideInRight: {
          '0%':   { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        floatUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0.6' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bubbleIn: {
          '0%': { 
            transform: 'scale(0.9) translateY(12px)',
            opacity: '0'
          },
          '70%': { 
            transform: 'scale(1.02) translateY(-4px)',
            opacity: '0.8'
          },
          '100%': { 
            transform: 'scale(1) translateY(0)',
            opacity: '1'
          },
        },
        glow: {
          '0%': { boxShadow: '0 2px 12px rgba(59, 130, 246, 0.15), 0 4px 20px rgba(59, 130, 246, 0.08)' },
          '100%': { boxShadow: '0 4px 24px rgba(59, 130, 246, 0.25), 0 8px 28px rgba(59, 130, 246, 0.15)' },
        },
      },
    },
  },
  plugins: [],
}