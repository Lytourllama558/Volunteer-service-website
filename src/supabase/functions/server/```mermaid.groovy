```mermaid
erDiagram
AUTH_USERS {
  uuid id PK
  text email
}

USER_PROFILES {
  uuid user_id PK  "FK -> AUTH_USERS.id"
  text name
  text email
  text phone
  text avatar
  text bio
  int total_hours
  int total_activities
  timestamptz created_at
  timestamptz updated_at
}

ACTIVITIES {
  uuid id PK
  text legacy_kv_id "兼容旧KV id(可空)"
  text title
  text organization
  text organizer_unit
  text category
  text location
  text date
  timestamptz signup_start_time
  timestamptz signup_end_time
  timestamptz activity_start_time
  timestamptz activity_end_time
  text leader_name
  text leader_phone
  text duration
  int spots_available
  int total_spots
  text description
  jsonb requirements
  text image
  jsonb tags
  timestamptz created_at
}

REGISTRATIONS {
  uuid id PK
  uuid activity_id FK
  uuid user_id "FK -> AUTH_USERS.id (可空: 游客报名)"
  text name
  text email
  text phone
  text message
  text status
  timestamptz registered_at
  timestamptz completed_at
  int volunteered_hours
}

ACTIVITIES ||--o{ REGISTRATIONS : "1对多(报名属于活动)"
AUTH_USERS ||--o| USER_PROFILES : "1对0..1(扩展资料)"
AUTH_USERS ||--o{ REGISTRATIONS : "1对0..N(登录用户报名)"