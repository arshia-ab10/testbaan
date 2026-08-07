PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'user', -- 'admin' یا 'user'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
, first_name TEXT, last_name TEXT, session_token TEXT);
INSERT INTO "users" ("id","email","role","created_at","first_name","last_name","session_token") VALUES('4419939286','arshia.abootorabi10@gmail.com','admin','2026-07-28 17:58:09','Arshia','Abootorabi','15ceac82-04bb-4bf5-a497-08dec7e918db-1722706050');
INSERT INTO "users" ("id","email","role","created_at","first_name","last_name","session_token") VALUES('7091574801','abootorabiarshya@gmail.com','user','2026-07-28 19:40:14','Arshya','Abootorabi','89329f82-ec1e-41a0-b4fe-371be0d1e109-6916596548');
CREATE TABLE books (
    id TEXT PRIMARY KEY,
    custom_id TEXT UNIQUE NOT NULL, -- شناسه اختصاصی ادمین (مثلاً bio-1403)
    title TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "books" ("id","custom_id","title","description","created_at") VALUES('4029785167','4029785167','کتاب ۱','','2026-07-28 18:02:40');
INSERT INTO "books" ("id","custom_id","title","description","created_at") VALUES('9554880660','9554880660','Book','Example','2026-08-03 19:05:18');
CREATE TABLE answer_sheets (
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
INSERT INTO "answer_sheets" ("id","book_id","custom_id","title","type","duration_minutes","start_question_number","total_questions","correct_keys","created_at") VALUES('8301346950','4029785167','8301346950','فصل ۱','practice',NULL,1,2,'{"1":1,"2":1}','2026-07-28 18:03:01');
INSERT INTO "answer_sheets" ("id","book_id","custom_id","title","type","duration_minutes","start_question_number","total_questions","correct_keys","created_at") VALUES('8750034305','4029785167','8750034305','فصل ۰','practice',NULL,1,60,'{"2":0,"3":0}','2026-07-28 20:12:52');
INSERT INTO "answer_sheets" ("id","book_id","custom_id","title","type","duration_minutes","start_question_number","total_questions","correct_keys","created_at") VALUES('3153535490','9554880660','3153535490','فصل ۱','practice',NULL,1,10,'{"1":2,"2":2,"3":2,"4":2,"5":2,"6":2,"7":2,"8":2,"9":2,"10":2}','2026-08-03 19:19:31');
CREATE TABLE user_permissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    answer_sheet_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (answer_sheet_id) REFERENCES answer_sheets(id) ON DELETE CASCADE,
    UNIQUE(user_id, answer_sheet_id)
);
INSERT INTO "user_permissions" ("id","user_id","answer_sheet_id","created_at") VALUES('1803362533','7091574801','8301346950','2026-07-28 19:40:35');
INSERT INTO "user_permissions" ("id","user_id","answer_sheet_id","created_at") VALUES('8295083888','4419939286','8750034305','2026-08-03 19:20:05');
INSERT INTO "user_permissions" ("id","user_id","answer_sheet_id","created_at") VALUES('7398551567','4419939286','3153535490','2026-08-03 19:20:05');
CREATE TABLE user_submissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    answer_sheet_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress' یا 'completed'
    completed_at DATETIME,
    user_answers TEXT, -- پاسخ‌های کاربر به صورت JSON
    score_percentage REAL, version INTEGER DEFAULT 1, -- درصد کسب شده
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (answer_sheet_id) REFERENCES answer_sheets(id) ON DELETE CASCADE
);
INSERT INTO "user_submissions" ("id","user_id","answer_sheet_id","status","completed_at","user_answers","score_percentage","version") VALUES('9124832152','4419939286','3153535490','completed','2026-08-03 19:21:24','{"1":1,"2":2,"3":1,"4":2,"5":1,"6":2,"7":1,"8":2,"9":1,"10":2}',33.33,1);
INSERT INTO "user_submissions" ("id","user_id","answer_sheet_id","status","completed_at","user_answers","score_percentage","version") VALUES('4774150848','4419939286','3153535490','completed','2026-08-03 19:22:29','{"1":0,"2":0,"3":0}',0,2);
INSERT INTO "user_submissions" ("id","user_id","answer_sheet_id","status","completed_at","user_answers","score_percentage","version") VALUES('2576708660','4419939286','8750034305','completed','2026-08-03 19:27:52','{"11":0}',0,1);
INSERT INTO "user_submissions" ("id","user_id","answer_sheet_id","status","completed_at","user_answers","score_percentage","version") VALUES('4688575551','4419939286','8750034305','completed','2026-08-04 10:34:37','{}',0,2);
CREATE TABLE user_sheet_progress (user_id TEXT NOT NULL, answer_sheet_id TEXT NOT NULL, draft_answers TEXT, question_flags TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (user_id, answer_sheet_id));
INSERT INTO "user_sheet_progress" ("user_id","answer_sheet_id","draft_answers","question_flags","updated_at") VALUES('4419939286','3153535490','{}','{"1":0,"2":3,"3":4,"4":5,"5":1,"6":2,"7":1,"8":1,"9":1,"10":0}','2026-08-03 19:21:18');
INSERT INTO "user_sheet_progress" ("user_id","answer_sheet_id","draft_answers","question_flags","updated_at") VALUES('4419939286','8750034305','{}','{"11":1,"56":4,"59":0}','2026-08-03 19:27:52');
CREATE TABLE otps (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at DATETIME NOT NULL
);
INSERT INTO "otps" ("id","email","code","expires_at") VALUES('c9c1ed56-6260-4ea2-bbc1-2bf3d699a52d','arshia.abootorabi10@gmail.com','677687','2026-08-07T19:43:05.879Z');
INSERT INTO "otps" ("id","email","code","expires_at") VALUES('78d92bcb-2131-4a6e-bbc2-348236e84070','arshia.abootorabi10@gmail.com','592253','2026-08-07T19:43:15.886Z');
INSERT INTO "otps" ("id","email","code","expires_at") VALUES('145a4545-f1a8-47e5-a6af-e371fbdb7deb','arshia.abootorabi10@gmail.com','831301','2026-08-07T20:26:11.876Z');
