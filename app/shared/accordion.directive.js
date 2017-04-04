'use strict';
/**
 * Created by Greg on 12/3/2016.
 */
require('angular').module('shared')
    /**
     * @ngdoc directive
     * @description Container for an accordion
     */
    .directive('psAccordion', [psAccordionDirective])
    /**
     * @ngdoc directive
     * @description Defines a tab in the accordion, requires a parent psAccordion
     */
    .directive('psAccordionTab', [psAccordionTabDirective])
    /**
     * @ngdoc directive
     * @description A header that can be activated to expand a tab in the accordion
     *
     */
    .directive('psAccordionHeader', [psAccordianHeaderDirective]);

function psAccordionDirective(){
    return {
        restrict: 'AC',
        scope: {},
        controller: ['$scope', function PsAccordionCtrl($scope){

            var tabs = $scope.tabs = [];

            this.expand = $scope.expand = function(expandedTab){
                tabs.forEach(tab => {
                    tab.expanded = false;
                    tab.collapsed = true;
                });

                expandedTab.expanded = true;
                expandedTab.collapsed = false;
            };

            this.addTab = function(tab){
                if(tabs.length === 0){
                    $scope.expand(tab);
                }
                $scope.tabs.push(tab);
            };
        }]
    };
}

function psAccordionTabDirective(){
    return {
        restrict: 'AC',
        require: '^^psAccordion',
        scope: true,
        link: function(scope, elem, attrs, accordionCtrl){
            scope.expanded = false;
            scope.collapsed = true;
            scope.test = 'testing';
            scope.expand = accordionCtrl.expand;
            accordionCtrl.addTab(scope);
            if(attrs.hasOwnProperty('selected')){
                scope.expand(scope);
            }
        },
        controller: ['$scope', '$element', PsAccordionTabCtrl]
    };
}

function PsAccordionTabCtrl($scope, $element){
    $element.addClass('ps-accordion-tab');

    this.expand = function(){
        $scope.expand($scope, $element);
        $element.removeClass('collapsed');
        $element.addClass('expanded');
    };

    $scope.$watch('collapsed', (n) => {
        if(n === true){
            $element.addClass('collapsed');
            $element.removeClass('expanded');
        }
    });
}

function psAccordianHeaderDirective(){
    return {
        restrict: 'AC',
        require: '^^psAccordionTab',
        transclude: true,
        scope: true,
        template: `<span ng-transclude></span><span class="ps-accordion-icon"><span class="fa" ng-class="[{'fa-arrow-down': expanded}, {'fa-arrow-left': collapsed}]"></span></span>`,
        link: function(scope, elem, attrs, tabCtrl){
            elem.on('click', tabCtrl.expand);
        }
    };
}