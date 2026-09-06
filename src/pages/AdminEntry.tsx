import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "@/components/admin/AdminLayout";
import AdminDashboard from "@/components/admin/pages/AdminDashboard";
import UsersPage from "@/components/admin/pages/UsersPage";
import PaymentsPage from "@/components/admin/pages/PaymentsPage";
import NotificationsPage from "@/components/admin/pages/NotificationsPage";
import DebugPage from "@/components/admin/pages/DebugPage";
import DirectionsPage from "@/components/admin/pages/DirectionsPage";
import TeachersPage from "@/components/admin/pages/TeachersPage";
import SubscriptionTypesPage from "@/components/admin/pages/SubscriptionTypesPage"

const ADMIN_KEY = "FGVhygvR7fkjtdjyCDJKytfkuyg";

export default function AdminEntry() {
  useEffect(() => {
    localStorage.setItem("admin_key", ADMIN_KEY);
  }, []);

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="subscriptions" element={<SubscriptionTypesPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="debug" element={<DebugPage />} />
        <Route path="directions" element={<DirectionsPage />} />
        <Route path="teachers" element={<TeachersPage />} />
      </Route>

      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  );
}