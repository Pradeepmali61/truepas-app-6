import { Redirect } from 'expo-router';

/** Premium showcase entry — opens on the welcome experience. */
export default function Index() {
  return <Redirect href="/(auth)/welcome" />;
}
