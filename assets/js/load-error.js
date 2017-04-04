/**
 * Created by Greg on 10/19/2016.
 */
var angular = angular;

window.addEventListener('load', function(){
  function isES6Supported(){
    'use strict';

    if(typeof Symbol === 'undefined'){
      return false;
    }

    if(!window.Worker){
      return false;
    }

    try {
      eval('class Test {}');
      eval('(x=>x)()');
    } catch (e) {
      return false;
    }

    return true;
  }

  var loadError = document.querySelector('#loadError'),
    dependencyErrMsg = 'Dependencies failed to load.',
    unexpectedErrMsg = 'An unexpected error was encountered',
    es6ErrMsg = 'This app utilizes ES6 features that your browser does not appear to support';

  loadError.innerHTML = angular ? unexpectedErrMsg : dependencyErrMsg;

  if(!isES6Supported()){
    loadError.innerHTML = es6ErrMsg;
    //Add to some sort of load error detection script
    //loadError.className += ' es6-warning-banner';
  }
});