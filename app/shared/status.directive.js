/**
 * Created by gjrwcs on 4/18/2017.
 */
module.exports = {resolve: ADT => [
    ADT.inject(),
    ADT.MDT,
    statusDirective
    ]};

function statusDirective(ADT, MDT) {
    class StatusController {
        constructor($scope, Status, Log) {
            this.messages = [];

            $scope.activeMessage = null;
            $scope.class = '';

            Log.addLogger(this, Log.levels.Error);
        }

        error() {
            // TODO: handle error display
        }
    }

    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/status.html',
        controller: [
            ADT.ng.$scope,
            MDT.Log,
            ADT.shared.Status,
            StatusController]
    }
}


