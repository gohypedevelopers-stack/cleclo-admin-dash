const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3000/api/admin/auth';

const getAuthToken = (): string => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('admin_auth_token') || '';
};

const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`
});

const apiFetch = async (url: string, options?: RequestInit): Promise<Response> => {
    const res = await fetch(url, options);
    if (res.status === 401) {
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            localStorage.removeItem('admin_auth_token');
            window.location.href = '/login';
        }
    }
    return res;
};

export interface DashboardKpi {
    key: string;
    title: string;
    value: string | number;
    accent: string;
    note: string;
}

export interface DashboardOrderRow {
    id: string;
    customer: string;
    vendor: string;
    city: string;
    location: string;
    status: string;
    paymentStatus: string;
    orderType: string;
    pickupSlot: string;
    deliveryEta: string;
    amount: number;
    transactionId: string;
    phone: string;
    customerPhone: string;
    vendorPhone: string;
    commissionAmount: number;
    payoutDueAmount: number;
    turnaroundHours: number;
    issueSummary: { severity: string; title: string; summary: string } | null;
    createdAt: string;
}

export interface DashboardSettlementRow {
    id: string;
    vendor: string;
    city: string;
    amount: number;
    grossAmount: number;
    commissionAmount: number;
    orderCount: number;
    status: string;
    dueDate: string;
    transactionId: string;
    vendorPhone: string;
    failureReason: string | null;
    note: string | null;
    createdAt: string;
}

export interface DashboardApproval {
    id: string;
    vendorName: string;
    city: string;
    documentStatus: string;
    commissionModel: string;
    agreementSigned: boolean;
    bankVerified: boolean;
    priority: string;
    appliedLabel: string;
}

export interface DashboardIssueDigest {
    id: string;
    orderId: string;
    type: string;
    severity: string;
    vendor: string;
    summary: string;
    city: string;
    unread: boolean;
}

export interface FinanceSnapshotItem {
    key: string;
    title: string;
    value: string;
    description: string;
}

export interface GrowthMetricItem {
    key: string;
    title: string;
    value: string;
    detail: string;
}

export interface DashboardOverview {
    role: string;
    title: string;
    subtitle: string;
    period: string;
    periodLabel: string;
    filters: {
        timeRangeOptions: { value: string; label: string }[];
        vendors: string[];
        cities: string[];
        statuses: string[];
    };
    searchPlaceholder: string;
    kpis: DashboardKpi[];
    financeSnapshot: FinanceSnapshotItem[];
    growthMetrics: GrowthMetricItem[];
    approvals: DashboardApproval[];
    issueDigest: DashboardIssueDigest[];
    primaryTable: {
        type: 'orders' | 'settlements';
        title: string;
        description: string;
        rows: DashboardOrderRow[] | DashboardSettlementRow[];
    };
    summary: {
        pendingApprovals: number;
        openIssues: number;
        unreadIssues: number;
    };
}

export const dashboardApi = {
    getOverview: async (params: {
        period?: string;
        startDate?: string;
        endDate?: string;
        search?: string;
        status?: string;
        vendor?: string;
        city?: string;
        date?: string;
    } = {}): Promise<DashboardOverview> => {
        const query = new URLSearchParams();
        if (params.period) query.set('period', params.period);
        if (params.startDate) query.set('startDate', params.startDate);
        if (params.endDate) query.set('endDate', params.endDate);
        if (params.search) query.set('search', params.search);
        if (params.status) query.set('status', params.status);
        if (params.vendor) query.set('vendor', params.vendor);
        if (params.city) query.set('city', params.city);
        if (params.date) query.set('date', params.date);

        const url = `${AUTH_API_URL}/dashboard/overview${query.toString() ? '?' + query.toString() : ''}`;
        const res = await apiFetch(url, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to load dashboard data');
        return res.json();
    },

    getStats: async () => {
        const res = await apiFetch(`${AUTH_API_URL}/dashboard/stats`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to load dashboard stats');
        return res.json();
    },
};
