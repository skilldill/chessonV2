import { useEffect, useRef, useState } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCreateRoom } from '../../hooks/useCreateRoom';
import { parseFriendGameSettings } from '../../utils/friendGameEntry';
import { parseBotGameSettings } from '../../utils/botGameEntry';
import { setRoomTimeSettingsToStorage } from '../../utils/roomTimeStorage';

export const GameEntryScreen = ({ mode = 'friend' }: { mode?: 'friend' | 'bot' }) => {
    const { t } = useTranslation();
    const history = useHistory();
    const location = useLocation();
    const [settings] = useState(() => mode === 'bot'
        ? parseBotGameSettings(location.search)
        : parseFriendGameSettings(location.search));
    const [attempt, setAttempt] = useState(0);
    const { createRoom, roomCreatingError, isCreating } = useCreateRoom();
    const creation = useRef<Promise<string | undefined> | null>(null);

    useEffect(() => {
        if (!settings) return;
        let active = true;
        const params = new URLSearchParams(location.search);
        params.set('requestId', settings.requestId);
        if (params.toString() !== location.search.slice(1)) {
            history.replace({ pathname: location.pathname, search: params.toString() });
        }
        // Reattach to the same request when React replays the effect.
        if (!creation.current) {
            creation.current = createRoom(settings, { navigate: false });
        }
        void creation.current.then((roomId) => {
            if (!active || !roomId) return;
            try {
                localStorage.removeItem('gameData');
                localStorage.removeItem('quickPlayRoomId');
                if (mode === 'friend') setRoomTimeSettingsToStorage(settings.timeMinutes, settings.incrementSeconds);
            } catch {
                // Saving preferences must not block entry into the created room.
            }
            history.replace(`/game/${roomId}`);
        });
        return () => { active = false; };
    }, [settings, mode, attempt, createRoom, history, location.pathname, location.search]);

    const retry = () => {
        creation.current = null;
        setAttempt((value) => value + 1);
    };
    const hasError = !settings || !!roomCreatingError;

    return (
        <main className="min-h-screen flex flex-col items-center justify-center gap-5 px-6 text-white bg-[#050507]">
            {hasError ? (
                <>
                    <p role="alert" className="max-w-md text-center text-lg">
                        {t(settings ? 'room.friendCreationError' : 'room.invalidFriendSettings')}
                    </p>
                    {settings && (
                        <button type="button" onClick={retry} disabled={isCreating}
                            className="px-5 py-3 rounded-md bg-white text-black font-semibold disabled:opacity-50">
                            {t('puzzles.retry')}
                        </button>
                    )}
                    <Link className="underline" to="/create-room">{t('room.friendSettings')}</Link>
                </>
            ) : (
                <p role="status" className="text-lg">{t('room.friendCreating')}</p>
            )}
        </main>
    );
};
