import type { OAuthProvider } from "@crossmint/common-sdk-auth";
import { ChildWindow, PopupWindow } from "@crossmint/client-sdk-window";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useAuthForm } from "@/providers/auth/AuthFormProvider";
import { useCrossmintAuth } from "./useCrossmintAuth";

export const useOAuthWindowListener = (provider: OAuthProvider) => {
    const { crossmintAuth } = useCrossmintAuth();
    const { oauthUrlMap, setError } = useAuthForm();
    const [isLoading, setIsLoading] = useState(false);
    const childRef = useRef<ChildWindow<IncomingEvents, OutgoingEvents> | null>(null);

    useEffect(() => {
        if (childRef.current == null) {
            childRef.current = new ChildWindow<IncomingEvents, OutgoingEvents>(window.opener || window.parent, "*", {
                incomingEvents,
            });
        }

        return () => {
            if (childRef.current != null) {
                childRef.current.off("authMaterialFromPopupCallback");
            }
        };
    }, []);

    const createPopupAndSetupListeners = async () => {
        if (childRef.current == null) {
            throw new Error("Child window not initialized");
        }
        setIsLoading(true);
        setError(null);
        const popup = await PopupWindow.init(oauthUrlMap[provider], {
            awaitToLoad: false,
            crossOrigin: true,
            width: 400,
            height: 700,
        });

        const handleAuthMaterial = async (data: { oneTimeSecret: string }) => {
            await crossmintAuth?.handleRefreshAuthMaterial(data.oneTimeSecret);
            childRef.current?.off("authMaterialFromPopupCallback");
            popup.window.close();
            setIsLoading(false);
        };

        const handleError = (data: { error: string }) => {
            setError(data.error);
            childRef.current?.off("errorFromPopupCallback");
            popup.window.close();
            setIsLoading(false);
        };

        childRef.current.on("authMaterialFromPopupCallback", handleAuthMaterial);
        childRef.current.on("errorFromPopupCallback", handleError);
        // Add a check for manual window closure
        // Ideally we should find a more explicit way of doing this, but I think this is fine for now.
        const checkWindowClosure = setInterval(() => {
            if (popup.window.closed) {
                clearInterval(checkWindowClosure);
                setIsLoading(false);
                childRef.current?.off("authMaterialFromPopupCallback");
            }
        }, 2500); // Check every 2.5 seconds
    };

    return {
        createPopupAndSetupListeners,
        isLoading,
    };
};

const incomingEvents = {
    authMaterialFromPopupCallback: z.object({ oneTimeSecret: z.string() }),
    errorFromPopupCallback: z.object({ error: z.string() }),
};

type IncomingEvents = {
    authMaterialFromPopupCallback: typeof incomingEvents.authMaterialFromPopupCallback;
    errorFromPopupCallback: typeof incomingEvents.errorFromPopupCallback;
};

type OutgoingEvents = Record<string, never>;
