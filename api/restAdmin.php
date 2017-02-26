<?php
use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

require 'vendor/autoload.php';
require 'db.php';
use Firebase\JWT\JWT;

define('AUTH_SECRET', "supersecretkeyyoushouldnotcommittogithub");

try {
    DB::init('mysql:dbname=isodata;host=127.0.0.1;port=3306', 'root', '1234');
} catch (PDOException $e) {
    $file = 'log.txt';
    $string = 'Connection dataBase FALSE: ' . $e->getMessage();
    file_put_contents($file, $string);
}

function buildTree(array $elements, $parentId = 1) {
    $branch = array();

    foreach ($elements as $element) {

        if ($element['parentId'] == $parentId) {
            $element['icon'] = "glyphicon glyphicon-unchecked";
            $children = buildTree($elements, $element['id']);
            if ($children) {
                $element['nodes'] = $children;
                $element['icon'] = "glyphicon glyphicon-unchecked";
            }
            $branch[] = $element;
        }
    }

    return $branch;
}
$app = new \Slim\App;

$app->options('/{routes:.+}', function ($request, $response, $args) {
    return $response;
});

function deleteNode ($id, $nameTree){
    $sql = 'SELECT lft, rgt FROM '.$nameTree.' WHERE id = ' . $id;
    $inputId = DB::fetch($sql);
    $sqlDelete = 'DELETE FROM '.$nameTree.' WHERE lft >= ' . $inputId['lft'] .' AND rgt <= ' . $inputId['rgt'] . '; ';
    $sqlDelete = $sqlDelete . 'UPDATE '.$nameTree.' SET lft = IF(lft > '. $inputId['lft'] .', lft - ('. $inputId['rgt'] .' - '. $inputId['lft'] .' + 1), lft), rgt = rgt - ('. $inputId['rgt'] .' - '. $inputId['lft'] .' + 1) WHERE rgt > '. $inputId['rgt'];
    file_put_contents('log1.txt', $sql);
    DB::fetch($sqlDelete);
}

$app->add(function ($req, $res, $next) {
    $response = $next($req, $res);
    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
});

$app->delete('/deleteItem/', function (Request $request){
    $input =  $request->getQueryParams();
    $sql = 'DELETE FROM geo_for_items WHERE geo_for_items.id_items = '  . $input['id'] . ';';
    $sql = $sql . 'DELETE FROM keywords_for_items WHERE keywords_for_items.id_items = '  . $input['id'] . ';';
    $sql = $sql .'DELETE FROM items WHERE items.id= ' . $input['id'] . ';';
    DB::fetchAll($sql);
});

$app->delete('/deleteGeo/', function (Request $request,Response $response){
    $input =  $request->getQueryParams();
    deleteNode($input['id'],'geo');
});
$app->delete('/deleteKey/', function (Request $request,Response $response){
    $input =  $request->getQueryParams();
    deleteNode($input['id'],'keyword');
});

$app->put('/editItem/', function (Request $request) {
    $input =  $request->getParsedBody();
    $sql = 'UPDATE items SET items.name = "' . $input['params']['name'] . '", items.link = "'. $input['params']['link'] . '", items.date_start = "' . $input['params']['dateStart'] . '", items.date_end = "' . $input['params']['dateEnd'] . '"';
    if (isset($input['params']['format'])){
        $sql = $sql . ', items.id_format_file = "' . $input['params']['format'] . '"';
    }
    if (isset($input['params']['description'])){
        $sql = $sql . ', items.description = "' . $input['params']['description'] . '"';
    }
    if (isset($input['params']['owner'])){
        $sql = $sql . ', items.owner = "' . $input['params']['owner'] . '"';
    }
    $sql = $sql . ' WHERE items.id =' . $input['params']['id'] . ';';
    $sql = $sql . 'DELETE FROM geo_for_items WHERE geo_for_items.id_items = '  . $input['params']['id'] . ';';
    $sql = $sql . 'DELETE FROM keywords_for_items WHERE keywords_for_items.id_items = '  . $input['params']['id'] . ';';
    $geo = json_decode($input['params']['geo'], TRUE);
    for ($i=0;$i<count($geo['geoObj']);$i++) {
        $sql = $sql . 'INSERT INTO geo_for_items (geo_for_items.id_items, geo_for_items.id_geo) values(' . $input['params']['id'].', ' . $geo['geoObj'][$i] . ');';
    }
    $key = json_decode($input['params']['key'], TRUE);
    for ($i=0;$i<count($key['keyObj']);$i++) {
        $sql = $sql . 'INSERT INTO keywords_for_items (keywords_for_items.id_items, keywords_for_items.id_keyword) values(' . $input['params']['id'].', ' . $key['keyObj'][$i] . ');';
    }
    DB::fetchAll($sql);
});

$app->post('/addItem/', function(Request $request) {
    $input =  $request->getParsedBody();
    $sql = 'INSERT INTO items (';
    $fieldTableItems = 'items.name, items.link, items.date_start, items.date_end';
    $valueForItems = '("' . $input['params']['name'] . '", "' . $input['params']['link']  . '", "' . $input['params']['dateStart'] . '", "' . $input['params']['dateEnd']. '"';
    if (isset($input['params']['format'])){
        $fieldTableItems = $fieldTableItems . ', items.id_format_file';
        $valueForItems = $valueForItems . ', "' . $input['params']['format'] . '"';
    }
    if (isset($input['params']['description'])){
        $fieldTableItems = $fieldTableItems . ', items.description';
        $valueForItems = $valueForItems . ', "' . $input['params']['description'] . '"';
    }
    if (isset($input['params']['owner'])){
        $fieldTableItems = $fieldTableItems . ', items.owner';
        $valueForItems = $valueForItems . ', "' . $input['params']['owner'] . '"';
    }
    $sql= $sql . $fieldTableItems . ') values ' . $valueForItems . '); SET @last_id := LAST_INSERT_ID();';
    $geo = json_decode($input['params']['geo'], TRUE);
    for ($i=0;$i<count($geo['geoObj']);$i++) {
        $sql = $sql . 'INSERT INTO geo_for_items (geo_for_items.id_items, geo_for_items.id_geo) values(@last_id, ' . $geo['geoObj'][$i] . ');';
    }
    $key = json_decode($input['params']['key'], TRUE);
    for ($i=0;$i<count($key['keyObj']);$i++) {
        $sql = $sql . 'INSERT INTO keywords_for_items (keywords_for_items.id_items, keywords_for_items.id_keyword) values(@last_id, ' . $key['keyObj'][$i] . ');';
    }
    DB::fetch($sql);
});

$app->put('/editNameGeo/', function (Request $request) {
    $input =  $request->getParsedBody();
    $sql = 'UPDATE geo SET geo.text = "' . $input['params']['name'] . '" WHERE geo.id = '  . $input['params']['id'];
    DB::fetch($sql);
});
$app->put('/editNameKey/', function (Request $request) {
    $input =  $request->getParsedBody();
    $sql = 'UPDATE keyword SET keyword.text = "' . $input['params']['name'] . '" WHERE keyword.id = '  . $input['params']['id'];
    DB::fetch($sql);
});

$app->get('/getKeyforAdd/', function(Request $request, Response $response){
    $sql = 'SELECT text, id, parentId FROM keyword WHERE keyword.lft >= 0 ORDER BY keyword.lft';
    $results= DB::fetchAll($sql);
    $tree = buildTree($results, 0);
    $response->getBody()->write(json_encode([
        'data' =>  $tree
    ], JSON_UNESCAPED_UNICODE));
    return $response;
});

$app->post('/addFormat/', function(Request $request){
    $input =  $request->getParsedBody();
    $sql =  'INSERT INTO format_file SET format_name = "' . $input['params']['name'] . '"';
    DB::fetch($sql);
});

$app->post('/addKey/', function (Request $request) {
    $input =  $request->getParsedBody();
    $sql = 'SET @right_key := (SELECT keyword.rgt FROM keyword WHERE keyword.id = ' . $input['params']['idKey'] . '); UPDATE keyword SET keyword.rgt = keyword.rgt + 2, keyword.lft = IF(keyword.lft > @right_key, keyword.lft + 2, keyword.lft) WHERE keyword.rgt >= @right_key;INSERT INTO keyword SET keyword.lft = @right_key, keyword.rgt = @right_key + 1, keyword.text = "' . $input['params']['nameKey'] . '", keyword.parentId = ' .$input['params']['idKey'].';';
    DB::fetchAll($sql);

});

$app->post('/addGeo/', function (Request $request) {
    $input =  $request->getParsedBody();
    $sql = 'SET @right_key := (SELECT geo.rgt FROM geo WHERE geo.id = ' . $input['params']['idGeo'] . '); UPDATE geo SET geo.rgt = geo.rgt + 2, geo.lft = IF(geo.lft > @right_key, geo.lft + 2, geo.lft) WHERE geo.rgt >= @right_key;INSERT INTO geo SET geo.lft = @right_key, geo.rgt = @right_key + 1, geo.text = "' . $input['params']['nameGeo'] . '", geo.parentId = ' .$input['params']['idGeo'].';';
    DB::fetchAll($sql);

});
$app->post('/moveKey/', function (Request $request) {
    $input =  $request->getParsedBody();
    $sql = 'UPDATE `keyword` AS `t0` 
JOIN `keyword` AS `object` ON `object`.`id`= ' . $input['params']['idWhat'] . '
JOIN `keyword` AS `parent` ON `parent`.`id`= ' . $input['params']['idWhen'] . '
SET
`t0`.`lft` = `t0`.`lft` +
    IF (`parent`.`lft` < `object`.`lft`,
         IF (`t0`.`lft` >= `object`.`rgt` + 1, 0,
                IF (`t0`.`lft` >= `object`.`lft`, `parent`.`lft` - `object`.`lft` + 1,
                        IF (`t0`.`lft` >= `parent`.`lft` + 1, `object`.`rgt` - `object`.`lft` + 1 , 0
                            )
                    )
             ),
         IF (`t0`.`lft` >= `parent`.`lft` + 1, 0,
                IF (`t0`.`lft` >= `object`.`rgt` + 1, -`object`.`rgt` + `object`.`lft` - 1,
                        IF (`t0`.`lft` >= `object`.`lft`, `parent`.`lft` - `object`.`rgt`, 0
                            )
                    )
             )
        ),
`t0`.`rgt` = `t0`.`rgt` +
    IF (`parent`.`lft` < `object`.`lft`,
         IF (`t0`.`rgt` >= `object`.`rgt` + 1, 0,
                IF (`t0`.`rgt` >= `object`.`lft`, `parent`.`lft` - `object`.`lft` + 1,
                        IF (`t0`.`rgt` >= `parent`.`lft` + 1, `object`.`rgt` - `object`.`lft` + 1 , 0
                            )
                    )
             ),
         IF (`t0`.`rgt` >= `parent`.`lft` + 1, 0,
                IF (`t0`.`rgt` >= `object`.`rgt` + 1, -`object`.`rgt` + `object`.`lft` - 1,
                        IF (`t0`.`rgt` >= `object`.`lft`, `parent`.`lft` - `object`.`rgt`, 0
                            )
                    )
             )
        ),
object.parentId = parent.id
WHERE `parent`.`lft` < `object`.`lft` OR `parent`.`lft` > `object`.`rgt`;';

    DB::fetch($sql);

});

$app->post('/moveGeo/', function (Request $request) {
    $input =  $request->getParsedBody();
    $sql = 'UPDATE `geo` AS `t0` 
JOIN `geo` AS `object` ON `object`.`id`= ' . $input['params']['idWhat'] . '
JOIN `geo` AS `parent` ON `parent`.`id`= ' . $input['params']['idWhen'] . '
SET
`t0`.`lft` = `t0`.`lft` +
    IF (`parent`.`lft` < `object`.`lft`,
         IF (`t0`.`lft` >= `object`.`rgt` + 1, 0,
                IF (`t0`.`lft` >= `object`.`lft`, `parent`.`lft` - `object`.`lft` + 1,
                        IF (`t0`.`lft` >= `parent`.`lft` + 1, `object`.`rgt` - `object`.`lft` + 1 , 0
                            )
                    )
             ),
         IF (`t0`.`lft` >= `parent`.`lft` + 1, 0,
                IF (`t0`.`lft` >= `object`.`rgt` + 1, -`object`.`rgt` + `object`.`lft` - 1,
                        IF (`t0`.`lft` >= `object`.`lft`, `parent`.`lft` - `object`.`rgt`, 0
                            )
                    )
             )
        ),
`t0`.`rgt` = `t0`.`rgt` +
    IF (`parent`.`lft` < `object`.`lft`,
         IF (`t0`.`rgt` >= `object`.`rgt` + 1, 0,
                IF (`t0`.`rgt` >= `object`.`lft`, `parent`.`lft` - `object`.`lft` + 1,
                        IF (`t0`.`rgt` >= `parent`.`lft` + 1, `object`.`rgt` - `object`.`lft` + 1 , 0
                            )
                    )
             ),
         IF (`t0`.`rgt` >= `parent`.`lft` + 1, 0,
                IF (`t0`.`rgt` >= `object`.`rgt` + 1, -`object`.`rgt` + `object`.`lft` - 1,
                        IF (`t0`.`rgt` >= `object`.`lft`, `parent`.`lft` - `object`.`rgt`, 0
                            )
                    )
             )
        ),
object.parentId = parent.id
WHERE `parent`.`lft` < `object`.`lft` OR `parent`.`lft` > `object`.`rgt`;';
 DB::fetch($sql);

});

$app->get('/geo/', function(Request $request, Response $response){
    $sql = 'SELECT text, id, parentId FROM geo WHERE geo.lft >= 2 ORDER BY geo.lft';
    $results= DB::fetchAll($sql);
    $countRows = count($results);
    $tree = buildTree($results);
    $get['tree']= $tree;
    $get['count'] = $countRows;
    $response->getBody()->write(json_encode([
        'data' =>  $get
    ], JSON_UNESCAPED_UNICODE));
    return $response;
});
$app->get('/key/', function(Request $request, Response $response){
    $sql = 'SELECT text, id, parentId FROM keyword WHERE keyword.lft >= 2 ORDER BY keyword.lft';
    $results= DB::fetchAll($sql);
    $countRows = count($results);
    $tree = buildTree($results);
    $get['tree']= $tree;
    $get['count'] = $countRows;
    $response->getBody()->write(json_encode([
        'data' =>  $get
    ], JSON_UNESCAPED_UNICODE));
    return $response;
});

$app->get('/getCountGeo/', function(Request $request, Response $response){
    $input = $request->getQueryParams();
    $idItem =  json_decode( $input['id'], TRUE);
    $sql = 'SELECT geo_for_items.id_geo as idObj FROM geo_for_items WHERE geo_for_items.id_items = '. $idItem;
    $get = DB::fetchAll($sql);
    $response->getBody()->write(json_encode([
        'data' =>  $get
    ], JSON_UNESCAPED_UNICODE));
    return $response;
});
$app->get('/getCountKey/', function(Request $request, Response $response){
    $input = $request->getQueryParams();
    $idItem =  json_decode( $input['id'], TRUE);
    $sql = 'SELECT keywords_for_items.id_keyword as idObj FROM keywords_for_items WHERE keywords_for_items.id_items = '. $idItem;
    $get = DB::fetchAll($sql);
    $response->getBody()->write(json_encode([
        'data' =>  $get
    ], JSON_UNESCAPED_UNICODE));
    return $response;
});

$app->get('/getItems/', function (Request $request, Response $response) {
     $sql = 'SELECT DISTINCT i.operability, i.id, i.name,i.link, i.owner, DATE_FORMAT(i.date_start,"%d.%m.%Y") as date_start, DATE_FORMAT(i.date_end,"%d.%m.%Y") as date_end, i.description, format_file.format_name, format_file.id as idFormat,DATE_FORMAT(i.date_public,"%d.%m.%Y") as date_public, (SELECT GROUP_CONCAT((SELECT GROUP_CONCAT(geo.text  SEPARATOR ">") FROM geo WHERE geo.lft <= gg.lft AND geo.rgt >= gg.rgt AND geo.id != 1 ORDER BY geo.lft) SEPARATOR "; ")FROM items as ii JOIN geo_for_items as g ON g.id_items = ii.id JOIN geo as gg ON gg.id=g.id_geo WHERE ii.id = i.id)  as geosObj,(SELECT GROUP_CONCAT((SELECT GROUP_CONCAT(keyword.text SEPARATOR ">") FROM keyword WHERE keyword.lft <= keyw.lft AND keyword.rgt >= keyw.rgt AND keyword.id != 1 ORDER BY keyword.lft) SEPARATOR "; ") FROM items as it JOIN keywords_for_items as k ON k.id_items = it.id JOIN keyword as keyw  ON keyw.id=k.id_keyword WHERE it.id = i.id) as keyObj FROM items as i JOIN format_file ON i.id_format_file = format_file.id LEFT JOIN geo_for_items as gi ON gi.id_items = i.id LEFT JOIN geo as g ON g.id=gi.id_geo LEFT JOIN keywords_for_items as ki ON ki.id_items = i.id LEFT JOIN keyword as k ON ki.id_keyword = k.id';

    $rows = DB::fetchAll($sql);
    $response->getBody()->write(json_encode([
        'data' => $rows
    ], JSON_UNESCAPED_UNICODE));

    return $response;
});

$app->add(new \Slim\Middleware\JwtAuthentication([
//    "logger" => $logger,
    "secret" => AUTH_SECRET,
    "rules" => [
        new \Slim\Middleware\JwtAuthentication\RequestPathRule([
//            "path" => "/api",
            "passthrough" => ["/auth"]
        ]),
        new \Slim\Middleware\JwtAuthentication\RequestMethodRule([
            "passthrough" => ["OPTIONS"]
        ])
    ]
]));

$app->get("/auth", function (Request $request, Response $response) {

    /* Here generate and return JWT to the client. */
//    exit('O_o');
    //$data = $request->getParsedBody();
    $data = $request->getQueryParams();
    $expireTime = 100000 * 100000;//in seconds

    $login = isset($data['login']) ? $data['login'] : '';
    $password = isset($data['password']) ? $data['password'] : '';
    if ($login == 'admin' && md5($password) === 'e7d20f236ab06ddebd5206e6b849fdf0') {
        $token = JWT::encode([
            "iss" => 1,
            'exp' => time() + $expireTime,
            'nbf' => time()
        ],
            AUTH_SECRET
        );
        $response = $response->withStatus(200);
        $response->getBody()->write(json_encode([
            'user' => [
                'id' => 1,
                'login' => $login,
                'name' => 'Admin'
            ],
            'token' => $token
        ], JSON_UNESCAPED_UNICODE));
    } else {
        $response = $response->withStatus(400);
        $response->getBody()->write(json_encode([
            'error' => 'Invalid login'
        ]));
    }

    return $response;

});

$app->run();