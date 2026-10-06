/** @jsxImportSource react */
import { Redirect } from 'expo-router';

import { flowGuards } from '@/services/flowGuards';

/**
 * Delete account — legacy route, kept so existing links (the screen index)
 * still resolve. The deletion is the DELETE /user/me request on the confirm
 * screen, whose button spinner shows it in flight, and the success screen
 * follows straight after — there's no progress to stage here. A finished
 * deletion is forwarded to success; anything else (deep link) goes home.
 */
export default function DeleteProcessingScreen() {
  return <Redirect href={flowGuards.has('account:deleted') ? '/account/delete/success' : '/'} />;
}
