'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useRageMP } from '@/hooks/use-ragemp';
import {
    Play,
    Download,
    AlertCircle,
    Gamepad2,
    CheckCircle,
    Zap,
    Wifi,
    Loader2,
    Rocket,
    Signal,
    Shield,
    Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RageLauncherProps {
    className?: string;
    size?: 'sm' | 'lg' | 'default';
    variant?: 'default' | 'gang' | 'neon';
}

type LaunchPhase = 'idle' | 'launching' | 'connecting' | 'connected' | 'error';

export function RageLauncher({
    className,
    size = 'lg',
    variant = 'gang'
}: RageLauncherProps) {
    const {
        isLaunching,
        clientStatus,
        error,
        checkClientStatus,
        launchClient,
        downloadClient
    } = useRageMP();

    const [mounted, setMounted] = useState(false);
    const [launchPhase, setLaunchPhase] = useState<LaunchPhase>('idle');
    const [connectionProgress, setConnectionProgress] = useState(0);
    const [serverStatusText, setServerStatusText] = useState('');
    const [showParticles, setShowParticles] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        setMounted(true);
        checkClientStatus();
    }, [checkClientStatus]);

    // Enhanced connection progress simulation with realistic steps
    useEffect(() => {
        if (launchPhase === 'launching') {
            setServerStatusText('Starting RAGE:MP...');
            setShowParticles(true);

            const steps = [
                { progress: 15, text: 'Loading updater.exe...', delay: 300 },
                { progress: 35, text: 'Checking for updates...', delay: 800 },
                { progress: 55, text: 'Initializing client...', delay: 600 },
                { progress: 80, text: 'Preparing connection...', delay: 500 },
                { progress: 90, text: 'Launching GTA V...', delay: 700 }
            ];

            steps.forEach((step, index) => {
                setTimeout(() => {
                    setConnectionProgress(step.progress);
                    setServerStatusText(step.text);

                    if (index === steps.length - 1) {
                        setTimeout(() => {
                            setLaunchPhase('connecting');
                            setServerStatusText('Connecting to GangGPT Server...');
                        }, step.delay);
                    }
                }, index * 400);
            });

        } else if (launchPhase === 'connecting') {
            setServerStatusText('Establishing connection...');

            const connectionSteps = [
                { progress: 92, text: 'Authenticating...', delay: 400 },
                { progress: 96, text: 'Loading world state...', delay: 600 },
                { progress: 100, text: 'Connected to Los Santos!', delay: 500 }
            ];

            connectionSteps.forEach((step, index) => {
                setTimeout(() => {
                    setConnectionProgress(step.progress);
                    setServerStatusText(step.text);

                    if (index === connectionSteps.length - 1) {
                        setTimeout(() => {
                            setLaunchPhase('connected');
                            setServerStatusText('Welcome to GangGPT!');
                            setTimeout(() => {
                                setLaunchPhase('idle');
                                setConnectionProgress(0);
                                setServerStatusText('');
                                setShowParticles(false);
                            }, 4000);
                        }, step.delay);
                    }
                }, index * 600);
            });
        }
    }, [launchPhase]);

    const handleLaunch = async () => {
        if (!clientStatus?.clientInstalled) {
            downloadClient();
            return;
        }

        // Play launch sound effect (if audio available)
        try {
            if (audioRef.current) {
                audioRef.current.play().catch(() => {
                    // Ignore audio errors
                });
            }
        } catch {
            // Ignore audio errors
        }

        setLaunchPhase('launching');
        setConnectionProgress(10);

        const success = await launchClient();
        if (success) {
            console.log('🎮 RAGE:MP launching and connecting to GangGPT server...');
        } else {
            setLaunchPhase('error');
            setServerStatusText('Failed to launch game');
            setTimeout(() => {
                setLaunchPhase('idle');
                setConnectionProgress(0);
                setServerStatusText('');
                setShowParticles(false);
            }, 4000);
        }
    }; if (!mounted) {
        return (
            <Button
                size={size}
                variant={variant}
                disabled
                className={cn('opacity-50', className)}
            >
                <Gamepad2 className="mr-2 h-5 w-5" />
                Loading...
            </Button>
        );
    }

    const isClientInstalled = clientStatus?.clientInstalled ?? false;
    const isActive = launchPhase !== 'idle';

    const getButtonContent = () => {
        switch (launchPhase) {
            case 'launching':
                return (
                    <div className="flex items-center">
                        <Rocket className="mr-2 h-5 w-5 animate-bounce" />
                        <span className="font-bold">Launching Game...</span>
                        <div className="ml-2 flex space-x-1">
                            <div className="w-1 h-4 bg-white/60 animate-pulse" style={{ animationDelay: '0s' }}></div>
                            <div className="w-1 h-4 bg-white/60 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-1 h-4 bg-white/60 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                );
            case 'connecting':
                return (
                    <div className="flex items-center">
                        <Signal className="mr-2 h-5 w-5 animate-ping" />
                        <span className="font-bold">Connecting to Server...</span>
                        <Wifi className="ml-2 h-4 w-4 animate-pulse" />
                    </div>
                );
            case 'connected':
                return (
                    <div className="flex items-center">
                        <Shield className="mr-2 h-5 w-5 animate-connect-pulse" />
                        <span className="font-bold">Connected Successfully!</span>
                        <Target className="ml-2 h-4 w-4 animate-spin" />
                    </div>
                );
            case 'error':
                return (
                    <div className="flex items-center">
                        <AlertCircle className="mr-2 h-5 w-5 animate-shake" />
                        <span className="font-bold">Connection Failed</span>
                    </div>
                );
            default:
                if (!isClientInstalled) {
                    return (
                        <div className="flex items-center">
                            <Download className="mr-2 h-5 w-5" />
                            <span className="font-bold">Download RAGE:MP</span>
                            <div className="ml-2 text-xs opacity-70">(Required)</div>
                        </div>
                    );
                }
                return (
                    <div className="flex items-center">
                        <Play className="mr-2 h-6 w-6" />
                        <span className="font-bold text-lg">LAUNCH GAME</span>
                        <Zap className="ml-2 h-5 w-5 opacity-80 animate-neon-flicker" />
                    </div>
                );
        }
    };

    const getButtonStyles = () => {
        const baseStyles = "relative overflow-hidden transition-all duration-500 font-bold text-lg shadow-2xl border-2 group transform-gpu";

        switch (launchPhase) {
            case 'launching':
                return cn(
                    baseStyles,
                    "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 border-blue-400",
                    "shadow-blue-500/60 animate-gaming-bounce",
                    "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent",
                    "before:translate-x-[-100%] before:animate-shimmer",
                    "after:absolute after:inset-0 after:bg-gradient-to-r after:from-blue-400/20 after:to-purple-400/20 after:animate-pulse"
                );
            case 'connecting':
                return cn(
                    baseStyles,
                    "bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 border-yellow-400",
                    "shadow-yellow-500/60 animate-pulse",
                    "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent",
                    "before:translate-x-[-100%] before:animate-shimmer",
                    "animate-gaming-bounce"
                );
            case 'connected':
                return cn(
                    baseStyles,
                    "bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 border-green-400",
                    "shadow-green-500/70 scale-105 animate-connect-pulse",
                    "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent",
                    "before:translate-x-[-100%] before:animate-shimmer"
                );
            case 'error':
                return cn(
                    baseStyles,
                    "bg-gradient-to-r from-red-600 via-red-700 to-red-800 border-red-400",
                    "shadow-red-500/60 animate-shake"
                );
            default:
                return cn(
                    baseStyles,
                    "bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 border-purple-400",
                    "hover:from-purple-500 hover:via-pink-500 hover:to-red-500",
                    "hover:scale-105 hover:shadow-purple-500/70 hover:border-pink-400",
                    "active:scale-95 transform-gpu",
                    "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
                    "before:translate-x-[-100%] group-hover:before:animate-shimmer",
                    "after:absolute after:inset-0 after:bg-gradient-to-r after:from-purple-400/10 after:to-pink-400/10",
                    "hover:after:from-purple-400/20 hover:after:to-pink-400/20",
                    !isClientInstalled && "from-orange-600 to-red-600 border-orange-400 hover:from-orange-500 hover:to-red-500",
                    isClientInstalled && "animate-glow-pulse"
                );
        }
    };
    return (
        <div className="flex flex-col items-center gap-6">
            {/* Audio element for launch sound effect */}
            <audio ref={audioRef} preload="auto" className="hidden">
                <source src="/sounds/launch-sound.mp3" type="audio/mpeg" />
                <source src="/sounds/launch-sound.wav" type="audio/wav" />
            </audio>

            {/* Main Launch Button Container */}
            <div className="relative">
                {/* Particle effects background */}
                {showParticles && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "absolute w-1 h-1 bg-white rounded-full opacity-80",
                                    "animate-ping"
                                )}
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 2}s`,
                                    animationDuration: `${1 + Math.random()}s`
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Main Launch Button */}
                <Button
                    size={size}
                    onClick={handleLaunch}
                    disabled={isActive || isLaunching}
                    className={cn(
                        getButtonStyles(),
                        "px-10 py-6 min-w-[280px] text-white relative z-10",
                        "border-4 rounded-xl font-black text-xl tracking-wide",
                        className
                    )}
                >
                    {getButtonContent()}
                </Button>

                {/* Enhanced Gaming Glow Effect */}
                <div className={cn(
                    "absolute inset-0 rounded-xl blur-2xl opacity-40 -z-10 transition-all duration-700",
                    launchPhase === 'launching' && "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-gaming-bounce",
                    launchPhase === 'connecting' && "bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 animate-pulse scale-110",
                    launchPhase === 'connected' && "bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 animate-connect-pulse scale-125",
                    launchPhase === 'error' && "bg-red-500 animate-shake",
                    launchPhase === 'idle' && isClientInstalled && "bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:scale-110 hover:opacity-60",
                    launchPhase === 'idle' && !isClientInstalled && "bg-gradient-to-r from-orange-500 to-red-500"
                )} />

                {/* Secondary outer glow */}
                <div className={cn(
                    "absolute inset-0 rounded-xl blur-3xl opacity-20 -z-20 transition-all duration-1000",
                    launchPhase === 'launching' && "bg-blue-400 scale-150 animate-pulse",
                    launchPhase === 'connecting' && "bg-yellow-400 scale-160 animate-ping",
                    launchPhase === 'connected' && "bg-green-400 scale-175",
                    launchPhase === 'error' && "bg-red-400 scale-125",
                    launchPhase === 'idle' && isClientInstalled && "bg-purple-400 hover:scale-150",
                    launchPhase === 'idle' && !isClientInstalled && "bg-orange-400"
                )} />

                {/* Enhanced Progress Bar */}
                {(launchPhase === 'launching' || launchPhase === 'connecting') && (
                    <div className="absolute -bottom-2 left-0 right-0 h-2 bg-black/40 rounded-full overflow-hidden border border-white/20">
                        <div
                            className={cn(
                                "h-full transition-all duration-300 ease-out relative",
                                "bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400",
                                "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent",
                                "before:animate-shimmer"
                            )}
                            style={{ width: `${connectionProgress}%` }}
                        />
                        <div className="absolute top-0 right-2 text-xs text-white/80 font-mono">
                            {connectionProgress.toFixed(0)}%
                        </div>
                    </div>
                )}

                {/* Connection status text */}
                {serverStatusText && (
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        <div className="text-sm text-white/90 font-medium animate-fade-in bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                            {serverStatusText}
                        </div>
                    </div>
                )}
            </div>

            {/* Enhanced Status Indicator */}
            {mounted && (
                <div className="flex items-center gap-3 text-base">
                    {isClientInstalled ? (
                        <div className="flex items-center gap-2 text-green-400 animate-fade-in">
                            <div className="relative">
                                <CheckCircle className="h-5 w-5" />
                                <div className="absolute inset-0 h-5 w-5 bg-green-400/30 rounded-full animate-ping" />
                            </div>
                            <span className="font-semibold">RAGE:MP Ready</span>
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-yellow-400 animate-fade-in">
                            <AlertCircle className="h-5 w-5 animate-bounce" />
                            <span className="font-semibold">RAGE:MP Required</span>
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                        </div>
                    )}
                </div>
            )}

            {/* Enhanced Error Display */}
            {error && (
                <div className="text-red-400 text-base max-w-md text-center animate-fade-in">
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 backdrop-blur-sm">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <AlertCircle className="h-5 w-5 animate-shake" />
                            <span className="font-bold">Connection Error</span>
                        </div>
                        <div className="text-sm opacity-90">{error}</div>
                    </div>
                </div>
            )}

            {/* Enhanced Server Info */}
            {clientStatus && (
                <div className="text-white/60 text-sm text-center animate-fade-in">
                    <div className="bg-black/20 border border-white/10 rounded-lg px-4 py-2 backdrop-blur-sm">
                        <div className="flex items-center gap-2 justify-center">
                            <Signal className="h-4 w-4" />
                            <span>Server: <span className="text-white/80 font-mono">{clientStatus.serverAddress}</span></span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
