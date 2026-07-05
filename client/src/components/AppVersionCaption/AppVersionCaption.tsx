export const AppVersionCaption = () => {
  return (
    <div className="w-full flex flex-wrap justify-center items-center gap-x-[12px] gap-y-[6px] mt-[20px] text-[14px]">
      <a
        href="https://chesson.me/release-notes/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-center opacity-70 hover:opacity-100 transition-opacity"
      >
        <span className="text-[#fff]">v2.1.0 +{" "}</span>
        <span className="font-extrabold bg-gradient-to-r from-[#E810A7] to-[#FFE600] bg-clip-text text-transparent italic">
          Puzzles and Analysis
        </span>
      </a>
      <a
        href="https://t.me/chessonme"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#fff] opacity-70 hover:opacity-100 transition-opacity"
      >
        Telegram
      </a>
    </div>
  );
};
