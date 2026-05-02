# Admin Dashboard Audit

Date: May 1, 2026

---

## Done

### Dashboard
- KPI cards (orders, revenue, pending, issues, AOV)
- Time filters (today, yesterday, this week, this month, custom)
- Role-based dashboard view
- Finance snapshot
- Vendor weekly activity

### Orders
- Order listing with search, status, vendor, date filters
- Pagination
- Order detail view
- Status update
- Assign vendor to order
- Assign rider to order
- Report issue on order
- Resolve issue on order

### Vendors
- Vendor listing with filters
- Pending vendor approvals view
- Approve vendor
- Suspend vendor
- Vendor detail profile
- Internal notes
- Inspection status
- Onboarding step tracking
- Bank verified field
- GST registration fields
- Daily capacity field
- Area coverage field
- Vendor payouts listing
- Vendor outlets view
- Vendor analytics view

### Users
- User listing with role and status filters
- User search
- Block / unblock user
- Reset password
- CSV export

### Catalog
- Services CRUD
- Categories CRUD with reorder
- Subcategories CRUD
- Items CRUD
- Bulk item upload
- Bulk price update
- City-based price overrides
- Active/inactive toggle
- Service-level commission %
- Express option flag
- Surge pricing flag
- City targeting on services
- CSV import/export

### Wallet & Rewards
- Wallet config (min/max add amount)
- Bonus enabled toggle
- Reward rules CRUD
- Cashback rules
- Expiry days setting
- Wallet liability summary

### Content Management
- Banners CRUD with city targeting and priority rank
- Videos CRUD
- Campaigns CRUD with discount type, city targeting, first order flag
- Referral campaigns CRUD with reward amounts, city targeting, expiry

### Locations
- States lookup
- Cities CRUD (code, state, enabled, timezone)
- Areas CRUD (code, surge %, enabled)
- Time slots CRUD (pickup/delivery, day, capacity)

### Settlements
- Settlement listing with status and vendor filters
- Settlement stats
- Create settlement
- Update settlement
- Mark settlement paid
- Payment mode field
- Tax deducted field
- Commission and gross amount fields

### Issues & Alerts
- Issue listing with city, vendor, type, date, status, severity filters
- Assign issue to team member
- Escalate issue
- Mark issue resolved
- Mark all reviewed
- Root cause classification (vendor/rider/customer/system)
- Refund status tracking (not initiated, processing, completed)
- Damage claim support (images, invoice, liability cap)

### Settings
- Profile details form (name, email, phone, avatar)
- Password change form
- Notification governance table with role-based toggles
- Allocation logic config (auto-assign, priority rule, express multiplier)
- SLA engine config (standard/express/pickup hours, auto-flag, auto-penalty)
- Commission config (default rate, express override, settlement cycle)
- Rider payment model config (base rate, distance rate, peak bonus, penalty rules)
- Tax & compliance config (GST %, TDS %, auto-invoice, mandatory PAN/GST)
- Damage & compensation config (damage cap, free rewash, late comp amount)
- Multi-city configuration table

### Support
- Support chat UI
- Customer intelligence sidebar (LTV, orders, rating, issue rate)
- Active order view in sidebar
- REPL commands (/refund, /call, /resolve, /transfer)

### Riders
- Rider dashboard page
- Rider analytics page
- Rider payments page
- Rider verification page
- Rider support page
- Rider listing page

### Feedback
- Feedback listing with category filters
- Feedback detail with linked order
- Resolution tracking
- Feedback heatmap

---

## Not Done

### Users detail page — backend API exists but admin doesn't use it
- View user saved addresses
- Add / edit / delete user address
- View wallet balance from API
- Manual wallet credit or debit
- Loyalty points adjustment
- View payment methods (cards, UPI)
- Edit user profile from admin

### Support tickets — backend API exists but admin uses mock data
- Fetch real ticket list from API
- Create ticket from admin
- Update ticket status from admin
- Use escalation flag from API

### Wallet reward rules — backend fields exist but not shown in UI
- City targeting on reward rules (targetCityCodes)
- First order only toggle (firstOrderOnly)
- Priority rank field (priorityRank)
- Max reward cap field (maxRewardAmount)
- Delete reward rule button

### Catalog pricing — backend supports it but admin only does city overrides
- Vendor-specific price overrides
- Price preview tool wired to UI

### Settings — backend API exists but admin saves locally only
- Wire profile update to API
- Wire password change to API
- All other settings (commission, SLA, notifications, allocation, payouts, tax, damage, multi-city) have no backend API yet — mock is correct for now

### Riders — backend not built at all
- Rider onboarding workflow
- Rider verification workflow
- Rider document upload and expiry
- Rider vehicle details
- Rider zone and outlet assignment
- Rider availability states
- Rider earnings and payouts
- Rider analytics
- Live GPS tracking

### Orders — backend not built for these
- SLA countdown timer
- Allocation strategy engine
- Order profitability breakdown
- Bulk assign vendor/rider
- Bulk status change
- Bulk export

### Vendors — backend not built for these
- Vendor tier engine (Gold / Silver / Probation)
- Agreement expiry tracking
- Full KYC checklist workflow
- Geo-map for outlets
- Registration source tracking
- Priority tags (High Risk, Incomplete Docs, Ready to Activate)

### Settlements — backend not built for these
- Vendor ledger
- Invoice PDF generation
- Settlement aging API
- Financial health score
- Bulk settlement processing
- Bulk payout release

### Issues — backend not built for these
- Auto-escalation background worker
- Payout hold from issue risk

### Support — backend not built for these
- Ticket source tracking (app, dashboard, email)
- Auto-ticket from SLA breach
- Auto-ticket from bad rating
- Predefined reply templates
- Dispute workflow

### Customer analytics — backend not built
- Customer segmentation engine (VIP, Gold, At Risk, Dormant)
- Lifetime value calculation
- Churn tracking
- Registration source tracking
- Internal customer notes
