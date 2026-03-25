/**
 * Frontend Application — Public Website
 * Parent, faculty, and admin routes have been moved to the separate admin module.
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
        
        {/* If anyone tries to access the old portal paths on the frontend, redirect them to the admin app */}
        <Route path="/portal/*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
