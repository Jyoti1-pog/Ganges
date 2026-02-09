import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBannerProps {
    message?: string;
    onRetry?: () => void;
}

export function ErrorBanner({ message = "Something went wrong. Please try again.", onRetry }: ErrorBannerProps) {
    return (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1">
                <h4 className="text-sm font-bold text-red-900">Unable to load data</h4>
                <p className="text-sm text-red-700 mt-1">{message}</p>
                {onRetry && (
                    <Button
                        variant="link"
                        size="sm"
                        className="text-red-800 font-bold px-0 h-auto mt-2 hover:no-underline hover:text-red-900 p-0"
                        onClick={onRetry}
                    >
                        <RefreshCw className="w-3 h-3 mr-1.5" /> Retry
                    </Button>
                )}
            </div>
        </div>
    );
}
