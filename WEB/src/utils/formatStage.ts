export function formatStage(stage: string, group?: string | null): string {
  const titleCase = (s: string) => s.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
  if (stage === 'GROUP_STAGE' && group) return `${titleCase(stage)} \u00b7 ${titleCase(group)}`;
  return titleCase(stage);
}
