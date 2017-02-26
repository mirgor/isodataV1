var adminApp = angular.module('adminApp', ['ngRoute','ngResource']);

function scrollToElement(theElement) {
    var selectedPosX = 0;
    var selectedPosY = 0;

    while (theElement != null) {
        selectedPosX += theElement.offsetLeft;
        selectedPosY += theElement.offsetTop;
        theElement = theElement.offsetParent;
    }

    window.scrollTo(selectedPosX,selectedPosY);
}

createObj = function (nameObj, data) {
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

adminApp.config(function($routeProvider){
    $routeProvider
    .when('/addItem', {
        templateUrl:'admin/views/addItem.html',
        controller: 'addItemsController'
    })
    .when('/editItems', {
        templateUrl:'admin/views/editItems.html',
        controller: 'editItemsController'
    })
    .when('/', {
        templateUrl:'admin/views/editItems.html',
        controller: 'editItemsController'
    })
    .when('/addgeo', {
        templateUrl:'admin/views/addgeo.html',
        controller: 'addGeoController'
    })
    .when('/moveGeo', {
        templateUrl: 'admin/views/moveGeo.html',
        controller: 'moveGeoController'
    })
    .when('/editGeo', {
        templateUrl: 'admin/views/editGeo.html',
        controller: 'editGeoController'
    })
    .when('/addKey', {
        templateUrl: 'admin/views/addKey.html',
        controller: 'addKeyController'
    })
    .when('/moveKey', {
        templateUrl: 'admin/views/moveKey.html',
        controller: 'moveKeyController'
    })
    .when('/editKey', {
        templateUrl: 'admin/views/editKey.html',
        controller: 'editKeyController'
    })
    .when('/addFormat', {
        templateUrl: 'admin/views/addFormatFile.html',
        controller: 'addFormatController'
    })
});

adminApp.factory('AuthModel', ['$resource', function ($resource) {
    return $resource('/api/restAdmin.php/auth/:id', {'id': '@id'}, {
        'login': {'method': 'POST'}
    });
}]);

adminApp.factory('jwtInterceptor', ['$rootScope', '$q', function ($rootScope, $q) {
    return {
        request: function (config) {
            var token = window.localStorage.getItem('authToken');
            config.headers = config.headers || {};
            if (token != 'undefined' && angular.isDefined(token)) {
                config.headers.Authorization = 'Bearer ' + token;
            }
            return config;
        },
        response: function (response) {
            if (response.status === 401) {
                // handle the case where the user is not authenticated
            }
            return response || $q.when(response);
        }
    };
}]);

adminApp.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push('jwtInterceptor');
}]);

adminApp.run(['$rootScope', function ($rootScope) {
    $rootScope.logout = function () {
        $rootScope.$user = null;
        window.localStorage.removeItem('authToken');
        window.localStorage.removeItem('authUser');
    };
    var authUser = window.localStorage.getItem('authUser');
    $rootScope.$user = authUser ? JSON.parse(authUser) : null;
}]);
adminApp.controller('admin', ['$scope', '$rootScope', 'AuthModel', function ($scope, $rootScope, AuthModel) {
    $scope.refresh = function () {
        if (!$rootScope.$user) {
            $(location).attr('href','admin/');
        }
    };
}]);
adminApp.controller('LoginController', ['$scope', '$rootScope', 'AuthModel', function ($scope, $rootScope, AuthModel) {
    $scope.user = {};
    $scope.login = function () {
        AuthModel.get($scope.user, function (res) {
            res1 = res.toJSON();
            $(location).attr('href','admin/#/editItems')
            window.localStorage.setItem('authToken', res.token);
            window.localStorage.setItem('authUser', JSON.stringify(res.user));
            $rootScope.$user = res.user;
        }, function (err) {
            alert('Не вірно ввдено логін або пароль')
        });
    };
}]);

adminApp.controller('addFormatController', function ($scope,$http) {

       $scope.addFormat = function () {
        var addParamFormat = {};
           alert($scope.valueAddFormat)
        if ($scope.valueAddFormat != undefined) {
            addParamFormat.name = $scope.valueAddFormat;
            $http.post('/api/restAdmin.php/addFormat/', {params:addParamFormat})
                .success(function (res,status, headers, config) {
                    if (status = 200) {
                        $scope.valueAddFormat = undefined
                        $("input[name='inputAdd']").val('');
                    }else{
                        alert(status);
                    }
                });
        }else{
            alert('Виберіть гілку для додавання');
        }
    }
});

adminApp.controller('addKeyController', function ($scope,$http) {
    $scope.getKey = function () {
        selectedKey = undefined;
        $scope.varKeyListRequired = true;
        $http.get('/api/restAdmin.php/getKeyforAdd/')
            .success(function (res, status, headers, config) {
                treeKeyObj = res.data;
                $('#keyObj').treeview({
                    selectedIcon: "glyphicon glyphicon-check",
                    showIcon: true,
                    multiSelect: false,
                    state: {
                        checked: true,
                        expanded: true
                    },
                    data: treeKeyObj,
                    levels: 2,
                    onNodeUnselected: function (event, node) {
                        selectedKey = undefined;
                    },
                    onNodeSelected: function (event, node) {
                        selectedKey = node.id;
                    }
                });
            });
    };
    $scope.addKey = function () {
        var addParamKey = {};
        if (selectedKey != undefined) {
            addParamKey.idKey = selectedKey;
            addParamKey.nameKey = $scope.valueAddKey;
            $http.post('/api/restAdmin.php/addKey/', {params:addParamKey})
                .success(function (res,status, headers, config) {
                    if (status = 200) {
                        $("input[name='inputAddKeyName']").val('');
                        $scope.getKey();
                    }else{
                        alert(status);
                    }
                });
        }else{
            alert('Виберіть гілку для додавання');
        }
    }
});

adminApp.controller('editKeyController', function ($scope,$http){
    $scope.getKey = function () {
        selectedKeyEditName = undefined;
        $scope.varKeyListRequired = true;
        $http.get('/api/restAdmin.php/getKeyforAdd/')
            .success(function (res, status, headers, config) {
                treeKeyObj = res.data;
                selectedKeyEditName = undefined;
                $('#keyObj').treeview({
                    selectedIcon: "glyphicon glyphicon-check",
                    showIcon: true,
                    multiSelect: false,
                    state: {
                        checked: true,
                        expanded: true
                    },
                    data:  treeKeyObj,
                    levels: 2,
                    onNodeUnselected: function (event, node) {
                        selectedKeyEditName = undefined;
                        $("input[name='inputForEditKeyName']").val('');
                        $('#viewBtnForDeleteKeyName').prop('disabled', true);
                        $('#viewBtnForEditKeyName').prop('disabled', true);
                    },
                    onNodeSelected: function (event, node) {
                        selectedKeyEditName = node.id;
                        $("input[name='inputForEditKeyName']").val(node.text);
                        $('#viewBtnForDeleteKeyName').prop('disabled', false);
                        $('#viewBtnForEditKeyName').prop('disabled', false);
                    }
                });
            })
    };

    $scope.editNameKey = function () {
        var paramEditNameKey = {};
        if ($scope.valueEditKeyName != undefined && selectedKeyEditName != undefined) {
            paramEditNameKey.name = $scope.valueEditKeyName;
            paramEditNameKey.id = selectedKeyEditName;
            $http.put('/api/restAdmin.php/editNameKey/', {params:paramEditNameKey})
                .success(function (res,status, headers, config) {
                    if (status == 200){
                        $('#viewBtnForEditKeyName').prop('disabled', true);
                        $('#viewBtnForDeleteKeyName').prop('disabled', true);
                        $("input[name='inputForEditKeyName']").val('');
                        selectedKeyEditName = undefined;
                        $scope.valueEditKeyName = undefined;
                        $scope.getKey();
                    }else{
                        alert(status);
                    }

                });
        }
    };
    $scope.deleteKey = function () {
        alert(1)
        var paramDltNameKey = {};
        paramDltNameKey.id = selectedKeyEditName;
        $http.delete('/api/restAdmin.php/deleteKey/', {params:paramDltNameKey})
            .success(function (res,status, headers, config) {
                if (status == 200){
                    $('#viewBtnForEditKeyName').prop('disabled', true);
                    $('#viewBtnForDeleteKeyName').prop('disabled', true);
                    $("input[name='inputForEditKeyName']").val('');
                    selectedKeyEditName = undefined;
                    $scope.valueEditKeyName = undefined;
                    $scope.getKey();
                }else{
                    alert(status);
                }

            });    };
});

adminApp.controller('moveKeyController', function ($scope,$http) {
    $scope.getKey2 = function () {
        selectedKeyWhen = undefined;
        $http.get('/api/restAdmin.php/getKeyforAdd/')
            .success(function (res, status, headers, config) {
                treeKeyObjWhen = res.data;
                $('#keyObj2').treeview({
                    selectedIcon: "glyphicon glyphicon-check",
                    showIcon: true,
                    multiSelect: false,
                    state: {
                        checked: true,
                        expanded: true
                    },
                    data: treeKeyObjWhen,
                    levels: 2,
                    onNodeUnselected: function (event, node) {
                        selectedKeyWhen = undefined;
                    },
                    onNodeSelected: function (event, node) {
                        selectedKeyWhen = node.id;
                    }
                });
            });
    };
    $scope.getKey1 = function () {
        selectedKeyWhat = undefined;
        $http.get('/api/restAdmin.php/getKeyforAdd/')
            .success(function (res, status, headers, config) {
                treeKeyObjWhat = res.data;
                $('#keyObj1').treeview({
                    selectedIcon: "glyphicon glyphicon-check",
                    showIcon: true,
                    multiSelect: false,
                    state: {
                        checked: true,
                        expanded: true
                    },
                    data: treeKeyObjWhat,
                    levels: 2,
                    onNodeUnselected: function (event, node) {
                        selectedKeyWhat = undefined;
                    },
                    onNodeSelected: function (event, node) {
                        selectedKeyWhat = node.id;
                    }
                });
            });
    };
    $scope.moveKey = function () {
        var paramMoveKey = {};
        if (selectedKeyWhen != undefined && selectedKeyWhat != undefined) {
            paramMoveKey.idWhen = selectedKeyWhen;
            paramMoveKey.idWhat = selectedKeyWhat;
            $http.post('/api/restAdmin.php/moveKey/', {params: paramMoveKey})
                .success(function (res,status, headers, config) {
                    if (status = 200) {
                        selectedKeyWhen = undefined;
                        selectedKeyWhat = undefined;
                        location.reload(true);
                    }else{
                        alert(status);
                    }
                });
        }else {
            alert('Виберіть тещо не Ви ще не вибрали');
        }
    };
});

adminApp.controller('editGeoController', function ($scope,$http){
    $scope.getGeo = function () {
        selectedGeoEditName = undefined;
        $scope.varGeoListRequired = true;
        $http.get('/api/rest.php/geo/')
            .success(function (res, status, headers, config) {
                treeGeoObj = res.data;
                selectedGeoEditName = undefined;
                $('#geoObj').treeview({
                    selectedIcon: "glyphicon glyphicon-check",
                    showIcon: true,
                    multiSelect: false,
                    state: {
                        checked: true,
                        expanded: true
                    },
                    data:  treeGeoObj,
                    levels: 1,
                    onNodeUnselected: function (event, node) {
                        selectedGeoEditName = undefined;
                        $("input[name='inputForEditGeoName']").val('');
                        $('#viewBtnForEditGeoName').prop('disabled', true);
                        $('#viewBtnForDltGeoName').prop('disabled', true);
                    },
                    onNodeSelected: function (event, node) {
                        selectedGeoEditName = node.id;
                        $("input[name='inputForEditGeoName']").val(node.text);
                        $('#viewBtnForEditGeoName').prop('disabled', false);
                        $('#viewBtnForDltGeoName').prop('disabled',  false);
                    }
                });
            })
    };

   $scope.editNameGeo = function () {
       var paramEditNameGeo = {};
       if ($scope.valueEditGeoName != undefined && selectedGeoEditName != undefined) {
           paramEditNameGeo.name = $scope.valueEditGeoName;
           paramEditNameGeo.id = selectedGeoEditName;
           $http.put('/api/restAdmin.php/editNameGeo/', {params:paramEditNameGeo})
               .success(function (res,status, headers, config) {
                   if (status == 200){
                       $('#viewBtnForEditGeoName').prop('disabled', true);
                       $("input[name='inputForEditGeoName']").val('');
                       selectedGeoEditName = undefined;
                       $scope.valueEditGeoName = undefined;
                       $scope.getGeo();
                   }else{
                       alert(status);
                   }

               });
       }
   };
    $scope.deleteGeo = function () {
        var paramDltNameGeo = {};
            paramDltNameGeo.id = selectedGeoEditName;
            $http.delete('/api/restAdmin.php/deleteGeo/', {params:paramDltNameGeo})
                .success(function (res,status, headers, config) {
                    if (status == 200){
                        $('#viewBtnForEditGeoName').prop('disabled', true);
                        $("input[name='inputForEditGeoName']").val('');
                        selectedGeoEditName = undefined;
                        $scope.valueEditGeoName = undefined;
                        $scope.getGeo();
                    }else{
                        alert(status);
                    }

                });
        };
});

adminApp.controller('moveGeoController', function ($scope,$http) {
    $scope.getGeo2 = function () {
        selectedGeoWhen = undefined;
        $scope.varGeoListRequired = true;
        $http.get('/api/rest.php/geo/')
            .success(function (res, status, headers, config) {
                treeGeoObjWhen = res.data;
                $('#geoObj2').treeview({
                    selectedIcon: "glyphicon glyphicon-check",
                    showIcon: true,
                    multiSelect: false,
                    state: {
                        checked: true,
                        expanded: true
                    },
                    data: treeGeoObjWhen,
                    levels: 1,
                    onNodeUnselected: function (event, node) {
                        selectedGeoWhen = undefined;
                    },
                    onNodeSelected: function (event, node) {
                        selectedGeoWhen = node.id;
                    }
                });
            });
    };
    $scope.getGeo1 = function () {
        selectedGeoWhat = undefined;
        $scope.varGeoListRequired = true;
        $http.get('/api/rest.php/geo/')
            .success(function (res, status, headers, config) {
                treeGeoObjWhat = res.data;
                $('#geoObj1').treeview({
                    selectedIcon: "glyphicon glyphicon-check",
                    showIcon: true,
                    multiSelect: false,
                    state: {
                        checked: true,
                        expanded: true
                    },
                    data: treeGeoObjWhat,
                    levels: 1,
                    onNodeUnselected: function (event, node) {
                        selectedGeoWhat = undefined;
                    },
                    onNodeSelected: function (event, node) {
                        selectedGeoWhat = node.id;
                    }
                });
            });
    };
    $scope.moveGeo = function () {
        var paramMoveGeo = {};
        if (selectedGeoWhen != undefined && selectedGeoWhat != undefined) {
            paramMoveGeo.idWhen = selectedGeoWhen;
            paramMoveGeo.idWhat = selectedGeoWhat;
            $http.post('/api/restAdmin.php/moveGeo/', {params: paramMoveGeo})
                .success(function (res,status, headers, config) {
                    if (status = 200) {
                        selectedGeoWhen = undefined;
                        selectedGeoWhat = undefined;
                        location.reload(true);
                    }else{
                        alert(status);
                    }
                });
        }else {
            alert('Виберіть тещо не Ви ще не вибрали');
        }
    };
});

adminApp.controller('addGeoController', function ($scope,$http) {
    $scope.getGeo = function () {
        selectedGeo = undefined;
        $scope.varGeoListRequired = true;
        $http.get('/api/rest.php/geo/')
            .success(function (res, status, headers, config) {
                treeGeoObj = res.data;
                $('#geoObj').treeview({
                    selectedIcon: "glyphicon glyphicon-check",
                    showIcon: true,
                    multiSelect: false,
                    state: {
                        checked: true,
                        expanded: true
                    },
                    data: treeGeoObj,
                    levels: 1,
                    onNodeUnselected: function (event, node) {
                        selectedGeo = undefined;
                    },
                    onNodeSelected: function (event, node) {
                        selectedGeo = node.id;
                    }
                });
            });
    };
    $scope.addGeo = function () {
        var addParamGeo = {};
        if (selectedGeo != undefined) {
            addParamGeo.idGeo = selectedGeo;
            addParamGeo.nameGeo = $scope.valueAddGeo;
            $http.post('/api/restAdmin.php/addGeo/', {params:addParamGeo})
                .success(function (res,status, headers, config) {
                    if (status = 200) {
                        $("input[name='inputAddGeoName']").val('');
                        $scope.getGeo();
                    }else{
                        alert(status);
                    }
                });
        }else{
            alert('Виберіть гілку для додавання');
        }
    }
});

adminApp.controller('editItemsController', function ($scope, $http) {
    listSelectedGeo = [];
    listSelectedKey = [];
    $scope.vievFormEditItem = false;
    $scope.getItemsEdit = function () {
    $http.get('/api/restAdmin.php/getItems/')
        .success(function (res,status, headers, config) {
            $scope.items = res.data;
        });
    $scope.propertyName = 'id';
    $scope.reverse = true;
    $scope.sortBy = function(propertyName) {
        $scope.reverse = ($scope.propertyName === propertyName) ? !$scope.reverse : false;
        $scope.propertyName = propertyName;
    };
};
$scope.getFormat = function () {
    $http.get('/api/rest.php/getFormat/')
        .success(function (res, status, headers, config) {
            $scope.formats = res.data;
        });
};
$scope.selectedEditItem = function (item) {

    listSelectedGeo = [];
    listSelectedKey = [];
    $('#geoObj').treeview('collapseAll', { silent: true });
    $('#keyObj').treeview('collapseAll', { silent: true });
    $scope.name = item.name;
    var converDate = function (date) {
        var splitString = date.split('.');
        var converDateString = splitString[2] + '-' + splitString[1] + '-' + splitString[0];
        return converDateString;
    };
    $scope.dateStart = converDate(item.date_start);
    $scope.dateEnd = converDate(item.date_end);
    $scope.id = item.id;
    $scope.link = item.link;
    $scope.owner = item.owner;
    $scope.format = item.idFormat;
    $scope.description = item.description;
    $scope.vievFormEditItem = true;
    var paramItem = {};
    paramItem.id = item.id;
    var selectedNodeGeo = undefined;
    selectedNodeGeo = $('#geoObj').treeview('getSelected');
    for(var t=0; t<selectedNodeGeo.length;t++) {
        $('#geoObj').treeview('unselectNode', [ selectedNodeGeo[t].nodeId, { silent: true, color: '#333' } ]);
    }
    var selectedNodeKey = $('#keyObj').treeview('getSelected');
    for(var i=0; i<selectedNodeKey.length;i++) {
        $('#keyObj').treeview('unselectNode', [ selectedNodeKey[i].nodeId, { silent: true } ]);
    }
    $http.get('/api/restAdmin.php/getCountGeo/', {params:paramItem})
        .success(function (res, status, headers, config) {
            idGeo = res.data;
            findNodeId($scope.dataGeo.count, idGeo, '#geoObj')
        });
    $http.get('/api/restAdmin.php/getCountKey/', {params:paramItem})
        .success(function (res, status, headers, config) {
            idKey = res.data;
            findNodeId($scope.dataKey.count, idKey, '#keyObj')
        });
    var dataNode;
    var findNodeId = function (count, id, nameSelector) {
        for (var i=0;i<id.length;i++) {
            for (var j=0;j<count;j++) {
                dataNode =  $(nameSelector).treeview('getNode', j);
                if (dataNode.id == id[i].idObj){
                    $(nameSelector).treeview('selectNode', [ dataNode.nodeId, { silent: true } ]);
                    $(nameSelector).treeview('search', [ dataNode.text, {
                        ignoreCase: true,     // case insensitive
                        exactMatch: true,    // like or equals
                        revealResults: true  // reveal matching nodes
                    }]);
                    if(nameSelector == '#geoObj'){
                        listSelectedGeo.push(dataNode.id)
                    }
                    if(nameSelector == '#keyObj'){
                        listSelectedKey.push(dataNode.id)
                    }
                }
            }
         }
        dateCalendar();
    };

    var dateCalendar = function () {
        dateRequired = false;
        $('input[name="daterange"]').on('showCalendar.daterangepicker', function(ev, picker) {
            $scope.dateStart = picker.startDate.format('YYYY-MM-DD');
            $scope.dateEnd = picker.endDate.format('YYYY-MM-DD');
            dateRequired = false;
        });

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
                    "firstDay": 0
                },
                startDate: item.date_start,
                endDate: item.date_end
            },function(startDate, endDate, label) {
                $scope.dateStart = startDate.format('YYYY-MM-DD');
                $scope.dateEnd = endDate.format('YYYY-MM-DD');
            });
    };

    scrollToElement('editItem');
};
    $scope.getGeo = function () {
        $scope.varGeoListRequired = true;
        $http.get('/api/restAdmin.php/geo/')
            .success(function (res, status, headers, config) {
                $scope.dataGeo = res.data;
                treeGeoObj = $scope.dataGeo.tree;
                $('#geoObj').treeview({
                    selectedIcon: "glyphicon glyphicon-check",
                    showIcon: true,
                    multiSelect: true,
                    searchResultColor:'#000',
                    searchResultBackColor: '#ffffff',
                    selectedBackColor: '#ffffff',
                    selectedColor:'#000',
                    state: {
                        checked: true,
                        expanded: true
                    },
                    data: treeGeoObj,
                    levels: 1,
                    onNodeUnselected: function (event, node) {
                        for (var i = 0; i < listSelectedGeo.length; i++) {
                            if (listSelectedGeo[i] == node.id) {
                                listSelectedGeo.splice(i, 1);
                            }
                        }
                    },
                    onNodeSelected: function (event, node) {
                        listSelectedGeo.push(node.id)
                    }
                });

            });

    };

    $scope.getKey= function () {
        $scope.varGeoListRequired = true;
        $http.get('/api/restAdmin.php/key/')
            .success(function (res, status, headers, config) {
                $scope.dataKey = res.data;
                treeKeyObj = $scope.dataKey.tree;
                $('#keyObj').treeview({
                    selectedIcon: "glyphicon glyphicon-check",
                    showIcon: true,
                    multiSelect: true,
                    searchResultColor:'#000',
                    searchResultBackColor: '#ffffff',
                    selectedBackColor: '#ffffff',
                    selectedColor:'#000',
                    state: {
                        checked: true,
                        expanded: true
                    },
                    data: treeKeyObj,
                    levels: 1,
                    onNodeUnselected: function (event, node) {
                        for (var i = 0; i < listSelectedKey.length; i++) {
                            if (listSelectedKey[i] == node.id) {
                                listSelectedKey.splice(i, 1);
                            }
                        }
                    },
                    onNodeSelected: function (event, node) {
                        listSelectedKey.push(node.id)
                    }
                });
            });
    };

    $scope.editVarificationItem = function() {
        paramEdit = {};
        var required = "Заповніть такі поля: ";

        if ($scope.editForm.name.$error.required == true) {
            required = required + 'Назва; ';
        }else {
            paramEdit.name= $scope.name;
        }
        if ($scope.editForm.link.$error.required == true) {
            required = required + 'Посилання; ';
        }else {
            paramEdit.link = $scope.link;
        }
        if (listSelectedKey.length == 0) {
            required = required + 'Ключові слова; ';
        }else {
            paramEdit.key = createObj('keyObj', listSelectedKey);
        }
        if (listSelectedGeo.length == 0) {
            required = required + 'Географічне розташування; ';
        }else {
            paramEdit.geo = createObj('geoObj', listSelectedGeo);
        }
        if (dateRequired == true) {
            required = required + 'Дата; ';
        }else {
            paramEdit.dateStart = $scope.dateStart;
            paramEdit.dateEnd = $scope.dateEnd;
        }
        if($scope.format != undefined && $scope.format != '') {
            if ($scope.format.length != 0) {
                paramEdit.format = $scope.format;
            }
        }
        if($scope.description != undefined && $scope.description != '') {
            paramEdit.description = $scope.description;
        }
        if($scope.owner != undefined && $scope.owner != '') {
            paramEdit.owner = $scope.owner;
        }
        if (required != "Заповніть такі поля: ") {
            alert(required)
        } else {
            paramEdit.id = $scope.id;
            editItem(paramEdit);
        }
    };
    var editItem = function (paramEdit) {
        $http.put('/api/restAdmin.php/editItem/', {params:paramEdit})
            .success(function (res,status, headers, config) {
                if (status == 200){
                    location.reload(true);
                }else{
                    alert(status);
                }
            });
    };

    $scope.deleteItem = function (itemId) {
        var itemDeleteObj = {};
        itemDeleteObj.id = itemId;
        var isAdmin = confirm("Підтвердіть видалення?");
        if (isAdmin) {
        $http.delete('/api/restAdmin.php/deleteItem/', {params:itemDeleteObj})
            .success(function (res,status, headers, config) {
                if (status == 200){
                    location.reload(true);
                }else{
                    alert(status);
                }
            });
        }
    }


});

adminApp.controller('addItemsController', function ($scope, $http, $rootScope) {
    $scope.attr = function () {
        if (!$rootScope.$user) {
            $(location).attr('href','admin/#/');
        }
    };
    paramAdd = {};
    var addItem = function (paramAdd) {
        $http.post('/api/restAdmin.php/addItem/', {params:paramAdd})
            .success(function (res,status, headers, config) {
                if (status == 200){
                    location.reload(true);
                }else{
                    alert(status);
                }
            });
    };

   $scope.addVarificationItem = function() {
       var required = "Заповніть такі поля: ";

       if ($scope.addForm.name.$error.required == true) {
           required = required + 'Назва; ';
       }else {
           paramAdd.name= $scope.name;
       }
       if ($scope.addForm.link.$error.required == true) {
           required = required + 'Посилання; ';
       }else {
           paramAdd.link = $scope.link;
       }
       if (listSelectedKey.length == 0) {
           required = required + 'Ключові слова; ';
       }else {
           paramAdd.key = createObj('keyObj', listSelectedKey);
       }
       if (listSelectedGeo.length == 0) {
           required = required + 'Географічне розташування; ';
       }else {
           paramAdd.geo = createObj('geoObj', listSelectedGeo);
       }
       if (dateRequired == true) {
           required = required + 'Дата; ';
       }else {
           paramAdd.dateStart = $scope.dateStart;
           paramAdd.dateEnd = $scope.dateEnd;
       }
       if($scope.format != undefined && $scope.format != '') {
           if ($scope.format.length != 0) {
               paramAdd.format = $scope.format;
           }
       }
       if($scope.description != undefined && $scope.description != '') {
           paramAdd.description = $scope.description;
       }
       if($scope.owner != undefined && $scope.owner != '') {
           paramAdd.owner = $scope.owner;
       }
       if (required != "Заповніть такі поля: ") {
            alert(required)
        } else {
           addItem(paramAdd);

       }
   };

    $scope.getKey = function () {
        listSelectedKey = [];
        $scope.varKeyListRequired = true;
        $http.get('/api/rest.php/key/')
            .success(function (res,status, headers, config) {
                treeKeyObj = res.data;
                $('#keyObj').treeview({
                    selectedIcon: "glyphicon glyphicon-check",
                    showIcon: true,
                    multiSelect: true,
                    state: {
                        checked: true,
                        expanded: true
                    },
                    data:  treeKeyObj,
                    levels: 1,
                    onNodeUnselected: function (event, node) {
                        for (var i = 0; i < listSelectedKey.length; i++) {
                            if (listSelectedKey[i] == node.id) {
                                listSelectedKey.splice(i, 1);
                            }
                        }
                    },
                    onNodeSelected: function (event, node) {
                        listSelectedKey.push(node.id)
                    }
                });
            });
    };


    $scope.getGeo = function () {
        listSelectedGeo = [];
        $scope.varGeoListRequired = true;
        $http.get('/api/rest.php/geo/')
            .success(function (res, status, headers, config) {
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
                        for (var i = 0; i < listSelectedGeo.length; i++) {
                            if (listSelectedGeo[i] == node.id) {
                                listSelectedGeo.splice(i, 1);
                            }
                        }
                    },
                    onNodeSelected: function (event, node) {
                        listSelectedGeo.push(node.id)
                    }
                });
            });
    };
    $scope.dateCalendar = function () {
        dateRequired = true;
        $('input[name="daterange"]').on('showCalendar.daterangepicker', function(ev, picker) {
            $scope.dateStart = picker.startDate.format('YYYY-MM-DD');
            $scope.dateEnd = picker.endDate.format('YYYY-MM-DD');
            dateRequired = false;
        });

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
                    "firstDay": 0
                },
                startDate: '01.01.2016',
                endDate: '31.12.2016'
            },function(startDate, endDate, label) {

                $scope.dateStart = startDate.format('YYYY-MM-DD');
                $scope.dateEnd = endDate.format('YYYY-MM-DD');
            });
    };

        $scope.getFormat = function () {
        $http.get('/api/rest.php/getFormat/')
            .success(function (res,status, headers, config) {
                $scope.formats = res.data;
            });
    };

});


adminApp.directive('selectFormat1', function ($timeout) {
    return {
        link: function ($scope, element, attr) {
            var last = attr.last;
            if (last === "true") {
                $timeout(function () {
                     //$(element).parent().selectpicker('val');
                    $(element).parent().selectpicker('refresh');
                });
            }
        }
    };
});

$("body").append(' <div class="row" ng-if="$user"><div class="col-xs-12 col-md-2"><ul class="nav nav-pills nav-stacked"><li><a href="/admin/#/addItem">Додавання матеріалу</a></li>' +
'<li><a href="/admin/#/editItems">Редагування матеріалу</a></li><li><a href="/admin/#/addgeo">Додавання географічного об\'єкта</a></li>' +
'<li><a href="/admin/#/moveGeo">Переміщення географічних об\'єктів</a></li><li><a href="/admin/#/editGeo">Редагування географічних об\'єктів</a></li>' +
'<li><a href="/admin/#/addKey">Додавання ключового слова</a></li><li><a href="/admin/#/moveKey">Переміщення ключового слова</a></li>' +
'<li><a href="/admin/#/editKey">Редагування ключового слова</a></li><li><a href="/admin/#/addFormat">Додавання формату файлу</a></li>' +
'</ul></div><div class="col-xs-12 col-md-9"> <ng-view></ng-view></div></div>');
