// src/services/authService.js
// ============================================================
// طبقة المصادقة الحقيقية — متصلة بـ Supabase Auth مباشرة.
// أي Component (Auth.jsx) بيتكلم مع الدوال دي بس.
//
// ⚠️ تغيير مهم: إنشاء صف children/specialists بقى بيحصل من جوه
// الـ trigger (handle_new_user في Supabase) مش من هنا — عشان
// يشتغل حتى لو الإيميل لسه مش متأكد (مفيش Session وقتها، فأي
// insert من العميل هيترفض بسبب RLS). شوف trigger_update.sql
// ============================================================
import { supabase } from "../supabaseClient";

import { normalizeAuthError } from "./authPolicy";
export { getAuthErrorMessage } from "./authPolicy";

async function fetchProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw Object.assign(new Error("Profile lookup failed"), { code: "profile_unavailable" });
  return data || null;
}

// --- تسجيل الدخول بالإيميل ---
// بيرجّع شكل موحّد: { id, email, role, name }
export async function loginWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw normalizeAuthError(error);

  const profile = await fetchProfile(data.user.id);
  return {
    id: data.user.id,
    email: data.user.email,
    role: profile?.role ?? null,
    name: profile?.Full_name ?? "",
  };
}

// --- إنشاء حساب جديد ---
// role: "parent" | "specialist"
// extra: { childName, childAge } لو parent، أو { specialty } لو specialist
// بيرجّع: { id, email, role, name, needsEmailConfirmation }
export async function registerUser({ name, email, password, role, extra = {} }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // كل البيانات دي بتوصل للـ trigger عشان يعمل profiles +
      // children/specialists في نفس اللحظة، من غير ما نحتاج Session
      data: {
        full_name: name,
        role,
        child_name: role === "parent" ? extra.childName || "" : undefined,
        child_age: role === "parent" ? String(extra.childAge || "") : undefined,
        specialty: role === "specialist" ? extra.specialty || "" : undefined,
      },
    },
  });

  if (error) throw normalizeAuthError(error);

  return {
    id: data.user.id,
    email: data.user.email,
    role,
    name,
    // لو true، يبقى لسه محتاج يأكد إيميله قبل ما يقدر يدخل فعلياً
    needsEmailConfirmation: !data.session,
  };
}

// --- تسجيل دخول بجوجل ---
export async function loginWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + "/complete-profile" },
  });
  if (error) throw { code: "default" };
  return data;
}

// --- تسجيل خروج ---
export async function logout() {
  await supabase.auth.signOut();
}

export function calculatePasswordStrength(password) {
  if (!password) return "empty";
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return "weak";
  if (score <= 2) return "medium";
  return "strong";
}

export const SPECIALTIES = [
  { value: "aba", label: "أخصائي تحليل سلوك تطبيقي (ABA Specialist)" },
  { value: "speech", label: "أخصائي علاج نطق ولغة (Speech-Language Pathologist)" },
  { value: "occupational", label: "أخصائي علاج وظيفي (Occupational Therapist)" },
  { value: "behavioral", label: "أخصائي سلوكي (Behavioral Therapist)" },
  { value: "pecs", label: "أخصائي نظام تواصل بالصور (PECS Specialist)" },
  { value: "psychologist", label: "أخصائي نفسي أطفال (Child Psychologist)" },
  { value: "neurologist", label: "طبيب أعصاب (Neurologist)" },
];
