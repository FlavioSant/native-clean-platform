import { useQuery } from '@tanstack/react-query';

import { fetchSessions } from '../api/authApi';
import { AUTH_QUERY_KEYS } from '../constants';

/**
 * The active sessions of the account, read fresh on every mount: another device
 * can open or end one at any moment, and a list that claims otherwise misleads
 * exactly the user who opened it to check.
 *
 * `networkMode: 'always'` because the client default would pause the query
 * offline and leave the screen loading forever instead of failing where it can
 * offer a retry. `silent`: the screen renders that failure itself, so the
 * global toast would say it twice.
 */
export const useSessions = () =>
  useQuery({
    queryKey: AUTH_QUERY_KEYS.SESSIONS,
    queryFn: fetchSessions,
    staleTime: 0,
    networkMode: 'always',
    meta: { silent: true },
  });
