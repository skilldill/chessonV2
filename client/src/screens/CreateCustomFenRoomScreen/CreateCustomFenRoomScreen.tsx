import { useState } from "react";
import { useHistory } from "react-router-dom";
import { API_PREFIX } from "../../constants/api";
import { INITIAL_FEN } from "../../constants/chess";

export const CreateCustomFenRoomScreen = () => {
    const history = useHistory();

    const [customFEN, setCustomFEN] = useState(INITIAL_FEN);
    const [selectedColor, setSelectedColor] = useState<"white" | "black" | undefined>(undefined);

    const [isCreating, setIsCreating] = useState(false);

    const handleClose = () => {
        window.location.href = import.meta.env.VITE_MAIN_SITE;
    };

    const handleChangeCustomFEN = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCustomFEN(event.currentTarget.value);
    }

    const createRoom = async () => {
        try {
            setIsCreating(true);

            const requestBody: { currentFEN: string; color?: "white" | "black" } = {
                currentFEN: customFEN,
            };
            
            if (selectedColor) {
                requestBody.color = selectedColor;
            }

            const response = await fetch(API_PREFIX + '/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error('Failed to create room');
            }

            const data = await response.json();

            if (data.success && data.roomId) {
                // Редирект на созданную комнату
                history.push(`/game/${data.roomId}`);
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (err) {
            console.error('Error creating room:', err);
            setIsCreating(false);
        }
    };

    // useEffect(() => {
    //     createRoom();
    // }, [history]);

    return (
        <div className="w-full h-[100vh] flex justify-center items-center">
            {isCreating ? (
                <p>Creating room...</p>
            ) : (
                <div className="w-[432px] h-[520px] relative rounded-xl border-[1px] border-[#364153] rounded-3xl overflow-hidden select-none fadeIn">
                    <div className="w-[348px] h-[348px] rounded-full absolute top-[-174px] left-[-104px] bg-[#155DFC] z-30 blur-[200px]" />
                    
                    <div className="w-full h-full flex flex-col items-center absolute top-0 left-0 gap-[32px] z-40 py-[32px]">
                        <div className="w-full flex justify-end px-[32px]">
                            <button 
                                type="button"
                                aria-label="Close"
                                className="w-[24px] h-[24px] flex items-center justify-center bg-transparent border-none p-0 m-0 cursor-pointer active:scale-95 active:opacity-80 transition-all duration-300"
                                style={{ outline: "none" }}
                                onClick={handleClose}
                            >
                                <svg 
                                    width="16" 
                                    height="16" 
                                    viewBox="0 0 13.5 13.5" 
                                    fill="none" 
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <line 
                                        x1="2" y1="2" x2="11.5" y2="11.5" 
                                        stroke="white" 
                                        strokeWidth="2"
                                        strokeLinecap="round" 
                                    />
                                    <line 
                                        x1="2" y1="11.5" x2="11.5" y2="2" 
                                        stroke="white" 
                                        strokeWidth="2"
                                        strokeLinecap="round" 
                                    />
                                </svg>
                            </button>
                        </div>

                        <h3 className="text-white text-center text-3xl font-semibold">
                            Input custom FEN
                        </h3>
                        
                        <div className="flex flex-col gap-3">
                            <label className="text-white/80 text-sm font-medium">
                                Choose your color (or random)
                            </label>
                            <div className="flex gap-3">
                                {/* White button */}
                                <button
                                    type="button"
                                    onClick={() => setSelectedColor("white")}
                                    className={`flex-1 h-[48px] rounded-md border-2 transition-all duration-200 active:scale-95 focus:outline-none ${
                                        selectedColor === "white"
                                            ? "bg-white text-black border-white"
                                            : "bg-white/10 text-white border-white/30 hover:border-white/50"
                                    }`}
                                >
                                    <span className="font-semibold">White</span>
                                </button>
                                
                                {/* Black button */}
                                <button
                                    type="button"
                                    onClick={() => setSelectedColor("black")}
                                    className={`flex-1 h-[48px] rounded-md border-2 transition-all duration-200 active:scale-95 focus:outline-none ${
                                        selectedColor === "black"
                                            ? "bg-black text-white border-white"
                                            : "bg-white/10 text-white border-white/30 hover:border-white/50"
                                    }`}
                                >
                                    <span className="font-semibold">Black</span>
                                </button>

                                {/* Random button (black and white) */}
                                <button
                                    type="button"
                                    onClick={() => setSelectedColor(undefined)}
                                    className={`h-[48px] rounded-md border-2 transition-all duration-200 active:scale-95 focus:outline-none relative overflow-hidden ${
                                        selectedColor === undefined
                                            ? "border-white"
                                            : "border-white/30 hover:border-white/50"
                                    }`}
                                >
                                    <span className={`relative z-10 font-semibold flex items-center justify-center h-full ${
                                        selectedColor === undefined 
                                            ? "text-black drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]" 
                                            : "text-white/90"
                                    }`}>
                                        Random
                                    </span>
                                </button>
                            </div>
                        </div>
                        
                        <form onSubmit={(event) => event.preventDefault()}>
                            <div className="relative w-[328px]">
                                <input
                                    type="text"
                                    placeholder="Custom FEN"
                                    value={customFEN}
                                    onChange={handleChangeCustomFEN}
                                    className="bg-white/4 w-full h-[40px] px-[12px] py-[10px] border border-white/10 border-solid rounded-md focus:border-indigo-700 focus:outline-none transition-all duration-200 pr-10 placeholder-[#99A1AF]"
                                />
                            </div>
                        </form>

                        <button 
                            className="rounded-md text-sm font-semibold px-4 py-2 bg-[#4F39F6] text-white min-w-[126px] cursor-pointer transition-all duration-300 active:scale-95 focus:outline-none"
                            onClick={createRoom}
                        >
                            Create room
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

