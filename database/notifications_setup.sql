-- Create comprehensive notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Temporarily disable RLS for testing
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Notification types we'll support:
-- friend_request_received: Someone sent you a friend request
-- friend_request_accepted: Your friend request was accepted
-- friend_request_declined: Your friend request was declined
-- group_invitation_received: Someone invited you to a group
-- group_member_joined: Someone joined your group
-- group_member_left: Someone left your group
-- group_deleted: A group you were in was deleted
-- group_invitation_accepted: Someone accepted your group invitation
-- group_invitation_declined: Someone declined your group invitation

