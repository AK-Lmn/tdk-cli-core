/**
 * Neon Color System for TDK CLI
 * 
 * True-color ANSI codes for cyberpunk neon aesthetic
 */

// Primary Neon Colors (True 24-bit Color)
export const NEON = {
  // Primary Colors
  cyan: '\x1b[38;2;0;255;255m',
  pink: '\x1b[38;2;255;0;128m',
  purple: '\x1b[38;2;191;0;255m',
  green: '\x1b[38;2;57;255;20m',
  yellow: '\x1b[38;2;255;255;0m',
  red: '\x1b[38;2;255;7;58m',
  orange: '\x1b[38;2;255;95;31m',
  white: '\x1b[38;2;255;255;255m',
  gray: '\x1b[38;2;128;128;128m',
  darkGray: '\x1b[38;2;64;64;64m',
  
  // Background Colors
  bgVoid: '\x1b[48;2;10;10;15m',
  bgPanel: '\x1b[48;2;20;20;31m',
  bgSelect: '\x1b[48;2;26;10;46m',
  bgMidnight: '\x1b[48;2;13;17;23m',
  bgCyan: '\x1b[48;2;0;100;100m',
  
  // Styles
  dim: '\x1b[2m',
  normal: '\x1b[22m',
  bold: '\x1b[1m',
  underline: '\x1b[4m',
  blink: '\x1b[5m',
  inverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  // Reset
  reset: '\x1b[0m',
};

// Glow effect simulation (for use with chalk or ink)
export const glow = (color: string, intensity: 'dim' | 'normal' | 'bright' = 'normal') => {
  const intensities = {
    dim: 0.5,
    normal: 0.8,
    bright: 1.0,
  };
  return intensities[intensity];
};

// Border characters
export const BORDERS = {
  neon: {
    h: '▓▒░',
    v: '▒',
    tl: '▓',
    tr: '▓',
    bl: '▓',
    br: '▓',
  },
  double: {
    h: '═',
    v: '║',
    tl: '╔',
    tr: '╗',
    bl: '╚',
    br: '╝',
    cross: '╬',
    t: '╦',
    b: '╩',
    l: '╠',
    r: '╣',
  },
  single: {
    h: '─',
    v: '│',
    tl: '┌',
    tr: '┐',
    bl: '└',
    br: '┘',
    cross: '┼',
    t: '┬',
    b: '┴',
    l: '├',
    r: '┤',
  },
  rounded: {
    h: '─',
    v: '│',
    tl: '╭',
    tr: '╮',
    bl: '╰',
    br: '╯',
  },
};

// Status Icons with neon colors
export const ICONS = {
  ready: { char: '✓', color: NEON.green },
  pending: { char: '◐', color: NEON.yellow },
  error: { char: '✗', color: NEON.red },
  building: { char: '◉', color: NEON.orange },
  unknown: { char: '?', color: NEON.purple },
  selected: { char: '►', color: NEON.cyan },
  unselected: { char: '○', color: NEON.darkGray },
  bullet: { char: '●', color: NEON.cyan },
  bulletDim: { char: '○', color: NEON.gray },
  arrow: { char: '→', color: NEON.cyan },
  folder: { char: '▓', color: NEON.purple },
  file: { char: '░', color: NEON.gray },
  check: { char: '✓', color: NEON.green },
  cross: { char: '✗', color: NEON.red },
  warning: { char: '⚠', color: NEON.yellow },
  info: { char: 'ℹ', color: NEON.cyan },
  sparkle: { char: '✨', color: NEON.yellow },
  fire: { char: '🔥', color: NEON.orange },
  rocket: { char: '🚀', color: NEON.pink },
  computer: { char: '💻', color: NEON.cyan },
  gear: { char: '⚙', color: NEON.purple },
  star: { char: '★', color: NEON.yellow },
  heart: { char: '♥', color: NEON.red },
  diamond: { char: '◆', color: NEON.cyan },
  club: { char: '♣', color: NEON.green },
  spade: { char: '♠', color: NEON.gray },
};

// Gradient text generator (simulated with color steps)
export const gradientText = (text: string, colors: string[]) => {
  return text.split('').map((char, i) => {
    const color = colors[i % colors.length];
    return `${color}${char}${NEON.reset}`;
  }).join('');
};

// Rainbow gradient
export const rainbow = (text: string) => {
  const colors = [
    NEON.red,
    NEON.orange,
    NEON.yellow,
    NEON.green,
    NEON.cyan,
    NEON.purple,
    NEON.pink,
  ];
  return gradientText(text, colors);
};

// Cyan to pink gradient (primary brand gradient)
export const brandGradient = (text: string) => {
  const colors = [NEON.cyan, NEON.purple, NEON.pink];
  return gradientText(text, colors);
};

// Glow box generator
export const glowBox = (content: string[], width: number, color: string = NEON.cyan) => {
  const horizontal = BORDERS.neon.h.repeat(Math.floor(width / 3));
  const top = `${color}▓▒░${horizontal}▓▒░${NEON.reset}`;
  const bottom = `${color}▓▒░${horizontal}▓▒░${NEON.reset}`;
  
  return [
    top,
    ...content.map(line => `${color}▒${NEON.reset} ${line.padEnd(width - 4)} ${color}▒${NEON.reset}`),
    bottom,
  ];
};

// Neon header generator
export const neonHeader = (title: string, subtitle?: string) => {
  const lines = [
    `${NEON.cyan}▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░${NEON.reset}`,
    `${NEON.cyan}▒▓${NEON.reset}                                                                                              ${NEON.cyan}▓▒${NEON.reset}`,
    `${NEON.cyan}▓▒${NEON.reset}   ${NEON.bold}${NEON.inverse} ${title} ${NEON.reset}   ${subtitle ? subtitle : ''}`,
    `${NEON.cyan}▒▓${NEON.reset}                                                                                              ${NEON.cyan}▓▒${NEON.reset}`,
    `${NEON.cyan}▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░${NEON.reset}`,
  ];
  return lines;
};

// Animated spinner frames
export const SPINNERS = {
  neon: ['▓', '▒', '░', '▒'],
  pulse: ['▓', '▓', '▒', '▒', '░', '░', '▒', '▒'],
  matrix: ['▓', '▒', '░', ' ', ' ', '░', '▒', '▓'],
  arrow: ['→', '↗', '↑', '↖', '←', '↙', '↓', '↘'],
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  diamonds: ['◆', '◇', '◈', '◉'],
  blocks: ['▖', '▗', '▘', '▙', '▚', '▛', '▜', '▝', '▞', '▟'],
};
