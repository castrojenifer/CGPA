import { useTheme } from '../context/ThemeContext';

export default function GlassCard({ children, className = '', hover = true, animate = true, ...props }) {
  const { darkMode } = useTheme();

  return (
    <div
      className={`
        ${darkMode ? 'glass' : 'glass-light'}
        p-6
        ${hover ? 'hover:shadow-lg hover:shadow-primary-500/10 hover:border-primary-400/30' : ''}
        ${animate ? 'animate-fade-in' : ''}
        transition-all duration-300
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
