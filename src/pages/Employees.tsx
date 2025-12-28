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
  const { t } = useLanguage();

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
      toast.error("Failed to load employees");
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
    return new Date(dateString).toLocaleDateString("en-US", {
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

      toast.success("Employee data anonymized successfully");
      setIsAnonymizeOpen(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error: any) {
      console.error("Error anonymizing employee:", error);
      toast.error(error.message || "Failed to anonymize employee");
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
          <Badge variant="secondary" className="text-base px-4 py-2">
            <Users className="w-4 h-4 mr-2" />
            {employees.length} {t.employees.title}
          </Badge>
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
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
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
            <p className="text-muted-foreground">You are not assigned to any organization.</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery || departmentFilter !== "all" ? "No employees found" : "No employees yet"}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery || departmentFilter !== "all"
                ? "Try adjusting your filters."
                : "Employees will appear here once they participate in assessments."}
            </p>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Job Title</TableHead>
                    <TableHead className="text-center">Assessments</TableHead>
                    <TableHead>Last Assessment</TableHead>
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
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{employee.full_name || "Unknown"}</p>
                            <p className="text-sm text-muted-foreground">{employee.email}</p>
                            {employee.employee_code && (
                              <p className="text-xs text-muted-foreground">#{employee.employee_code}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {employee.department ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            {employee.department}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {employee.job_title ? (
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-muted-foreground" />
                            {employee.job_title}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span>{employee.completed_count}</span>
                          <span className="text-muted-foreground">/ {employee.assessment_count}</span>
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
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => openAnonymizeDialog(employee, e)}
                              className="text-destructive focus:text-destructive"
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              Anonymize Data
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
              Anonymize Employee Data
            </DialogTitle>
            <DialogDescription>
              This will permanently anonymize all personal data for <strong>{selectedEmployee?.full_name || selectedEmployee?.email}</strong>. 
              Their assessment results will be preserved but all identifying information will be removed.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm">
              <p className="font-medium text-destructive mb-2">This action will:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Replace name with an anonymous identifier</li>
                <li>Replace email with an anonymized email</li>
                <li>Remove employee code, department, and job title</li>
                <li>Delete AI-generated report text</li>
                <li>Preserve assessment scores and completion data</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAnonymizeOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleAnonymize} disabled={anonymizing}>
              {anonymizing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Anonymize Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Employees;
