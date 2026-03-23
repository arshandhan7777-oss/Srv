/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ScrollToTop } from './components/ScrollToTop';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { SkillDevelopment } from './pages/SkillDevelopment';
import { CoCurricular } from './pages/CoCurricular';
import { Admission } from './pages/Admission';
import { Gallery } from './pages/Gallery';
import { News } from './pages/News';
import { Contact } from './pages/Contact';
import { Academics } from './pages/Academics';
import { Facilities } from './pages/Facilities';

// Portal Imports
import { Login } from './portal/Login';
import { AdminLogin } from './portal/AdminLogin';
import { AdminDashboard } from './portal/AdminDashboard';
import { FacultyDashboard } from './portal/FacultyDashboard';
import { ParentDashboard } from './portal/ParentDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="skills" element={<SkillDevelopment />} />
          <Route path="co-curricular" element={<CoCurricular />} />
          <Route path="admission" element={<Admission />} />
          <Route path="academics" element={<Academics />} />
          <Route path="facilities" element={<Facilities />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="news" element={<News />} />
          <Route path="contact" element={<Contact />} />
        </Route>

        {/* Portal Routes without Main Layout */}
        <Route path="/portal">
          {/* Public login routes — no auth required */}
          <Route path="login" element={<Login />} />
          <Route path="admin-login" element={<AdminLogin />} />

          {/* Admin — only users with role='admin' */}
          <Route element={<ProtectedRoute allowedRole="admin" redirectTo="/portal/admin-login" />}>
            <Route path="admin" element={<AdminDashboard />} />
          </Route>

          {/* Faculty — only users with role='faculty' */}
          <Route element={<ProtectedRoute allowedRole="faculty" redirectTo="/portal/login" />}>
            <Route path="faculty" element={<FacultyDashboard />} />
          </Route>

          {/* Parent — only users with role='parent' */}
          <Route element={<ProtectedRoute allowedRole="parent" redirectTo="/portal/login" />}>
            <Route path="parent" element={<ParentDashboard />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}
