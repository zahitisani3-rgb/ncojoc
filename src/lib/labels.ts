import type { ResourceType, Tier } from '@/types';
import type { ChipTone } from '@/components/ui';

export const RESOURCE_TONE: Record<ResourceType, { tone: ChipTone; label: string }> = {
  course: { tone: 'blue', label: 'Course' },
  club: { tone: 'success', label: 'Club' },
  event: { tone: 'cardinal', label: 'Event' },
  service: { tone: 'gold', label: 'Service' },
  program: { tone: 'neutral', label: 'Program' },
};

export const TIER_TONE: Record<Tier, { tone: ChipTone; label: string }> = {
  quick: { tone: 'blue', label: 'Quick' },
  standard: { tone: 'gold', label: 'Standard' },
  major: { tone: 'cardinal', label: 'Major' },
};
