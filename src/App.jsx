import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { NetworkProvider, useNetwork } from './context/NetworkContext'
import Header from './components/Header'
import Footer from './components/Footer'
import VibeAtmosphere from './components/VibeAtmosphere'
import Home from './components/Home'
import JobTypeView from './components/JobTypeView'
import SpecialtyView from './components/SpecialtyView'
import MemberProfile from './components/MemberProfile'
import SearchPage from './pages/SearchPage'
import AboutPage from './pages/AboutPage'
import JoinPage from './pages/JoinPage'
import ApplicationStatusPage from './pages/ApplicationStatusPage'
import PrivacyPage from './pages/PrivacyPage'
import NotFound from './pages/NotFound'
import CitiesPage from './pages/CitiesPage'
import CityView from './pages/CityView'
import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout, { AdminGuard } from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminApplications from './pages/admin/AdminApplications'
import AdminApplicationDetail from './pages/admin/AdminApplicationDetail'
import AdminMembers from './pages/admin/AdminMembers'
import AdminMemberForm from './pages/admin/AdminMemberForm'
import AdminContacts from './pages/admin/AdminContacts'
import './App.css'
import './components/ContactRequestModal.css'

function JobTypeRoute() {
  const { jobTypeId } = useParams()
  const { getJobType } = useNetwork()
  if (!getJobType(jobTypeId)) return <Navigate to="/" replace />
  return <JobTypeView />
}

function SpecialtyRoute() {
  const { jobTypeId, specialtyId } = useParams()
  const { getSpecialty } = useNetwork()
  if (!getSpecialty(jobTypeId, specialtyId)) return <Navigate to="/" replace />
  return <SpecialtyView />
}

function MemberRoute() {
  const { memberId } = useParams()
  const { getMember } = useNetwork()
  if (!getMember(memberId)) return <Navigate to="/" replace />
  return <MemberProfile />
}

function CityRoute() {
  const { citySlug } = useParams()
  const { getCityBySlug } = useNetwork()
  if (!getCityBySlug(citySlug)) return <Navigate to="/cities" replace />
  return <CityView />
}

function PublicApp() {
  return (
    <div className="app">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/join/status/:applicationId" element={<ApplicationStatusPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/cities" element={<CitiesPage />} />
          <Route path="/cities/:citySlug" element={<CityRoute />} />
          <Route path="/job-types/:jobTypeId" element={<JobTypeRoute />} />
          <Route path="/specialties/:jobTypeId/:specialtyId" element={<SpecialtyRoute />} />
          <Route path="/members/:memberId" element={<MemberRoute />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <NetworkProvider>
      <VibeAtmosphere />
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={(
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          )}
        >
          <Route index element={<AdminDashboard />} />
          <Route path="applications" element={<AdminApplications />} />
          <Route path="applications/:applicationId" element={<AdminApplicationDetail />} />
          <Route path="contacts" element={<AdminContacts />} />
          <Route path="members" element={<AdminMembers />} />
          <Route path="members/new" element={<AdminMemberForm />} />
          <Route path="members/:memberId/edit" element={<AdminMemberForm />} />
        </Route>
        <Route path="/*" element={<PublicApp />} />
      </Routes>
    </NetworkProvider>
  )
}
