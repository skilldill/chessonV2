import { IonPage, IonContent, IonText, IonIcon, IonImg } from '@ionic/react';
import { ChessButton } from '../../components/ChessButton/ChessButton';
import ShareIconSVG from '../../assets/share-icon.svg';
import ShareLinkSVG from '../../assets/shared-link.svg';
import { useParams } from 'react-router';
import cn from 'classnames';
import { useState } from 'react';
import { Share } from '@capacitor/share';

const SITE_BASE_URL = import.meta.env.VITE_TEST_MODE ? 'http://localhost:' + window.location.port : import.meta.env.VITE_MAIN_SITE;

const WaitingScreen: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
      try {
          await navigator.clipboard.writeText(`${SITE_BASE_URL}/${roomId}`);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      } catch (err) {
          console.error('Failed to copy link:', err);
      }
  };

  const handleShare = async () => {
      const url =`${SITE_BASE_URL}/${roomId}`;
      
      try {
          await Share.share({
              title: 'Chess Game Invite',
              text: `Join my chess game! Room ID: ${roomId}`,
              url: url,
              dialogTitle: 'Share with friends',
          });
      } catch (err) {
          // Пользователь отменил шаринг или произошла ошибка
          // Fallback: копируем в буфер обмена
          if ((err as Error).name !== 'AbortError') {
              console.warn('Share failed, falling back to copy:', err);
              await handleCopy();
          }
      }
  };

  return (
    <IonPage>
      <IonContent>
        <div className="h-full grid grid-rows-[1fr_92px]">
          <div className="flex flex-col items-center justify-center gap-[44px]">
            <div className="w-[72px] h-[72px] flex items-center justify-center bg-black rounded-full border-[1px] border-[#364153]">
              <IonImg style={{ width: '43px', height: '43px' }} src={ShareLinkSVG} />
            </div>

            <IonText>
              <h1 
                className="text-white text-center" 
                style={{ fontSize: 30, margin: 0, fontWeight: 600 }}
              >
                Copy and send invite <br /> to friend
              </h1>
            </IonText>

            <IonText onClick={handleCopy}>
              <p 
                className="text-[#BEDBFF] active:opacity-80 select-none transition-all duration-200"
                style={{ fontSize: 20, margin: 0, fontWeight: 400 }}
              >Room's ID: {roomId}</p>
            </IonText>
          </div>
          <div className="py-[20px] px-[36px]">
            <ChessButton onClick={handleShare}>
              <div className="flex flex-1 items-center justify-center gap-[4px]">
                <IonIcon src={ShareIconSVG} />
                <span>
                  Share
                </span>
              </div>
            </ChessButton>
          </div>
        </div>

        <div className="w-full fixed bottom-0 left-0 flex justify-center items-center z-100 pointer-events-none">
          <div className={cn('flex items-center gap-[12px] border-[1px] bg-back-secondary border-[#364153] rounded-lg p-[16px] opacity-0 translate-y-[0px] transition-all duration-300', {'bounceIn': copied})}>
              <div>
                  <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M13.6853 0.152545C13.7638 0.212172 13.8298 0.286703 13.8796 0.371871C13.9293 0.45704 13.9617 0.551175 13.975 0.648889C13.9882 0.746602 13.9821 0.845976 13.957 0.941322C13.9318 1.03667 13.8881 1.12612 13.8283 1.20455L5.82829 11.7045C5.7634 11.7896 5.68106 11.8598 5.58681 11.9104C5.49256 11.961 5.38857 11.9909 5.28182 11.998C5.17508 12.0051 5.06805 11.9892 4.96792 11.9516C4.86779 11.9139 4.77688 11.8552 4.70129 11.7795L0.201292 7.27954C0.0688118 7.13737 -0.00331137 6.94932 0.000116847 6.75502C0.00354506 6.56072 0.0822571 6.37534 0.21967 6.23792C0.357083 6.10051 0.542468 6.0218 0.736769 6.01837C0.93107 6.01494 1.11912 6.08707 1.26129 6.21955L5.15529 10.1125L12.6353 0.295545C12.7557 0.137497 12.9339 0.0336733 13.1307 0.00686313C13.3276 -0.0199471 13.527 0.0324471 13.6853 0.152545Z" fill="#F3F4F6" />
                  </svg>
              </div>
              <span>Link copied!</span>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default WaitingScreen;

