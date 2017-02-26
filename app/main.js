var mainApp = angular.module('MainApp', ['ngRoute','ngResource']);

mainApp.config(function($routeProvider){
   $routeProvider
       .when('/', {
            templateUrl: 'app/views/search.html',
            controller: 'NewsViewController'
        })
       .when('/sendData', {
           templateUrl: 'app/views/sendData.html',
       })
});


mainApp.controller('NewsViewController',function ($scope, $http)  {
    dateEnd = undefined;
    dateStart = undefined;
    $scope.viewParamSearch = true;
    $scope.viewResSearch = false;
    var createObj = function (nameObj, data) {
        var obj = '{"' + nameObj + '": [';
        var comma = ',';
        for (var i=0; i<data.length; i++) {
            if (i == data.length-1) {
                comma = '';
            };
            obj = obj + '"' +  data[i] + '"' + comma;
        }
        obj = obj + ']}';
        return obj;
    };


    checkLinkItem = function (id) {
        var paramId = {};
        paramId.id = id;
        $http.post('/api/rest.php/checkLinkItem/', {params:paramId})
    };
    viewRes = function (size) {
        $scope.viewResSearch = true;
        if(size !== 0) {
            $scope.textRes = 'Результати пошуку:';
            $scope.viewParamSearch = false;
        }else {
            $scope.textRes = 'Нажаль, пошук не дав результатів. Спробуйте ще раз';
            $scope.viewParamSearch = true;
        }
    };
function htmlElmPost(i,res) {
    $('#fixed').append('<div class="col-sm-12 col-md-10 col-md-offset-1">' +
        '<div class="thumbnail">' +
        '<div class="caption">' +
        '<p><b>Назва: </b>'+res.data[i].name+'</p>' +
        '<p><b>Власник: </b>'+res.data[i].owner+'</p>' +
        '<p><b>Дата: </b>'+res.data[i].date_start+' по '+res.data[i].date_end+'</p>' +
        '<p><b>Географічна приналежність: </b>'+res.data[i].geosObj+'</p>' +
        '<p><b>Ключові слова: </b>'+res.data[i].keyObj+'</p>' +
        '<p><b>Опис: </b>'+res.data[i].description+'</p>' +
        '<p><b>Посилання: </b><a href="'+res.data[i].link+'">'+res.data[i].link+'</a><sup style="padding-left: 7px; padding-bottom: 20px"><button onclick="checkLinkItem('+ res.data[i].id +')" type="button" class="btn btn-warning btn-xs">Не відкривається?</button></sup></p>' +
        '</div>' +
        '</div>' +
        '</div>'
    );
}
httpGetPost = function (paramSearch) {
    if (clikBtnSearch == 1) {
        paramSearch.beginPost = 0;
        paramSearch.lastPost = 3;
    }else{
        paramSearch.beginPost = paramSearch.beginPost + 3;
     }
    $http.get('/api/rest.php/items/', {params: paramSearch})
        .success(function (res,status, headers, config) {
              if (clikBtnSearch == 1) {
                for (var i=0;i<res.data.length;i++) {
                    htmlElmPost(i,res);
                }
                viewRes(res.data.length)
                clikBtnSearch = 0;
            }else{
                for (var i=0;i<res.data.length;i++) {
                    htmlElmPost(i,res);
                }
            }
        });
};
    $scope.getPosts = function () {
        $("#fixed").remove()
        clikBtnSearch = 1;
        $scope.viewResSearchPagin = false;
        paramSearch = {};
        if (dateStart != undefined) {
            paramSearch.dateStart = dateStart;
        }
        if (dateEnd != undefined) {
            paramSearch.dateEnd = dateEnd;
        }
        paramSearch.findMainInput = $scope.findMainInput;
        if ($scope.field == undefined || $scope.field == '') {
            paramSearch.field = '{"fieldObj": "all"}';
        }else {
            paramSearch.field = createObj('fieldObj',$scope.field);
        }
        if($scope.format != undefined){
            if ($scope.format.length != 0) {
                paramSearch.format = createObj('formatObj', $scope.format);
            }
        }
        if (listSelectedGeo.length != 0){
            paramSearch.geo = createObj('geoObj',listSelectedGeo);
        }
        if (listSelectedKey.length != 0){
            paramSearch.key = createObj('keyObj',listSelectedKey);
        }
        $('#row').append('<div class="row" id="fixed"></div>')
        httpGetPost(paramSearch,0,5);
    };

        $scope.getGeo = function () {
            listSelectedGeo = [];
            $http.get('/api/rest.php/geo/')
                .success(function (res,status, headers, config) {
                    treeGeoObj = res.data;
                    $('#geoObj').treeview({
                        selectedIcon: "glyphicon glyphicon-check",
                        showIcon: true,
                        multiSelect: true,
                        state: {
                            checked: true,
                            expanded: true
                        },
                        data: treeGeoObj,
                        levels: 1,
                        onNodeUnselected: function (event, node) {
                            for (var i=0;i<listSelectedGeo.length;i++){
                                if (listSelectedGeo[i] == node.id) {
                                    listSelectedGeo.splice(i,1);
                                }
                            }
                        },
                        onNodeSelected: function (event, node) {
                            listSelectedGeo.push(node.id);
                        }
                    });
                });
        };

    $scope.getKey = function () {
        listSelectedKey = [];
        $http.get('/api/rest.php/key/')
            .success(function (res,status, headers, config) {
                treeKeyObj = res.data;
                $('#key').treeview({
                    selectedIcon: "glyphicon glyphicon-check",
                    showIcon: true,
                    multiSelect: true,
                    state: {
                        checked: true,
                        expanded: true
                    },
                    data: treeKeyObj,
                    levels: 1,
                    onNodeUnselected: function (event, node) {
                        for (var i=0;i<listSelectedKey.length;i++){
                            if (listSelectedKey[i] == node.id) {
                                listSelectedKey.splice(i,1);
                            }
                        }
                    },
                    onNodeSelected: function (event, node) {
                        listSelectedKey.push(node.id);
                    }
                });
            });
    };
    $scope.dateCalendar = function () {
        $('input[name="daterange"]').daterangepicker(
            {
                locale: {
                    format: 'DD.MM.YYYY',
                    separator: " - ",
                    fromLabel: "з",
                    toLabel: "по",
                    weekLabel: "Тиж",
                    daysOfWeek: [
                        "Пн",
                        "Вт",
                        "Ср",
                        "Чт",
                        "Пт",
                        "Сб",
                        "Нд"
                    ],
                    monthNames: [
                        "Січень",
                        "Лютий",
                        "Березень",
                        "Квітень",
                        "Травень",
                        "Червень",
                        "Липень",
                        "Серпень",
                        "Вересень",
                        "Жовтень",
                        "Листопад",
                        "Грудень"
                    ],
                    "firstDay": 0,
                    cancelLabel: 'Очистити',
                    applyLabel: 'Обрати'
                },
                autoUpdateInput: false,
            },function(start, end, label) {
                dateStart = start.format('YYYY-MM-DD');
                dateEnd = end.format('YYYY-MM-DD');
            });
        $('input[name="daterange"]').on('apply.daterangepicker', function(ev, picker) {
            $(this).val(picker.startDate.format('DD.MM.YYYY') + ' - ' + picker.endDate.format('DD.MM.YYYY'));
            dateStart = picker.startDate.format('YYYY-MM-DD');
            dateEnd = picker.endDate.format('YYYY-MM-DD');
        });
        $('input[name="daterange"]').on('cancel.daterangepicker', function(ev, picker) {
            $(this).val('');
            dateStart = undefined;
            dateEnd = undefined;
        });
    };

    $scope.getFormat = function () {
        $http.get('/api/rest.php/getFormat/')
            .success(function (res,status, headers, config) {
                $scope.formats = res.data;
            });
    }
});

mainApp.controller('sendItemController',function ($scope,$http) {
    $scope.getData = function () {
        var paramSend = {};
        paramSend.linkItem = $scope.linkItem;
        if (paramSend.linkItem != undefined) {
            paramSend.titleItem = $scope.titleItem;
            paramSend.ownerItem = $scope.ownerItem;
            paramSend.dateItem = $scope.dateItem;
            paramSend.geoItem = $scope.geoItem;
            paramSend.keyItem = $scope.keyItem;
            paramSend.descItem = $scope.descItem;
        }else {
            alert('Заповніть поле "Веб-посилання"')
        }
        $http.post('/api/rest.php/sendEmail/', {params:paramSend})
            .success(function (res,status, headers, config) {
                if(status==200){
                    alert('Відправлено')
                }
            });
    }
});

mainApp.controller('itemViewController', function ($scope, $http, $routeParams) {
   $scope.getItem = function () {
       var paramItem = {};
       paramItem.id = $routeParams.id;
       $http.get('/api/rest.php/item/', {params:paramItem})
           .success(function (res,status, headers, config) {
               $scope.item = res.data[0];
               /*$scope.stringGeoList = '';
               $scope.stringKeyList = '';
               for (var i=0; i<$scope.item.listGeo.length;i++) {
                     $scope.stringGeoList = $scope.stringGeoList + $scope.item.listGeo[i] + '; ';
               }
               for (var i=0; i<$scope.item.listKey.length;i++) {
                   $scope.stringKeyList = $scope.stringKeyList + $scope.item.listKey[i] + '; ';
               }*/

           });
   };
    $scope.checkLinkItem = function () {
        var paramId = {};
        paramId.id = $routeParams.id;
        $http.post('/api/rest.php/checkLinkItem/', {params:paramId})
    }
});


mainApp.directive('selectFormat', function ($timeout) {
    return {
        link: function ($scope, element, attr) {
            var last = attr.last;
            if (last === "true") {
                $timeout(function () {
                    //$(element).parent().selectpicker('val', 'any');
                    $(element).parent().selectpicker('refresh');
                });
            }
        }
    };
});
