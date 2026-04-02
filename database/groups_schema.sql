-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT '',
    type VARCHAR(50) NOT NULL, -- 'cafe', 'home', 'general'
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(group_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_groups_creator ON groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_groups_type ON groups(type);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_status ON group_members(status);

-- Add RLS (Row Level Security) policies
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Groups policies
CREATE POLICY "Users can view groups they are members of" ON groups
    FOR SELECT USING (
        id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND status = 'accepted'
        )
    );

CREATE POLICY "Users can create groups" ON groups
    FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Group creators can update their groups" ON groups
    FOR UPDATE USING (creator_id = auth.uid());

-- Group members policies
CREATE POLICY "Users can view group memberships" ON group_members
    FOR SELECT USING (
        user_id = auth.uid() OR 
        group_id IN (
            SELECT group_id FROM group_members 
            WHERE user_id = auth.uid() AND status = 'accepted'
        )
    );

CREATE POLICY "Group creators can invite members" ON group_members
    FOR INSERT WITH CHECK (
        group_id IN (
            SELECT id FROM groups WHERE creator_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own membership status" ON group_members
    FOR UPDATE USING (user_id = auth.uid());
