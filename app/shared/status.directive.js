/**
 * Created by gjrwcs on 4/18/2017.
 */
module.exports = {resolve: ADT => [
    ADT.inject(),
    statusDirective,
    ]};

function statusDirective(ADT) {
    class StatusController {
        constructor($scope, Status, $timeout) {
            $scope.activeMessage = null;
            $scope.msgStyle = '';
            let statusTimeout = null;

            window.testStatus = () => {
                Status.display('This is a test message');
            };

            window.testCond = () => Status.displayConditional('test conditional');

            $scope.displayNextStatus = () => {
                $scope.setActiveStatus(Status.getNextStatus());
            };

            $scope.setActiveStatus = (msg) => {
                $timeout.cancel(statusTimeout);
                $scope.activeMessage = msg;
                if (msg === null) {
                    return;
                }

                if (Number.isFinite(msg.getDuration())) {
                    $scope.msgStyle = msg.getLevel();
                    statusTimeout = $timeout($scope.displayNextStatus, msg.getDuration());
                } else {
                    $scope.msgStyle = `${msg.getLevel()} persist`;
                }
            };

            $scope.dismissStatus = (e) => {
                if (e && e.status && $scope.activeMessage !== e.status) {
                    return;
                }

                $scope.displayNextStatus();
            };

            Status.addEventListener('dismissStatus', $scope.dismissStatus);
            Status.addEventListener('displayStatus', $scope.displayNextStatus);
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
            StatusController],
    };
}
