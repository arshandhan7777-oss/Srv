import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { twMerge } from 'tailwind-merge';
import srvLogo from '../assest/fav_logo/srv-t.png';

// Portal Login is intentionally NOT included here — it's a separate CTA button
const navLinks = [
  { name: 'Home', path: '/' },
  {
    name: 'About Us',
    path: '/about',
    dropdown: [
      { name: 'About SRVM', path: '/about' },
      { name: 'Academics', path: '/academics' },
      { name: 'Facilities', path: '/facilities' },
    ],
  },
  { name: 'Skill Development', path: '/skills' },
  { name: 'Co-Curricular', path: '/co-curricular' },
  { name: 'Admission', path: '/admission' },
  { name: 'Gallery', path: '/gallery' },
  { name: 'News & Media', path: '/news' },
  // { name: 'Contact Us', path: '/contact' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.lenis?.stop();
    } else {
      document.body.style.overflow = 'unset';
      window.lenis?.start();
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.lenis?.start();
    };
  }, [isOpen]);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={twMerge(
          'fixed w-full top-0 z-50 transition-all duration-500 ease-in-out',
          scrolled || isOpen
            ? 'glass !bg-white/90 shadow-sm py-2'
            : 'bg-transparent py-4'
        )}
      >
        {/* ── Inner container: full width up to 1400px, generous side padding ── */}
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2">

            {/* ── Logo ── */}
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-900 rounded-[16px] p-[3px] shadow-md flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shrink-0">
                <div className="w-full h-full bg-white rounded-[13px] flex items-center justify-center overflow-hidden p-1">
                  <img src={srvLogo} alt="SRV Logo" className="w-full h-full object-contain scale-[1.15]" />
                </div>
              </div>
              <div className="flex flex-col leading-none">
                <span
                  className={twMerge(
                    'font-display text-xl font-bold tracking-tight transition-colors duration-300',
                    scrolled ? 'text-slate-900' : 'text-white'
                  )}
                >
                  SRV
                </span>
                <span
                  className={twMerge(
                    'text-[9px] uppercase tracking-widest font-semibold transition-colors duration-300 -mt-0.5',
                    scrolled ? 'text-emerald-700' : 'text-emerald-200'
                  )}
                >
                  School
                </span>
              </div>
            </Link>

            {/* ── Desktop Nav — visible at lg (1024px+) ── */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2 flex-1 justify-center">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <div key={link.name} className="relative group">
                    <Link
                      to={link.path}
                      className={twMerge(
                        'flex items-center gap-0.5 text-[13px] xl:text-[14px] font-medium transition-colors py-2 px-2 xl:px-2.5 relative whitespace-nowrap rounded-lg',
                        scrolled
                          ? isActive
                            ? 'text-amber-600'
                            : 'text-slate-700 hover:text-amber-500 hover:bg-slate-100'
                          : isActive
                          ? 'text-amber-400'
                          : 'text-slate-100 hover:text-white hover:bg-white/10'
                      )}
                    >
                      {link.name}
                      {link.dropdown && (
                        <ChevronDown size={12} className="mt-0.5 shrink-0" />
                      )}
                      {isActive && (
                        <motion.span
                          layoutId="nav-indicator"
                          className={twMerge(
                            'absolute bottom-0 left-2 right-2 h-0.5 rounded-full',
                            scrolled ? 'bg-amber-500' : 'bg-amber-400'
                          )}
                        />
                      )}
                    </Link>

                    {/* Dropdown */}
                    {link.dropdown && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 opacity-0 translate-y-2 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible transition-all duration-300 z-50">
                        <div className="glass !bg-white/95 shadow-xl border border-slate-100 rounded-2xl py-2 w-52 flex flex-col overflow-hidden">
                          {link.dropdown.map((drop) => (
                            <Link
                              key={drop.name}
                              to={drop.path}
                              className="px-5 py-3 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors whitespace-nowrap"
                            >
                              {drop.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* ── CTA Buttons + Hamburger ── */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Portal Login — always visible on md+ */}
              <a
                href="https://srv-admin-gamma.vercel.app/login"
                className={twMerge(
                  'hidden md:flex items-center gap-1.5 px-3 xl:px-4 py-2 rounded-full font-semibold text-xs xl:text-sm transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap border',
                  scrolled
                    ? 'bg-slate-900 text-white hover:bg-slate-700 border-slate-900'
                    : 'bg-white/10 text-white hover:bg-white/20 border-white/30 backdrop-blur-sm'
                )}
              >
                <User size={14} className="shrink-0" />
                <span>Portal Login</span>
              </a>

              {/* Contact Us — visible on lg+ */}
              <Link
                to="/contact"
                className={twMerge(
                  'hidden lg:flex items-center gap-1.5 px-3 xl:px-5 py-2 rounded-full font-semibold text-xs xl:text-sm transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap',
                  scrolled
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/25'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-black/10'
                )}
              >
                Contact Us
              </Link>

              {/* Hamburger — shown below lg */}
              <button
                className={twMerge(
                  'lg:hidden p-2 rounded-lg transition-colors',
                  scrolled || isOpen
                    ? 'text-slate-800 hover:bg-slate-100'
                    : 'text-white hover:bg-white/10'
                )}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle navigation menu"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile / Tablet Nav ── */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-2xl overflow-hidden mt-2"
            >
              <nav
                className="flex flex-col py-4 px-4 gap-1 max-h-[75vh] overflow-y-auto overscroll-contain"
                data-lenis-prevent="true"
              >
                {/* Include Portal Login in mobile menu */}
                {navLinks.map((link, i) => (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex flex-col"
                    >
                      <Link
                        to={link.path}
                        className={twMerge(
                          'px-4 py-3.5 rounded-xl text-[15px] font-medium flex items-center justify-between transition-colors',
                          location.pathname === link.path
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'text-slate-700 hover:bg-slate-50'
                        )}
                      >
                        {link.name}
                        {link.dropdown && (
                          <ChevronDown size={16} className="text-slate-400" />
                        )}
                      </Link>
                      {link.dropdown && (
                        <div className="flex flex-col pl-6 pr-4 py-1 gap-1 border-l-2 border-slate-100 ml-6 my-1">
                          {link.dropdown.map((drop) => (
                            <Link
                              key={drop.name}
                              to={drop.path}
                              className="py-2.5 text-sm text-slate-500 hover:text-emerald-600 font-medium"
                            >
                              {drop.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </motion.div>
                ))}

                {/* External Portal Link for mobile */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.04 }}
                  className="flex flex-col mt-1"
                >
                  <a
                    href="https://srv-admin-gamma.vercel.app/login"
                    className="px-4 py-3.5 rounded-xl text-[15px] font-medium flex items-center justify-between text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Portal Login
                  </a>
                </motion.div>

                {/* Contact Us in mobile */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.04 + 0.04 }}
                  className="mt-2 pt-2 border-t border-slate-100"
                >
                  <Link
                    to="/contact"
                    className="block w-full text-center px-4 py-3.5 rounded-xl bg-emerald-600 text-white font-semibold text-[15px] hover:bg-emerald-700 transition-colors"
                  >
                    Contact Us
                  </Link>
                </motion.div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
