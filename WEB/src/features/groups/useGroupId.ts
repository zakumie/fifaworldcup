import { useAppSelector } from '../../app/hooks';
import { useGetGroupsQuery } from './groupsApi';

export function useGroupId() {
  const selectedGroupId = useAppSelector((state) => state.group.selectedGroupId);
  const { data: groups, isLoading: groupsLoading } = useGetGroupsQuery();
  const groupId = selectedGroupId || groups?.[0]?.id || '';
  return { groupId, groups: groups ?? [], groupsLoading };
}
