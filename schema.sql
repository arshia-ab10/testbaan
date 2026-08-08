-- ۱. جدول کاربران
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT NOT NULL DEFAULT 'user', -- 'admin' یا 'user'
    session_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ۲. جدول کتاب‌ها
CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    custom_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ۳. جدول پاسخ‌برگ‌ها
CREATE TABLE IF NOT EXISTS answer_sheets (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    custom_id TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'practice', -- 'exam' یا 'practice'
    duration_minutes INTEGER,
    start_question_number INTEGER NOT NULL DEFAULT 1,
    total_questions INTEGER NOT NULL,
    correct_keys TEXT NOT NULL, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- ۴. جدول دسترسی‌ها
CREATE TABLE IF NOT EXISTS user_permissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    answer_sheet_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (answer_sheet_id) REFERENCES answer_sheets(id) ON DELETE CASCADE,
    UNIQUE(user_id, answer_sheet_id)
);

-- ۵. جدول کارنامه‌ها (نسخه‌ها)
CREATE TABLE IF NOT EXISTS user_submissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    answer_sheet_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    score_percentage REAL,
    version INTEGER DEFAULT 1,
    user_answers TEXT, -- JSON
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (answer_sheet_id) REFERENCES answer_sheets(id) ON DELETE CASCADE
);

-- ۶. جدول پیش‌نویس‌های آنلاین (Cloud Sync)
CREATE TABLE IF NOT EXISTS user_sheet_progress (
    user_id TEXT NOT NULL,
    answer_sheet_id TEXT NOT NULL,
    draft_answers TEXT, -- JSON
    question_flags TEXT, -- JSON
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, answer_sheet_id)
);

-- ۷. جدول کدهای ورود OTP
CREATE TABLE IF NOT EXISTS otps (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at DATETIME NOT NULL
);