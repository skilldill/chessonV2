export const AppTopBar = () => {
  return (
    <div className="absolute top-0 left-0 right-0 z-20">
      <div className="h-14 flex items-center justify-center border-b border-white/10 bg-black/25 backdrop-blur-md">
        <img src="/chesson-logo.svg" alt="Chesson" className="h-6 w-auto" />
      </div>
    </div>
  );
};
