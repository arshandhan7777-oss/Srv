import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, BookOpen, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import srvLogo from '../assest/fav_logo/srv-t.png';

const navLinks = [
  { name: 'Home', path: '/' },
  { 
    name: 'About Us', 
    path: '/about',
    dropdown: [
      { name: 'About SRVM', path: '/about' },
      { name: 'Academics', path: '/academics' },
      { name: 'Facilities', path: '/facilities' },
    ]
  },
  { name: 'Skill Development', path: '/skills' },
  { name: 'Co-Curricular', path: '/co-curricular' },
  { name: 'Admission', path: '/admission' },
  { name: 'Gallery', path: '/gallery' },
  { name: 'News & Media', path: '/news' },
  { name: 'Contact Us', path: '/contact' },
  { name: 'Portal Login', path: '/portal/login' },
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
          scrolled || isOpen ? 'glass !bg-white/85 shadow-sm py-3' : 'bg-transparent py-5'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="p-1.5 rounded-[1.25rem] bg-emerald-900 shadow-md flex items-center justify-center shrink-0 transition-all duration-300">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1">
                  <img src={srvLogo} alt="SRV Logo" className="w-full h-full object-contain" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className={twMerge(
                  "font-display text-2xl font-bold tracking-tight transition-colors duration-300",
                  scrolled ? "text-slate-900" : "text-white"
                )}>SRV</span>
                <span className={twMerge(
                  "text-[10px] uppercase tracking-widest font-semibold transition-colors duration-300 block -mt-1",
                  scrolled ? "text-emerald-700" : "text-emerald-200"
                )}>School</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden xl:flex items-center gap-7">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <div key={link.name} className="relative group">
                    <Link
                      to={link.path}
                      className={twMerge(
                        'flex items-center gap-1 text-[15px] font-medium transition-colors py-2 relative',
                        scrolled 
                          ? (isActive ? 'text-amber-600' : 'text-slate-700 hover:text-amber-500')
                          : (isActive ? 'text-amber-400' : 'text-slate-100 hover:text-white')
                      )}
                    >
                      {link.name}
                      {link.dropdown && <ChevronDown size={14} className="mt-0.5" />}
                      {isActive && (
                        <motion.span 
                          layoutId="nav-indicator"
                          className={twMerge(
                            "absolute bottom-0 left-0 w-full h-0.5 rounded-full",
                            scrolled ? "bg-amber-500" : "bg-amber-400"
                          )}
                        />
                      )}
                    </Link>

                    {link.dropdown && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 translate-y-3 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible transition-all duration-300 z-50">
                        <div className="glass !bg-white/95 shadow-xl border border-slate-100 rounded-2xl py-2 w-64 flex flex-col overflow-hidden">
                          {link.dropdown.map((drop) => (
                            <Link
                              key={drop.name}
                              to={drop.path}
                              className="px-5 py-3 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
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

            {/* Action Button & Mobile Menu */}
            <div className="flex items-center gap-3 md:gap-4">
                <Link
                  to="/portal/login"
                  className={twMerge(
                    "flex items-center justify-center px-4 py-2 md:px-6 md:py-2.5 rounded-full font-bold text-xs md:text-sm transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5",
                    scrolled 
                      ? "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/25" 
                      : "bg-white text-slate-900 hover:bg-slate-50 shadow-black/10"
                  )}
                >
                  <User size={16} className="md:mr-2" />
                  <span className="hidden md:inline">Portal Login</span>
                  <span className="md:hidden ml-1.5">Login</span>
                </Link>
                <Link
                  to="/contact"
                  className={twMerge(
                    "hidden md:flex items-center justify-center px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5",
                    scrolled 
                      ? "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/25" 
                      : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-black/10"
                  )}
                >
                  Contact Us
                </Link>
              <button
                className={twMerge(
                  "xl:hidden p-2 rounded-lg transition-colors",
                  scrolled || isOpen ? "text-slate-800 hover:bg-slate-100" : "text-white hover:bg-white/10"
                )}
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? <X size={26} /> : <Menu size={26} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="xl:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-2xl overflow-hidden mt-3"
            >
              <nav className="flex flex-col py-4 px-4 gap-1 max-h-[70vh] overflow-y-auto overscroll-contain" data-lenis-prevent="true">
                {navLinks.map((link, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={link.name} 
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
                      {link.dropdown && <ChevronDown size={16} className="text-slate-400" />}
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
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}

