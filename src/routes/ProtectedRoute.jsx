// src/routes/ProtectedRoute.jsx
// ============================================================
// يمنع دخول أي داشبورد من غير الدور المناسب. مثال:
//   <ProtectedRoute allowedRoles={["parent"]}><ParentDashboard/></ProtectedRoute>
// ولي أمر مسجل دخول مش هيقدر يوصل لـ /tawasl، والعكس صحيح.
// ============================================================
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { profile, user, loading, error } = useAuth();
  const location = useLocation();

  if (loading) return <main dir="rtl" role="status" style={{ padding: 32 }}>جاري تحميل حسابك…</main>;

  if (error || (user && !["parent", "specialist"].includes(profile?.role))) {
    return <Navigate to="/complete-profile" replace />;
  }

  if (!profile) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    // مسجل دخول بدور مختلف (مثلاً ولي أمر بيحاول يدخل داشبورد الأخصائي)
    const fallback = profile.role === "specialist" ? "/tawasl" : "/parent";
    return <Navigate to={fallback} replace />;
  }

  return children;
}
