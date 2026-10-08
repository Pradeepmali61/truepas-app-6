import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScanFace } from 'lucide-react-native';

import {
    AppHeader,
    NotificationCenter,
    UserMenu,
    type AppNotification,
} from '@/components/complex';
import { useLogoutFlow } from '@/features/auth/useLogoutFlow';
import { useNotifications } from '@/features/notifications/hooks';
import { useProfilePicture } from '@/features/profile/hooks';
import { useToast } from '@/hooks/useToast';
import { useAppSelector } from '@/store';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';
import type { Notification } from '@/types/domain';

function toAppNotification(n: Notification, onPress: () => void): AppNotification {
    const d = new Date(n.createdAt);
    return {
        key: n.id,
        title: n.title,
        description: n.body,
        timestamp: Number.isNaN(d.getTime())
            ? ''
            : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        read: n.read,
        onPress,
    };
}

/** Home chrome — repo AppHeader composition (design-repo ChromeSection):
 *  brand lockup, bell with unread badge, account avatar chip. */
export function AppChrome() {
    const theme = useThemeTokens();
    const router = useRouter();

    const user = useAppSelector((state) => state.auth.user);
    const queryClient = useQueryClient();
    const toast = useToast();
    const { logout: logoutFlow } = useLogoutFlow();
    const { url: avatarUri } = useProfilePicture();
    const { data: notifData, isPending: notifLoading } = useNotifications();

    const notifications = (notifData?.pages.flat() ?? []).map((n) =>
        toAppNotification(n, () => router.push('/notification' as never)),
    );

    // No mark-read endpoint on the BFF — update the inbox cache locally.
    const markAllRead = () => {
        queryClient.setQueriesData<InfiniteData<Notification[]>>({ queryKey: ['notifications'] }, (data) =>
            data
                ? { ...data, pages: data.pages.map((page) => page.map((n) => ({ ...n, read: true }))) }
                : data,
        );
    };

    const handleLogout = async () => {
        await logoutFlow();
        toast.show('success', 'Logged out successfully');
    };

    return (
        <AppHeader
            left={<ScanFace size={iconSize.xl} color={theme.colors.actionPrimary} />}
            title="TruePas"
            actions={
                <>
                    <NotificationCenter
                        notifications={notifications}
                        loading={notifLoading}
                        onMarkAllRead={markAllRead}
                    />
                    <UserMenu
                        name={user?.fullName ?? 'User'}
                        email={user?.email}
                        avatarUri={avatarUri ?? undefined}
                        onProfile={() => router.push('/profile' as never)}
                        onSettings={() => router.push('/settings' as never)}
                        onLogout={handleLogout}
                    />
                </>
            }
        />
    );
}
