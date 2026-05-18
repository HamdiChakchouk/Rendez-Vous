import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

// On génère l'URI de redirection pour l'application Expo (qui fonctionnera dans Expo Go et dans les builds autonomes)
const redirectTo = makeRedirectUri();

export const createSessionFromUrl = async (url: string) => {
    const { params, errorCode } = QueryParams.getQueryParams(url);

    if (errorCode) throw new Error(errorCode);
    const { access_token, refresh_token } = params;

    if (!access_token || !refresh_token) return null;

    const { data, error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
    });
    
    if (error) throw error;
    return data.session;
};

export const signInWithProvider = async (provider: 'google' | 'facebook') => {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo,
                skipBrowserRedirect: true,
            },
        });
        
        if (error) throw error;

        if (data?.url) {
            const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
            if (res.type === 'success') {
                const { url } = res;
                return await createSessionFromUrl(url);
            }
        }
        return null;
    } catch (err) {
        console.error(`[OAuth ${provider}] Error:`, err);
        throw err;
    }
};
