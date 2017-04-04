'use strict';
/**
 * @description Service for handling ADAL authentications
 * @method isAuthenticated
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */
require('angular')
    .module('pulsar.media')
    .service('media.GrooveAuth', [
        '$window',
        '$q',
        '$cookies',
        'simple-request.HttpConfig',
        'config.Path',
        GrooveAuth]);

function GrooveAuth($window, $q, $cookies, HttpConfig, Path){

    const AUTH_SCOPE = 'MicrosoftMediaServices.GrooveApiAccess';
    const AUTH_COOKIE_KEY = 'pulsar-groove-auth';

    var accessToken = '',
        expires = null,
        clientId = '',

        authDefer = null;

    /**
     * Save the session in a cookie that expires when the access token expires
     * @param {Object} session
     */
    function cacheLogin(session){
        $cookies.put(AUTH_COOKIE_KEY, JSON.stringify(session), session.expires);
    }

    /**
     * Restore a cached session (so we don't have re-authenticate)
     */
    function restoreCachedLogin(){
        var session = $cookies.getObject(AUTH_COOKIE_KEY);
        if(session){
            accessToken = session.accessToken;
            expires = new Date(session.expires);
            clientId = session.clientId;
        }
    }

    /**
     * Resolve a pending authentication request
     * @param resp
     */
    function resolveAuthRequest(resp){
        if(resp.error){
            authDefer.reject(decodeURIComponent(resp.error_description || resp.error));
        } else if(resp.scope === AUTH_SCOPE){
            accessToken = resp.access_token;

            var now = new Date();
            expires = new Date(now.getTime() + parseInt(resp.expires_in) * 1000);
            clientId = resp.user_id;

            cacheLogin({
                accessToken: accessToken,
                expires: expires.getTime(),
                clientId: clientId
            });

            //Resolve the auth promise
            authDefer.resolve(true);
            authDefer = null;
        }
        else {
            authDefer.reject('Invalid response scope: ' + resp.scope);
        }
    }

    this.logout = function(){
        accessToken = '';
        clientId = '';
        expires = null;
        $cookies.remove(AUTH_COOKIE_KEY);
    };

    /**
     * Invokes a popup authentication dialog for the user to authenticate
     */
    this.login = function(){
        if(authDefer !== null){
            return authDefer.promise;
        }

        if(this.isAuthenticated()){
            return $q.when(true);
        }

        authDefer = $q.defer();
        var authUrl = 'https://login.live.com/oauth20_authorize.srf',
            params = {
                client_id: '5e289711-ad30-47c4-9be8-e17a4325a143',
                redirect_uri: `${Path.base}/grooveAuthenticate.html`,
                response_type: 'token',
                scope: AUTH_SCOPE
            },
            navigateUrl = `${authUrl}?${HttpConfig.getQueryString(params)}`;

        var popupWindow = $window.open(navigateUrl, 'Microsoft Authenticate', 'height=380,width=350');
        if(popupWindow){
            popupWindow.focus();
        }

        /**
         * If the authentication defer was not already resolved when the popup closes
         * then the request failed
         */
        popupWindow.onbeforeunload = function(){
            if(authDefer !== null){
                authDefer.reject('Could not authenticate with Microsoft AD');
            }
        };

        return authDefer.promise.catch(err => {
            console.error(err);
        });
    };

    this.getAccessToken = function(){
        return accessToken;
    };

    this.getClientId = function(){
        return clientId;
    };

    /**
     * Indicates if the service currently has a valid access token
     * @returns {boolean}
     */
    this.isAuthenticated = function(){
        return accessToken && expires && expires.getTime() > (new Date()).getTime();
    };

    function handleMessage(event){
        var origin = event.origin || event.originalEvent.origin;
        if(origin !== $window.location.origin){
            return;
        }

        if(event.data._message === 'grooveAuth' && authDefer !== null){
            resolveAuthRequest(event.data);
        }
    }

    restoreCachedLogin();

    $window.addEventListener('message', handleMessage);
}