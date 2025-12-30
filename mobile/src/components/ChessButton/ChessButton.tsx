import { FC, ButtonHTMLAttributes, PropsWithChildren } from "react";
import cn from 'classnames';

type ChessButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {

};

export const ChessButton: FC<PropsWithChildren<ChessButtonProps>> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <button
      className={
        cn(`block bg-[#4F39F6] w-full text-white font-[16px] font-semibold
            active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed
            select-none touch-manipulation ${className}`,
        { 'opacity-55': props.disabled })}
      style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
            padding: 12,
            borderRadius: '0.375rem',
            lineHeight: '24px'
      }}
      {...props}
    >
      {children}
    </button>
  );
};