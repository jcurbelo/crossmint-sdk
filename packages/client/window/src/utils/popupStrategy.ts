interface CreatePopupService {
    getTop(height: number): number;
    getLeft(width: number): number;
}

export class CreatePopupStrategy {
    protected createPopupService: CreatePopupService;

    constructor() {
        this.createPopupService = this.isCrossmintOrigin()
            ? new CrossmintPopupService()
            : new CrossOriginPopupService();
    }

    private isCrossmintOrigin(): boolean {
        try {
            const url = new URL(window.location.origin);
            return url.hostname.endsWith("crossmint.com");
        } catch (e) {
            console.error("Invalid URL", e);
            return false;
        }
    }

    getTop(height: number): number {
        return this.createPopupService.getTop(height);
    }

    getLeft(width: number): number {
        return this.createPopupService.getLeft(width);
    }
}

class CrossOriginPopupService implements CreatePopupService {
    getTop(height: number): number {
        return (screen.height - height) / 2;
    }
    getLeft(width: number): number {
        return (screen.width - width) / 2;
    }
}

class CrossmintPopupService implements CreatePopupService {
    getTop(height: number): number {
        return window?.top != null
            ? window.top.outerHeight / 2 + window.top.screenY - height / 2
            : window.outerHeight / 2 + window.screenY - height / 2;
    }
    getLeft(width: number): number {
        return window?.top != null
            ? window.top.outerWidth / 2 + window.top.screenX - width / 2
            : window.outerWidth / 2 + window.screenX - width / 2;
    }
}
