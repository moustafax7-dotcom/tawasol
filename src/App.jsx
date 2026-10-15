import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import Landing from './pages/Landing'
import ProfileRecovery from './pages/ProfileRecovery'
import NotFound from './pages/NotFound'
import Auth from './pages/Auth'
const ParentDashboard = lazy(() => import('./pages/ParentDashboard'))
const KidsDashboard = lazy(() => import('./pages/KidsDashboard'))
const TawaslDashboard = lazy(() => import('./pages/TawaslDashboard'))

// ملحوظة: تم حذف مكوّن QuickNav (كان بيدّي دخول مباشر لأي داشبورد
// من غير أي حماية — أي مستخدم، حتى غير المسجل، كان يقدر يفتح
// داشبورد الأخصائي بضغطة واحدة). التنقل الحقيقي دلوقتي بيتم من
// خلال الـ Navbar وأزرار كل صفحة، ومحمي حسب دور المستخدم.

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<div role="status" style={{ padding: 48, textAlign: "center" }}>جاري تحميل الصفحة...</div>}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/complete-profile" element={<ProfileRecovery />} />
          <Route path="*" element={<NotFound />} />
          <Route
            path="/parent"
            element={
              <ProtectedRoute allowedRoles={["parent"]}>
                <ParentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kids"
            element={
              <ProtectedRoute allowedRoles={["parent"]}>
                <KidsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tawasl"
            element={
              <ProtectedRoute allowedRoles={["specialist"]}>
                <TawaslDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
