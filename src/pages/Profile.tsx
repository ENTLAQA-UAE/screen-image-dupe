import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Trash2, Loader2, UserCircle } from "lucide-react";

interface ProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  title: string | null;
  avatar_url: string | null;
}

export default function Profile() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, title, avatar_url")
      .eq("id", user.id)
      .single();

    if (error) {
      toast.error(isAr ? "فشل في تحميل الملف الشخصي" : "Failed to load profile");
      setLoading(false);
      return;
    }

    setProfile(data);
    setFullName(data.full_name || "");
    setTitle(data.title || "");
    setPhone(data.phone || "");
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName || null,
        title: title || null,
        phone: phone || null,
      })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      toast.error(isAr ? "فشل في حفظ التغييرات" : "Failed to save changes");
      return;
    }

    toast.success(isAr ? "تم حفظ الملف الشخصي" : "Profile saved");
    fetchProfile();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error(isAr ? "الرجاء رفع ملف صورة" : "Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(isAr ? "يجب أن تكون الصورة أقل من 2 ميجابايت" : "Image must be less than 2MB");
      return;
    }

    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    // Remove any previously uploaded avatars under this user's folder
    // (different extensions shouldn't linger and count against storage).
    if (profile?.avatar_url) {
      const oldPath = profile.avatar_url.split("/").slice(-2).join("/").split("?")[0];
      if (oldPath) {
        await supabase.storage.from("user-avatars").remove([oldPath]);
      }
    }

    const { error: uploadError } = await supabase.storage
      .from("user-avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setUploading(false);
      toast.error(isAr ? "فشل في رفع الصورة" : "Failed to upload avatar");
      return;
    }

    const { data: urlData } = supabase.storage.from("user-avatars").getPublicUrl(filePath);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id);

    setUploading(false);

    if (updateError) {
      toast.error(isAr ? "فشل في تحديث رابط الصورة" : "Failed to update avatar URL");
      return;
    }

    toast.success(isAr ? "تم رفع الصورة بنجاح" : "Avatar uploaded successfully");
    fetchProfile();
  };

  const handleRemoveAvatar = async () => {
    if (!user || !profile?.avatar_url) return;

    const oldPath = profile.avatar_url.split("/").slice(-2).join("/").split("?")[0];
    if (oldPath) {
      await supabase.storage.from("user-avatars").remove([oldPath]);
    }

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", user.id);

    if (error) {
      toast.error(isAr ? "فشل في إزالة الصورة" : "Failed to remove avatar");
      return;
    }

    toast.success(isAr ? "تم إزالة الصورة" : "Avatar removed");
    fetchProfile();
  };

  if (loading) {
    return (
      <DashboardLayout activeItem="profile">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeItem="profile">
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isAr ? "الملف الشخصي" : "Profile"}
          </h1>
          <p className="text-muted-foreground">
            {isAr ? "تحديث معلوماتك الشخصية وصورتك" : "Update your personal information and photo"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "الصورة الشخصية" : "Profile Photo"}</CardTitle>
            <CardDescription>
              {isAr ? "ستظهر هذه الصورة في رأس الصفحة" : "This photo will appear in the header"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {profile?.avatar_url ? (
                <div className="relative">
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="h-20 w-20 rounded-full object-cover border bg-background"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={handleRemoveAvatar}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="h-20 w-20 rounded-full border-2 border-dashed flex items-center justify-center bg-muted">
                  <UserCircle className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
              <div>
                <Button variant="outline" className="relative" disabled={uploading}>
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {isAr ? "رفع صورة" : "Upload Photo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  {isAr ? "PNG أو JPG، حتى 2 ميجابايت" : "PNG or JPG, up to 2MB"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "المعلومات الشخصية" : "Personal Information"}</CardTitle>
            <CardDescription>
              {isAr ? "التفاصيل التي تظهر في حسابك" : "Details shown across your account"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">{isAr ? "البريد الإلكتروني" : "Email"}</Label>
              <Input id="email" value={user?.email || ""} disabled />
              <p className="text-xs text-muted-foreground">
                {isAr ? "لا يمكن تغيير البريد الإلكتروني" : "Email cannot be changed"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">{isAr ? "الاسم الكامل" : "Full Name"}</Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={isAr ? "أحمد محمد" : "John Doe"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">{isAr ? "المسمى الوظيفي" : "Job Title"}</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isAr ? "مدير الموارد البشرية" : "HR Manager"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{isAr ? "رقم الهاتف" : "Phone"}</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+971 50 123 4567"
              />
            </div>

            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isAr ? "حفظ التغييرات" : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
