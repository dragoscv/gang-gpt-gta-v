'use client';

import { useState, useCallback } from 'react';

interface ClientStatus {
    clientInstalled: boolean;
    clientPath: string | null;
    downloadUrl: string;
    serverAddress: string;
}

interface LaunchResponse {
    success: boolean;
    message: string;
    serverAddress?: string;
    clientPath?: string;
    error?: string;
    downloadUrl?: string;
    instructions?: string[];
}

export function useRageMP() {
    const [isLaunching, setIsLaunching] = useState(false);
    const [clientStatus, setClientStatus] = useState<ClientStatus | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [launchInstructions, setLaunchInstructions] = useState<string[]>([]);

    const checkClientStatus = useCallback(async (): Promise<ClientStatus | null> => {
        try {
            const response = await fetch('/api/game/client-status');
            const data = await response.json();

            if (data.success) {
                setClientStatus(data);
                setError(null);
                return data;
            } else {
                setError(data.error || 'Failed to check client status');
                return null;
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Network error';
            setError(errorMessage);
            return null;
        }
    }, []);

    const launchClient = useCallback(async (): Promise<boolean> => {
        setIsLaunching(true);
        setError(null);
        setLaunchInstructions([]);

        try {
            const response = await fetch('/api/game/launch-client', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data: LaunchResponse = await response.json();

            if (data.success) {
                setError(null);
                setLaunchInstructions(data.instructions || []);

                // Show success message temporarily
                setTimeout(() => {
                    setIsLaunching(false);
                }, 5000);

                return true;
            } else {
                setError(data.message || data.error || 'Failed to launch client');
                setIsLaunching(false);
                return false;
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Network error';
            setError(errorMessage);
            setIsLaunching(false);
            return false;
        }
    }, []);

    const downloadClient = useCallback(() => {
        window.open('https://rage.mp/', '_blank');
    }, []);
    return {
        isLaunching,
        clientStatus,
        error,
        launchInstructions,
        checkClientStatus,
        launchClient,
        downloadClient,
    };
}
