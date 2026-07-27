-- ۱. جدول کاربران
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'user', -- 'admin' یا 'user'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ۲. جدول کتاب‌ها
CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    custom_id TEXT UNIQUE NOT NULL, -- شناسه اختصاصی ادمین (مثلاً bio-1403)
    title TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ۳. جدول پاسخ‌برگ‌ها / فصل‌ها
CREATE TABLE IF NOT EXISTS answer_sheets (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    custom_id TEXT NOT NULL, -- شناسه اختصاصی فصل (مثلاً ch1)
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'practice', -- 'exam' (زمان‌دار) یا 'practice' (تست عادی)
    duration_minutes INTEGER, -- مدت زمان به دقیقه برای آزمون‌ها
    start_question_number INTEGER NOT NULL DEFAULT 1, -- شماره سوال شروع (مثلاً ۵۱)
    total_questions INTEGER NOT NULL, -- تعداد کل سوالات
    correct_keys TEXT NOT NULL, -- کلید پاسخ‌های صحیح به صورت JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    UNIQUE(book_id, custom_id)
);

-- ۴. جدول دسترسی کاربران به پاسخ‌برگ‌ها
CREATE TABLE IF NOT EXISTS user_permissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    answer_sheet_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (answer_sheet_id) REFERENCES answer_sheets(id) ON DELETE CASCADE,
    UNIQUE(user_id, answer_sheet_id)
);

-- ۵. جدول پاسخ‌های ثبت‌شده توسط کاربر
CREATE TABLE IF NOT EXISTS user_submissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    answer_sheet_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress' یا 'completed'
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    user_answers TEXT, -- پاسخ‌های کاربر به صورت JSON
    score_percentage REAL, -- درصد کسب شده
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (answer_sheet_id) REFERENCES answer_sheets(id) ON DELETE CASCADE
);