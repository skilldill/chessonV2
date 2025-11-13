import { useState, type FC } from "react";
import SharedLinkSVG from "../../assets/shared-link.svg";
import cn from "classnames";

type ShareLinkBlockProps = {
    link: string;
    onClose: () => void;
}

export const ShareLinkBlock: FC<ShareLinkBlockProps> = ({ link, onClose }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    };

    return (
        <>
            <div className="relative w-[430px] h-[380px] fadeIn">
                <div className="flex h-[80px] absolute  z-100 left-[0px] right-[0px] top-[-40px] justify-center select-none">
                    <div className="w-[80px] h-[80px] rounded-full bg-back-primary border-[1px] border-[#364153] flex items-center justify-center">
                        <img src={SharedLinkSVG} alt="Shared Link" className="w-[48px] h-[48px] select-none" />
                    </div>
                </div>
                <div className="w-[430px] h-[380px] relative rounded-xl border-[1px] border-[#364153] rounded-3xl overflow-hidden select-none">

                    <div className="w-[284px] h-[284px] rounded-full absolute top-[-142px] left-[-84px] bg-[#4F39F6] z-30 blur-[200px]" />

                    <div className="w-full h-full flex flex-col items-center absolute top-0 left-0 gap-[48px] z-40 px-[52px] py-[32px]">
                        <h3 className="text-white text-center text-3xl font-semibold">
                            Copy and send invite <br /> to friend
                        </h3>

                        <input
                            type="text"
                            value={link}
                            disabled
                            placeholder="Link"
                            className="bg-white/4 w-full h-[40px] px-[12px] py-[10px] border border-white/10 border-solid rounded-md focus:border-indigo-700 focus:outline-none transition-all duration-200 pr-10 placeholder-[#99A1AF]"
                        />

                        <button
                            className="rounded-md text-sm font-semibold px-4 py-2 bg-[#4F39F6] text-white min-w-[126px] cursor-pointer transition-all duration-300 active:scale-95 focus:outline-none"
                            onClick={handleCopy}
                        >
                            Copy link
                        </button>
                    </div>
                </div>
            </div>

            <div className="w-full fixed bottom-0 left-0 flex justify-center items-center z-100">
                <div className={cn('flex items-center gap-[12px] border-[1px] bg-back-secondary border-[#364153] rounded-lg p-[16px] opacity-0 translate-y-[0px] transition-all duration-300', {'bounceIn': copied})}>
                    <div>
                        <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M13.6853 0.152545C13.7638 0.212172 13.8298 0.286703 13.8796 0.371871C13.9293 0.45704 13.9617 0.551175 13.975 0.648889C13.9882 0.746602 13.9821 0.845976 13.957 0.941322C13.9318 1.03667 13.8881 1.12612 13.8283 1.20455L5.82829 11.7045C5.7634 11.7896 5.68106 11.8598 5.58681 11.9104C5.49256 11.961 5.38857 11.9909 5.28182 11.998C5.17508 12.0051 5.06805 11.9892 4.96792 11.9516C4.86779 11.9139 4.77688 11.8552 4.70129 11.7795L0.201292 7.27954C0.0688118 7.13737 -0.00331137 6.94932 0.000116847 6.75502C0.00354506 6.56072 0.0822571 6.37534 0.21967 6.23792C0.357083 6.10051 0.542468 6.0218 0.736769 6.01837C0.93107 6.01494 1.11912 6.08707 1.26129 6.21955L5.15529 10.1125L12.6353 0.295545C12.7557 0.137497 12.9339 0.0336733 13.1307 0.00686313C13.3276 -0.0199471 13.527 0.0324471 13.6853 0.152545Z" fill="#F3F4F6" />
                        </svg>
                    </div>
                    <span>Link copied!</span>
                </div>
            </div>
        </>
    )
};

