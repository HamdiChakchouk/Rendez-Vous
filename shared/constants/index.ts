export const RDV_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    REMINDED: 'reminded',
    COMPLETED: 'completed',
    NO_SHOW: 'no_show',
    CANCELLED_CLIENT: 'cancelled_client',
    CANCELLED_SALON: 'cancelled_salon',
} as const;

export const USER_ROLES = {
    SUPER_ADMIN: 'super_admin',
    MANAGER: 'manager',
    COIFFEUR: 'coiffeur',
    CLIENT: 'client',
} as const;
