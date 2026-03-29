import srvLogo from '../assest/fav_logo/srv-t.png';

export function Logo({ className = '', imageClassName = '' }) {
  return (
    <div className={`flex h-11 w-11 min-w-11 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm sm:h-11 sm:w-11 sm:min-w-11 md:h-12 md:w-12 md:min-w-12 ${className}`}>
      <img
        src={srvLogo}
        alt="SRV Logo"
        className={`h-full w-full max-h-full max-w-full object-contain object-center ${imageClassName}`}
      />
    </div>
  );
}
