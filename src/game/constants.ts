import type { CardData } from './types';

export const BOARD_PADDING = 28;
export const CARD_WIDTH = 112;
export const CARD_HEIGHT = 144;
export const CURSOR_THREAT_RADIUS = 220;
export const CHASE_TRIGGER_RADIUS = 160;
export const MAX_PRANK_REVEALS = 4;
export const CONFETTI_TEXT = 'Glad Påsk!';
export const CONFETTI_COLORS = [
  '#f59e9e',
  '#f3c94b',
  '#8bc7ff',
  '#ff8ec5',
  '#ffb347',
  '#d6a56f',
  '#c9c2ff',
  '#95d6a4',
];

export const PRANK_MESSAGES = [
  "This is not the card you're looking for",
  '404 Card not found',
  'Please contact Qopla support',
  'Works on my machine',
  'Access denied. Try again later',
  'Unexpected error. Try refreshing your life',
  'Card moved to another environment',
  'Feature not available in your region',
  "You don't have permission to see this egg",
  'Loading... please wait forever',
];

export const SYMBOLS: Array<
  Pick<CardData, 'icon' | 'title' | 'accent' | 'shellPattern'>
> = [
  {
    icon: '🐇',
    title: 'Bunny',
    accent: '#f59e9e',
    shellPattern:
      'radial-gradient(circle at 50% 18%, rgba(255,255,255,0.7), transparent 22%), repeating-linear-gradient(180deg, rgba(255,255,255,0.28) 0 10px, rgba(255,255,255,0) 10px 22px)',
  },
  {
    icon: '🐣',
    title: 'Chick',
    accent: '#f3c94b',
    shellPattern:
      'repeating-radial-gradient(circle at 50% 28%, rgba(255,255,255,0.24) 0 10px, rgba(255,255,255,0) 10px 24px)',
  },
  {
    icon: '🥚',
    title: 'Egg Basket',
    accent: '#8bc7ff',
    shellPattern:
      'repeating-linear-gradient(135deg, rgba(255,255,255,0.24) 0 8px, rgba(255,255,255,0) 8px 18px)',
  },
  {
    icon: '🌷',
    title: 'Tulip',
    accent: '#ff8ec5',
    shellPattern:
      'repeating-linear-gradient(90deg, rgba(255,255,255,0.24) 0 12px, rgba(255,255,255,0) 12px 20px)',
  },
  {
    icon: '🌼',
    title: 'Flower',
    accent: '#ffb347',
    shellPattern:
      'radial-gradient(circle at 30% 32%, rgba(255,255,255,0.24) 0 12px, rgba(255,255,255,0) 13px), radial-gradient(circle at 70% 48%, rgba(255,255,255,0.2) 0 10px, rgba(255,255,255,0) 11px)',
  },
  {
    icon: '🧺',
    title: 'Basket',
    accent: '#d6a56f',
    shellPattern:
      'repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 7px, rgba(255,255,255,0) 7px 14px), repeating-linear-gradient(135deg, rgba(255,255,255,0.12) 0 7px, rgba(255,255,255,0) 7px 14px)',
  },
  {
    icon: '🥕',
    title: 'Carrot',
    accent: '#ff9a57',
    shellPattern:
      'repeating-linear-gradient(180deg, rgba(255,255,255,0.22) 0 9px, rgba(255,255,255,0) 9px 18px), radial-gradient(circle at 50% 24%, rgba(255,255,255,0.24), transparent 26%)',
  },
  {
    icon: '🐑',
    title: 'Lamb',
    accent: '#c9c2ff',
    shellPattern:
      'radial-gradient(circle at 28% 34%, rgba(255,255,255,0.24) 0 10px, rgba(255,255,255,0) 11px), radial-gradient(circle at 68% 42%, rgba(255,255,255,0.24) 0 12px, rgba(255,255,255,0) 13px), repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0 10px, rgba(255,255,255,0) 10px 20px)',
  },
];
