import { Redirect } from 'expo-router';

/**
 * Root index — immediately redirects to the main tab navigator.
 * Auth gating is handled inside (auth)/ if/when Supabase is configured.
 * The app is offline-first: no remote credentials are required to launch.
 */
export default function Index() {
  return <Redirect href="/(tabs)/" />;
}
