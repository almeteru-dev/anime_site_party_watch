CREATE TABLE watch_party_rooms (
    id BIGSERIAL PRIMARY KEY,
    owner_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    password_hash VARCHAR(200) NULL,
    invite_code VARCHAR(32) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dissolved', 'expired')),
    dissolved_reason VARCHAR(50) NULL,
    dissolved_at TIMESTAMPTZ NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    content_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_playing BOOLEAN NOT NULL DEFAULT FALSE,
    playback_rate REAL NOT NULL DEFAULT 1.0,
    playback_position_sec REAL NOT NULL DEFAULT 0,
    playback_seq BIGINT NOT NULL DEFAULT 0,
    last_state_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_watch_party_rooms_invite_code ON watch_party_rooms(invite_code);
CREATE INDEX idx_watch_party_rooms_status ON watch_party_rooms(status);
CREATE INDEX idx_watch_party_rooms_expires_at ON watch_party_rooms(expires_at);
CREATE INDEX idx_watch_party_rooms_owner_user_id ON watch_party_rooms(owner_user_id);

CREATE TABLE watch_party_room_members (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL REFERENCES watch_party_rooms(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'moderator', 'viewer')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ NULL,
    UNIQUE (room_id, user_id)
);

CREATE INDEX idx_watch_party_room_members_room_id ON watch_party_room_members(room_id);
CREATE INDEX idx_watch_party_room_members_user_id ON watch_party_room_members(user_id);
CREATE INDEX idx_watch_party_room_members_left_at ON watch_party_room_members(left_at);

CREATE TABLE watch_party_room_messages (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL REFERENCES watch_party_rooms(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_watch_party_room_messages_room_created ON watch_party_room_messages(room_id, created_at DESC);
