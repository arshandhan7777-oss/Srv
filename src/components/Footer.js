import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Instagram, Facebook, Twitter, Youtube, ArrowRight, BookOpen } from 'lucide-react';
import srvLogo from '../assest/fav_logo/srv-t.png';

export function Footer() {
  return (
    <footer className="bg-[#0b1120] text-slate-300 pt-20 pb-8 border-t border-slate-800 relative overflow-hidden">
      {/* Decorative gradient orb */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 rounded-full bg-emerald-900/20 blur-3xl pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          {/* Brand */}
          <div className="lg:col-span-4 space-y-6">
            <Link to="/" className="flex items-center gap-4">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl flex items-center justify-center p-1 md:p-1.5 shadow-lg shadow-emerald-900/40 border border-slate-100 overflow-hidden shrink-0">
                <img src={srvLogo} alt="SRV" className="w-full h-full object-contain scale-110" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-3xl font-bold tracking-tight text-white mb-0.5">SRV</span>
                <span className="text-[11px] uppercase tracking-widest font-semibold text-emerald-400 block -mt-1">School</span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
              Sri Ramakrishna Vidyalaya Matriculation School. Empowering students with knowledge, integrity, and the vision to lead the world towards a brighter future.
            </p>
            <div className="flex items-center gap-3">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-slate-800/80 flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all duration-300 hover:-translate-y-1 shadow-md">
                  <Icon size={22} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 lg:col-start-6">
            <h3 className="text-white font-display font-semibold text-lg mb-6 flex items-center gap-2">
              Explore <span className="w-8 h-0.5 bg-amber-500 block"></span>
            </h3>
            <ul className="space-y-3.5">
              {[
                { label: 'About Us', path: '/about' },
                { label: 'Admissions', path: '/admission' },
                { label: 'Skill Development', path: '/skills' },
                { label: 'Gallery', path: '/gallery' },
                { label: 'News & Media', path: '/news' },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.path} className="text-sm text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1 group">
                    <ArrowRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-amber-500" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Academics */}
          <div className="lg:col-span-2">
            <h3 className="text-white font-display font-semibold text-lg mb-6 flex items-center gap-2">
              Academics <span className="w-8 h-0.5 bg-emerald-500 block"></span>
            </h3>
            <ul className="space-y-3.5">
              {['Curriculum', 'Co-curricular', 'Faculty Directory', 'Library', 'Calendar'].map((link) => (
                <li key={link}>
                  <Link to="/co-curricular" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1 group">
                    <ArrowRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-emerald-500" />
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3 lg:col-start-10">
            <h3 className="text-white font-display font-semibold text-lg mb-6 flex items-center gap-2">
              Get in Touch <span className="w-8 h-0.5 bg-slate-600 block"></span>
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <div className="p-2 bg-slate-800 rounded-lg text-amber-500 shrink-0 mt-0.5"><MapPin size={16} /></div>
                <span className="text-sm leading-relaxed text-slate-400">SRV Matriculation School,<br />Tamil Nadu, India</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="p-2 bg-slate-800 rounded-lg text-amber-500 shrink-0"><Phone size={16} /></div>
                <span className="text-sm text-slate-400">+91 04327 252435</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="p-2 bg-slate-800 rounded-lg text-amber-500 shrink-0"><Mail size={16} /></div>
                <span className="text-sm text-slate-400">info@srvmschool.in</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800/80 pt-8 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} SRV Matriculation School. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-slate-500 border-l border-slate-800 pl-6">
            <Link to="#" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
            <Link to="#" className="hover:text-slate-300 transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
