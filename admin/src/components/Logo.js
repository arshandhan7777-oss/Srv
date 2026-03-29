import srvLogo from '../assest/fav_logo/srv-t.png';

export function Logo({ className = '', imageClassName = '' }) {
  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm sm:h-10 sm:w-10 md:h-12 md:w-12 ${className}`}>
      <img
        src={srvLogo}
        alt="SRV Logo"
        className={`max-h-full max-w-full object-contain object-center ${imageClassName}`}
      />
    </div>
  );
}
