/**
 * Created by gjrwcs on 4/18/2017.
 */
module.exports = {resolve: ADT => [
    ADT.inject(),
    statusDirective
    ]};

function statusDirective(ADT) {
    class StatusController {
        constructor($scope, Status, $timeout) {
            $scope.activeMessage = null;
            $scope.msgStyle = '';

            window.testStatus = () => {
                Status.display('This is a test message');
            };

            $scope.displayNextStatus = () => {
                $scope.setActiveStatus(Status.getNextStatus());
            };

            Status.addEventListener('displayStatus', $scope.displayNextStatus);

            $scope.setActiveStatus = (msg)=> {
                $scope.activeMessage = msg;
                if (msg !== null && Number.isFinite(msg.getDuration())) {
                    $scope.msgStyle = msg.getLevel();
                    $timeout($scope.displayNextStatus, msg.getDuration());
                } else {
                    $scope.msgStyle = 'persist';
                }
            };

            $scope.dismissStatus = () => {
                $scope.displayNextStatus();
            };
        }
    }

    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/status.html',
        controller: [
            ADT.ng.$scope,
            ADT.shared.Status,
            ADT.ng.$timeout,
            StatusController]
    };
}