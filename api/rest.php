<?php
use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;


require 'vendor/autoload.php';
require 'db.php';
require 'vendor/phpmailer/phpmailer/PHPMailerAutoload.php';



try {
    DB::init('mysql:dbname=isodata;host=127.0.0.1;port=3306', 'root', '1234');
} catch (PDOException $e) {
    $file = 'log.txt';
    $string = 'Connection dataBase FALSE: ' . $e->getMessage();
    file_put_contents($file, $string);
}

$app = new \Slim\App;
$app->add(function ($req, $res, $next) {
    $response = $next($req, $res);
    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
});
$app->options('/{routes:.+}', function ($request, $response, $args) {
    return $response;
});


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

function sqlTree($input, $nameParamUrl, $nameObj, $nameTable, $nameTableAlias) {
    $geoObj =  json_decode($input[$nameParamUrl], TRUE);
    for ($i=0;$i<count($geoObj[$nameObj]);$i++){
        $sqlGetIdlftIdrgt = 'SELECT ' . $nameTable . '.lft, ' . $nameTable . '.rgt FROM ' . $nameTable . ' WHERE ' . $nameTable . '.id =' . $geoObj[$nameObj][$i];
        $IdlftIdrgt[$i] = DB::fetch($sqlGetIdlftIdrgt);
    }
    for ($i=0;$i<count($IdlftIdrgt);$i++){
        $sqlGetIdChild = 'SELECT GROUP_CONCAT(DISTINCT ' . $nameTable . '.id) as idSrting FROM ' . $nameTable . ' WHERE ' . $nameTable . '.lft >= '. $IdlftIdrgt[$i]['lft'] . ' AND ' . $nameTable . '.rgt <= ' . $IdlftIdrgt[$i]['rgt'] . ' ORDER BY ' . $nameTable . '.lft';
        $tempRes =  DB::fetchAll($sqlGetIdChild);
        $GetIdChild[$i] = explode("," ,$tempRes[0]['idSrting']);
    }
    $sql = ' AND (';
    $tempInd = 0;
    for ($i=0; $i<count($geoObj[$nameObj]);$i++) {
        if ($tempInd==count($geoObj[$nameObj])-1){
            $sql = $sql . ' ' . $nameTableAlias . '.id = "' .$geoObj[$nameObj][$i] . '"';
        }else{
            $sql = $sql . ' ' . $nameTableAlias . '.id = "' .$geoObj[$nameObj][$i] . '" OR';
        }
        $tempInd++;
    }
    for ($i=0; $i<count($GetIdChild);$i++) {
        $sql = $sql . ' OR';
        for ($j=0; $j<count($GetIdChild[$i]);$j++) {
            if ($j==count($GetIdChild[$i])-1){
                $sql = $sql . ' ' . $nameTableAlias . '.id = "' . $GetIdChild[$i][$j] . '"';
            }else{
                $sql = $sql . ' ' . $nameTableAlias . '.id = "' . $GetIdChild[$i][$j] . '" OR';
            }
        }
    }
    $sql = $sql . ' )';
    return $sql;
}



$app->get('/getFormat/', function(Request $request, Response $response){
    $sql = 'SELECT DISTINCT id, format_name FROM format_file';
    $result = DB::fetchAll($sql);
    $response->getBody()->write(json_encode([
        'data' =>  $result
    ], JSON_UNESCAPED_UNICODE));
    return $response;
});

$app->get('/geo/', function(Request $request, Response $response){
    $sql = 'SELECT text, id, parentId FROM geo WHERE geo.lft >= 2 ORDER BY geo.lft';
    $results= DB::fetchAll($sql);
    $tree = buildTree($results);
    $response->getBody()->write(json_encode([
        'data' =>  $tree
    ], JSON_UNESCAPED_UNICODE));
    return $response;
});
$app->get('/key/', function(Request $request, Response $response){
    $sql = 'SELECT text, id, parentId FROM keyword WHERE keyword.lft >= 2 ORDER BY keyword.lft';
    $results= DB::fetchAll($sql);
    $tree = buildTree($results);
    $response->getBody()->write(json_encode([
        'data' =>  $tree
    ], JSON_UNESCAPED_UNICODE));
    return $response;
});
    $app->post('/checkLinkItem/', function(Request $request){
    $input = $request->getParsedBody();
    $idItem =  $input['params']['id'];
    $sql = 'UPDATE items SET items.operability = 0 WHERE items.id = ' . $idItem;
    DB::fetch($sql);

});

$app->get('/item/', function(Request $request, Response $response){
    $input = $request->getQueryParams();
    $idItem =  json_decode( $input['id'], TRUE);
    $sql = 'SELECT DISTINCT i.id, i.name,i.link, i.owner, DATE_FORMAT(i.date_start,"%d.%m.%Y") as date_start, DATE_FORMAT(i.date_end,"%d.%m.%Y") as date_end, i.description, format_file.format_name, (SELECT DISTINCT GROUP_CONCAT((SELECT GROUP_CONCAT(geo.text  SEPARATOR ">") FROM geo WHERE geo.lft <= gg.lft AND geo.rgt >= gg.rgt AND geo.id != 1 ORDER BY geo.lft) SEPARATOR "; ")FROM items as ii JOIN geo_for_items as g ON g.id_items = ii.id JOIN geo as gg ON gg.id=g.id_geo WHERE ii.id = i.id)  as geosObj,(SELECT DISTINCT GROUP_CONCAT((SELECT GROUP_CONCAT(keyword.text SEPARATOR ">") FROM keyword WHERE keyword.lft <= keyw.lft AND keyword.rgt >= keyw.rgt AND keyword.id != 1 ORDER BY keyword.lft) SEPARATOR "; ") FROM items as it JOIN keywords_for_items as k ON k.id_items = it.id JOIN keyword as keyw  ON keyw.id=k.id_keyword WHERE it.id = i.id) as keyObj FROM items as i JOIN format_file ON i.id_format_file = format_file.id LEFT JOIN geo_for_items as gi ON gi.id_items = i.id LEFT JOIN geo as g ON g.id=gi.id_geo LEFT JOIN keywords_for_items as ki ON ki.id_items = i.id LEFT JOIN keyword as k ON ki.id_keyword = k.id WHERE i.id= ' . $idItem;


    $result = DB::fetchAll($sql);
    $response->getBody()->write(json_encode([
        'data' =>  $result
    ], JSON_UNESCAPED_UNICODE));

    return $response;
});
$app->get('/item1/', function(Request $request, Response $response){
   $sql = 'SELECT ';

    $result = DB::fetchAll($sql);
    $response->getBody()->write(json_encode([
        'data' =>  $result
    ], JSON_UNESCAPED_UNICODE));

    return $response;
});

$app->get('/items/', function (Request $request, Response $response) {
    $input = $request->getQueryParams();
    $sql = 'SELECT DISTINCT i.id, i.name,i.link, i.owner, DATE_FORMAT(i.date_start,"%d.%m.%Y") as date_start, DATE_FORMAT(i.date_end,"%d.%m.%Y") as date_end, i.description, format_file.format_name, (SELECT DISTINCT GROUP_CONCAT((SELECT GROUP_CONCAT(geo.text  SEPARATOR ">") FROM geo WHERE geo.lft <= gg.lft AND geo.rgt >= gg.rgt AND geo.id != 1 ORDER BY geo.lft) SEPARATOR "; ")FROM items as ii JOIN geo_for_items as g ON g.id_items = ii.id JOIN geo as gg ON gg.id=g.id_geo WHERE ii.id = i.id)  as geosObj,(SELECT DISTINCT GROUP_CONCAT((SELECT GROUP_CONCAT(keyword.text SEPARATOR ">") FROM keyword WHERE keyword.lft <= keyw.lft AND keyword.rgt >= keyw.rgt AND keyword.id != 1 ORDER BY keyword.lft) SEPARATOR "; ") FROM items as it JOIN keywords_for_items as k ON k.id_items = it.id JOIN keyword as keyw  ON keyw.id=k.id_keyword WHERE it.id = i.id) as keyObj FROM items as i JOIN format_file ON i.id_format_file = format_file.id LEFT JOIN geo_for_items as gi ON gi.id_items = i.id LEFT JOIN geo as g ON g.id=gi.id_geo LEFT JOIN keywords_for_items as ki ON ki.id_items = i.id LEFT JOIN keyword as k ON ki.id_keyword = k.id WHERE ';
    $field =  json_decode($input['field'], TRUE);
    $findMainInput = $input['findMainInput'];
    $sql = $sql . ' (';
   if ($field['fieldObj'] == 'all' ) {
       $sql = $sql . 'i.name LIKE "%' .  $findMainInput . '%" OR i.description LIKE "%' . $findMainInput . '%" OR i.owner LIKE "%' . $findMainInput . '%"';
    } else {
        for ($i=0; $i<count($field['fieldObj']);$i++) {
            if ($i==count($field['fieldObj'])-1){
                $sql = $sql . ' i.' . $field['fieldObj'][$i] . ' LIKE "%' . $findMainInput . '%"';
            }else{
                $sql = $sql . ' i.' . $field['fieldObj'][$i] . ' LIKE "%' . $findMainInput . '%" OR';
            }
        }
    }
    $sql = $sql . ' )';

    if (isset($input['format'])) {
        $format =  json_decode($input['format'], TRUE);
        $sql = $sql . ' AND(';
        for ($i=0; $i<count($format['formatObj']);$i++) {
            if ($i==count($format['formatObj'])-1){
                $sql = $sql . ' format_file.id = "' . $format['formatObj'][$i] . '"';
            }else{
                $sql = $sql . ' format_file.id = "' . $format['formatObj'][$i] . '" OR';
            }
        }
        $sql = $sql . ' )';
    }
    if (isset($input['dateStart']) && isset($input['dateEnd'])) {
        $dateStart = $input['dateStart'];
        $sql = $sql . ' AND i.date_start >= "' . $dateStart .'"';
        $dateEnd = $input['dateEnd'];
        $sql = $sql . ' AND i.date_end <= "' . $dateEnd .'"';
    }


    if (isset($input['geo'])) {
        $sql = $sql . sqlTree($input, 'geo', 'geoObj', 'geo', 'g');
    }
    if (isset($input['key'])) {
        $sql = $sql . sqlTree($input, 'key', 'keyObj', 'keyword', 'k');
    }
    /*$beginPost = $input['beginPost'];
    $lastPost = $input['lastPost'];
    $sql = $sql . 'ORDER BY id  LIMIT ' . $lastPost . ' OFFSET ' . $beginPost;
    file_put_contents('log/log'.$beginPost.'.txt',  $sql);*/

    $rows = DB::fetchAll($sql);
    $response->getBody()->write(json_encode([
        'data' => $rows
    ], JSON_UNESCAPED_UNICODE));
    return $response;

});

$app->post('/sendEmail/', function (Request $request) {
    $mail = new PHPMailer;
    $input =  $request->getParsedBody();
    $data = $input['params'];
    $mail->isSMTP();                                      // Set mailer to use SMTP
    $mail->Host = 'smtp.meta.ua';  // Specify main and backup SMTP servers
    $mail->SMTPAuth = true;                               // Enable SMTP authentication
    $mail->Username = 'isodata@meta.ua';                 // SMTP username
    $mail->Password = '48aqWBTXMl7smBc';                           // SMTP password
    $mail->SMTPSecure = 'tls';                            // Enable TLS encryption, `ssl` also accepted
    $mail->Port = 465;                                  // TCP port to connect to


    $mail->CharSet = 'UTF-8';
    $mail->From = 'isodata@meta.ua';
    $mail->addCC('maxim.kohanskij@outlook.com');
    $mail->isHTML(true);
    $mail->Subject = 'Нові дані від ISODATA';
    $body = '<p>Заголовок: '. $data['titleItem'] .'</p>';
    $body = $body . '<p>Посилання: '. $data['linkItem'] .'</p>';
    $body = $body . '<p>Власник: '. $data['ownerItem'] .'</p>';
    $body = $body . '<p>Дата: '. $data['dateItem'] .'</p>';
    $body = $body . '<p>Географічна принадлежність: '. $data['geoItem'] .'</p>';
    $body = $body . '<p>Ключові слова: '. $data['keyItem'] .'</p>';
    $body = $body . '<p>Опис: '. $data['descItem'] .'</p>';
    $mail->Body    = $body;
    if(!$mail->send()) {
        file_put_contents('log1.txt', 'Mailer Error: ' . $mail->ErrorInfo);
    } else {
        file_put_contents('log1.txt', 'Message has been sent');
    }

});




$app->run();