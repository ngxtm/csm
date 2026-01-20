# FS6: Notifications

**Owner:** FS6 | **Priority:** P3 | **Status:** Pending
**Dependencies:** FS5 (Reports), Lead (Auth)

## Scope

| Area | Tasks |
|------|-------|
| Backend | Notifications module, push/email service, real-time |
| Frontend | Notification center, settings, toast alerts |

## Backend Tasks

### Files to Create

```
apps/api/src/notifications/
├── notifications.module.ts
├── notifications.controller.ts
├── notifications.service.ts
├── notifications.gateway.ts       # WebSocket for real-time
├── providers/
│   ├── email.provider.ts
│   └── push.provider.ts
└── dto/
    ├── notification.dto.ts
    └── notification-settings.dto.ts
```

### Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | /notifications | List user notifications | all |
| GET | /notifications/unread-count | Unread count | all |
| PUT | /notifications/:id/read | Mark as read | all |
| PUT | /notifications/read-all | Mark all as read | all |
| DELETE | /notifications/:id | Delete notification | all |
| GET | /notifications/settings | Get user settings | all |
| PUT | /notifications/settings | Update settings | all |

### Notification Types

```typescript
// Notification entity
interface Notification {
  id: number;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;  // Link to related entity
  isRead: boolean;
  createdAt: Date;
}

type NotificationType =
  | 'order_created'
  | 'order_status_changed'
  | 'production_completed'
  | 'low_stock_alert'
  | 'delivery_update'
  | 'system_announcement';

// User notification settings
interface NotificationSettings {
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  orderUpdates: boolean;
  stockAlerts: boolean;
  deliveryUpdates: boolean;
}
```

### Notification Service

```typescript
// apps/api/src/notifications/notifications.service.ts
@Injectable()
export class NotificationsService {
  constructor(
    private supabase: SupabaseService,
    private emailProvider: EmailProvider,
    private pushProvider: PushProvider,
    private gateway: NotificationsGateway,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    // Save to database
    const notification = await this.save(dto);

    // Send real-time via WebSocket
    this.gateway.sendToUser(dto.userId, notification);

    // Check user settings and send email/push if enabled
    const settings = await this.getSettings(dto.userId);
    if (settings.emailEnabled) {
      await this.emailProvider.send(dto);
    }
    if (settings.pushEnabled) {
      await this.pushProvider.send(dto);
    }

    return notification;
  }

  async notifyLowStock(items: LowStockItem[]): Promise<void> {
    // Notify managers about low stock items
  }

  async notifyOrderStatusChange(order: Order, newStatus: string): Promise<void> {
    // Notify relevant users about order status
  }
}
```

### WebSocket Gateway

```typescript
// apps/api/src/notifications/notifications.gateway.ts
@WebSocketGateway({ cors: true })
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string[]>();

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, userId: string) {
    const sockets = this.userSockets.get(userId) || [];
    sockets.push(client.id);
    this.userSockets.set(userId, sockets);
  }

  sendToUser(userId: string, notification: Notification) {
    const sockets = this.userSockets.get(userId) || [];
    sockets.forEach(socketId => {
      this.server.to(socketId).emit('notification', notification);
    });
  }
}
```

## Frontend Tasks

### Files to Create

```
apps/web/src/features/notifications/
├── components/
│   ├── notification-bell.tsx       # Header bell icon with badge
│   ├── notification-dropdown.tsx   # Dropdown list
│   ├── notification-item.tsx       # Single notification
│   ├── notification-center.tsx     # Full page view
│   └── notification-settings.tsx   # Settings page
├── hooks/
│   ├── use-notifications.ts
│   └── use-notification-socket.ts
└── stores/
    └── notification.store.ts       # Zustand store
```

### Components

```tsx
// Notification bell in header
<NotificationBell>
  <Badge count={unreadCount} />
  <NotificationDropdown>
    {notifications.map(n => (
      <NotificationItem
        key={n.id}
        notification={n}
        onRead={markAsRead}
      />
    ))}
  </NotificationDropdown>
</NotificationBell>

// Toast for real-time notifications
useNotificationSocket({
  onNotification: (notification) => {
    toast.info(notification.title);
    addToStore(notification);
  }
});
```

### Notification Store (Zustand)

```typescript
// apps/web/src/features/notifications/stores/notification.store.ts
interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Notification) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (n) => set((state) => ({
    notifications: [n, ...state.notifications],
    unreadCount: state.unreadCount + 1,
  })),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    ),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, isRead: true })),
    unreadCount: 0,
  })),
}));
```

## Database Schema

```sql
-- notifications table
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- notification_settings table
CREATE TABLE notification_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT FALSE,
  order_updates BOOLEAN DEFAULT TRUE,
  stock_alerts BOOLEAN DEFAULT TRUE,
  delivery_updates BOOLEAN DEFAULT TRUE
);

-- Index for fast queries
CREATE INDEX idx_notifications_user_unread
ON notifications(user_id, is_read)
WHERE is_read = FALSE;
```

## Acceptance Criteria

- [ ] Real-time notifications via WebSocket
- [ ] Notification bell shows unread count
- [ ] Dropdown shows recent notifications
- [ ] Mark as read (single and all)
- [ ] Notification settings page works
- [ ] Toast appears for new notifications
- [ ] Email notifications sent (if enabled)

## Notes

- Use Socket.io for WebSocket (NestJS has built-in support)
- Consider using Supabase Realtime as alternative
- Email provider: Resend, SendGrid, or Supabase Edge Functions
- Push notifications can be Phase 2 (PWA or mobile app)
