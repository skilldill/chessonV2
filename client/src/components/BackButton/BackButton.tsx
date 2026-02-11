import { useHistory } from "react-router-dom";

type BackButtonProps = {
  to?: string;
  label?: string;
};

export const BackButton = ({ to = "/main", label = "Back" }: BackButtonProps) => {
  const history = useHistory();

  const handleClick = () => {
    history.push(to);
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1 text-white/90 hover:text-white transition-colors duration-200 active:opacity-70 focus:outline-none cursor-pointer"
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
        className="w-5 h-5"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
      <span className="text-[17px] font-normal">{label}</span>
    </button>
  );
};
