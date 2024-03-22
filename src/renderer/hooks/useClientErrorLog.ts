import log from 'electron-log';
import { useEffect } from 'react';

export const onRejectionhandled = (event: PromiseRejectionEvent) => {
    log.error('rejectionhandled', { reason: event.reason });
}

export const onWindowError = (event: ErrorEvent) => {
    const { message, colno, lineno, filename } = event;
    log.error('window error', { message, colno, lineno, filename });
}

export const useClientErrorLog = () => {

    useEffect(() => {
        window.addEventListener('error', onWindowError);
        window.addEventListener('rejectionhandled', onRejectionhandled, false);

        return () => {
            window.removeEventListener('error', onWindowError);
            window.removeEventListener('rejectionhandled', onRejectionhandled, false);
        }
    }, []);
    
}
