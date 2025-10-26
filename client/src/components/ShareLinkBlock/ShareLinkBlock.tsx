import { useState, type FC } from "react";

type ShareLinkBlockProps = {
    link: string;
}

export const ShareLinkBlock: FC<ShareLinkBlockProps> = ({ link }) => {
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
        <div className="w-[472px] h-[452px] flex flex-col items-center py-12 gap-12">
            <h3 className="text-3xl font-semibold transition-all duration-400">
                Copy and send invite to friend
            </h3>
            <input
                type="text"
                value={link}
                readOnly
                className="w-[300px] h-[40px] px-[12px] py-[10px] rounded-md focus:outline-none transition-all duration-200"
                style={{
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.08)'
                }}
            />
            <button 
                onClick={handleCopy}
                className="rounded-md text-sm font-semibold px-4 py-2 bg-[#4F39F6] text-white min-w-[126px] cursor-pointer transition-all duration-300 active:scale-95"
            >
                {copied ? 'Copied!' : 'Share link'}
            </button>
        </div>
        
    );
};

