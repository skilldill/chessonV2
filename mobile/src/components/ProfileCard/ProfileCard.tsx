import { useHistory } from 'react-router-dom';
import { useProfileData } from '../../hooks/useProfileData';
import { MEM_AVATARS } from '../../constants/avatars';

export const ProfileCard: React.FC = () => {
  const history = useHistory();
  const { name, avatarIndex, loading } = useProfileData();

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center px-4 py-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#4F39F6] border-t-transparent" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => history.push('/profile')}
      className="btn-client btn-client-preset w-full min-h-[72px] rounded-xl"
    >
      <div className="flex items-center justify-between px-[8px]">
        <div className="flex items-center gap-[14px]">
          <img
            src={MEM_AVATARS[avatarIndex]}
            alt="Avatar"
            className="relative w-[52px] h-[52px] rounded-full"
          />
          <p className="text-white text-lg font-semibold">{name}</p>
        </div>
        <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
};
