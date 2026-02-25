import React from 'react';
import { ViewState, User, Student, AgendaItem, Extracurricular, BehaviorLog, GradeRecord, TeacherProfileData, SchoolProfileData, Holiday, SikapAssessment, KarakterAssessment, EmploymentLink, LearningReport, LiaisonLog, PermissionRequest, LearningJournalEntry, SupportDocument, InventoryItem, SchoolAsset, BOSTransaction, LearningDocumentation, BookLoan } from './types';
import DashboardContainer from './DashboardContainer';
import StudentList from './StudentList';
import ClassroomAdmin from './ClassroomAdmin';
import TeacherProfile from './TeacherProfile';
import AttendanceView from './AttendanceView';
import GradesView from './GradesView';
import CounselingView from './CounselingView';
import ActivitiesView from './ActivitiesView';
import IntroductionView from './IntroductionView';
import AttitudeView from './AttitudeView';
import AccountManagement from './AccountManagement';
import EmploymentLinksAdmin from './EmploymentLinksAdmin';
import LearningReportsView from './LearningReportsView';
import LearningJournalView from './LearningJournalView';
import LearningDocumentationView from './LearningDocumentationView';
import StudentMonitor from './StudentMonitor';
import LiaisonBookView from './LiaisonBookView';
import BackupRestore from './BackupRestore';
import SupportDocumentsView from './SupportDocumentsView';
import SupervisorOverview from './SupervisorOverview';
import SchoolAssetsAdmin from './SchoolAssetsAdmin';
import BOSManagement from './BOSManagement';
import BookLoanView from './BookLoanView';
import SchoolBell from './SchoolBell';

interface MainContentProps {
  currentView: ViewState;
  currentUser: User | null;
  students: Student[];
  agendas: AgendaItem[];
  extracurriculars: Extracurricular[];
  counselingLogs: BehaviorLog[];
  grades: GradeRecord[];
  teacherProfile: TeacherProfileData;
  schoolProfile: SchoolProfileData;
  holidays: Holiday[];
  sikapAssessments: SikapAssessment[];
  karakterAssessments: KarakterAssessment[];
  employmentLinks: EmploymentLink[];
  learningReports: LearningReport[];
  learningDocumentation: LearningDocumentation[];
  liaisonLogs: LiaisonLog[];
  permissionRequests: PermissionRequest[];
  supportDocuments: SupportDocument[];
  inventory: InventoryItem[];
  schoolAssets: SchoolAsset[];
  bosTransactions: BOSTransaction[];
  bookLoans: BookLoan[];
  activeClassId: string;
  isGlobalReadOnly: boolean;
  allowedSubjects: string[];
  kktpMap: Record<string, number>;
  adminPercentage: number;
  users: User[];
  onUpdateProfile: (type: 'teacher' | 'school', data: any) => void;
  onAddStudent: (student: Omit<Student, 'id'>) => void;
  onBatchAddStudents: (students: Omit<Student, 'id'>[]) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onAddAgenda: (item: AgendaItem) => void;
  onToggleAgenda: (id: string) => void;
  onDeleteAgenda: (id: string) => void;
  onAddExtracurricular: (item: Extracurricular) => void;
  onUpdateExtracurricular: (item: Extracurricular) => void;
  onSaveGrade: (studentId: string, subjectId: string, gradeData: any, classId: string) => void;
  onCreateLog: (log: BehaviorLog) => void;
  onAddHoliday: (holidays: Omit<Holiday, 'id'>[]) => void;
  onUpdateHoliday: (holiday: Holiday) => void;
  onDeleteHoliday: (id: string) => void;
  onSaveSikap: (studentId: string, assessment: Omit<SikapAssessment, 'studentId' | 'classId'>) => void;
  onSaveKarakter: (studentId: string, assessment: Omit<KarakterAssessment, 'studentId' | 'classId'>) => void;
  onAddUserAccount: (user: Omit<User, 'id'>) => void;
  onBatchAddUserAccount: (users: Omit<User, 'id'>[]) => void;
  onUpdateUserAccount: (user: User) => void;
  onDeleteUserAccount: (id: string) => void;
  onSaveEmploymentLink: (link: Omit<EmploymentLink, 'id'> | EmploymentLink) => void;
  onDeleteEmploymentLink: (id: string) => void;
  onSaveReport: (report: Omit<LearningReport, 'id'> | LearningReport) => void;
  onDeleteReport: (id: string) => void;
  onNavigateToJournal: (date: string) => void;
  onSaveJournalAndAutoReport: (entries: Partial<LearningJournalEntry>[]) => void;
  onSaveLearningDocumentation: (doc: Omit<LearningDocumentation, 'id'> | LearningDocumentation) => void;
  onDeleteLearningDocumentation: (id: string) => void;
  onSaveLiaisonLog: (log: Omit<LiaisonLog, 'id'>) => void;
  onProcessPermission: (id: string, action: 'approve' | 'reject') => void;
  onSaveSupportDocument: (doc: Omit<SupportDocument, 'id'> | SupportDocument) => void;
  onDeleteSupportDocument: (id: string) => void;
  onSaveInventory: (items: InventoryItem[]) => void;
  onSaveAsset: (asset: Omit<SchoolAsset, 'id'> | SchoolAsset) => void;
  onDeleteAsset: (id: string) => void;
  onSaveBOS: (transaction: BOSTransaction) => void;
  onDeleteBOS: (id: string) => void;
  onSaveBookLoan: (loan: Omit<BookLoan, 'id'> | BookLoan) => void;
  onDeleteBookLoan: (id: string) => void;
  onReturnBookLoan: (id: string) => void;
  setCurrentView: (view: ViewState) => void;
  handleShowNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
}

const MainContent: React.FC<MainContentProps> = (props) => {
  const { currentView, currentUser, setCurrentView } = props;
  const isStudentRole = currentUser?.role === 'siswa';

  switch (currentView) {
    case 'dashboard':
      return <DashboardContainer {...props} />;
    case 'pendahuluan':
      return <IntroductionView profile={props.teacherProfile} schoolProfile={props.schoolProfile} onUpdateProfile={props.onUpdateProfile} currentUser={currentUser} />;
    case 'students':
      if (isStudentRole) { setCurrentView('dashboard'); return null; }
      return <StudentList students={props.students} onAddStudent={props.onAddStudent} onBatchAddStudents={props.onBatchAddStudents} onUpdateStudent={props.onUpdateStudent} onDeleteStudent={props.onDeleteStudent} onShowNotification={props.handleShowNotification} classId={props.activeClassId} />; 
    case 'attendance':
      if (isStudentRole) { setCurrentView('dashboard'); return null; }
      return <AttendanceView students={props.students} holidays={props.holidays} classId={props.activeClassId} isReadOnly={props.isGlobalReadOnly} />; 
    case 'grades':
      if (isStudentRole) { setCurrentView('dashboard'); return null; }
      return <GradesView students={props.students} grades={props.grades} onSaveGrade={props.onSaveGrade} kktpMap={props.kktpMap} classId={props.activeClassId} isReadOnly={props.isGlobalReadOnly} allowedSubjects={props.allowedSubjects} />; 
    case 'counseling':
      if (isStudentRole) { setCurrentView('dashboard'); return null; }
      return <CounselingView students={props.students} logs={props.counselingLogs} onCreateLog={props.onCreateLog} classId={props.activeClassId} isReadOnly={props.isGlobalReadOnly} />; 
    case 'activities':
      if (isStudentRole) { setCurrentView('dashboard'); return null; }
      return <ActivitiesView students={props.students} agendas={props.agendas} extracurriculars={props.extracurriculars} onAddAgenda={props.onAddAgenda} onToggleAgenda={props.onToggleAgenda} onDeleteAgenda={props.onDeleteAgenda} onUpdateExtracurricular={props.onUpdateExtracurricular} onAddExtracurricular={props.onAddExtracurricular} onShowNotification={props.handleShowNotification} classId={props.activeClassId} />; 
    case 'admin':
      if (isStudentRole) { setCurrentView('dashboard'); return null; }
      return <ClassroomAdmin students={props.students} teacherProfile={props.teacherProfile} onShowNotification={props.handleShowNotification} holidays={props.holidays} onAddHoliday={props.onAddHoliday} classId={props.activeClassId} userRole={currentUser.role} users={props.users} schoolProfile={props.schoolProfile} />; 
    case 'support-docs':
      if (isStudentRole) { setCurrentView('dashboard'); return null; }
      return <SupportDocumentsView documents={props.supportDocuments} onSave={props.onSaveSupportDocument} onDelete={props.onDeleteSupportDocument} onShowNotification={props.handleShowNotification} classId={props.activeClassId} isReadOnly={props.isGlobalReadOnly} />; 
    case 'employment-links':
      if (currentUser.role !== 'admin') { setCurrentView('dashboard'); return null; }
      return <EmploymentLinksAdmin links={props.employmentLinks} onSave={props.onSaveEmploymentLink} onDelete={props.onDeleteEmploymentLink} />; 
    case 'accounts':
      if (currentUser.role !== 'admin') { setCurrentView('dashboard'); return null; }
      return <AccountManagement users={props.users} onAddUser={props.onAddUserAccount} onBatchAddUser={props.onBatchAddUserAccount} onUpdateUser={props.onUpdateUserAccount} onDeleteUser={props.onDeleteUserAccount} onShowNotification={props.handleShowNotification} />; 
    case 'profile':
      if (isStudentRole) { setCurrentView('dashboard'); return null; }
      return <TeacherProfile profile={props.teacherProfile} schoolProfile={props.schoolProfile} onUpdateProfile={props.onUpdateProfile} currentUser={currentUser} />; 
    case 'attitude':
      if (isStudentRole) { setCurrentView('dashboard'); return null; }
      return <AttitudeView students={props.students} sikap={props.sikapAssessments} karakter={props.karakterAssessments} onSaveSikap={props.onSaveSikap} onSaveKarakter={props.onSaveKarakter} classId={props.activeClassId} isReadOnly={props.isGlobalReadOnly} />; 
    case 'learning-reports':
      if (isStudentRole) { setCurrentView('dashboard'); return null; }
      return <LearningReportsView reports={props.learningReports} onSave={props.onSaveReport} onDelete={props.onDeleteReport} classId={props.activeClassId} onShowNotification={props.handleShowNotification} onNavigateToJournal={props.onNavigateToJournal} isReadOnly={props.isGlobalReadOnly} users={props.users} />; 
    case 'learning-journal':
      if (isStudentRole) { setCurrentView('dashboard'); return null; }
      return <LearningJournalView classId={props.activeClassId} students={props.students} onSave={props.onSaveJournalAndAutoReport} isReadOnly={props.isGlobalReadOnly} />; 
    case 'learning-documentation':
      if (isStudentRole) { setCurrentView('dashboard'); return null; }
      return <LearningDocumentationView documents={props.learningDocumentation} onSave={props.onSaveLearningDocumentation} onDelete={props.onDeleteLearningDocumentation} classId={props.activeClassId} isReadOnly={props.isGlobalReadOnly} />; 
    case 'student-monitor':
      if (isStudentRole) { setCurrentView('dashboard'); return null; }
      return <StudentMonitor students={props.students} attendance={props.filteredAttendance} grades={props.grades} counseling={props.counselingLogs} />; 
    case 'liaison-book':
      return <LiaisonBookView logs={props.liaisonLogs} onSave={props.onSaveLiaisonLog} currentUser={currentUser} students={props.students} classId={props.activeClassId} />; 
    case 'backup-restore':
      if (currentUser.role !== 'admin') { setCurrentView('dashboard'); return null; }
      return <BackupRestore onRestore={handleRestoreData} />; 
    case 'supervisor-overview':
      if (currentUser.role !== 'supervisor' && currentUser.role !== 'admin') { setCurrentView('dashboard'); return null; }
      return <SupervisorOverview reports={props.learningReports} users={props.users} />; 
    case 'school-assets':
      if (currentUser.role !== 'admin' && currentUser.role !== 'supervisor') { setCurrentView('dashboard'); return null; }
      return <SchoolAssetsAdmin assets={props.schoolAssets} onSave={props.onSaveAsset} onDelete={props.onDeleteAsset} isReadOnly={currentUser.role === 'supervisor'} />; 
    case 'bos-admin':
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'supervisor') { setCurrentView('dashboard'); return null; }
      return <BOSManagement transactions={props.bosTransactions} onSave={props.onSaveBOS} onDelete={props.onDeleteBOS} isReadOnly={props.isGlobalReadOnly} schoolProfile={props.schoolProfile} />; 
    case 'book-loan':
      if (isStudentRole) { setCurrentView('dashboard'); return null; }
      return <BookLoanView loans={props.bookLoans} students={props.students} onSave={props.onSaveBookLoan} onDelete={props.onDeleteBookLoan} onReturn={props.onReturnBookLoan} isReadOnly={props.isGlobalReadOnly} />; 
    case 'school-bell':
      if (currentUser?.role !== 'admin') { setCurrentView('dashboard'); return null; }
      return <SchoolBell />;
    default:
      return <DashboardContainer {...props} />;
  }
};

export default MainContent;

