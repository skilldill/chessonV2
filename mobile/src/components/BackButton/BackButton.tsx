import { useHistory } from 'react-router-dom';

type BackButtonProps = {
  to?: string;
  label?: string;
};

export const BackButton: React.FC<BackButtonProps> = ({ to = "/main", label = "Back" }) => {
  const history = useHistory();

  const handleClick = () => {
    history.push(to);
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 py-3 -ml-1 text-white/90 active:text-white transition-colors duration-200 focus:outline-none cursor-pointer touch-manipulation min-h-[44px] min-w-[44px]"
      aria-label={label}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
      <span className="text-[17px] font-normal">{label}</span>
    </button>
  );
};
