import { useHistory } from "react-router-dom";
import { useProfileData } from "../../hooks/useProfileData";
import { MEM_AVATARS } from "../../constants/avatars";

export const ProfileCard = () => {
  const history = useHistory();
  const { name, avatarIndex, loading } = useProfileData();

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center px-4 py-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#4F39F6] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div 
      className="w-full flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-all active:scale-[0.98]"
      onClick={() => history.push('/profile')}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 rounded-full"></div>
          <img
            src={MEM_AVATARS[avatarIndex]}
            alt="Avatar"
            className="relative w-[56px] h-[56px] rounded-full"
          />
        </div>
        <div>
          <h2 className="text-white text-lg font-semibold">{name}</h2>
        </div>
      </div>
      <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
};
