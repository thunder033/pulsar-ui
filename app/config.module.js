'use strict';
/**
 * Created by Greg on 12/10/2016.
 */
const ADT = require('./app.dependency-tree').ADT;

ADT.config = {
    Env: 'config.Env',
    Path: 'config.Path'
};

const config = require('angular')
    .module('config', []);

const Environment = {
    'DEV': 'dev',
    'STAGE': 'stage',
    'PROD': 'prod',
};

config.constant(ADT.config.Env, (()=>{
    const host = location.href;
    if(host.indexOf('localhost') > -1){
        return Environment.DEV;
    } else if(host.indexOf('stage') > -1){
        return Environment.STAGE;
    } else {
        return Environment.PROD;
    }
})());

/**
 * @description provides configured path values for different resources
 * @class config.Path
 *  @property api - base api for pulsar media api endpoints
 *  @property appPath
 *  @property scriptModifier
 *  @property relativeBase
 *  @property warpApi
 *  @property protocol
 */
config.provider(ADT.config.Path, [
    ADT.config.Env,
    PathProvider
]);

function PathProvider(Env) {

    function getPathBase(env){
        switch(env){
            case Environment.DEV: return '/pulsar-ui';
            case Environment.STAGE: return '/pulsar-stage';
            case Environment.PROD: return '/pulsar';
        }
    }

    function getScriptModifier(env){
        switch(env){
            case Environment.DEV: return '';
            case Environment.STAGE:
            case Environment.PROD: return '.min';
        }
    }

    const protocol = Env === Environment.DEV ? 'http://' : 'https://';
    function getWarpApiPath(env) {
        switch (env) {
            case Environment.DEV: return  `${protocol}localhost:3000`;
            case Environment.STAGE: return `${protocol}pulsar-api-stage.herokuapp.com`;
            case Environment.PROD: return `${protocol}pulsar-api.herokuapp.com`;
        }
    }

    const paths = {
        protocol: protocol,
        host: Env === Environment.DEV ? `${protocol}localhost:63342` : `${protocol}thunderlab.net`,
        appPath: getPathBase(Env),
        api: `${protocol}thunderlab.net/pulsar-media/api`,
        scriptModifier: getScriptModifier(Env),
        relativeBase: '../',
        warpApi: getWarpApiPath(Env),

        forScript(name){return `${this.dist}/${name}${this.scriptModifier}.js`;},
        get base(){return this.host + this.appPath;},
        get dist(){return this.base + '/dist';}
    };

    this.addPath = function(name, value){
        paths[name] = value;
    };

    this.$get = [function pathFactory(){
        return paths;
    }];

}

module.exports = config;