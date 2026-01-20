import { ForbiddenException } from '@nestjs/common';
import { EntityContext } from './entity.factory';

/**
 * StatusFactory - Abstract Factory for Status Transitions
 *
 * Quản lý state machine cho entities có status workflow.
 * Validate role-based permissions và execute transition hooks.
 *
 * VÍ DỤ ORDER STATUS FLOW:
 * ```
 * pending ──[manager]──► approved ──[ck_staff]──► processing
 *    │                      │                         │
 *    ▼                      ▼                         ▼
 * cancelled            cancelled                   shipping
 *                                                     │
 *                                               [coordinator]
 *                                                     │
 *                                                     ▼
 *                                                 delivered
 * ```
 *
 * USAGE:
 * ```typescript
 * @Injectable()
 * export class OrderStatusFactory extends StatusFactory<OrderStatus> {
 *   protected transitions: StatusTransition[] = [
 *     { from: 'pending', to: 'approved', allowedRoles: ['manager', 'admin'] },
 *     { from: 'approved', to: 'processing', allowedRoles: ['ck_staff', 'admin'] },
 *     // ...
 *   ];
 * }
 *
 * // Trong service:
 * const newStatus = await this.orderStatusFactory.execute(
 *   orderId,
 *   currentStatus,
 *   'approved',
 *   user.role,
 *   { userId: user.id }
 * );
 * ```
 */

/**
 * Định nghĩa một transition hợp lệ
 */
export interface StatusTransition {
  /** Status hiện tại */
  from: string;
  /** Status muốn chuyển đến */
  to: string;
  /** Roles được phép thực hiện transition này */
  allowedRoles: string[];
  /**
   * Optional: Hook chạy khi transition thành công
   * Ví dụ: Khi order → 'processing', tạo production plan
   */
  onTransition?: (entityId: number, ctx: EntityContext) => Promise<void>;
}

/**
 * Abstract base class cho status factories
 *
 * @template TStatus - Union type của các status (e.g., 'pending' | 'approved' | ...)
 */
export abstract class StatusFactory<TStatus extends string> {
  /**
   * Định nghĩa các transitions hợp lệ
   * Subclass phải override property này
   */
  protected abstract transitions: StatusTransition[];

  /**
   * Kiểm tra xem transition có hợp lệ không
   *
   * @param from - Status hiện tại
   * @param to - Status muốn chuyển
   * @param role - Role của user
   * @returns true nếu transition hợp lệ
   */
  validate(from: TStatus, to: TStatus, role: string): boolean {
    const transition = this.findTransition(from, to);
    if (!transition) return false;

    // '*' means any role can do this transition
    return (
      transition.allowedRoles.includes(role) ||
      transition.allowedRoles.includes('*')
    );
  }

  /**
   * Thực hiện transition
   *
   * @param entityId - ID của entity (order, shipment, etc.)
   * @param from - Status hiện tại
   * @param to - Status muốn chuyển
   * @param role - Role của user
   * @param ctx - User context
   * @returns Status mới nếu thành công
   * @throws ForbiddenException nếu không có quyền
   */
  async execute(
    entityId: number,
    from: TStatus,
    to: TStatus,
    role: string,
    ctx: EntityContext,
  ): Promise<TStatus> {
    // Validate transition
    if (!this.validate(from, to, role)) {
      throw new ForbiddenException(
        `Cannot transition from '${from}' to '${to}' with role '${role}'`,
      );
    }

    // Execute hook if exists
    const transition = this.findTransition(from, to);
    if (transition?.onTransition) {
      await transition.onTransition(entityId, ctx);
    }

    return to;
  }

  /**
   * Lấy danh sách các status có thể chuyển đến từ status hiện tại
   *
   * @param from - Status hiện tại
   * @param role - Role của user
   * @returns Danh sách các status có thể chuyển đến
   */
  getAvailableTransitions(from: TStatus, role: string): TStatus[] {
    return this.transitions
      .filter(
        (t) =>
          t.from === from &&
          (t.allowedRoles.includes(role) || t.allowedRoles.includes('*')),
      )
      .map((t) => t.to as TStatus);
  }

  /**
   * Tìm transition definition
   */
  private findTransition(
    from: string,
    to: string,
  ): StatusTransition | undefined {
    return this.transitions.find((t) => t.from === from && t.to === to);
  }
}
