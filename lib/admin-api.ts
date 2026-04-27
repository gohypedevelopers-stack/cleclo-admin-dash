const CATALOG_API_URL = process.env.NEXT_PUBLIC_CATALOG_API_URL || 'http://localhost:3000/api/admin/catalog';
const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3000/api/admin/auth';

const getAuthToken = (): string => {
    // Guard against SSR — localStorage is only available in the browser
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('admin_auth_token') || '';
};

const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

/** Shared fetch wrapper that redirects to /login on 401 */
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

export const adminCatalogApi = {
    getServices: async () => {
        const res = await apiFetch(`${CATALOG_API_URL}/services`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to fetch services');
        return res.json();
    },
    createService: async (data: any) => {
        const res = await apiFetch(`${CATALOG_API_URL}/services`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to create service');
        return res.json();
    },
    updateService: async (id: string, data: any) => {
        const res = await apiFetch(`${CATALOG_API_URL}/services/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to update service');
        return res.json();
    },
    deleteService: async (id: string) => {
        const res = await apiFetch(`${CATALOG_API_URL}/services/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete service');
        if (res.status === 204) return null;
        return res.json().catch(() => null);
    },
    getCategories: async (serviceId?: string) => {
        const url = serviceId
            ? `${CATALOG_API_URL}/categories?serviceId=${serviceId}`
            : `${CATALOG_API_URL}/categories`;
        const res = await apiFetch(url, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to fetch categories');
        return res.json();
    },
    createCategory: async (data: any) => {
        const res = await apiFetch(`${CATALOG_API_URL}/categories`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to create category');
        return res.json();
    },
    updateCategory: async (id: string, data: any) => {
        const res = await apiFetch(`${CATALOG_API_URL}/categories/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to update category');
        return res.json();
    },
    deleteCategory: async (id: string) => {
        const res = await apiFetch(`${CATALOG_API_URL}/categories/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete category');
        return res.json();
    },
    getSubCategories: async (categoryId?: string) => {
        const url = categoryId ? `${CATALOG_API_URL}/subcategories?categoryId=${categoryId}` : `${CATALOG_API_URL}/subcategories`;
        const res = await apiFetch(url, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to fetch subcategories');
        return res.json();
    },
    createSubCategory: async (data: any) => {
        const res = await apiFetch(`${CATALOG_API_URL}/subcategories`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to create subcategory');
        return res.json();
    },
    updateSubCategory: async (id: string, data: any) => {
        const res = await apiFetch(`${CATALOG_API_URL}/subcategories/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to update subcategory');
        return res.json();
    },
    deleteSubCategory: async (id: string) => {
        const res = await apiFetch(`${CATALOG_API_URL}/subcategories/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete subcategory');
        return res.json();
    },
    getItems: async (subCategoryId?: string) => {
        const url = subCategoryId
            ? `${CATALOG_API_URL}/items?subCategoryId=${subCategoryId}`
            : `${CATALOG_API_URL}/items`;
        const res = await apiFetch(url, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to fetch items');
        return res.json();
    },
    createItem: async (data: any) => {
        const res = await apiFetch(`${CATALOG_API_URL}/items`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to create item');
        return res.json();
    },
    updateItem: async (id: string, data: any) => {
        const res = await apiFetch(`${CATALOG_API_URL}/items/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to update item');
        return res.json();
    },
    deleteItem: async (id: string) => {
        const res = await apiFetch(`${CATALOG_API_URL}/items/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete item');
        return res.json();
    }
};

export const adminContentApi = {
    // BANNERS
    getBanners: async () => {
        const res = await apiFetch(`${CATALOG_API_URL}/banners`, { headers: getAuthHeaders() });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to fetch banners');
        }
        return res.json();
    },
    createBanner: async (data: any) => {
        const res = await apiFetch(`${CATALOG_API_URL}/banners`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to create banner');
        }
        return res.json();
    },
    updateBanner: async (id: string, data: any) => {
        const res = await apiFetch(`${CATALOG_API_URL}/banners/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to update banner');
        }
        return res.json();
    },
    deleteBanner: async (id: string) => {
        const res = await apiFetch(`${CATALOG_API_URL}/banners/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to delete banner');
        }
        return res.json();
    },

    // VIDEOS
    getVideos: async () => {
        const res = await apiFetch(`${CATALOG_API_URL}/videos`, { headers: getAuthHeaders() });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to fetch videos');
        }
        return res.json();
    },
    createVideo: async (data: any) => {
        const res = await apiFetch(`${CATALOG_API_URL}/videos`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to create video');
        }
        return res.json();
    },
    updateVideo: async (id: string, data: any) => {
        const res = await apiFetch(`${CATALOG_API_URL}/videos/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to update video');
        }
        return res.json();
    },
    deleteVideo: async (id: string) => {
        const res = await apiFetch(`${CATALOG_API_URL}/videos/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to delete video');
        }
        return res.json();
    },

    // CAMPAIGNS (PROMOTIONS)
    getCampaigns: async () => {
        const res = await apiFetch(`${CATALOG_API_URL}/campaigns`, { headers: getAuthHeaders() });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to fetch campaigns');
        }
        return res.json();
    },
    createCampaign: async (data: any) => {
        const res = await apiFetch(`${CATALOG_API_URL}/campaigns`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to create campaign');
        }
        return res.json();
    },
    updateCampaign: async (id: string, data: any) => {
        const res = await apiFetch(`${CATALOG_API_URL}/campaigns/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to update campaign');
        }
        return res.json();
    },
    deleteCampaign: async (id: string) => {
        const res = await apiFetch(`${CATALOG_API_URL}/campaigns/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to delete campaign');
        }
        return res.json();
    }
};

export const adminWalletApi = {
    getConfig: async () => {
        const res = await apiFetch(`${AUTH_API_URL}/wallet/config`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to fetch wallet config');
        return res.json();
    },
    updateConfig: async (data: any) => {
        const res = await apiFetch(`${AUTH_API_URL}/wallet/config`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to update wallet config');
        return res.json();
    },
    getRewards: async () => {
        const res = await apiFetch(`${AUTH_API_URL}/wallet/rewards`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to fetch rewards');
        return res.json();
    },
    createReward: async (data: any) => {
        const res = await apiFetch(`${AUTH_API_URL}/wallet/rewards`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to create reward');
        return res.json();
    },
    updateReward: async (id: string, data: any) => {
        const res = await apiFetch(`${AUTH_API_URL}/wallet/rewards/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to update reward');
        return res.json();
    }
};

export const adminUserApi = {
    adjustLoyalty: async (userId: string, data: { points: number, type: 'earned' | 'redeemed', reason: string }) => {
        const res = await apiFetch(`${AUTH_API_URL}/users/${userId}/loyalty/adjust`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to adjust loyalty points');
        }
        return res.json();
    }
};

export const adminReferralApi = {
    getCampaigns: async () => {
        const res = await apiFetch(`${AUTH_API_URL}/referrals/campaigns`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to fetch referral campaigns');
        return res.json();
    },
    createCampaign: async (data: any) => {
        const res = await apiFetch(`${AUTH_API_URL}/referrals/campaigns`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to create referral campaign');
        }
        return res.json();
    },
    updateCampaign: async (id: string, data: any) => {
        const res = await apiFetch(`${AUTH_API_URL}/referrals/campaigns/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to update referral campaign');
        }
        return res.json();
    },
    deleteCampaign: async (id: string) => {
        const res = await apiFetch(`${AUTH_API_URL}/referrals/campaigns/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to delete referral campaign');
        }
        return res.json();
    }
};
