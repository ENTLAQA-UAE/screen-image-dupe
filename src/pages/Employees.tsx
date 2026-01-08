import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Search,
  Users,
  Loader2,
  User,
  Building2,
  Briefcase,
  FileText,
  ChevronRight,
  MoreHorizontal,
  UserX,
  Eye,
} from "lucide-react";

interface Employee {
  email: string;
  full_name: string;
  department: string | null;
  job_title: string | null;
  employee_code: string | null;
  assessment_count: number;
  completed_count: number;
  last_assessment_date: string | null;
  organization_id: string;
}

const Employees = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isSuperAdmin } = useAuth();
  const { t, language } = useLanguage();

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [departments, setDepartments] = useState<string[]>([]);
  const [isAnonymizeOpen, setIsAnonymizeOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [anonymizing, setAnonymizing] = useState(false);

  useEffect(() => {
    if (!authLoading && isSuperAdmin()) {
      navigate("/super-admin", { replace: true });
    }
  }, [authLoading, isSuperAdmin, navigate]);

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();

      setOrganizationId(profile?.organization_id || null);
    };

    fetchOrganization();
  }, [user]);

  useEffect(() => {
    if (organizationId) {
      fetchEmployees();
    }
  }, [organizationId]);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchQuery, departmentFilter]);

  const fetchEmployees = async () => {
    if (!organizationId) return;

    setLoading(true);
    try {
      // Fetch all participants and aggregate by email
      const { data: participants, error } = await supabase
        .from("participants")
        .select("*")
        .eq("organization_id", organizationId);

      if (error) throw error;

      // Aggregate participants by email to get unique employees
      const employeeMap = new Map<string, Employee>();

      ((participants || []) as any[]).forEach((p) => {
        if (!p.email) return;

        const existing = employeeMap.get(p.email);
        if (existing) {
          existing.assessment_count += 1;
          if (p.status === "completed") {
            existing.completed_count += 1;
          }
          // Use most recent data
          if (p.completed_at && (!existing.last_assessment_date || p.completed_at > existing.last_assessment_date)) {
            existing.last_assessment_date = p.completed_at;
          }
          // Update name if current is more complete
          if (p.full_name && (!existing.full_name || p.full_name.length > existing.full_name.length)) {
            existing.full_name = p.full_name;
          }
          if (p.department && !existing.department) {
            existing.department = p.department;
          }
          if (p.job_title && !existing.job_title) {
            existing.job_title = p.job_title;
          }
          if (p.employee_code && !existing.employee_code) {
            existing.employee_code = p.employee_code;
          }
        } else {
          employeeMap.set(p.email, {
            email: p.email,
            full_name: p.full_name || "",
            department: p.department,
            job_title: p.job_title,
            employee_code: p.employee_code,
            assessment_count: 1,
            completed_count: p.status === "completed" ? 1 : 0,
            last_assessment_date: p.completed_at,
            organization_id: p.organization_id,
          });
        }
      });

      const employeeList = Array.from(employeeMap.values()).sort((a, b) =>
        (a.full_name || a.email).localeCompare(b.full_name || b.email)
      );

      setEmployees(employeeList);

      // Extract unique departments
      const deptSet = new Set<string>();
      employeeList.forEach((e) => {
        if (e.department) deptSet.add(e.department);
      });
      setDepartments(Array.from(deptSet).sort());
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error(language === 'ar' ? 'فشل في تحميل الموظفين' : 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    let filtered = [...employees];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.full_name?.toLowerCase().includes(query) ||
          e.email?.toLowerCase().includes(query) ||
          e.employee_code?.toLowerCase().includes(query) ||
          e.department?.toLowerCase().includes(query) ||
          e.job_title?.toLowerCase().includes(query)
      );
    }

    // Department filter
    if (departmentFilter && departmentFilter !== "all") {
      filtered = filtered.filter((e) => e.department === departmentFilter);
    }

    setFilteredEmployees(filtered);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleViewEmployee = (employee: Employee) => {
    navigate(`/employees/${encodeURIComponent(employee.email)}`);
  };

  const openAnonymizeDialog = (employee: Employee, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEmployee(employee);
    setIsAnonymizeOpen(true);
  };

  const handleAnonymize = async () => {
    if (!selectedEmployee || !organizationId) return;

    setAnonymizing(true);
    try {
      // Generate anonymous identifiers
      const anonymousId = `ANON-${Date.now().toString(36).toUpperCase()}`;
      const anonymousEmail = `${anonymousId.toLowerCase()}@anonymized.local`;

      // Update all participants with this email
      const { error } = await supabase
        .from("participants")
        .update({
          full_name: anonymousId,
          email: anonymousEmail,
          employee_code: null,
          department: null,
          job_title: null,
          ai_report_text: null,
        })
        .eq("organization_id", organizationId)
        .eq("email", selectedEmployee.email);

      if (error) throw error;

      toast.success(language === 'ar' ? 'تم إخفاء بيانات الموظف بنجاح' : 'Employee data anonymized successfully');
      setIsAnonymizeOpen(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error: any) {
      console.error("Error anonymizing employee:", error);
      toast.error(error.message || (language === 'ar' ? 'فشل في إخفاء بيانات الموظف' : 'Failed to anonymize employee'));
    } finally {
      setAnonymizing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <DashboardLayout activeItem="Employees">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-display font-bold text-foreground mb-1"
            >
              {t.employees.title}
            </motion.h1>
            <p className="text-muted-foreground">
              {t.employees.description}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-0 shadow-md px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{employees.length}</p>
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70">{t.employees.title}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t.employees.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={language === 'ar' ? 'جميع الأقسام' : 'All Departments'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ar' ? 'جميع الأقسام' : 'All Departments'}</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : !organizationId ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">{t.assessments.notAssigned}</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery || departmentFilter !== "all" 
                ? (language === 'ar' ? 'لم يتم العثور على موظفين' : 'No employees found') 
                : (language === 'ar' ? 'لا يوجد موظفون بعد' : 'No employees yet')}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery || departmentFilter !== "all"
                ? (language === 'ar' ? 'جرب تعديل الفلاتر.' : 'Try adjusting your filters.')
                : (language === 'ar' ? 'سيظهر الموظفون هنا بمجرد مشاركتهم في التقييمات.' : 'Employees will appear here once they participate in assessments.')}
            </p>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/30 border-0 shadow-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'ar' ? 'الموظف' : 'Employee'}</TableHead>
                    <TableHead>{t.participants.department}</TableHead>
                    <TableHead>{t.participants.jobTitle}</TableHead>
                    <TableHead className="text-center">{t.assessments.title}</TableHead>
                    <TableHead>{t.employees.lastAssessment}</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee, index) => (
                    <TableRow
                      key={employee.email}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleViewEmployee(employee)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">{employee.full_name || (language === 'ar' ? 'غير معروف' : 'Unknown')}</p>
                            <p className="text-sm text-muted-foreground">{employee.email}</p>
                            {employee.employee_code && (
                              <p className="text-xs text-muted-foreground">#{employee.employee_code}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {employee.department ? (
                          <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 w-fit">
                            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-sm text-emerald-700 dark:text-emerald-300">{employee.department}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {employee.job_title ? (
                          <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/30 w-fit">
                            <Briefcase className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                            <span className="text-sm text-violet-700 dark:text-violet-300">{employee.job_title}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 w-fit mx-auto">
                          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="font-semibold text-blue-700 dark:text-blue-300">{employee.completed_count}</span>
                          <span className="text-blue-600/60 dark:text-blue-400/60">/ {employee.assessment_count}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(employee.last_assessment_date)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewEmployee(employee); }}>
                              <Eye className="w-4 h-4 mr-2" />
                              {language === 'ar' ? 'عرض الملف الشخصي' : 'View Profile'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => openAnonymizeDialog(employee, e)}
                              className="text-destructive focus:text-destructive"
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              {t.employeeDetail.anonymizeData}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Anonymize Dialog */}
      <Dialog open={isAnonymizeOpen} onOpenChange={setIsAnonymizeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <UserX className="w-5 h-5" />
              {t.employeeDetail.anonymizeTitle}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' 
                ? `سيتم إخفاء جميع البيانات الشخصية بشكل دائم لـ ${selectedEmployee?.full_name || selectedEmployee?.email}. سيتم الحفاظ على نتائج التقييم ولكن ستتم إزالة جميع المعلومات التعريفية.`
                : `This will permanently anonymize all personal data for ${selectedEmployee?.full_name || selectedEmployee?.email}. Their assessment results will be preserved but all identifying information will be removed.`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm">
              <p className="font-medium text-destructive mb-2">{t.employeeDetail.anonymizeWarning}</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>{t.employeeDetail.anonymizeItem1}</li>
                <li>{t.employeeDetail.anonymizeItem2}</li>
                <li>{t.employeeDetail.anonymizeItem3}</li>
                <li>{t.employeeDetail.anonymizeItem4}</li>
                <li>{t.employeeDetail.anonymizeItem5}</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAnonymizeOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={handleAnonymize} disabled={anonymizing}>
              {anonymizing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t.employeeDetail.anonymizeData}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Employees;
