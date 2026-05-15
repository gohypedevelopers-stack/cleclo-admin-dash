const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3000/api/admin/auth';
const ORDER_API_URL = process.env.NEXT_PUBLIC_ORDER_API_URL || 'http://localhost:3000/api/admin/orders';

const getAuthToken = (): string => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('admin_auth_token') || '';
};

const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`
});

const REQUEST_TIMEOUT_MS = 30000;

const apiFetch = async (url: string, options?: RequestInit): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const res = await fetch(url, {
            ...options,
            cache: 'no-store',
            signal: options?.signal || controller.signal
        });

        if (res.status === 401) {
            console.error(`[Dashboard API] 401 Unauthorized at ${url}. Redirecting to login.`);
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                localStorage.removeItem('admin_auth_token');
                window.location.href = '/login';
            }
            throw new Error('Authentication required. Redirecting to login...');
        }
        return res;
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            console.error(`[Dashboard API] Request timed out: ${url}`);
            throw new Error(`Request timed out: ${url}`);
        }
        console.error(`[Dashboard API] Fetch error at ${url}:`, error);
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
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
    createdAt?: string;
    supportTicketId?: string;
    type: string;
    severity: string;
    vendor: string;
    summary: string;
    city: string;
    unread: boolean;
    assignedTo?: string;
    financialRiskAmount?: string;
    status: 'Open' | 'Escalated' | 'Resolved';
    vendorRiskLevel?: 'Low' | 'Medium' | 'High';
    financialRisk?: { label: string; value: string; color: string };
    refundStatus?: 'Not Initiated' | 'Processing' | 'Completed';
    damageClaim?: {
        preCleanImageUrl?: string;
        postCleanImageUrl?: string;
        invoiceValue: number;
        liabilityCap: number;
    };
    resolution?: {
        rootCause?: 'Vendor Fault' | 'Rider Fault' | 'Customer Fault' | 'System Issue';
        resolvedAt?: string;
    };
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
    revenueBreakdown: FinanceSnapshotItem[];
    financeSnapshot: FinanceSnapshotItem[];
    growthMetrics: GrowthMetricItem[];
    approvals: DashboardApproval[];
    issueDigest: DashboardIssueDigest[];
    riders: any[];
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
    walletLiability: {
        totalCustomerWalletBalance: number;
        totalVendorPayoutDue: number;
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
        tableStartDate?: string;
        tableEndDate?: string;
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
        if (params.tableStartDate) query.set('tableStartDate', params.tableStartDate);
        if (params.tableEndDate) query.set('tableEndDate', params.tableEndDate);

        const url = `${AUTH_API_URL}/dashboard/overview${query.toString() ? '?' + query.toString() : ''}`;
        const res = await apiFetch(url, { headers: getAuthHeaders() });
        if (!res.ok) {
            const errorBody = await res.json().catch(() => ({}));
            const msg = errorBody?.error || errorBody?.message || `HTTP ${res.status}`;
            console.error('[Dashboard getOverview] Error:', res.status, msg);
            throw new Error(`Dashboard load failed: ${msg}`);
        }
        return res.json();
    },

    getStats: async () => {
        const res = await apiFetch(`${AUTH_API_URL}/dashboard/stats`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to load dashboard stats');
        return res.json();
    },

    getAnalytics: async () => {
        const res = await apiFetch(`${ORDER_API_URL}/analytics`, { headers: getAuthHeaders() });
        if (!res.ok) return null;
        return res.json();
    },

    updateIssue: async (issueId: string, payload: {
        action?: 'assign' | 'review' | 'escalate' | 'resolve';
        assignedTo?: string;
        rootCause?: string;
        refundStatus?: string;
        damageClaim?: any;
    }) => {
        const res = await apiFetch(`${AUTH_API_URL}/issues/${issueId}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.message || 'Failed to update issue');
        }
        return res.json();
    },

    updateVendor: async (vendorId: string, payload: {
        status?: 'Active' | 'Rejected' | 'Suspended';
        action?: 'approve' | 'reject';
    }) => {
        const res = await apiFetch(`${AUTH_API_URL}/vendors/${vendorId}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.message || 'Failed to update vendor');
        }
        return res.json();
    },

    markAllIssuesReviewed: async () => {
        const res = await apiFetch(`${AUTH_API_URL}/issues/review-all`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.message || 'Failed to mark issues as reviewed');
        }
        return res.json();
    }
};
