import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Target, Globe } from "lucide-react";

interface Competency {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  is_active: boolean;
  created_at: string;
}

export function CompetencyManagement() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  
  // Add/Edit dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompetency, setEditingCompetency] = useState<Competency | null>(null);
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizationAndCompetencies();
  }, [user]);

  const fetchOrganizationAndCompetencies = async () => {
    if (!user) return;
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();
    
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }
    
    setOrganizationId(profile.organization_id);
    
    const { data, error } = await supabase
      .from("competencies")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("name");
    
    if (error) {
      toast.error("Failed to load competencies");
      console.error(error);
    } else {
      setCompetencies(data || []);
    }
    
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setEditingCompetency(null);
    setName("");
    setNameAr("");
    setDescription("");
    setDescriptionAr("");
    setDialogOpen(true);
  };

  const handleOpenEdit = (competency: Competency) => {
    setEditingCompetency(competency);
    setName(competency.name);
    setNameAr(competency.name_ar || "");
    setDescription(competency.description || "");
    setDescriptionAr(competency.description_ar || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !organizationId) return;
    
    setSaving(true);
    
    try {
      if (editingCompetency) {
        // Update existing
        const { error } = await supabase
          .from("competencies")
          .update({
            name: name.trim(),
            name_ar: nameAr.trim() || null,
            description: description.trim() || null,
            description_ar: descriptionAr.trim() || null,
          })
          .eq("id", editingCompetency.id);
        
        if (error) throw error;
        toast.success("Competency updated");
      } else {
        // Create new
        const { error } = await supabase
          .from("competencies")
          .insert({
            organization_id: organizationId,
            name: name.trim(),
            name_ar: nameAr.trim() || null,
            description: description.trim() || null,
            description_ar: descriptionAr.trim() || null,
          });
        
        if (error) throw error;
        toast.success("Competency created");
      }
      
      setDialogOpen(false);
      fetchOrganizationAndCompetencies();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to save competency");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (competency: Competency) => {
    const { error } = await supabase
      .from("competencies")
      .update({ is_active: !competency.is_active })
      .eq("id", competency.id);
    
    if (error) {
      toast.error("Failed to update competency status");
    } else {
      toast.success(competency.is_active ? "Competency deactivated" : "Competency activated");
      fetchOrganizationAndCompetencies();
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    
    const { error } = await supabase
      .from("competencies")
      .delete()
      .eq("id", id);
    
    setDeletingId(null);
    
    if (error) {
      toast.error("Failed to delete competency");
      console.error(error);
    } else {
      toast.success("Competency deleted");
      fetchOrganizationAndCompetencies();
    }
  };

  const getDisplayName = (competency: Competency) => {
    if (language === "ar" && competency.name_ar) {
      return competency.name_ar;
    }
    return competency.name;
  };

  const getDisplayDescription = (competency: Competency) => {
    if (language === "ar" && competency.description_ar) {
      return competency.description_ar;
    }
    return competency.description;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Competencies
          </CardTitle>
          <CardDescription>
            Manage competencies for Situational Judgment assessments
          </CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Competency
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingCompetency ? "Edit Competency" : "Add Competency"}
              </DialogTitle>
              <DialogDescription>
                Define a competency that will be available for situational judgment assessments
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name (English)</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Leadership"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name-ar" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Name (Arabic)
                  </Label>
                  <Input
                    id="name-ar"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="e.g. القيادة"
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (English)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this competency..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description-ar" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Description (Arabic)
                </Label>
                <Textarea
                  id="description-ar"
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  placeholder="وصف الكفاءة..."
                  dir="rtl"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !name.trim()}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingCompetency ? "Save Changes" : "Add Competency"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {competencies.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Competencies Yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Add competencies that will be used in situational judgment assessments
            </p>
            <Button onClick={handleOpenAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Competency
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Competency</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-28"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competencies.map((competency) => (
                <TableRow key={competency.id} className={!competency.is_active ? "opacity-60" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Target className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{getDisplayName(competency)}</p>
                        {competency.name_ar && language !== "ar" && (
                          <p className="text-xs text-muted-foreground" dir="rtl">
                            {competency.name_ar}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-sm text-muted-foreground truncate">
                      {getDisplayDescription(competency) || "-"}
                    </p>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Switch
                        checked={competency.is_active}
                        onCheckedChange={() => handleToggleActive(competency)}
                      />
                      <Badge variant={competency.is_active ? "default" : "secondary"}>
                        {competency.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(competency)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={deletingId === competency.id}
                          >
                            {deletingId === competency.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Competency</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{competency.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(competency.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
