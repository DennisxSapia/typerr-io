import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MobileKeyboardProps {
    onKey: (key: string) => void;
}

export function MobileKeyboard({ onKey }: MobileKeyboardProps) {
    const handleTouch = (key: string, e: React.PointerEvent) => {
        e.preventDefault();
        try {
            if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(10);
            }
        } catch (err) {}
        onKey(key);
    };

    const row1 = ['q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p'];
    const row2 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
    const row3 = ['y', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.'];

    const KeyButton = ({ char, flex = false, className = "", children, display, isSystemKey = false, flexClass = "", buttonClass = "h-[56px]" }: { char: string, flex?: boolean, className?: string, children?: React.ReactNode, display?: string, isSystemKey?: boolean, flexClass?: string, buttonClass?: string, key?: React.Key }) => {
        const [isPressed, setIsPressed] = useState(false);

        const system = isSystemKey || !!children;

        const triggerPress = (e: React.PointerEvent) => {
            setIsPressed(true);
            handleTouch(char, e);
        };

        const releasePress = () => {
            setTimeout(() => setIsPressed(false), 50); // Small delay to guarantee visual feedback visibility
        };

        return (
            <div className={`relative ${flex ? 'flex-1' : ''} ${flexClass} h-full flex flex-col justify-end`}>
                <button
                    onPointerDown={triggerPress}
                    onPointerUp={releasePress}
                    onPointerCancel={releasePress}
                    onPointerLeave={releasePress}
                    className={`
                        ${buttonClass} rounded-[6px] shadow-[0_1px_1.5px_rgba(0,0,0,0.5)]
                        text-[24px] capitalize flex items-center justify-center select-none
                        transition-colors duration-75 ease-out font-medium
                        w-full ${className}
                    `}
                    style={{ 
                        touchAction: 'none',
                        WebkitTapHighlightColor: 'transparent',
                        backgroundColor: isPressed ? (system ? '#636368' : '#e5e5ea') : (system ? '#2c2c2e' : '#4a4a4d'),
                        color: isPressed && !system ? '#000000' : '#ffffff',
                    }}
                >
                    <div className={`flex items-center justify-center ${system && isPressed ? 'opacity-80' : ''}`}>
                        {children || display || char}
                    </div>
                </button>
            </div>
        );
    };

    return (
        <div className="w-full bg-[#1c1c1e]/98 backdrop-blur-3xl border-t border-white/5 px-1.5 pt-3 pb-8 z-50 flex flex-col gap-2.5 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
            <div className="flex gap-1.5 justify-center px-0.5">
                {row1.map(char => <KeyButton key={char} char={char} flex />)}
            </div>
            <div className="flex gap-1.5 justify-center px-6">
                {row2.map(char => <KeyButton key={char} char={char} flex />)}
            </div>
            <div className="flex gap-1.5 justify-center px-6">
                {row3.map(char => <KeyButton key={char} char={char} flex />)}
            </div>
            <div className="flex gap-2 justify-center px-1 mt-2">
                <KeyButton char="ArrowLeft" flexClass="w-[28%]" buttonClass="h-[64px]" isSystemKey>
                    <ChevronLeft className="w-12 h-12 text-white" />
                </KeyButton>
                <KeyButton char=" " flexClass="flex-1" buttonClass="h-[64px]" className="text-white text-lg tracking-[0.2em]" display="SPACE" isSystemKey={false} />
                <KeyButton char="ArrowRight" flexClass="w-[28%]" buttonClass="h-[64px]" isSystemKey>
                    <ChevronRight className="w-12 h-12 text-white" />
                </KeyButton>
            </div>
        </div>
    );
}
