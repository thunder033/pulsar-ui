/**
 * Created by Greg on 11/27/2016.
 */
'use strict';
var request = require('request');

var circleCIToken = process.env.ArtifactToken || 'test', //Token for Circle CI
    buildNum = 'latest';

/**
 * Determines if there is an error, outputting it to the console and exiting
 * @param err
 * @returns {boolean}
 */
function logError(err){
    if(err){
        console.error('Deployment Failed: ' + (err.message || err));
        process.exit(1);
    }

    return false;
}

/**
 * Shallow copy the properties of the source to the destination
 * @param {Object} source
 * @param {Object} dest
 */
function copyObj(source, dest){
    Object.keys(source).forEach(key => dest[key] = source[key]);
}

/**
 * Find an artifact by name in a CirceCI API response
 * @param {Array<Object>} artifacts: list of returned artifacts from CCI
 * @param {string} artifactName: Name of the artifact to search for
 * @param {Object} artifactOut: An empty object to output artifact properties on
 * @returns {boolean|Array}
 */
function getArtifact(artifacts, artifactName, artifactOut) {
    return artifacts.some(artifact => {
        if(artifact.path.indexOf(artifactName) > -1){
            copyObj(artifact, artifactOut);
            return true;
        }

        return false;
    });
}

/**
 * Get the artifact for the build and deploy if it's found
 */
function getArtifactID(){
    //Path for getting build artifacts
    var apiBase = 'https://circleci.com/api/v1.1/project/';
    var queryURI = `${apiBase}github/thunder033/RMWA/${buildNum}/artifacts?circle-token=${circleCIToken}`;

    request.get(queryURI, {headers: {'Accept': 'application/json'}}, function(err, response, body){

        if(!logError(err)){
            var artifacts = JSON.parse(body),
                artifact = {},
                artifactName = 'dist.tar';
            if(getArtifact(artifacts, artifactName, artifact)){
                //If we found the artifact, trigger the deploy
                triggerDeploy(artifact);
            }
            else logError(`Artifact ${artifactName} was not found for build ${buildNum}`);
        }
    });
}

/**
 * Trigger a deploy script on the server
 * @param {Object} artifact: artifact to deploy
 */
function triggerDeploy(artifact){

    //Parse the artifact path to get the server and artifact path
    var pcs = artifact.url.match(/^https:\/\/([\d]+\-[\d]+\-\w+\.)circle-artifacts.com(.*)$/);

    if(pcs === null || pcs.length === 0){
        return logError(`Could not parse artifact URL: ` + artifact.path);
    }

    var server = pcs[1],
        path = pcs[2];

    // Use when Node 6 becomes available on Cirlce CI (and delete above)
    // var [, server, path] = artifact.path.match(/^https:\/\/([\d]+\-[\d]+\-\w+\.)circle-artifacts.com(.*)$/);

    if(!server || !path){
        return logError(`Could not parse artifact URL: ` + artifact.path);
    }

    var deployURL = 'http://thunderlab.net/deployRMWA.php',
        payload = {
            artifact_path: path,
            artifact_server: server,
            circle_ci_token: circleCIToken,
            environment: process.argv[2] || 'stage'
        },

        options = {
            method: 'POST',
            form: payload
        };

    request(deployURL, options, function(error, response, body){
        if(!logError(error)) {
            console.log('\nCompleted Deployment: ' + (body || response.status || response));
        }
    });
}

getArtifactID();