import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCsvImport } from "@/hooks/useCsvImport";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  groupId?: string;
  onSuccess: () => void;
}

interface ParticipantImport {
  employee_code: string;
  full_name: string;
  email: string;
  department?: string;
  job_title?: string;
}

export function CsvImportDialog({
  open,
  onOpenChange,
  organizationId,
  groupId,
  onSuccess,
}: CsvImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{
    success: ParticipantImport[];
    errors: { row: number; message: string; data: Record<string, string> }[];
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const { importCsv, importing, downloadTemplate } = useCsvImport<ParticipantImport>();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);

    const importResult = await importCsv(selectedFile, {
      requiredColumns: ['employee_code', 'full_name'],
      optionalColumns: ['email', 'department', 'job_title'],
      validateRow: (row) => {
        if (!row.employee_code?.trim()) {
          return { valid: false, error: 'Employee code is required' };
        }
        if (!row.full_name?.trim()) {
          return { valid: false, error: 'Full name is required' };
        }
        if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
          return { valid: false, error: 'Invalid email format' };
        }
        return { valid: true };
      },
      transformRow: (row) => ({
        employee_code: row.employee_code.trim(),
        full_name: row.full_name.trim(),
        email: row.email?.trim() || '',
        department: row.department?.trim(),
        job_title: row.job_title?.trim(),
      }),
    });

    setResult(importResult);
  };

  const handleImport = async () => {
    if (!result || result.success.length === 0) return;

    setSaving(true);
    try {
      // Check for duplicate employee codes in the same group
      if (groupId) {
        const employeeCodes = result.success.map(p => p.employee_code);
        const { data: existingCodes } = await supabase
          .from('participants')
          .select('employee_code')
          .eq('group_id', groupId)
          .in('employee_code', employeeCodes);

        if (existingCodes && existingCodes.length > 0) {
          const duplicates = existingCodes.map(e => e.employee_code).join(', ');
          toast.error(`Duplicate employee codes in group: ${duplicates}`);
          setSaving(false);
          return;
        }

        // Check for duplicate emails in the same group
        const emails = result.success.filter(p => p.email).map(p => p.email.toLowerCase());
        if (emails.length > 0) {
          const { data: existingEmails } = await supabase
            .from('participants')
            .select('email')
            .eq('group_id', groupId)
            .in('email', emails);

          if (existingEmails && existingEmails.length > 0) {
            const duplicates = existingEmails.map(e => e.email).join(', ');
            toast.error(`Duplicate emails in group: ${duplicates}`);
            setSaving(false);
            return;
          }
        }
      }

      // Check for duplicates within the CSV itself
      const seenCodes = new Set<string>();
      const seenEmails = new Set<string>();
      for (const p of result.success) {
        if (seenCodes.has(p.employee_code)) {
          toast.error(`Duplicate employee code in CSV: ${p.employee_code}`);
          setSaving(false);
          return;
        }
        seenCodes.add(p.employee_code);

        if (p.email) {
          const lowerEmail = p.email.toLowerCase();
          if (seenEmails.has(lowerEmail)) {
            toast.error(`Duplicate email in CSV: ${p.email}`);
            setSaving(false);
            return;
          }
          seenEmails.add(lowerEmail);
        }
      }

      // Insert participants
      const { error } = await supabase.from('participants').insert(
        result.success.map(p => ({
          organization_id: organizationId,
          group_id: groupId || null,
          employee_code: p.employee_code,
          full_name: p.full_name,
          email: p.email ? p.email.toLowerCase() : null,
          department: p.department || null,
          job_title: p.job_title || null,
          status: 'invited',
        }))
      );

      if (error) {
        // Handle unique constraint violation
        if (error.code === '23505') {
          toast.error('Some participants already exist in this group');
          setSaving(false);
          return;
        }
        throw error;
      }

      toast.success(`Successfully imported ${result.success.length} participants`);
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || 'Failed to import participants');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  const handleDownloadTemplate = () => {
    downloadTemplate(
      ['employee_code', 'full_name', 'email', 'department', 'job_title'],
      'participants'
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Import Participants from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file with participant information. Required columns: employee_code, full_name
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download template */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Download CSV Template
          </Button>

          {/* File upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-accent transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {file ? file.name : 'Click to select a CSV file'}
            </p>
          </div>

          {/* Processing indicator */}
          {importing && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing file...
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-3">
              {/* Success count */}
              {result.success.length > 0 && (
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">{result.success.length} participants ready to import</span>
                </div>
              )}

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{result.errors.length} rows with errors</span>
                  </div>
                  <ScrollArea className="h-32 rounded-lg border border-border p-2">
                    {result.errors.map((err, i) => (
                      <div key={i} className="text-xs text-muted-foreground py-1">
                        Row {err.row}: {err.message}
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="hero"
            onClick={handleImport}
            disabled={!result || result.success.length === 0 || saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>Import {result?.success.length || 0} Participants</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
