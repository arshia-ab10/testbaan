"use client";

import { useState } from "react";

{/* جایگزین کردن بخش رندر لیست کاربران */}
const users: any[] = [];
const [selectedUser, setSelectedUser] = useState<any | null>(null);
<div className="space-y-2 max-h-96 overflow-y-auto">
  {users.length === 0 ? (
    <p className="text-gray-500 text-sm text-center py-4">هیچ کاربری یافت نشد.</p>
  ) : (
    users.map(u => (
      <button key={u.id} onClick={() => setSelectedUser(u)} className={`w-full text-right p-3 rounded-lg border ${selectedUser?.id === u.id ? 'bg-blue-50 border-blue-500 dark:bg-blue-900' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
        <div className="font-bold">
          {u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}` : u.name}
        </div>
        <div className="text-xs text-gray-500">{u.email}</div>
      </button>
    ))
  )}
</div>