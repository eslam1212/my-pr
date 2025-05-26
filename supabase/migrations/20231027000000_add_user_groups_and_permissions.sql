-- 1. Create permissions table
CREATE TABLE public.permissions (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.permissions IS 'Stores all available granular permissions in the system.';

-- 2. Create user_groups table
CREATE TABLE public.user_groups (
    id BIGSERIAL PRIMARY KEY,
    group_name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.user_groups IS 'Stores user groups that bundle sets of permissions.';

-- 3. Create group_permission_assignments table (Junction table)
CREATE TABLE public.group_permission_assignments (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_group_permission UNIQUE (group_id, permission_id)
);
COMMENT ON TABLE public.group_permission_assignments IS 'Assigns permissions to user groups.';

-- 4. Create user_group_assignments table (Junction table)
-- This table links users from auth.users to a group in public.user_groups.
CREATE TABLE public.user_group_assignments (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Assuming auth.users table and UUID IDs
    group_id BIGINT NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_user_group_assignment UNIQUE (user_id) -- Enforces that a user can only belong to one group
);
COMMENT ON TABLE public.user_group_assignments IS 'Assigns users to a single user group.';

-- Trigger function to update 'updated_at' column
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
CREATE TRIGGER set_timestamp_permissions
BEFORE UPDATE ON public.permissions
FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp_user_groups
BEFORE UPDATE ON public.user_groups
FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp_group_permission_assignments
BEFORE UPDATE ON public.group_permission_assignments
FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp_user_group_assignments
BEFORE UPDATE ON public.user_group_assignments
FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();

-- Seed initial permissions
INSERT INTO public.permissions (name, description) VALUES
    ('dashboard:view', 'View the main dashboard'),
    ('products:create', 'Create new products'),
    ('products:read', 'View product information'),
    ('products:update', 'Update existing products'),
    ('products:delete', 'Delete products'),
    ('invoices:create', 'Create new invoices'),
    ('invoices:read', 'View invoice information'),
    ('invoices:update', 'Update existing invoices'),
    ('invoices:delete', 'Delete invoices'),
    ('customers:create', 'Create new customers'),
    ('customers:read', 'View customer information'),
    ('customers:update', 'Update customer information'),
    ('customers:delete', 'Delete customers'),
    ('suppliers:create', 'Create new suppliers'),
    ('suppliers:read', 'View supplier information'),
    ('suppliers:update', 'Update supplier information'),
    ('suppliers:delete', 'Delete suppliers'),
    ('reports:financial:view', 'View financial reports'),
    ('reports:inventory:view', 'View inventory reports'),
    ('users:manage', 'Manage users, groups, and permissions (deprecated, use settings:users:manage)'),
    ('settings:users:manage', 'Manage users, groups, and permissions'),
    ('settings:system:manage', 'Manage general system settings');

-- Seed initial user groups
INSERT INTO public.user_groups (group_name, description) VALUES
    ('Administrator', 'Full system access. All permissions are typically granted to this group.'),
    ('Accountant', 'Access to financial records, invoicing, and customer/supplier data.'),
    ('Sales Manager', 'Access to sales operations, customer data, product information, and sales reports.'),
    ('Inventory Clerk', 'Access to product catalog, stock levels, and inventory reports.');

-- Enable RLS for the new tables if desired, e.g.:
-- ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read access to permissions" ON public.permissions FOR SELECT USING (true);

-- ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read access to user groups" ON public.user_groups FOR SELECT USING (true);

-- ALTER TABLE public.group_permission_assignments ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read access to group permission assignments" ON public.group_permission_assignments FOR SELECT USING (true);
-- Note: More restrictive RLS will be needed for user_group_assignments (e.g. user can see their own, admin can see all)

-- Grant usage on schema and select on tables to authenticated role (and anon if needed for public data)
-- This is important for Supabase access from the client or services.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.permissions TO authenticated;
GRANT SELECT ON public.user_groups TO authenticated;
GRANT SELECT ON public.group_permission_assignments TO authenticated;
GRANT SELECT ON public.user_group_assignments TO authenticated;

-- For service_role (backend operations), grant all permissions
GRANT ALL ON public.permissions TO service_role;
GRANT ALL ON public.user_groups TO service_role;
GRANT ALL ON public.group_permission_assignments TO service_role;
GRANT ALL ON public.user_group_assignments TO service_role;
GRANT ALL ON SEQUENCE public.permissions_id_seq TO service_role;
GRANT ALL ON SEQUENCE public.user_groups_id_seq TO service_role;
GRANT ALL ON SEQUENCE public.group_permission_assignments_id_seq TO service_role;
GRANT ALL ON SEQUENCE public.user_group_assignments_id_seq TO service_role;

-- Note: The permission 'users:manage' was included in the seed data. 
-- The `missing-features.txt` mentions "تتبع نشاط المستخدمين (User Activity Logs)"
-- and "إدارة الصلاحيات المتقدمة" which implies managing users.
-- The new permission 'settings:users:manage' is more aligned with the settings area.
-- I've kept 'users:manage' for now and added a note about deprecation in its description.
-- Consider removing 'users:manage' if 'settings:users:manage' is sufficient.
-- The assignment of all permissions to the Administrator group is commented out
-- as it's better handled by backend logic or a more specific seeding script
-- that runs after the tables and initial permissions/groups are created.
-- For example, an admin user creating a new group would then assign permissions to it.
-- Default RLS policies for read access via 'authenticated' role are commented out but can be enabled.
-- Specific RLS for mutations (insert, update, delete) or more granular select policies
-- would be added based on application requirements (e.g., only admins can manage groups).
-- Added trigger function and its application to tables for auto-updating 'updated_at'.
-- Added grants for 'authenticated' and 'service_role'.
